import { useEffect, useMemo, useState } from "react";
import { ingredientImage, applianceImage } from "../imagery.js";
import Timer from "../components/Timer.jsx";

const TIME_LABELS = {
  fast: "Fast",
  medium: "Medium",
  "time-consuming": "Time-consuming",
};

// Shared dish detail (used by both browse and, later, the gacha draw).
// Ingredients and appliances render as framed photo objects on the cream
// ground with captions, like the reference; each falls back to a plain caption
// when no library image matches. Ingredients stay tick-off-able.
// Timers and the Claude buttons arrive in later build steps.
export default function DishDetail({
  dish,
  onBack,
  backLabel = "menu",
  onEdit,
  onDelete,
}) {
  // Checked ingredients are session-only UI state (not persisted) per the brief.
  const [checked, setChecked] = useState(() => new Set());
  const [copied, setCopied] = useState(false);

  // Copy the exact prompt for Claude. No API call — the flow is copy here,
  // open Claude, paste. (See the brief.)
  async function copyPrompt() {
    const text = `give me a detailed recipe and cooking instructions for ${dish.name}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — leave the label as-is.
    }
  }

  // Dish photos are image blobs in IndexedDB. Turn them into object URLs for
  // display and revoke on unmount. Empty until photo upload lands in step 5.
  const photoUrls = useMemo(
    () =>
      (dish.photos || []).map((p) =>
        p instanceof Blob ? URL.createObjectURL(p) : p
      ),
    [dish.photos]
  );
  useEffect(
    () => () => {
      photoUrls.forEach((u) => {
        if (typeof u === "string" && u.startsWith("blob:")) {
          URL.revokeObjectURL(u);
        }
      });
    },
    [photoUrls]
  );

  function toggle(index) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  return (
    <div className="screen">
      <button type="button" className="back" onClick={onBack}>
        ← {backLabel}
      </button>

      <h1>{dish.name}</h1>
      <p className="dish-meta">
        {dish.origin.join(", ")} · {TIME_LABELS[dish.timeCategory]}
      </p>

      {photoUrls.length > 0 && (
        <div className="photo-strip">
          {photoUrls.map((url, i) => (
            <span key={i} className="photo-frame">
              <img src={url} alt={`${dish.name} ${i + 1}`} />
            </span>
          ))}
        </div>
      )}

      <hr />

      <section>
        <h2>Ingredients:</h2>
        <div className="object-grid">
          {dish.ingredients.map((item, i) => {
            const img = ingredientImage(item);
            const isChecked = checked.has(i);
            return (
              <button
                key={i}
                type="button"
                className="object object-tap"
                aria-pressed={isChecked}
                onClick={() => toggle(i)}
              >
                {img && (
                  <span className="frame">
                    <img src={img} alt="" />
                  </span>
                )}
                <span className={isChecked ? "caption checked" : "caption"}>
                  {item}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <hr />

      <section>
        <h2>Appliances:</h2>
        {dish.appliances.length === 0 ? (
          <p className="empty">None</p>
        ) : (
          <div className="object-grid">
            {dish.appliances.map((item, i) => {
              const img = applianceImage(item);
              return (
                <div key={i} className="object">
                  {img && (
                    <span className="frame">
                      <img src={img} alt="" />
                    </span>
                  )}
                  <span className="caption">{item}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <hr />

      <section>
        <h2>Instructions:</h2>
        <ol className="steps">
          {dish.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>

      {dish.timers && dish.timers.length > 0 && (
        <>
          <hr />
          <section>
            <h2>Timers:</h2>
            <div className="timer-list">
              {dish.timers.map((t, i) => (
                <Timer key={i} label={t.label} seconds={t.seconds} />
              ))}
            </div>
          </section>
        </>
      )}

      <hr />

      <section>
        <h2 className="claude-heading">Claude it!</h2>
        <div className="claude-row">
          <button type="button" className="claude-link" onClick={copyPrompt}>
            {copied ? "copied!" : "copy prompt"}
          </button>
          <a
            className="claude-link"
            href="https://claude.ai/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            open Claude →
          </a>
        </div>
      </section>

      {(onEdit || onDelete) && (
        <>
          <hr />
          <div className="detail-admin">
            {onEdit && (
              <button type="button" className="admin-link" onClick={onEdit}>
                edit dish
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="admin-link admin-danger"
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete “${dish.name}”? This can't be undone.`
                    )
                  ) {
                    onDelete(dish.id);
                  }
                }}
              >
                delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
