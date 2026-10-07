import { create } from "zustand";
import { seedVehicles, valleyFill, type Plan, type Vehicle } from "./optimizer";

type Store = {
  vehicles: Vehicle[];
  plans: Plan[];
  selected: string | null;
  select: (id: string | null) => void;
  replan: () => void;
};

export const useVolt = create<Store>((set) => {
  const vehicles = seedVehicles();
  return {
    vehicles,
    plans: valleyFill(vehicles),
    selected: vehicles[0]?.id ?? null,
    select: (id) => set({ selected: id }),
    replan: () => {
      const vehicles = seedVehicles();
      set({ vehicles, plans: valleyFill(vehicles), selected: vehicles[0]?.id ?? null });
    },
  };
});
