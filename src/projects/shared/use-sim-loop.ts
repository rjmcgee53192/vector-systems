import { useEffect } from "react";

/** Client-only rAF loop. `tick` must be a stable function (zustand getState). */
export function useSimLoop(tick: (dt: number) => void, running: boolean, speed: number) {
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const raw = (now - last) / 1000;
      last = now;
      const dt = Math.min(0.08, raw) * speed;
      if (dt > 0) tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick, running, speed]);
}

export function formatClock(t: number) {
  const sign = t < 0 ? "-" : "+";
  const abs = Math.abs(t);
  const m = Math.floor(abs / 60);
  const s = abs - m * 60;
  return `${sign}${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}
