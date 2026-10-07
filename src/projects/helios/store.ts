import { create } from "zustand";
import { initialWorld, stepWorld, toggleBlock, type World } from "./world";

type Store = World & {
  toggle: () => void;
  reset: () => void;
  setSpeed: (n: number) => void;
  click: (x: number, y: number) => void;
  step: (dt: number) => void;
};

export const useHelios = create<Store>((set, get) => ({
  ...initialWorld(),
  toggle: () => set((s) => ({ running: !s.running })),
  reset: () => set({ ...initialWorld(), speed: get().speed }),
  setSpeed: (n) => set({ speed: n }),
  click: (x, y) => set((s) => toggleBlock(s, x, y)),
  step: (dt) => {
    const s = get();
    if (!s.running) return;
    set(stepWorld(s, dt));
  },
}));
