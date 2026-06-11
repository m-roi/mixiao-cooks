# Ingredient image library

Drop **background-free PNGs** here, named after the words that appear in your
ingredient text, using hyphens for spaces — e.g. `tofu.png`, `egg.png`,
`soy-sauce.png`, `century-egg.png`.

Keep the name **short and generic**: `tofu.png` matches "1 block silken tofu" —
you do *not* name the file after the whole phrase. A file matches when its
phrase (`soy-sauce` → "soy sauce") appears anywhere in the ingredient text, and
when several match the **most specific (longest) name wins** — so
`century-egg.png` beats `egg.png` for "1 century egg", while plain "2 eggs"
still gets `egg.png`.

Vite discovers files automatically (see [`../../imagery.js`](../../imagery.js));
no code change needed. Ingredients with no matching image fall back to a plain
caption — a dish is never blocked on imagery. Background removal is a
"nice to have," never required.
