# Appliance image library

Drop **background-free PNGs** here, named after the words that appear in your
appliance text, using hyphens for spaces — e.g. `cast-iron.png`, `air-fryer.png`,
`knife.png`, `tongs.png`.

Same rule as the ingredient library: short, generic names; a file matches when
its phrase (`cast-iron` → "cast iron") appears anywhere in the appliance text;
the most specific (longest) name wins; plain text fallback when nothing matches.
Discovered automatically by Vite — no code change needed.
