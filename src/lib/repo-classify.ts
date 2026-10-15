/**
 * repo-classify.ts — automatic classification of GitHub repositories into the
 * site's four project categories, with icon + tech-tag suggestions.
 *
 * Used by the auto-sync job (scripts/auto-sync.ts) to turn a brand-new repo
 * into a ready-to-publish Project card without any manual curation. Pure
 * functions only — no network, no DB — so matching rules are trivially
 * testable with fixtures.
 */

export type ClassifyInput = {
  name: string;
  description?: string | null;
  language?: string | null;
  topics?: string[] | null;
};

export type ClassifyResult = {
  /** One of the CATEGORY_LABELS keys: bots | web | 3d | tools */
  category: "bots" | "web" | "3d" | "tools";
  icon: string;
  tags: string[];
  /** Human title derived from the repo name, e.g. "KV-Dumper" → "KV Dumper". */
  title: string;
};

/** Lowercased keyword → any-name hits put a repo into the Telegram-bots bucket. */
const BOT_KEYWORDS = [
  "bot",
  "telegram",
  "gemini-worker",
  "webhook",
  "channel",
  "unsplashphotos",
  "configtochannel",
];

const THREED_KEYWORDS = [
  "3d",
  "threejs",
  "three.js",
  "webgl",
  "solar",
  "earth",
  "cosmic",
  "nebula",
  "galaxy",
  "planet",
  "interactive-experience",
];

const TOOLS_KEYWORDS = [
  "cli",
  "optimizer",
  "optimiser",
  "cheat",
  "sheet",
  "dump",
  "dumper",
  "script",
  "scripts",
  "fix",
  "repair",
  "opencv",
  "face",
  "blender",
  "boilerplate",
  "template",
  "vault",
  "obsidian",
  "linux",
  "ubuntu",
  "kv",
  "toolkit",
  "scanner",
  "installer",
];

const WEB_KEYWORDS = [
  "web",
  "site",
  "website",
  "shop",
  "store",
  "ecommerce",
  "e-commerce",
  "landing",
  "fashion",
  "style",
  "step",
  "portfolio",
  "vpn",
  "app",
  "showcase",
  "planner",
  "habits",
  "fitness",
  "cbt",
  "game",
  "luxe",
  "panel",
  "wizard",
  "dashboard",
];

/** Subject-matter emoji overrides — nicer than the plain category defaults. */
const ICON_OVERRIDES: [RegExp, string][] = [
  [/solar|earth|cosmic|planet|nebula|galaxy/i, "🪐"],
  [/vpn|argus|aurora/i, "🛡️"],
  [/fashion|style|luxe|step|sneaker|shoe/i, "👗"],
  [/habits|willpower|amcc|fitness|health/i, "🧠"],
  [/cheat|sheet|linux|ubuntu/i, "🐧"],
  [/dump|dumper|scanner|projdump/i, "🗃️"],
  [/opencv|face|image|photo|unsplash/i, "📷"],
  [/game|valentine|quest/i, "🎮"],
  [/vault|obsidian/i, "📓"],
  [/calculator/i, "🧮"],
  [/network|proxy|fix/i, "🧯"],
];

const TAG_STOPWORDS = new Set([
  "js",
  "javascript",
  "typescript",
  "ts",
  "css",
  "html",
  "website",
  "portfolio",
  "personal",
  "project",
  "demo",
  "iran",
  "farsi",
  "persian",
]);

const normalize = (s: string): string => s.toLowerCase().replace(/[-_]/g, " ");

const haystack = (input: ClassifyInput): string =>
  [
    normalize(input.name),
    normalize(input.description ?? ""),
    ...(input.topics ?? []).map(normalize),
  ].join(" ");

/** Whole-word match — "Three platforms" must not read as Three.js. */
const keywordRe = (k: string): RegExp =>
  new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");

const hasAny = (hay: string, keywords: string[]): boolean =>
  keywords.some((k) => keywordRe(k).test(hay));

/** "KV-Dumper" → "KV Dumper", "my_valentine_site" → "My Valentine Site". */
export function prettyTitle(name: string): string {
  return name
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) =>
      // Keep all-caps acronyms (KV, AI) intact, capitalize the rest.
      word.length > 1 && word === word.toUpperCase() && /^[A-Z]+$/.test(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ")
    .trim();
}

/**
 * Decide category, icon and tech tags for a repo. Rules run in priority
 * order (bots → 3d → tools → web) because names like "telegram-bot-boilerplate"
 * must land in bots even though "boilerplate" is a tools keyword.
 */
export function classifyRepo(input: ClassifyInput): ClassifyResult {
  const hay = haystack(input);
  const topics = (input.topics ?? []).map((t) => t.toLowerCase());

  let category: ClassifyResult["category"];
  if (hasAny(hay, BOT_KEYWORDS)) category = "bots";
  else if (hasAny(hay, THREED_KEYWORDS)) category = "3d";
  else if (hasAny(hay, TOOLS_KEYWORDS)) category = "tools";
  else if (hasAny(hay, WEB_KEYWORDS)) category = "web";
  else {
    // Language-based fallback: scripting/systems languages → tools,
    // everything else (JS/TS/HTML/CSS/…) → web.
    const lang = (input.language ?? "").toLowerCase();
    category = ["python", "shell", "c++", "c", "go", "rust", "java", "kotlin"].includes(lang)
      ? "tools"
      : "web";
  }

  const icon =
    ICON_OVERRIDES.find(([re]) => re.test(hay))?.[1] ??
    (category === "bots" ? "🤖" : category === "3d" ? "🪐" : category === "tools" ? "🛠️" : "🌐");

  // Tech tags: primary language first, then meaningful GitHub topics.
  const tags: string[] = [];
  if (input.language) tags.push(input.language);
  for (const t of topics) {
    if (tags.length >= 5) break;
    if (!TAG_STOPWORDS.has(t) && !tags.some((x) => x.toLowerCase() === t)) tags.push(t);
  }
  // Guarantee at least the category tag so the card is filterable.
  if (tags.length === 0) {
    tags.push(
      category === "bots" ? "telegram" : category === "3d" ? "webgl" : category === "tools" ? "cli" : "web"
    );
  }

  return { category, icon, tags, title: prettyTitle(input.name) };
}
