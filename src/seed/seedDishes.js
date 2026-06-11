// Seed data for the Cookbook app.
// Loaded into IndexedDB on first run only (when the database is empty).
// After that, the "Add dish" form is the source of new dishes.
//
// Shape matches the data model in the brief:
//   id, name, origin[], timeCategory, ingredients[], appliances[], steps[], photos[], timers[]
// - origin: array of tags. A dish can have multiple (e.g. ["Chinese", "Taiwanese"]).
// - photos: empty here; added later via the app (upload).
// - timers: array of { label, seconds }. Empty array = no timer.

export const seedDishes = [
  {
    id: "cast-iron-steak",
    name: "Cast Iron Steak",
    origin: ["American"],
    timeCategory: "medium",
    ingredients: [
      "1 steak (ribeye or sirloin)",
      "Salt",
      "Black pepper",
      "Canola oil",
      "Butter",
      "2 cloves garlic (optional)",
      "A few sprigs thyme (optional)",
    ],
    appliances: ["Cast iron pan", "Tong"],
    steps: [
      "Take the steak out ~30 min early to come to room temperature. Pat completely dry.",
      "Season generously with salt and pepper on both sides.",
      "Heat the cast iron pan over high until just smoking. Add oil.",
      "Lay the steak away from you. Sear undisturbed ~2.5 min until a deep crust forms.",
      "Flip. Add butter, garlic, and thyme. Sear the second side ~1.5 min, spooning the foaming butter over the top.",
      "Pull at your target doneness (use a thermometer if unsure). Rest on a board ~5–10 min before slicing.",
    ],
    photos: [],
    timers: [
      { label: "First sear", seconds: 150 },
      { label: "Second sear", seconds: 90 },
    ],
  },
  {
    id: "century-egg-tofu",
    name: "Century Egg and Tofu （皮蛋豆腐）",
    origin: ["Chinese", "Taiwanese"],
    timeCategory: "fast",
    ingredients: [
      "1 block silken tofu",
      "1 century egg",
      "1 tbsp soy sauce",
      "1 tsp sesame oil",
      "1 scallion (chopped)",
      "Bonito flakes (optional)",
      "Pinch of sugar (optional)",
    ],
    appliances: ["Knife"],
    steps: [
      "Gently turn the tofu out onto a plate. Slice or cube it.",
      "Peel the century egg and cut into wedges. Arrange over the tofu.",
      "Mix soy sauce and sesame oil; drizzle over.",
      "Top with chopped scallion. Serve cold.",
    ],
    photos: [],
    timers: [],
  },
];
