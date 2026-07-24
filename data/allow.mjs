// ⛔⛔ THE CARDINAL LAW OF THIS SITE (owner 2026-07-24, verbatim intent):
// "only him giving the lecture or his writing or his video and not anybody else that you know
//  claiming to be about him or from him… only stuff that HE HIMSELF did. that ever changes later
//  I will let you know." Mirrors the hayanuka "ONLY THE YANUKA, EVER" law (the Rozenberg incident).
//
// The ONLY content that may EVER appear on ravarush.com: teachings Rabbi Shalom Arush HIMSELF gave —
// his own lectures, his own writings, his own videos. NEVER another speaker talking ABOUT him,
// re-uploading with his name, a talmid's own drasha, an event panel, or content merely tagged/titled
// "arush"/"breslev". When in doubt, EXCLUDE. Only the owner widens this.
//
// ENFORCEMENT = source-authority, not keyword guessing. We take content ONLY from sources where the
// OFFICIAL publisher attributes it to him:

// 1) His OFFICIAL YouTube channels — their own uploads are him / his mosad.
export const OFFICIAL_YT = new Set([
  "UCmW5DoNtDXqZAGLVQ9nQJJw", // Rabbi Shalom Arush - Breslev English (official)
  "UCSzgpXBkBeQEI7gE_KoTMhQ", // הרב שלום ארוש | הערוץ הרשמי | BreslevTV (official Hebrew)
  "UCaVd3Ul-frunP0L1k1h1KYA", // הרב שלום ארוש - Topic (auto-generated from his official audio)
]);

// 2) Breslev's own video libraries, filtered to the lecturer THEY tag as him.
export const BRESLEV_VIDEO_LECTURER = {
  "breslev.co.il": 13434, // "הרב שלום ארוש"  (1,386)
  "breslev.com": 83225,   // "Rabbi Shalom Arush" (651)
};

// 3) Breslev's articles, by the author-taxonomy term THEY file under him.
export const BRESLEV_AUTHOR = {
  "breslev.co.il": 14267, // הרב שלום ארוש (HE, 1,502)
  "breslev.com": 14273,   // Rabbi Shalom Arush (EN, 1,085)
};

// 4) TorahAnytime — his speaker id.
export const TORAHANYTIME_SPEAKER = 318;

// HARD-EXCLUDE — anyone else who shows up near his name (his relatives are NOT him; re-uploaders,
// talmidim, event orgs, other rabbanim). This is a backstop; source-authority above is the real gate.
export const NOT_HIM = [
  /nachman arush|natan arush|miriam arush|נחמן ארוש|נתן ארוש|מרים ארוש|שרה ארוש/i,
  /unofficial|goldsmith|midnightrabbi|chazaq|returning light|rabbi cohen|torah flow|elevator kollel|ערוץ 2000/i,
  /lazer brody|ofer erez|yaakov meir|elgrod/i,
];

// A YouTube item is allowed ONLY if it comes from an official channel (source-authority).
// No keyword "arush"/"breslev" allowance — that is exactly how other speakers leaked in.
export function ytAllowed(channelId, title = "", channel = "") {
  if (!OFFICIAL_YT.has(channelId)) return false;
  const s = `${title} ${channel}`;
  return !NOT_HIM.some((re) => re.test(s));
}
