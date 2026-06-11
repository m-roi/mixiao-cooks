// IndexedDB access for the Cookbook app, via the `idb` wrapper.
//
// One object store, `dishes`, keyed by `id`. Dishes are stored whole, matching
// the brief's data model (including empty photos[]/timers[]) so later build
// steps can read those fields without a migration.
//
// Single device, no sync, no server — everything lives in this browser.

import { openDB } from "idb";
import { seedDishes } from "./seed/seed-dishes.js";

const DB_NAME = "mixiao-cooks";
const DB_VERSION = 1;
const STORE = "dishes";

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    },
  });
}

// Load the seed list on first run only — when the store is empty. Never
// re-seeds after that, so deleting a seed dish in-app makes it stay gone.
export async function seedIfEmpty() {
  const db = await getDB();
  const count = await db.count(STORE);
  if (count > 0) return;

  const tx = db.transaction(STORE, "readwrite");
  await Promise.all([
    ...seedDishes.map((dish) => tx.store.put(dish)),
    tx.done,
  ]);
}

export async function getAllDishes() {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function getDish(id) {
  const db = await getDB();
  return db.get(STORE, id);
}

// Add a new dish from the form. Generates the id; photo blobs and everything
// else are stored as-is (IndexedDB structured-clones Blobs/Files directly).
export async function addDish(dish) {
  const db = await getDB();
  const withId = { ...dish, id: crypto.randomUUID() };
  await db.put(STORE, withId);
  return withId;
}

// Save edits to an existing dish (must carry its id) — overwrites the record.
export async function updateDish(dish) {
  const db = await getDB();
  await db.put(STORE, dish);
  return dish;
}

export async function deleteDish(id) {
  const db = await getDB();
  await db.delete(STORE, id);
}

// Dev helper: wipe the store completely and reload the seed list fresh. Used by
// the "reset data" control so seed-file updates don't require clearing
// IndexedDB by hand. seedIfEmpty re-seeds because the store is now empty.
export async function resetData() {
  const db = await getDB();
  await db.clear(STORE);
  await seedIfEmpty();
}
