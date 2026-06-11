# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Mixiao Cooks — a **local, single-device** web cookbook for two people to save dishes they've cooked, get a random suggestion ("gacha draw"), and run cooking timers. The authoritative spec is [`cookbook-plan-mode-brief.md`](cookbook-plan-mode-brief.md); read it before any non-trivial change. It also defines a staged build order (steps 1–8) — features are added one step at a time and tested before moving on.

## Commands

```bash
npm run dev       # Vite dev server (http://localhost:5173)
npm run build     # Production build to dist/
npm run preview   # Serve the built dist/
```

There is **no test runner, linter, or formatter** configured. "Verify" means running `npm run build` (catches compile errors) and checking the app in the browser.

## Hard constraints (from the brief — do not violate without asking)

- **No backend, no auth, no server, no sync, no accounts.** Everything runs in the browser on one device. If sync ever comes up, it's a future phase — flag it, don't build it.
- **No runtime AI / API calls.** The only "Claude" integration is a copy-to-clipboard button plus a plain link to `https://claude.ai/new`. Nothing in the app is generated at runtime.
- **Dependencies are frozen to React + `idb` (+ Vite).** Adding anything else — including a router, an animation library, or a font package — requires asking the user first. The brief lists these as explicit "ask, don't assume" triggers.
- **Plain JavaScript, no TypeScript.**
- **Fonts load via a Google Fonts `<link>` in `index.html`**, deliberately not an npm package, to keep the dependency set minimal.

## Architecture

**Navigation is view-state, not a router.** [`src/App.jsx`](src/App.jsx) holds a `view` string (`home | menu | detail | draw`) plus a `selectedId`, and renders the matching screen. This is intentional — see the no-extra-deps constraint. Add screens by extending that switch, not by introducing react-router.

**Storage flows through [`src/db.js`](src/db.js)** — the only module that touches IndexedDB (via `idb`). One object store, `dishes`, keyed by `id`. Key behaviors:
- `seedIfEmpty()` loads [`src/seed/seed-dishes.js`](src/seed/seed-dishes.js) **only when the store is empty**, so deleting a dish in-app keeps it gone and re-running never duplicates. `App` calls it once on mount, then reads all dishes into state.
- Dishes are stored whole, matching the brief's data model exactly — including empty `photos: []` and `timers: []` — so later build steps read those fields without a schema migration.
- `resetData()` wipes the store and re-seeds; it's behind the tiny **"reset data"** dev control rendered by `App` in the corner. Use it (or clear the `mixiao-cooks` IndexedDB db in devtools) to pick up seed-file edits, since seeding only runs on an empty store.

**Dish data model** (see the brief for the canonical list): `id, name, origin[], timeCategory, mealType[], ingredients[], appliances[], steps[], photos[], timers[]`. Notes that affect logic:
- `origin` is an **array** of tags; a dish can belong to several. The browse filter matches a dish if **any** of its tags match a selected origin (OR), and multi-selecting origins is also OR. See `Menu.jsx`.
- `mealType` is an **array** of tags from `Snack | Breakfast | Proper meal`. The Menu's single-select "Meal" filter matches if any of a dish's tags equals the selection.
- `timeCategory` is one of `fast | medium | time-consuming`. The display labels live in a `TIME_LABELS` map duplicated in `Menu.jsx` and `DishDetail.jsx`.
- `photos[]` holds **data-URL strings** (see `AddDish`/imagery notes). The display code also tolerates legacy `Blob`s.

**Menu** ([`src/screens/Menu.jsx`](src/screens/Menu.jsx)) is an alphabetical **image grid** (cards = photo, name, then `origin · meal · time` tags) with a dashed inner-line layout (no outer box). It has a **search** box (magnifier + underlined field) matching name/ingredients/origin/meal, plus the Time/Origin/Meal filter rows — all of which **AND** together.

