import { create } from "zustand";
import { initialPlant, jam, stepPlant, type Plant, type StationId } from "./sim";

type Store = Plant & {
  toggle: () => void;
  reset: () => void;
  setSpeed: (n: number) => void;
  jam: (id: StationId) => void;
  step: (dt: number) => void;
};

export const useForge = create<Store>((set, get) => ({
  ...initialPlant(),
  toggle: () => set((s) => ({ running: !s.running })),
  reset: () => set({ ...initialPlant(), speed: get().speed }),
  setSpeed: (n) => set({ speed: n }),
  jam: (id) => set((s) => jam(s, id)),
  step: (dt) => {
    const s = get();
    if (!s.running) return;
    set(stepPlant(s, dt));
  },
}));
