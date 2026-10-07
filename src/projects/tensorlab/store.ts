import { create } from "zustand";
import { initialCluster, preempt, stepCluster, submit, type Cluster } from "./scheduler";

type Store = Cluster & {
  toggle: () => void;
  reset: () => void;
  setSpeed: (n: number) => void;
  submit: (gpus: number, name: string, priority: number) => void;
  preempt: (id: string) => void;
  step: (dt: number) => void;
};

export const useTensor = create<Store>((set, get) => ({
  ...initialCluster(),
  toggle: () => set((s) => ({ running: !s.running })),
  reset: () => set({ ...initialCluster(), speed: get().speed }),
  setSpeed: (n) => set({ speed: n }),
  submit: (gpus, name, priority) => set((s) => submit(s, gpus, name, priority)),
  preempt: (id) => set((s) => preempt(s, id)),
  step: (dt) => {
    const s = get();
    if (!s.running) return;
    set(stepCluster(s, dt));
  },
}));
