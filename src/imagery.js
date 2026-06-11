// Reusable imagery for ingredients and appliances.
//
// Per the brief the look is PHOTOGRAPHIC cut-out objects on the cream ground,
// NOT generated icons — so nothing is generated here. We map an ingredient or
// appliance name to a background-free PNG from a small reusable library, and
// gracefully fall back to a plain text caption when no image exists. Imagery
// is always optional; a dish is never blocked on it.
//
// NAMING RULE (filename-driven):
//   Name a PNG after the words that appear in your ingredient/appliance text,
//   using hyphens for spaces — e.g. tofu.png, egg.png, soy-sauce.png,
//   cast-iron.png, century-egg.png. Keep it short and generic: "1 block
//   silken tofu" is matched by tofu.png; you do NOT name the file after the
//   whole phrase.
//
//   A file matches a dish when its phrase ("soy-sauce" -> "soy sauce") appears
//   anywhere in the (lowercased) ingredient/appliance text. When several files
//   match, the MOST SPECIFIC (longest phrase) wins — so century-egg.png beats
//   egg.png for "1 century egg", while plain "2 eggs" still gets egg.png.
//
//   Drop a file into src/assets/ingredients (or .../appliances) and it is
//   discovered automatically by Vite — no code change needed.

const ingredientFiles = import.meta.glob("./assets/ingredients/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});
const applianceFiles = import.meta.glob("./assets/appliances/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

// "./assets/ingredients/soy-sauce.png" -> { phrase: "soy sauce", url }
function buildLibrary(globResult) {
  return Object.entries(globResult).map(([path, url]) => {
    const key = path.split("/").pop().replace(/\.png$/, "");
    return { phrase: key.replace(/-/g, " ").toLowerCase(), url };
  });
}

// Optional synonyms, only for the odd case where the word in a recipe differs
// from the filename (e.g. a file named beef.png should also match "steak").
// Keyed by the file's phrase. Most dishes won't need any entry here.
const SYNONYMS = {
  beef: ["steak"],
  pork: ["bacon"],
  scallion: ["green onion"],
  "soy sauce": ["shoyu"],
  fish: ["bonito"],
  noodles: ["noodle"],
};

// Match the most specific (longest) library phrase that appears in the text.
function makeMatcher(library) {
  const entries = [...library].sort(
    (a, b) => b.phrase.length - a.phrase.length
  );
  return (text) => {
    const t = text.toLowerCase();
    for (const { phrase, url } of entries) {
      if (t.includes(phrase)) return url;
      const extra = SYNONYMS[phrase];
      if (extra && extra.some((w) => t.includes(w))) return url;
    }
    return null;
  };
}

export const ingredientImage = makeMatcher(buildLibrary(ingredientFiles));
export const applianceImage = makeMatcher(buildLibrary(applianceFiles));
