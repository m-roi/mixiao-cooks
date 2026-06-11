import { useEffect, useRef, useState } from "react";

// "no idea" — the gacha draw. Function first: picking a random dish and
// revealing it is plain logic that works on its own; the gachapon animation
// (crank turns → pixel ball drops → pixel paper unfurls) is a layer on top,
// driven by CSS keyframes + a small phase state machine. No animation libraries.

// Optional drop-in machine sprite: if a (properly licensed) pixel-art machine
// PNG is saved at src/assets/gacha-machine.png it replaces the hand-drawn SVG.
const machineFiles = import.meta.glob("../assets/gacha-machine.png", {
  eager: true,
  query: "?url",
  import: "default",
});
const machineSprite = Object.values(machineFiles)[0] || null;

const OL = "#1f1f22"; // near-black outline
const RED = "#d8362f"; // red accents (dome frame, mid band, base trim)
const GRAY = "#47464d"; // charcoal body
const GRAY_DK = "#36353b"; // recessed control panel

// A small pixel "round" shape (octagon) used for gumballs and the knobs.
function Octagon({ x, y, s, fill }) {
  const pts = [
    [2, 0],
    [s - 2, 0],
    [s, 2],
    [s, s - 2],
    [s - 2, s],
    [2, s],
    [0, s - 2],
    [0, 2],
  ]
    .map(([dx, dy]) => `${x + dx},${y + dy}`)
    .join(" ");
  return <polygon points={pts} fill={fill} />;
}

const GUMBALLS = [
  { x: 10, y: 18, c: "#e98aa6" },
  { x: 16, y: 20, c: "#d96a72" },
  { x: 22, y: 19, c: "#8fc08a" },
  { x: 27, y: 20, c: "#7fa8d0" },
  { x: 14, y: 12, c: "#b08fc8" },
  { x: 20, y: 11, c: "#e98aa6" },
  { x: 26, y: 12, c: "#c9a87e" },
];

// Hand-drawn pixel-art machine, scaled up with crisp (non-antialiased) edges.
// Gray-and-red body with a rounded glass dome.
function MachineSvg() {
  return (
    <svg
      className="machine"
      viewBox="0 0 44 66"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* outlined structural parts */}
      <g stroke={OL} strokeWidth="1.2" strokeLinejoin="miter">
        {/* base + legs */}
        <rect x="5" y="58" width="34" height="4" fill={GRAY} />
        <rect x="10" y="62" width="5" height="3" fill={GRAY} />
        <rect x="29" y="62" width="5" height="3" fill={GRAY} />
        {/* lower body + recessed control panel */}
        <rect x="6" y="35" width="32" height="23" fill={GRAY} />
        <rect x="9" y="40" width="26" height="16" fill={GRAY_DK} />
        {/* coin slot */}
        <rect x="27" y="42" width="6" height="2" fill="#8e8d93" />
        {/* red mid band */}
        <rect x="6" y="32" width="32" height="3" fill={RED} />
        {/* glass dome — red frame + rounded light glass */}
        <polygon
          fill={RED}
          points="4,32 4,13 5,10 7,8 9,6 12,5 16,3 20,2 24,2 28,3 32,5 35,6 37,8 39,10 40,13 40,32"
        />
        <polygon
          fill="#e9eef0"
          points="8,30 8,14 9,12 11,10 13,8 16,7 20,6 24,6 28,7 31,8 33,10 35,12 36,14 36,30"
        />
        {/* gumballs */}
        {GUMBALLS.map((g, i) => (
          <Octagon key={i} x={g.x} y={g.y} s={7} fill={g.c} />
        ))}
        {/* dark dispenser scoop (left) */}
        <Octagon x={10} y={45} s={11} fill="#232227" />
        {/* white swirl knob (right) — this is the crank, it spins */}
        <g className="crank">
          <Octagon x={24} y={45} s={11} fill="#efece5" />
          <rect x="28" y="48" width="1" height="1" fill="#b8b2a8" stroke="none" />
          <rect x="29" y="48" width="1" height="1" fill="#b8b2a8" stroke="none" />
          <rect x="30" y="49" width="1" height="1" fill="#b8b2a8" stroke="none" />
          <rect x="30" y="50" width="1" height="1" fill="#b8b2a8" stroke="none" />
          <rect x="29" y="51" width="1" height="1" fill="#b8b2a8" stroke="none" />
          <rect x="28" y="51" width="1" height="1" fill="#b8b2a8" stroke="none" />
          <rect x="28" y="50" width="1" height="1" fill="#b8b2a8" stroke="none" />
        </g>
      </g>
      {/* unstroked detail pixels (drawn on top) */}
      <rect x="5" y="58" width="34" height="1.5" fill={RED} />
      {GUMBALLS.map((g, i) => (
        <rect key={i} x={g.x + 1} y={g.y + 1} width="2" height="2" fill="#fbf7ef" />
      ))}
      <rect x="13" y="48" width="3" height="1" fill="#4a4850" />
    </svg>
  );
}

