// THE CASTLE — Rabbi Shalom Arush hub identity + the curated hall→room map.
// Owner law (2026-07-24): "his castle… many rooms and beautiful furnishings… a magnificently
// organized and sorted treasure. never an overkill — depth over surface." So the 48 raw breslev
// categories are CURATED into a handful of dignified HALLS, each holding sorted rooms. No flat dump.

export const IDENTITY = {
  name: "Rabbi Shalom Arush",
  tagline: "The Garden of Emuna, opened for the world",
  intro:
    "A living hall of the teachings of HaRav Shalom Arush shlit”a — founder of Chut Shel Chessed — " +
    "gathered from across the world and set in order: his shiurim to watch or hear, his writings to read, " +
    "and his sefarim. Built by his students so that his light — emuna, joy, and personal prayer — " +
    "reaches every heart, in English.",
  motifs: ["emuna", "hisbodedus", "joy", "the thread of chesed"],
  socials: {
    "YouTube (Breslev English)": "https://www.youtube.com/@BreslevEnglish",
    Instagram: "https://instagram.com/rabbi_shalom_arush_english",
    "X (Twitter)": "https://x.com/ShalomArushEN",
    Facebook: "https://www.facebook.com/breslevenglish",
    "Books → Breslev store": "https://breslev.com/store/",
  },
};

// HALLS of the Writings wing — each groups raw breslev categories into one dignified room.
// order = the walk through the castle; every raw category is placed exactly once (first match wins),
// leftovers fall into "More from the Rav" so nothing is lost, nothing is sloppy.
export const WRITING_HALLS = [
  { slug: "emuna", title: "The Garden of Emuna", blurb: "Faith as the foundation of everything — his central teaching.",
    cats: ["Jewish Outlook", "Emuna Means Thank You", "Emuna Stories", "Emuna in the Workplace", "Rebbe Nachman's Wisdom"] },
  { slug: "avodah", title: "Growth & the Inner Life", blurb: "The daily work of the soul — teshuva, joy, and rising.",
    cats: ["Spiritual Growth", "Personal Growth", "Teshuva Stories"] },
  { slug: "hisbodedus", title: "Personal Prayer", blurb: "Hisbodedus — speaking to Hashem in your own words.",
    cats: ["Hitbodedut (Personal Prayer)"] },
  { slug: "home", title: "The Jewish Home", blurb: "Marriage, children, and raising a family with emuna.",
    cats: ["Marital Harmony", "Children and Education", "Breslev Kids", "Dating", "Thank You Marriage and Children", "Aging and Retirement"] },
  { slug: "kedusha", title: "Purity & Holiness", blurb: "Guarding the eyes and the covenant, for men and women.",
    cats: ["Holiness for Men and Women", "Shovevim"] },
  { slug: "parnassa", title: "Livelihood & the Body", blurb: "Parnassa, health, and gratitude for both.",
    cats: ["Good Income", "Thank You Good Income", "Physical and Emotional Health", "Thank You Health"] },
  { slug: "moadim", title: "The Jewish Year", blurb: "The festivals and seasons, each in its time.",
    cats: ["Rosh Hashanah", "Yom Kippur", "Sukkot, Hoshana Raba, Simchat Torah", "Chanukah", "Purim", "Passover",
           "Sefirat HaOmer", "Lag B'Omer", "Shavuot", "Three Weeks", "Menachem Av and Elul", "Shabbat", "Tu B'Shvat", "Uman"] },
  { slug: "halacha", title: "Daily Life & Halacha", blurb: "Living the day the way the Torah asks.",
    cats: ["Jewish Daily Life and Halacha", "Breslev Customs"] },
  { slug: "klal-yisrael", title: "Israel & the Times", blurb: "The Rav's word on the nation and the hour we are in.",
    cats: ["Current Affairs", "Israel and Aliyah", "News", "Holocaust Day"] },
  { slug: "sages", title: "Stories & Sages", blurb: "Tzaddikim, wonders, and the chain of our teachers.",
    cats: ["Religious Leaders", "Various Scholars", "Rabbi Arush Miracle Stories", "Baal Shem Tov and Students",
           "Kabbalah and Mysticism", "Jewish Music and Arts"] },
];

export const LEFTOVER_HALL = { slug: "more", title: "More from the Rav", blurb: "Further teachings from across his writings." };
