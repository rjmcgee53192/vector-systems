/** Deadline-aware valley-fill against a 15-minute LMP and site kW caps. */

export const SLOT_H = 0.25;
export const SLOTS = 32; // 8 hours

export type SiteId = "oakland" | "fremont" | "lathrop" | "houston";

export type Vehicle = {
  id: string;
  model: string;
  site: SiteId;
  soc: number;
  capKwh: number;
  needKwh: number;
  maxKw: number;
  departSlot: number;
};

export type Plan = {
  vehicleId: string;
  kw: number[]; // length SLOTS
  naiveKw: number[];
};

export const SITES: { id: SiteId; name: string; capKw: number }[] = [
  { id: "oakland", name: "Oakland Supercharger", capKw: 1200 },
  { id: "fremont", name: "Fremont depot", capKw: 2400 },
  { id: "lathrop", name: "Lathrop Megapack", capKw: 1800 },
  { id: "houston", name: "Houston service", capKw: 900 },
];

export function priceCurve(slot: number) {
  const h = slot * SLOT_H;
  const duck = 42 + 28 * Math.sin((h - 3) / 2.2) + 18 * Math.exp(-((h - 18) ** 2) / 8);
  const spike = h > 16.5 && h < 19.5 ? 55 : 0;
  return Math.max(12, duck + spike);
}

export function seedVehicles(): Vehicle[] {
  const models = ["Hatch 70", "Sedan 100", "Semi 500", "Crossover 85", "Van 120"];
  const sites = SITES.map((s) => s.id);
  return Array.from({ length: 16 }, (_, i) => {
    const cap = [75, 100, 500, 85, 120][i % 5];
    const soc = 0.18 + ((i * 17) % 40) / 100;
    const need = Math.min(cap * 0.82 - cap * soc, cap * 0.7);
    return {
      id: `V-${String(i + 1).padStart(2, "0")}`,
      model: models[i % models.length],
      site: sites[i % sites.length],
      soc,
      capKwh: cap,
      needKwh: Math.max(8, need),
      maxKw: cap > 200 ? 350 : 150,
      departSlot: 12 + ((i * 5) % 18),
    };
  });
}

export function naiveCharge(v: Vehicle): number[] {
  const kw = Array.from({ length: SLOTS }, () => 0);
  let left = v.needKwh;
  for (let s = 0; s < v.departSlot && left > 0.05; s++) {
    const add = Math.min(v.maxKw, left / SLOT_H);
    kw[s] = add;
    left -= add * SLOT_H;
  }
  return kw;
}

export function valleyFill(vehicles: Vehicle[]): Plan[] {
  const siteLoad = Object.fromEntries(SITES.map((s) => [s.id, Array.from({ length: SLOTS }, () => 0)])) as Record<
    SiteId,
    number[]
  >;
  const siteCap = Object.fromEntries(SITES.map((s) => [s.id, s.capKw])) as Record<SiteId, number>;
  const ranked = [...vehicles].sort((a, b) => a.departSlot - b.departSlot || b.needKwh - a.needKwh);

  return ranked.map((v) => {
    const kw = Array.from({ length: SLOTS }, () => 0);
    let left = v.needKwh;
    const slots = Array.from({ length: v.departSlot }, (_, s) => s).sort(
      (a, b) => priceCurve(a) - priceCurve(b) || a - b,
    );
    for (const s of slots) {
      if (left <= 0.05) break;
      const headroom = Math.max(0, siteCap[v.site] - siteLoad[v.site][s]);
      const add = Math.min(v.maxKw, left / SLOT_H, headroom);
      if (add < 1) continue;
      kw[s] = add;
      siteLoad[v.site][s] += add;
      left -= add * SLOT_H;
    }
    return { vehicleId: v.id, kw, naiveKw: naiveCharge(v) };
  });
}

export function energyCost(kw: number[]) {
  return kw.reduce((sum, p, s) => sum + p * SLOT_H * priceCurve(s), 0) / 1000;
}

export function siteSeries(plans: Plan[], vehicles: Vehicle[], key: "kw" | "naiveKw") {
  return SITES.map((site) => {
    const ids = new Set(vehicles.filter((v) => v.site === site.id).map((v) => v.id));
    const series = Array.from({ length: SLOTS }, (_, s) =>
      plans.filter((p) => ids.has(p.vehicleId)).reduce((n, p) => n + p[key][s], 0),
    );
    return { site, series };
  });
}
