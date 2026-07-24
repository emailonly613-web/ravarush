// Sparks — his short clips (<4 min) that are on the CDN, for a shuffle-able full-screen feed
// (owner: "sparks, a bunch of shorts under four minutes, shuffle them"). Intersect durations (<240s)
// with the media-manifest (video actually uploaded). Titles use the English translation when ready.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const D = "D:/arush-hub/data", OUT = "D:/arush-hub/site/public/data";
const load = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {});
const dur = load(`${D}/durations.json`);
const manifest = load(`${OUT}/media-manifest.json`);
const en = load(`${D}/titles-en.json`);
const titles = {};
for (const f of ["breslev-video-he.json", "breslev-video-en.json"]) {
  if (existsSync(`${D}/${f}`)) for (const v of JSON.parse(readFileSync(`${D}/${f}`, "utf8"))) titles[String(v.id)] = v.title;
}
const decode = (s) => String(s || "").replace(/&#8217;|&#8216;/g, "’").replace(/&#8220;|&#8221;/g, "”")
  .replace(/&#8211;|&#8212;/g, "—").replace(/&amp;/g, "&").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const sparks = [];
for (const [id, secs] of Object.entries(dur)) {
  if (secs >= 240 || secs < 8) continue;          // shorts only, skip sub-8s junk
  if (!manifest[id]?.v) continue;                  // must have video on the CDN
  sparks.push({ id, secs, title: en[id] || decode(titles[id]) || "Shiur" });
}
sparks.sort((a, b) => a.secs - b.secs);
writeFileSync(`${OUT}/sparks.json`, JSON.stringify(sparks));
console.log(`sparks: ${sparks.length} shorts on the CDN (shortest ${sparks[0]?.secs}s)`);
