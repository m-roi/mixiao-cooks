import { useEffect, useMemo, useState } from "react";
import Filters from "../components/Filters.jsx";

const TIME_LABELS = {
  fast: "Fast",
  medium: "Medium",
  "time-consuming": "Time-consuming",
};

// Browse menu: an image grid of dishes (alphabetical) with time, origin, meal
// filters and a search box. A dish matches origin if ANY of its tags is
// selected (OR); meal if any mealType tag equals the selection; search if the
// query appears in the name, ingredients, origin, or meal tags. Everything
// combines — a dish must satisfy all active filters/search to show.
export default function Menu({ dishes, onHome, onOpenDish, onAdd }) {
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedOrigins, setSelectedOrigins] = useState([]);
  const [mealFilter, setMealFilter] = useState("all");
  const [query, setQuery] = useState("");

  // Origin options come from the origins actually present in the data.
  const originOptions = useMemo(() => {
    const set = new Set();
    dishes.forEach((d) => d.origin.forEach((o) => set.add(o)));
    return [...set].sort();
  }, [dishes]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes
      .filter((d) => {
        const timeOk = timeFilter === "all" || d.timeCategory === timeFilter;
        const originOk =
          selectedOrigins.length === 0 ||
          d.origin.some((o) => selectedOrigins.includes(o));
        const mealOk =
          mealFilter === "all" || (d.mealType || []).includes(mealFilter);
        const searchable = [
          d.name,
          ...(d.ingredients || []),
          ...(d.origin || []),
          ...(d.mealType || []),
        ]
          .join(" ")
          .toLowerCase();
        const queryOk = !q || searchable.includes(q);
        return timeOk && originOk && mealOk && queryOk;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dishes, timeFilter, selectedOrigins, mealFilter, query]);

  // Thumbnail per visible dish: photos are usually data-URL strings now, but
  // older dishes may hold Blobs — make an object URL for those and revoke it.
  const thumbs = useMemo(
    () =>
      visible.map((d) => {
        const p = d.photos?.[0];
        return p instanceof Blob ? URL.createObjectURL(p) : p || null;
      }),
    [visible]
  );
  useEffect(
    () => () =>
      thumbs.forEach((u) => {
        if (typeof u === "string" && u.startsWith("blob:")) {
          URL.revokeObjectURL(u);
        }
      }),
    [thumbs]
  );

  function toggleOrigin(origin) {
    setSelectedOrigins((prev) =>
      prev.includes(origin)
        ? prev.filter((o) => o !== origin)
        : [...prev, origin]
    );
  }

  return (
    <div className="screen">
      <div className="menu-topbar">
        <button type="button" className="back" onClick={onHome}>
          ← home
        </button>
        <label className="search">
          <svg className="search-icon" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" />
            <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" />
          </svg>
          <input
            className="search-input"
            type="search"
            value={query}
            placeholder="search dishes or ingredients..."
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <h1>Mixiao cooks :D</h1>

      <button type="button" className="add-dish-link" onClick={onAdd}>
        + add a dish
      </button>

      <Filters
        originOptions={originOptions}
        timeFilter={timeFilter}
        onTimeFilter={setTimeFilter}
        selectedOrigins={selectedOrigins}
        onToggleOrigin={toggleOrigin}
        mealFilter={mealFilter}
        onMealFilter={setMealFilter}
      />

      {visible.length === 0 ? (
        <p className="empty">
          No dishes match{query ? ` “${query}”` : " these filters"}.
        </p>
      ) : (
        <div className="dish-grid-wrap">
          <div className="dish-grid">
            {visible.map((dish, i) => (
              <button
                key={dish.id}
                type="button"
                className="dish-card"
                onClick={() => onOpenDish(dish.id)}
              >
                <span className="dish-card-img">
                  {thumbs[i] && <img src={thumbs[i]} alt="" />}
                </span>
                <span className="dish-card-name">{dish.name}</span>
                <span className="dish-card-meta">
                  {[
                    dish.origin.join(", "),
                    (dish.mealType || []).join(", "),
                    TIME_LABELS[dish.timeCategory],
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
