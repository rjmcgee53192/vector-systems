import { create } from "zustand";
import { arm, initialFlight, killEngine, stepFlight, type Flight } from "./physics";

type AetherStore = Flight & {
  arm: () => void;
  reset: () => void;
  toggle: () => void;
  setSpeed: (n: number) => void;
  kill: (i: number) => void;
  step: (dt: number) => void;
};

export const useAether = create<AetherStore>((set, get) => ({
  ...initialFlight(),
  arm: () => set((s) => arm(s)),
  reset: () => set({ ...initialFlight(), speed: get().speed }),
  toggle: () => set((s) => ({ running: !s.running })),
  setSpeed: (n) => set({ speed: n }),
  kill: (i) => set((s) => killEngine(s, i)),
  step: (dt) => {
    const s = get();
    if (!s.running) return;
    if (s.phase === "idle") return;
    set(stepFlight(s, dt));
  },
}));