**Screens** (`src/screens/`): `Home` (the "What are we eating today?" landing with two options), `Menu` (browse list + filters, plus the "+ add a dish" entry point), `DishDetail` (shared detail view), `Draw` (the "no idea" gacha draw), `AddDish` (the add form). In `DishDetail`, ingredients and appliances render as framed photo objects with captions; ingredient tick-off is **session-only UI state**, deliberately not persisted. The "Claude it!" controls are purely client-side (**no API calls**, per the brief): "copy prompt" writes `give me a detailed recipe and cooking instructions for <dish name>` to the clipboard, and "open Claude" is a plain new-tab link to `https://claude.ai/new`.

**Timers** ([`src/components/Timer.jsx`](src/components/Timer.jsx)): each dish timer (`{ label, seconds }`) renders an independent countdown (mm:ss) with start/pause/reset, driven by a `setInterval` so it keeps running while the steps are scrolled — multiple timers run at once. On reaching zero it alerts with a WebAudio beep, `navigator.vibrate` (mobile), and a CSS flash. Audio is unlocked by creating/resuming the `AudioContext` inside the start click (browsers block audio without a gesture).

`AddDish` covers every data-model field (name, multi-select/add-your-own origin tags, time category, multi-select meal types, repeated ingredients/appliances/steps, photo upload, optional named timers). On upload, photos are read via `FileReader` into **data-URL strings** (not raw `Blob`s — WebKit fails to persist `Blob`s in IndexedDB across reloads, which broke earlier uploads). The same form handles **editing**: when passed a `dish` prop it pre-fills and saves via `updateDish` (preserving the id); otherwise it calls `addDish` (which generates the `id` via `crypto.randomUUID()`). Editing is reached from the dish detail's "edit dish" control; "delete" calls `deleteDish` after a confirm. After any write, `App` re-fetches `getAllDishes()` into state so changes show immediately — the dishes list is loaded once and must be refreshed this way.

`Draw` is the gachapon draw: the random pick (`pickRandom`, avoids immediate repeats) is plain logic; the animation is a layer driven by a phase state machine (`idle → cranking → dropping → opening → revealed`) advanced by timeouts, with pure SVG + **CSS** keyframes (no animation libraries — adding one needs the user's OK). The pixel-art machine is an SVG drawn on a small grid with `shape-rendering: crispEdges`; clicking the machine turns the crank when idle and skips the animation otherwise. `App` passes `returnView` so dish detail's back button returns to whichever screen opened it (menu or draw).

**Imagery** flows through [`src/imagery.js`](src/imagery.js). Per the brief, the look is photographic cut-out PNGs on cream — **never generated icons**. Matching is **filename-driven**: a library PNG matches a dish when its filename phrase (`soy-sauce` → "soy sauce") appears anywhere in the ingredient/appliance text, and the **most specific (longest) match wins** (`century-egg.png` beats `egg.png`). A small optional `SYNONYMS` map covers cases where the recipe word differs from the filename (e.g. `beef` also matches "steak"). Library PNGs live in `src/assets/{ingredients,appliances}/` and are discovered automatically by `import.meta.glob` — **dropping a sensibly-named file in is the only step**, no code change. Non-matches fall back to a plain caption. Dish-level `photos[]` (data-URL strings) appear as the grid card thumbnail and as a small image to the right of the name on the dish detail; both render the string directly and fall back gracefully for legacy `Blob`s.

## Design language (specific — match it, don't improvise)

The reference is cabbages.world recipe pages; screenshots are in `reference/`. The look is carried by three things: **warm cream ground** (`--cream`), **chunky pixel display font** (Pixelify Sans, for dish names/headings/the home question), and **underlined monospace** (Space Mono) for small labels and links (`Ingredients:`, `Instructions:`, nav links). Body text is a neutral sans. All tokens are CSS variables at the top of [`src/index.css`](src/index.css) — change colors/fonts there, not inline. The aesthetic is restrained and mostly monochrome-on-cream; dish/ingredient photos provide the only color.

Pixelify Sans has no CJK glyphs, so CJK dish names (e.g. 皮蛋豆腐) fall back to the system font by design.

## After design changes

The brief asks: once the early steps are working, keep `cookbook-plan-mode-brief.md` updated if anything diverges from it.
