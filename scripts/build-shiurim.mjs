// Build the Shiurim wing catalog from Breslev's own video library (only-him, lecturer-tagged).
// Sorts his videos into ROOMS (castle law) — named series first (English), then themed topic rooms
// from the Hebrew category tags mapped to English. Emits public/data/shiurim.json (rooms → cards) +
// public/data/watch/<id>.json per video (title, date, source page). watch/listen/download upgrade to
// self-hosted as the archive+CDN fill; until then Watch opens the official Breslev source.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
const DATA = "D:/arush-hub/data", OUT = "D:/arush-hub/site/public/data";
mkdirSync(`${OUT}/watch`, { recursive: true });
// English translations of Hebrew titles (the moat) — display English, keep Hebrew as secondary.
const EN = existsSync(`${DATA}/titles-en.json`) ? JSON.parse(readFileSync(`${DATA}/titles-en.json`, "utf8")) : {};
const heRe = /[֐-׿]/;
const enTitle = (id, he) => EN[String(id)] || (heRe.test(he) ? he : he); // english if we have it
// which ids have video on the CDN (for hover-to-play cards)
const MAN = existsSync(`${OUT}/media-manifest.json`) ? JSON.parse(readFileSync(`${OUT}/media-manifest.json`, "utf8")) : {};
const hasVid = (id) => Boolean(MAN[String(id)]?.v);
const DUR = existsSync(`${DATA}/durations.json`) ? JSON.parse(readFileSync(`${DATA}/durations.json`, "utf8")) : {};

const decode = (s) => String(s || "")
  .replace(/&#8217;|&#8216;|&#039;|&#39;/g, "’").replace(/&#8220;|&#8221;|&quot;/g, "”")
  .replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, "—").replace(/&#160;|&nbsp;/g, " ")
  .replace(/&#8230;|&hellip;/g, "…").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const vids = [];
for (const f of ["breslev-video-he.json", "breslev-video-en.json"]) {
  if (existsSync(`${DATA}/${f}`)) { try { for (const v of JSON.parse(readFileSync(`${DATA}/${f}`, "utf8"))) { v.title = decode(v.title); vids.push(v); } } catch {} }
}
// his OFFICIAL YouTube channel audios (reused from the D:\kolbo\arush stash) — keyed by YT id,
// tagged into one room so they surface as playable/downloadable shiurim.
const ytShiurim = [];
if (existsSync(`${DATA}/yt-shiurim.json`)) { try { for (const v of JSON.parse(readFileSync(`${DATA}/yt-shiurim.json`, "utf8"))) { v.title = decode(v.title); v.officialChannel = true; ytShiurim.push(v); } } catch {} }
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
  const te = enTitle(v.id, v.title);
  const heSec = heRe.test(v.title) && te !== v.title ? v.title : "";
  writeFileSync(`${OUT}/watch/${v.id}.json`, JSON.stringify({
    id: v.id, lang: v.lang, title: te, titleHe: heSec, date: v.date, source: v.link,
    series: v.series || [], room: null,
  }));
  const card = { id: v.id, title: te, titleHe: heSec, date: v.date, lang: v.lang };
  // Named series = the best rooms.
  if (v.series && v.series.length) { put(`Series · ${v.series[0]}`, card); continue; }
  // else a themed topic room from category (skip music/clips/jokes).
  const cat = (v.categories || []).find((c) => CAT_ROOM[c]);
  if (cat) { put(CAT_ROOM[cat], card); continue; }
  if ((v.categories || []).some((c) => DROP_CAT.has(c))) continue; // music/clips filtered out of shiurim
  put("More Shiurim", card);
}
// official-channel audios → their own room
for (const v of ytShiurim) {
  writeFileSync(`${OUT}/watch/${v.id}.json`, JSON.stringify({ id: v.id, lang: v.lang || "he", title: v.title,
    date: v.date || "", source: v.link, series: [], room: "From His Official Channel" }));
  put("From His Official Channel", { id: v.id, title: v.title, date: v.date || "", lang: v.lang || "he" });
}

// order: themed topic rooms first (bigger, curated), then series, then More.
const THEMED = ["From His Official Channel","Emuna & Jewish Outlook","Breslev & Rebbe Nachman","Spirituality & Pnimiyus",
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
