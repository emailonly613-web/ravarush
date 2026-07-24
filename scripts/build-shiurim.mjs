// Build the Shiurim wing catalog from Breslev's own video library (only-him, lecturer-tagged).
// Sorts his videos into ROOMS (castle law) — named series first (English), then themed topic rooms
// from the Hebrew category tags mapped to English. Emits public/data/shiurim.json (rooms → cards) +
// public/data/watch/<id>.json per video (title, date, source page). watch/listen/download upgrade to
// self-hosted as the archive+CDN fill; until then Watch opens the official Breslev source.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
const DATA = "D:/arush-hub/data", OUT = "D:/arush-hub/site/public/data";
mkdirSync(`${OUT}/watch`, { recursive: true });

const vids = [];
for (const f of ["breslev-video-he.json", "breslev-video-en.json"]) {
  if (existsSync(`${DATA}/${f}`)) { try { vids.push(...JSON.parse(readFileSync(`${DATA}/${f}`, "utf8"))); } catch {} }
}
// Hebrew category → English themed room (only the meaningful teaching topics; drop music/clips/jokes).
const CAT_ROOM = {
  "יהדות והשקפה": "Emuna & Jewish Outlook", "אמונה": "Emuna & Jewish Outlook",
  "חיים באמונה": "Emuna & Jewish Outlook", "חיים בתודה": "Emuna & Jewish Outlook", "אור- אמונה ורצון": "Emuna & Jewish Outlook",
  "ברסלב": "Breslev & Rebbe Nachman", "ברסלב ישראל": "Breslev & Rebbe Nachman",
  "רוחניות וקבלה": "Spirituality & Pnimiyus", "שמחה והתחזקות": "Joy & Chizuk", "שמחה": "Joy & Chizuk",
  "פרשת השבוע": "The Weekly Parsha", "משפחה וזוגיות": "Marriage & the Home",
  "טיפים": "Tips for Living", "שאלות ותשובות": "Questions & Answers",
  "חברה": "Israel & Society",
  "הלכה יומית": "Halacha", "מסכת שבת": "Gemara & Halacha", "שבת": "Shabbos",
  "שיעורים לנשים": "For Women", "ברסלב לילדים": "For Children", "בבא סאלי": "Tzaddikim",
  // the whole Jewish year
  "חגים ומועדים": "The Jewish Year", "פורים": "The Jewish Year", "פסח": "The Jewish Year",
  "חנוכה": "The Jewish Year", "ראש השנה": "The Jewish Year", "יום כיפור": "The Jewish Year",
  "סוכות": "The Jewish Year", "שבועות": "The Jewish Year", "שלושת השבועות ותשעה באב": "The Jewish Year",
  "חודש אלול": "The Jewish Year", "ספירת העומר": "The Jewish Year", "חודש ניסן": "The Jewish Year",
  "ל\"ג בעומר": "The Jewish Year", "טו בשבט": "The Jewish Year",
};
const DROP_CAT = new Set(["מוסיקה יהודית", "קליפים", "בדיחות"]); // music/clips/jokes — not shiurim

const rooms = new Map(); // title -> videos[]
const put = (title, v) => { (rooms.get(title) || rooms.set(title, []).get(title)).push(v); };

for (const v of vids) {
  writeFileSync(`${OUT}/watch/${v.id}.json`, JSON.stringify({
    id: v.id, lang: v.lang, title: v.title, date: v.date, source: v.link,
    series: v.series || [], room: null,
  }));
  const card = { id: v.id, title: v.title, date: v.date, lang: v.lang };
  // Named series = the best rooms.
  if (v.series && v.series.length) { put(`Series · ${v.series[0]}`, card); continue; }
  // else a themed topic room from category (skip music/clips/jokes).
  const cat = (v.categories || []).find((c) => CAT_ROOM[c]);
  if (cat) { put(CAT_ROOM[cat], card); continue; }
  if ((v.categories || []).some((c) => DROP_CAT.has(c))) continue; // music/clips filtered out of shiurim
  put("More Shiurim", card);
}

// order: themed topic rooms first (bigger, curated), then series, then More.
const THEMED = ["Emuna & Jewish Outlook","Breslev & Rebbe Nachman","Spirituality & Pnimiyus",
  "The Weekly Parsha","The Jewish Year","Joy & Chizuk","Marriage & the Home","Tips for Living",
  "Questions & Answers","Israel & Society","Gemara & Halacha","Halacha","Shabbos","Tzaddikim",
  "For Women","For Children"];
const out = { rooms: [], total: 0 };
const emit = (title) => { const vs = rooms.get(title); if (!vs || !vs.length) return;
  vs.sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  out.rooms.push({ title, count: vs.length, videos: vs }); out.total += vs.length; rooms.delete(title); };
THEMED.forEach(emit);
[...rooms.keys()].filter((k)=>k.startsWith("Series · ")).sort().forEach(emit);
emit("More Shiurim");
writeFileSync(`${OUT}/shiurim.json`, JSON.stringify(out));

// bump counts.json with the real shiurim number
let c = {}; try { c = JSON.parse(readFileSync(`${OUT}/counts.json`, "utf8")); } catch {}
c.shiurim = out.total; writeFileSync(`${OUT}/counts.json`, JSON.stringify(c));
console.log(`shiurim: ${out.total} in ${out.rooms.length} rooms`);
console.log(out.rooms.slice(0, 15).map((r) => `  ${String(r.count).padStart(4)}  ${r.title}`).join("\n"));
