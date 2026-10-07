import { astar, inflate, type AStarResult, type Cell } from "./astar";

export const W = 48;
export const H = 32;

export type Track = {
  id: string;
  cls: "car" | "ped" | "cyclist";
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
};

export type World = {
  t: number;
  running: boolean;
  speed: number;
  tracks: Track[];
  blocked: Set<number>;
  start: Cell;
  goal: Cell;
  plan: AStarResult;
  occ: Uint8Array;
};

export function seedTracks(): Track[] {
  return [
    { id: "T-04", cls: "car", x: 18, y: 8, vx: 3.2, vy: 0.1, w: 3, h: 2 },
    { id: "T-11", cls: "car", x: 30, y: 18, vx: -2.4, vy: 0, w: 3, h: 2 },
    { id: "T-19", cls: "cyclist", x: 10, y: 22, vx: 1.4, vy: -0.2, w: 1, h: 1 },
    { id: "T-22", cls: "ped", x: 36, y: 10, vx: 0.4, vy: 0.6, w: 1, h: 1 },
    { id: "T-31", cls: "car", x: 6, y: 14, vx: 2.8, vy: 0, w: 3, h: 2 },
  ];
}

function wrap(n: number, max: number) {
  if (n < 1) return max - 2;
  if (n > max - 2) return 1;
  return n;
}

export function rasterize(tracks: Track[], extra: Set<number>) {
  const occ = new Uint8Array(W * H);
  for (const i of extra) occ[i] = 1;
  for (const t of tracks) {
    const x0 = Math.floor(t.x);
    const y0 = Math.floor(t.y);
    for (let y = y0; y < y0 + t.h; y++) {
      for (let x = x0; x < x0 + t.w; x++) {
        if (x >= 0 && y >= 0 && x < W && y < H) occ[y * W + x] = 1;
      }
    }
  }
  return occ;
}

export function initialWorld(): World {
  const tracks = seedTracks();
  const blocked = new Set<number>();
  for (let x = 20; x < 28; x++) blocked.add(12 * W + x);
  const occ = inflate(rasterize(tracks, blocked), W, H, 1);
  const start = { x: 3, y: H - 4 };
  const goal = { x: W - 4, y: 3 };
  occ[start.y * W + start.x] = 0;
  occ[goal.y * W + goal.x] = 0;
  return {
    t: 0,
    running: true,
    speed: 1,
    tracks,
    blocked,
    start,
    goal,
    occ,
    plan: astar(occ, W, H, start, goal),
  };
}

export function stepWorld(w: World, dt: number): World {
  const tracks = w.tracks.map((tr) => ({
    ...tr,
    x: wrap(tr.x + tr.vx * dt, W),
    y: wrap(tr.y + tr.vy * dt, H),
  }));
  const raw = rasterize(tracks, w.blocked);
  const occ = inflate(raw, W, H, 1);
  occ[w.start.y * W + w.start.x] = 0;
  occ[w.goal.y * W + w.goal.x] = 0;
  const plan = astar(occ, W, H, w.start, w.goal);
  return { ...w, t: w.t + dt, tracks, occ, plan };
}

export function toggleBlock(w: World, x: number, y: number): World {
  const i = y * W + x;
  const blocked = new Set(w.blocked);
  if (blocked.has(i)) blocked.delete(i);
  else blocked.add(i);
  return stepWorld({ ...w, blocked }, 0);
}