// Pick a random dish, avoiding an immediate repeat when the pool allows it.
function pickRandom(pool, excludeId) {
  if (pool.length === 0) return null;
  const choices =
    pool.length > 1 ? pool.filter((d) => d.id !== excludeId) : pool;
  return choices[Math.floor(Math.random() * choices.length)];
}

export default function Draw({ dishes, onBack, onOpenDish }) {
  const [dish, setDish] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle|cranking|dropping|opening|revealed
  const [photoUrl, setPhotoUrl] = useState(null);
  const timers = useRef([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function startDraw() {
    clearTimers();
    setDish(pickRandom(dishes, dish?.id));
    setPhase("cranking");
    timers.current.push(setTimeout(() => setPhase("dropping"), 700));
    timers.current.push(setTimeout(() => setPhase("opening"), 1450));
    timers.current.push(setTimeout(() => setPhase("revealed"), 1950));
  }

  // Tap during the animation to skip straight to the result.
  function skip() {
    clearTimers();
    setPhase("revealed");
  }

  // Click anywhere on the machine: draw when idle, redraw once revealed, or
  // skip the animation if it's mid-roll. (Tapping the result paper opens the
  // recipe instead — it stops propagation.)
  function handleStage() {
    if (phase === "idle" || phase === "revealed") startDraw();
    else skip();
  }

  useEffect(() => () => clearTimers(), []);

  // Object URL for the drawn dish's first photo (none on the seed dishes yet).
  useEffect(() => {
    const p = dish?.photos?.[0];
    if (p instanceof Blob) {
      const url = URL.createObjectURL(p);
      setPhotoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPhotoUrl(typeof p === "string" ? p : null);
  }, [dish]);

  const revealed = phase === "revealed";

  return (
    <div className="screen draw-screen">
      <button type="button" className="back" onClick={onBack}>
        ← home
      </button>

      <div className={`gacha gacha-${phase}`} onClick={handleStage}>
        {machineSprite ? (
          <img className="machine machine-img" src={machineSprite} alt="" />
        ) : (
          <MachineSvg />
        )}

        <div className="reveal">
          <div className="capsule">
            {/* pixel capsule ball */}
            <svg
              className="ball"
              viewBox="0 0 12 12"
              shapeRendering="crispEdges"
              aria-hidden="true"
            >
              <path d="M3 0 H9 L12 3 V6 H0 V3 Z" fill="#e0566a" />
              <path d="M0 6 H12 V9 L9 12 H3 L0 9 Z" fill="#fbf7ef" />
              <path
                d="M3 0 H9 L12 3 V9 L9 12 H3 L0 9 V3 Z"
                fill="none"
                stroke="#3a2e2e"
                strokeWidth="1"
              />
              <rect x="3" y="2" width="2" height="2" fill="#f2a9b3" />
            </svg>
          </div>

          <div
            className="paper"
            onClick={(e) => {
              if (revealed && dish) {
                e.stopPropagation();
                onOpenDish(dish.id);
              }
            }}
          >
            {dish && (
              <>
                {photoUrl && (
                  <img className="paper-photo" src={photoUrl} alt="" />
                )}
                <p className="paper-name">{dish.name}</p>
                {revealed && <p className="paper-hint">tap to open recipe</p>}
              </>
            )}
          </div>
        </div>

        {phase === "idle" && (
          <p className="draw-hint">click to turn the crank</p>
        )}
      </div>

      {revealed && dish && (
        <div className="draw-actions">
          <button
            type="button"
            className="draw-action"
            onClick={() => onOpenDish(dish.id)}
          >
            open recipe →
          </button>
          <button type="button" className="draw-redraw" onClick={startDraw}>
            redraw
          </button>
        </div>
      )}
    </div>
  );
}
