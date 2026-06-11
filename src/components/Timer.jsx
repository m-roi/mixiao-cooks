import { useEffect, useRef, useState } from "react";

// A single countdown timer for a dish (label + seconds). Runs on a setInterval,
// so it keeps ticking while the steps are scrolled. When it reaches zero it
// alerts with a short beep, a vibration on mobile (if supported), and a visible
// flash. Multiple timers on a dish each run independently.
function fmt(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Three short square-wave beeps via WebAudio — no audio file needed.
function beep(ctx) {
  if (!ctx) return;
  const now = ctx.currentTime;
  [0, 0.35, 0.7].forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.16, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.28);
    osc.start(now + offset);
    osc.stop(now + offset + 0.3);
  });
}

export default function Timer({ label, seconds }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const tick = useRef(null);
  const audio = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    tick.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(tick.current);
          setRunning(false);
          setDone(true);
          navigator.vibrate?.([200, 100, 200, 100, 200]);
          beep(audio.current);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tick.current);
  }, [running]);

  // Create/resume the AudioContext inside the click so audio is unlocked and
  // can play when the timer later fires (browsers block audio without a gesture).
  function ensureAudio() {
    if (!audio.current) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        audio.current = Ctx ? new Ctx() : null;
      } catch {
        audio.current = null;
      }
    }
    audio.current?.resume?.();
  }

  function start() {
    ensureAudio();
    if (remaining === 0) setRemaining(seconds);
    setDone(false);
    setRunning(true);
  }
  function pause() {
    setRunning(false);
  }
  function reset() {
    setRunning(false);
    setDone(false);
    setRemaining(seconds);
  }

  const startLabel = remaining === seconds ? "start" : done ? "again" : "resume";

  return (
    <div className={done ? "timer timer-done" : "timer"}>
      <span className="timer-label">{label}</span>
      <span className="timer-time">{fmt(remaining)}</span>
      {running ? (
        <button type="button" className="timer-btn" onClick={pause}>
          pause
        </button>
      ) : (
        <button type="button" className="timer-btn" onClick={start}>
          {startLabel}
        </button>
      )}
      {!running && (remaining !== seconds || done) && (
        <button type="button" className="timer-reset" onClick={reset}>
          reset
        </button>
      )}
    </div>
  );
}
