// Turn the 1,061 harvested articles into the Writings wing's data model.
// Cleans breslev's inline styling (navy #000080 spans, arial font tags) into calm semantic HTML,
// assigns each article to exactly one curated HALL, and emits:
//   public/data/writings.json  — light index for browsing (halls → article cards)
//   public/data/read/<id>.json — one file per article (cleaned body) for the reader
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { WRITING_HALLS, LEFTOVER_HALL } from "../data/arush.mjs";

const SRC = "D:/arush-hub/data/articles-en.json";
const OUTDIR = "D:/arush-hub/site/public/data";
mkdirSync(`${OUTDIR}/read`, { recursive: true });

const articles = JSON.parse(readFileSync(SRC, "utf8"));

// category -> hall (first hall that claims it)
const catToHall = new Map();
for (const h of WRITING_HALLS) for (const c of h.cats) if (!catToHall.has(c)) catToHall.set(c, h.slug);

function cleanBody(html) {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/ style="[^"]*"/gi, "")
    .replace(/ (color|face|bgcolor)="[^"]*"/gi, "")
    .replace(/<\/?(font|span)[^>]*>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<(o:p|w:sdt)[^>]*>[\s\S]*?<\/(o:p|w:sdt)>/gi, "")
    .replace(/class="[^"]*"/gi, "")
    .replace(/(\n\s*){3,}/g, "\n\n")
    .trim();
}
function decode(s) {
  return String(s || "").replace(/&#8217;|&#8216;/g, "’").replace(/&#8220;|&#8221;/g, "”")
    .replace(/&#8211;|&#8212;/g, "—").replace(/&#160;|&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&#8230;/g, "…").replace(/<[^>]+>/g, "").trim();
}
const words = (html) => (html.replace(/<[^>]+>/g, " ").match(/\S+/g) || []).length;

const halls = {};
const meta = new Map();
for (const h of [...WRITING_HALLS, LEFTOVER_HALL]) { halls[h.slug] = { ...h, articles: [] }; meta.set(h.slug, h); }

for (const a of articles) {
  const hall = (a.categories || []).map((c) => catToHall.get(c)).find(Boolean) || LEFTOVER_HALL.slug;
  const title = decode(a.title);
  if (!title) continue;
  const body = cleanBody(a.html);
  const card = {
    id: a.id, title, hall,
    room: (a.categories || [])[0] || "",
    excerpt: decode(a.excerpt).slice(0, 220),
    date: (a.date || "").slice(0, 10),
    words: words(body),
  };
  halls[hall].articles.push(card);
  writeFileSync(`${OUTDIR}/read/${a.id}.json`, JSON.stringify({
    id: a.id, title, hall, room: card.room, date: card.date, words: card.words,
    categories: a.categories || [], source: a.link, body,
  }));
}

// sort each hall newest-first; drop empty halls
const index = { halls: [] };
for (const h of [...WRITING_HALLS, LEFTOVER_HALL]) {
  const H = halls[h.slug];
  if (!H.articles.length) continue;
  H.articles.sort((x, y) => (y.date || "").localeCompare(x.date || ""));
  index.halls.push({ slug: h.slug, title: h.title, blurb: h.blurb, count: H.articles.length, articles: H.articles });
}
index.total = index.halls.reduce((s, h) => s + h.count, 0);
writeFileSync(`${OUTDIR}/writings.json`, JSON.stringify(index));

// counts.json — baked once (source inventory lives outside the repo); pages read this in-repo file.
let shiurim = 0;
try { shiurim = JSON.parse(readFileSync("D:/arush-hub/data/inventory.json", "utf8")).length; } catch {}
writeFileSync(`${OUTDIR}/counts.json`, JSON.stringify({ writings: index.total, halls: index.halls.length, shiurim }));

console.log(`writings: ${index.total} articles in ${index.halls.length} halls`);
console.log(index.halls.map((h) => `  ${String(h.count).padStart(4)}  ${h.title}`).join("\n"));
