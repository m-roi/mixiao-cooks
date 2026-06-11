import { useMemo, useState } from "react";
import Filters from "../components/Filters.jsx";

const TIME_LABELS = {
  fast: "Fast",
  medium: "Medium",
  "time-consuming": "Time-consuming",
};

// Browse menu: scrollable list of all dishes with time, origin, and meal
// filters. A dish matches the origin filter if ANY of its tags is selected
// (OR); meal matches if any of its mealType tags equals the selected one. All
// three filters combine — a dish must satisfy every active filter to show.
export default function Menu({ dishes, onHome, onOpenDish, onAdd }) {
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedOrigins, setSelectedOrigins] = useState([]);
  const [mealFilter, setMealFilter] = useState("all");

  // Origin options come from the origins actually present in the data.
  const originOptions = useMemo(() => {
    const set = new Set();
    dishes.forEach((d) => d.origin.forEach((o) => set.add(o)));
    return [...set].sort();
  }, [dishes]);

  const visible = useMemo(() => {
    return dishes.filter((d) => {
      const timeOk = timeFilter === "all" || d.timeCategory === timeFilter;
      const originOk =
        selectedOrigins.length === 0 ||
        d.origin.some((o) => selectedOrigins.includes(o));
      const mealOk =
        mealFilter === "all" || (d.mealType || []).includes(mealFilter);
      return timeOk && originOk && mealOk;
    });
  }, [dishes, timeFilter, selectedOrigins, mealFilter]);

  function toggleOrigin(origin) {
    setSelectedOrigins((prev) =>
      prev.includes(origin)
        ? prev.filter((o) => o !== origin)
        : [...prev, origin]
    );
  }

  return (
    <div className="screen">
      <button type="button" className="back" onClick={onHome}>
        ← home
      </button>

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
        <p className="empty">No dishes match these filters.</p>
      ) : (
        <ul className="dish-list">
          {visible.map((dish) => (
            <li key={dish.id}>
              <button
                type="button"
                className="dish-row"
                onClick={() => onOpenDish(dish.id)}
              >
                <span className="dish-name">{dish.name}</span>
                <span className="dish-meta">
                  {[
                    dish.origin.join(", "),
                    (dish.mealType || []).join(", "),
                    TIME_LABELS[dish.timeCategory],
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
