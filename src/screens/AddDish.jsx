import { useEffect, useMemo, useState } from "react";

const TIME_CATEGORIES = [
  { value: "fast", label: "Fast" },
  { value: "medium", label: "Medium" },
  { value: "time-consuming", label: "Time-consuming" },
];

// A repeated text field (ingredients / appliances / steps). `ordered` numbers
// the rows; `multiline` uses a textarea (for steps).
function ListField({ items, setItems, placeholder, ordered, multiline }) {
  const update = (i, v) => setItems(items.map((it, idx) => (idx === i ? v : it)));
  const add = () => setItems([...items, ""]);
  const remove = (i) => setItems(items.filter((_, idx) => idx !== i));

  return (
    <div className="list-field">
      {items.map((it, i) => (
        <div className="list-row" key={i}>
          {ordered && <span className="list-num">{i + 1}.</span>}
          {multiline ? (
            <textarea
              className="text-input"
              rows={2}
              value={it}
              placeholder={placeholder}
              onChange={(e) => update(i, e.target.value)}
            />
          ) : (
            <input
              className="text-input"
              value={it}
              placeholder={placeholder}
              onChange={(e) => update(i, e.target.value)}
            />
          )}
          <button
            type="button"
            className="row-remove"
            aria-label="remove"
            onClick={() => remove(i)}
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className="add-more" onClick={add}>
        + add
      </button>
    </div>
  );
}

// Add or edit a dish: every field from the data model, written to IndexedDB.
// When `dish` is passed the form is pre-filled and saving edits that dish.
export default function AddDish({ dishes, dish, onCancel, onSaved }) {
  const editing = !!dish;
  const [name, setName] = useState(dish?.name ?? "");
  const [origins, setOrigins] = useState(dish?.origin ?? []);
  const [originOptions, setOriginOptions] = useState(() => {
    const set = new Set();
    dishes.forEach((d) => d.origin.forEach((o) => set.add(o)));
    (dish?.origin ?? []).forEach((o) => set.add(o));
    return [...set].sort();
  });
  const [newOrigin, setNewOrigin] = useState("");
  const [timeCategory, setTimeCategory] = useState(dish?.timeCategory ?? "medium");
  const [ingredients, setIngredients] = useState(
    dish?.ingredients?.length ? dish.ingredients : [""]
  );
  const [appliances, setAppliances] = useState(
    dish?.appliances?.length ? dish.appliances : [""]
  );
  const [steps, setSteps] = useState(dish?.steps?.length ? dish.steps : [""]);
  const [photos, setPhotos] = useState(dish?.photos ?? []); // File/Blob objects
  const [timers, setTimers] = useState(
    (dish?.timers ?? []).map((t) => ({
      label: t.label,
      min: Math.floor(t.seconds / 60),
      sec: t.seconds % 60,
    }))
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Previews for chosen photos; revoke object URLs when the set changes.
  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  function toggleOrigin(o) {
    setOrigins((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]
    );
  }

  function addOrigin() {
    const t = newOrigin.trim();
    if (!t) return;
    if (!originOptions.includes(t)) setOriginOptions([...originOptions, t]);
    if (!origins.includes(t)) setOrigins([...origins, t]);
    setNewOrigin("");
  }

  function onPhotos(e) {
    setPhotos((prev) => [...prev, ...Array.from(e.target.files)]);
    e.target.value = ""; // allow re-picking the same file
  }

  function removePhoto(i) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addTimer() {
    setTimers([...timers, { label: "", min: 0, sec: 0 }]);
  }
  function updateTimer(i, patch) {
    setTimers(timers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }
  function removeTimer(i) {
    setTimers(timers.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!name.trim()) {
      setError("Give the dish a name.");
      return;
    }
    const dish = {
      name: name.trim(),
      origin: origins,
      timeCategory,
      ingredients: ingredients.map((s) => s.trim()).filter(Boolean),
      appliances: appliances.map((s) => s.trim()).filter(Boolean),
      steps: steps.map((s) => s.trim()).filter(Boolean),
      photos, // File blobs, stored directly
      timers: timers
        .map((t) => ({
          label: t.label.trim(),
          seconds: Number(t.min) * 60 + Number(t.sec),
        }))
        .filter((t) => t.label && t.seconds > 0),
    };
    setSaving(true);
    await onSaved(dish);
  }

  return (
    <div className="screen">
      <button type="button" className="back" onClick={onCancel}>
        {editing ? "← back" : "← menu"}
      </button>

      <h1>{editing ? "edit dish" : "add a dish"}</h1>

      <section>
        <h2>Name:</h2>
        <input
          className="text-input"
          value={name}
          placeholder="e.g. Mapo Tofu"
          onChange={(e) => setName(e.target.value)}
        />
      </section>

      <hr />

      <section>
        <h2>Origin:</h2>
        <div className="chip-row">
          {originOptions.map((o) => (
            <button
              key={o}
              type="button"
              className={origins.includes(o) ? "chip chip-on" : "chip"}
              onClick={() => toggleOrigin(o)}
            >
              {o}
            </button>
          ))}
        </div>
        <div className="inline-add">
          <input
            className="text-input"
            value={newOrigin}
            placeholder="add a tag"
            onChange={(e) => setNewOrigin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOrigin();
              }
            }}
          />
          <button type="button" className="add-more" onClick={addOrigin}>
            + add tag
          </button>
        </div>
      </section>

      <hr />

      <section>
        <h2>Time:</h2>
        <div className="chip-row">
          {TIME_CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={timeCategory === value ? "chip chip-on" : "chip"}
              onClick={() => setTimeCategory(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <hr />

      <section>
        <h2>Ingredients:</h2>
        <ListField
          items={ingredients}
          setItems={setIngredients}
          placeholder="e.g. 1 block silken tofu"
        />
      </section>

      <hr />

      <section>
        <h2>Appliances:</h2>
        <ListField
          items={appliances}
          setItems={setAppliances}
          placeholder="e.g. Cast iron pan"
        />
      </section>

      <hr />

      <section>
        <h2>Instructions:</h2>
        <ListField
          items={steps}
          setItems={setSteps}
          placeholder="describe the step"
          ordered
          multiline
        />
      </section>

      <hr />

      <section>
        <h2>Photos:</h2>
        {previews.length > 0 && (
          <div className="photo-previews">
            {previews.map((url, i) => (
              <span key={i} className="photo-preview">
                <img src={url} alt="" />
                <button
                  type="button"
                  className="row-remove"
                  aria-label="remove photo"
                  onClick={() => removePhoto(i)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <label className="file-label">
          + add photos
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onPhotos}
            hidden
          />
        </label>
      </section>

      <hr />

      <section>
        <h2>Timers:</h2>
        {timers.map((t, i) => (
          <div className="timer-row" key={i}>
            <input
              className="text-input"
              value={t.label}
              placeholder="label, e.g. Air fry"
              onChange={(e) => updateTimer(i, { label: e.target.value })}
            />
            <input
              className="num-input"
              type="number"
              min="0"
              value={t.min}
              onChange={(e) => updateTimer(i, { min: e.target.value })}
            />
            <span className="num-unit">min</span>
            <input
              className="num-input"
              type="number"
              min="0"
              max="59"
              value={t.sec}
              onChange={(e) => updateTimer(i, { sec: e.target.value })}
            />
            <span className="num-unit">sec</span>
            <button
              type="button"
              className="row-remove"
              aria-label="remove timer"
              onClick={() => removeTimer(i)}
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className="add-more" onClick={addTimer}>
          + add timer
        </button>
      </section>

      <hr />

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button
          type="button"
          className="save-btn"
          onClick={save}
          disabled={saving}
        >
          {saving ? "saving…" : editing ? "save changes" : "save dish"}
        </button>
        <button type="button" className="draw-redraw" onClick={onCancel}>
          cancel
        </button>
      </div>
    </div>
  );
}
