/** Discrete-event body line. OEE = Availability × Performance × Quality. */

export const STATIONS = [
  { id: "ST-10", name: "Blank", ideal: 18 },
  { id: "ST-20", name: "Stamp", ideal: 22 },
  { id: "ST-30", name: "Weld", ideal: 28 },
  { id: "ST-40", name: "E-coat", ideal: 24 },
  { id: "ST-50", name: "Paint", ideal: 26 },
  { id: "ST-60", name: "Assemble", ideal: 30 },
  { id: "ST-70", name: "Torque", ideal: 20 },
  { id: "ST-80", name: "EOL test", ideal: 16 },
] as const;

export type StationId = (typeof STATIONS)[number]["id"];

export type Station = {
  id: StationId;
  name: string;
  ideal: number;
  queue: number;
  busy: number;
  jammed: number;
  done: number;
  scrap: number;
  starved: number;
};

export type DimSample = { t: number; um: number };

export type Plant = {
  t: number;
  running: boolean;
  speed: number;
  stations: Station[];
  planned: number;
  run: number;
  good: number;
  total: number;
  wip: number;
  samples: DimSample[];
  events: { t: number; msg: string }[];
};

export function makeStations(): Station[] {
  return STATIONS.map((s, i) => ({
    ...s,
    queue: i === 0 ? 6 : i < 3 ? 2 : 0,
    busy: 0,
    jammed: 0,
    done: 0,
    scrap: 0,
    starved: 0,
  }));
}

export function initialPlant(): Plant {
  return {
    t: 0,
    running: true,
    speed: 8,
    stations: makeStations(),
    planned: 0,
    run: 0,
    good: 0,
    total: 0,
    wip: 8,
    samples: [],
    events: [{ t: 0, msg: "Shift start. Body line armed." }],
  };
}

function noise(ideal: number) {
  return ideal * (0.92 + Math.random() * 0.16);
}

export function oee(p: Plant) {
  const availability = p.planned > 1 ? p.run / p.planned : 1;
  const count = p.total || 1;
  const performance = Math.min(1.15, (16 * count) / Math.max(1, p.run));
  const quality = p.total ? p.good / p.total : 1;
  return {
    availability,
    performance: Math.min(1, performance),
    quality,
    oee: availability * Math.min(1, performance) * quality,
  };
}

export function stepPlant(p: Plant, dt: number): Plant {
  const stations = p.stations.map((s) => ({ ...s }));
  let events = p.events;
  let planned = p.planned + dt;
  let run = p.run;
  let good = p.good;
  let total = p.total;
  const samples = [...p.samples];

  if (stations[0].queue < 8) stations[0].queue += dt > 0 && Math.random() < dt * 0.35 ? 1 : 0;

  for (let i = 0; i < stations.length; i++) {
    const s = stations[i];
    if (s.jammed > 0) {
      s.jammed = Math.max(0, s.jammed - dt);
      if (s.jammed === 0) events = [{ t: p.t, msg: `${s.id} cleared.` }, ...events].slice(0, 40);
      continue;
    }
    run += dt;
    if (s.busy > 0) {
      s.busy = Math.max(0, s.busy - dt);
      if (s.busy === 0) {
        const scrap = Math.random() < 0.018;
        s.done += 1;
        total += 1;
        if (scrap) {
          s.scrap += 1;
          events = [{ t: p.t, msg: `${s.id} scrap. Dimensional.` }, ...events].slice(0, 40);
        } else {
          good += 1;
          if (i + 1 < stations.length) stations[i + 1].queue += 1;
        }
        if (s.id === "ST-80") {
          samples.push({ t: p.t, um: 12 + (Math.random() - 0.48) * 18 });
          if (samples.length > 48) samples.shift();
        }
      }
      continue;
    }
    if (s.queue > 0) {
      s.queue -= 1;
      s.busy = noise(s.ideal);
    } else {
      s.starved += dt;
    }
  }

  const wip = stations.reduce((n, s) => n + s.queue + (s.busy > 0 ? 1 : 0), 0);
  return {
    ...p,
    t: p.t + dt,
    stations,
    planned,
    run,
    good,
    total,
    wip,
    samples,
    events,
  };
}

export function jam(p: Plant, id: StationId): Plant {
  const stations = p.stations.map((s) =>
    s.id === id ? { ...s, jammed: 14 } : s,
  );
  return {
    ...p,
    stations,
    events: [{ t: p.t, msg: `${id} jammed. Maintenance.` }, ...p.events].slice(0, 40),
  };
}
