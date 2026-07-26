// Build the Shiurim wing catalog from Breslev's own video library (only-him, lecturer-tagged).
// Sorts his videos into ROOMS (castle law) — named series first (English), then themed topic rooms
// from the Hebrew category tags mapped to English. Emits public/data/shiurim.json (rooms → cards) +
// public/data/watch/<id>.json per video (title, date, source page). watch/listen/download upgrade to
// self-hosted as the archive+CDN fill; until then Watch opens the official Breslev source.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
// ⛔ THE CARDINAL LAW (site/data/allow.mjs) — it existed but NOTHING IMPORTED IT
// until 2026-07-26, so it enforced nothing. A law that is not called is decoration.
import { shiurRefuseReason } from "../data/allow.mjs";
const DATA = "D:/arush-hub/data", OUT = "D:/arush-hub/site/public/data";
mkdirSync(`${OUT}/watch`, { recursive: true });

// ⛔ CLEAR THE WATCH DIR FIRST. These files are what /watch/[id].astro turns into
// pages, and they ACCUMULATE: a previous build left 2,533 of them while the catalog
// held 887, so 1,646 orphan pages stayed reachable and sat in the sitemap — each one
// a shiur you cannot play. A generated directory must be rebuilt, never appended to.
for (const f of readdirSync(`${OUT}/watch`)) if (f.endsWith(".json")) rmSync(`${OUT}/watch/${f}`);
// English translations of Hebrew titles (the moat) — display English, keep Hebrew as secondary.
const EN = existsSync(`${DATA}/titles-en.json`) ? JSON.parse(readFileSync(`${DATA}/titles-en.json`, "utf8")) : {};
const heRe = /[֐-׿]/;
const enTitle = (id, he) => EN[String(id)] || (heRe.test(he) ? he : he); // english if we have it
// What we can actually DELIVER. The manifest is rebuilt from the bucket itself
// (tools/reconcile-manifest.mjs) — never from an upload ledger, which drifted and
// hid ~500 playable shiurim behind "being prepared" links.
const MAN = existsSync(`${OUT}/media-manifest.json`) ? JSON.parse(readFileSync(`${OUT}/media-manifest.json`, "utf8")) : {};
const media = (id) => MAN[String(id)] || null;
const DUR = existsSync(`${DATA}/durations.json`) ? JSON.parse(readFileSync(`${DATA}/durations.json`, "utf8")) : {};

// ⛔ OWNER RULE 2026-07-26: "organize everything by what's being offered."
// A card only exists if a visitor can actually play it here. An item we cannot
// serve is not a shiur on this site yet — it is not shown at all, and it appears
// by itself the moment its media lands in the bucket. No card is ever a dead end.
const stats = { refused: {}, noMedia: 0, video: 0, audio: 0 };

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

// Build a card, or return null with the reason recorded. Both sources go through
// this one gate — the law and the can-we-play-it test in a single place.
function makeCard(v, titleEn, titleHe) {
  const why = shiurRefuseReason(v.title, titleEn);   // check BOTH the Hebrew original and the translation
  if (why) { stats.refused[why] = (stats.refused[why] || 0) + 1; return null; }
  const m = media(v.id);
  if (!m || (!m.v && !m.a)) { stats.noMedia++; return null; }
  if (m.v) stats.video++; else stats.audio++;
  return {
    id: v.id, title: titleEn, titleHe, date: v.date || "", lang: v.lang || "he",
    v: m.v ? 1 : 0, a: m.a ? 1 : 0, t: m.t ? 1 : 0, dur: DUR[String(v.id)] || 0,
  };
}

for (const v of vids) {
  const te = enTitle(v.id, v.title);
  const heSec = heRe.test(v.title) && te !== v.title ? v.title : "";
  const card = makeCard(v, te, heSec);
  if (!card) continue;
  // Decide the room BEFORE writing anything. Writing the page first and dropping the
  // card afterwards is what leaves orphan /watch/ pages with no way in — it left 201
  // of them on the first pass of this rewrite.
  let room = null;
  if (v.series && v.series.length) room = `Series · ${v.series[0]}`;
  else {
    const cat = (v.categories || []).find((c) => CAT_ROOM[c]);
    if (cat) room = CAT_ROOM[cat];
    else if ((v.categories || []).some((c) => DROP_CAT.has(c))) { stats.notShiur = (stats.notShiur || 0) + 1; continue; }
    else room = "More Shiurim";
  }
  writeFileSync(`${OUT}/watch/${v.id}.json`, JSON.stringify({
    id: v.id, lang: v.lang, title: te, titleHe: heSec, date: v.date, source: v.link,
    series: v.series || [], room, v: card.v, a: card.a, dur: card.dur,
  }));
  put(room, card);
}
// official-channel audios → their own room
for (const v of ytShiurim) {
  const card = makeCard(v, v.title, "");
  if (!card) continue;
  writeFileSync(`${OUT}/watch/${v.id}.json`, JSON.stringify({ id: v.id, lang: v.lang || "he", title: v.title,
    date: v.date || "", source: v.link, series: [], room: "From His Official Channel",
    v: card.v, a: card.a, dur: card.dur }));
  put("From His Official Channel", card);
}

// order: themed topic rooms first (bigger, curated), then series, then More.
const THEMED = ["From His Official Channel","Emuna & Jewish Outlook","Breslev & Rebbe Nachman","Spirituality & Pnimiyus",
  "The Weekly Parsha","The Jewish Year","Joy & Chizuk","Marriage & the Home","Tips for Living",
  "Questions & Answers","Israel & Society","Gemara & Halacha","Halacha","Shabbos","Tzaddikim",
  "For Women","For Children"];
const out = { rooms: [], total: 0, video: 0, audio: 0 };
const emit = (title) => { const vs = rooms.get(title); if (!vs || !vs.length) return;
  // ORGANIZED BY WHAT IS OFFERED: what you can watch leads, what you can listen to
  // follows, newest first within each. So a room opens on its richest content.
  vs.sort((a, b) => (b.v - a.v) || (b.date || "").localeCompare(a.date || ""));
  const nv = vs.filter((x) => x.v).length;
  out.rooms.push({ title, count: vs.length, video: nv, audio: vs.length - nv, videos: vs });
  out.total += vs.length; out.video += nv; out.audio += vs.length - nv;
  rooms.delete(title); };
THEMED.forEach(emit);
[...rooms.keys()].filter((k)=>k.startsWith("Series · ")).sort().forEach(emit);
emit("More Shiurim");
// rooms with the most to watch come first — the wing opens on its richest rooms
out.rooms.sort((a, b) => (b.video - a.video) || (b.count - a.count));
writeFileSync(`${OUT}/shiurim.json`, JSON.stringify(out));

// bump counts.json with the real shiurim number
let c = {}; try { c = JSON.parse(readFileSync(`${OUT}/counts.json`, "utf8")); } catch {}
c.shiurim = out.total; c.shiurimVideo = out.video; c.shiurimAudio = out.audio;
writeFileSync(`${OUT}/counts.json`, JSON.stringify(c));
console.log(`shiurim OFFERED: ${out.total} (${out.video} to watch, ${out.audio} to listen) in ${out.rooms.length} rooms`);
console.log(`  law refused    : ${JSON.stringify(stats.refused)}`);
console.log(`  held back (no media on our CDN yet): ${stats.noMedia}`);
console.log(out.rooms.slice(0, 15).map((r) => `  ${String(r.count).padStart(4)} (${String(r.video).padStart(3)}v) ${r.title}`).join("\n"));
