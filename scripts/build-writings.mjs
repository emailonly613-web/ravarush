// Build BOTH writings wings from the harvested articles.
//   EN: data/articles-en.json → public/data/writings.json + read/<id>.json
//   HE: data/articles-he.json → public/data/writings-he.json + read-he/<id>.json
// Each article assigned to exactly one curated HALL (castle law: sorted rooms, never a dump).
// Cleans breslev's inline styling into calm semantic HTML. HE reader carries the source link so the
// page can always offer translate-to-English (owner law).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { WRITING_HALLS, WRITING_HALLS_HE, LEFTOVER_HALL } from "../data/arush.mjs";

const DATA = "D:/arush-hub/data";
const OUT = "D:/arush-hub/site/public/data";

function cleanBody(html) {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/ style="[^"]*"/gi, "").replace(/ (color|face|bgcolor)="[^"]*"/gi, "")
    .replace(/<\/?(font|span)[^>]*>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/class="[^"]*"/gi, "").replace(/(\n\s*){3,}/g, "\n\n").trim();
}
function decode(s) {
  return String(s || "").replace(/&#8217;|&#8216;/g, "’").replace(/&#8220;|&#8221;/g, "”")
    .replace(/&#8211;|&#8212;/g, "—").replace(/&#160;|&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&#8230;/g, "…").replace(/<[^>]+>/g, "").trim();
}
const words = (html) => (html.replace(/<[^>]+>/g, " ").match(/\S+/g) || []).length;

function buildWing({ src, halls, outIndex, readDir, lang }) {
  if (!existsSync(src)) { console.log(`skip ${lang}: ${src} missing`); return 0; }
  mkdirSync(`${OUT}/${readDir}`, { recursive: true });
  const articles = JSON.parse(readFileSync(src, "utf8"));
  const catToHall = new Map();
  for (const h of halls) for (const c of h.cats) if (!catToHall.has(c)) catToHall.set(c, h.slug);
  const bins = {};
  for (const h of [...halls, LEFTOVER_HALL]) bins[h.slug] = { ...h, articles: [] };
  for (const a of articles) {
    const title = decode(a.title); if (!title) continue;
    const hall = (a.categories || []).map((c) => catToHall.get(c)).find(Boolean) || LEFTOVER_HALL.slug;
    const body = cleanBody(a.html);
    bins[hall].articles.push({ id: a.id, title, hall, room: (a.categories || [])[0] || "",
      excerpt: decode(a.excerpt).slice(0, 220), date: (a.date || "").slice(0, 10), words: words(body) });
    writeFileSync(`${OUT}/${readDir}/${a.id}.json`, JSON.stringify({
      id: a.id, title, hall, room: (a.categories || [])[0] || "", date: (a.date || "").slice(0, 10),
      words: words(body), lang, source: a.link, body }));
  }
  const index = { lang, halls: [] };
  for (const h of [...halls, LEFTOVER_HALL]) {
    const H = bins[h.slug]; if (!H.articles.length) continue;
    H.articles.sort((x, y) => (y.date || "").localeCompare(x.date || ""));
    index.halls.push({ slug: h.slug, title: h.title, blurb: h.blurb, count: H.articles.length, articles: H.articles });
  }
  index.total = index.halls.reduce((s, h) => s + h.count, 0);
  writeFileSync(`${OUT}/${outIndex}`, JSON.stringify(index));
  console.log(`${lang}: ${index.total} articles in ${index.halls.length} halls`);
  return index.total;
}

const en = buildWing({ src: `${DATA}/articles-en.json`, halls: WRITING_HALLS, outIndex: "writings.json", readDir: "read", lang: "en" });
const he = buildWing({ src: `${DATA}/articles-he.json`, halls: WRITING_HALLS_HE, outIndex: "writings-he.json", readDir: "read-he", lang: "he" });

let shiurim = 0;
try { shiurim = JSON.parse(readFileSync(`${DATA}/inventory.json`, "utf8")).length; } catch {}
writeFileSync(`${OUT}/counts.json`, JSON.stringify({ writings: en, writingsHe: he, halls: 10, shiurim }));
console.log(`counts: EN ${en} + HE ${he} writings, ${shiurim} shiurim`);
