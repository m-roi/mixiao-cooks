// Filter controls for the browse menu.
// - Time category: single-select (one of the three, or "all").
// - Origin: multi-select. Selecting several tags is OR (a dish shows if it
//   matches any selected tag). Options are derived from the dishes present.

const TIME_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "fast", label: "Fast" },
  { value: "medium", label: "Medium" },
  { value: "time-consuming", label: "Time-consuming" },
];

export default function Filters({
  originOptions,
  timeFilter,
  onTimeFilter,
  selectedOrigins,
  onToggleOrigin,
}) {
  return (
    <div className="filters">
      <div className="filter-group">
        <span className="filter-label">Time:</span>
        {TIME_CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={timeFilter === value ? "chip chip-on" : "chip"}
            onClick={() => onTimeFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {originOptions.length > 0 && (
        <div className="filter-group">
          <span className="filter-label">Origin:</span>
          {originOptions.map((origin) => (
            <button
              key={origin}
              type="button"
              className={
                selectedOrigins.includes(origin) ? "chip chip-on" : "chip"
              }
              onClick={() => onToggleOrigin(origin)}
            >
              {origin}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
