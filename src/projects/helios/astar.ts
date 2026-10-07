/** 8-connected A* on a binary occupancy grid. Octile heuristic. */

export type Cell = { x: number; y: number };

const DIRS: Cell[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
];

function octile(a: Cell, b: Cell) {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
}

export type AStarResult = {
  path: Cell[];
  expanded: number;
  cost: number;
  ok: boolean;
};

export function astar(
  occ: Uint8Array,
  w: number,
  h: number,
  start: Cell,
  goal: Cell,
): AStarResult {
  const idx = (x: number, y: number) => y * w + x;
  if (occ[idx(start.x, start.y)] || occ[idx(goal.x, goal.y)]) {
    return { path: [], expanded: 0, cost: Infinity, ok: false };
  }

  const open: { c: Cell; f: number; g: number }[] = [{ c: start, f: octile(start, goal), g: 0 }];
  const gScore = new Float32Array(w * h).fill(Infinity);
  const came = new Int32Array(w * h).fill(-1);
  const seen = new Uint8Array(w * h);
  gScore[idx(start.x, start.y)] = 0;
  let expanded = 0;

  while (open.length) {
    let best = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[best].f) best = i;
    const cur = open.splice(best, 1)[0];
    const ci = idx(cur.c.x, cur.c.y);
    if (seen[ci]) continue;
    seen[ci] = 1;
    expanded++;
    if (cur.c.x === goal.x && cur.c.y === goal.y) {
      const path: Cell[] = [];
      let p = ci;
      while (p !== -1) {
        path.push({ x: p % w, y: (p / w) | 0 });
        p = came[p];
      }
      path.reverse();
      return { path, expanded, cost: cur.g, ok: true };
    }
    for (const d of DIRS) {
      const nx = cur.c.x + d.x;
      const ny = cur.c.y + d.y;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = idx(nx, ny);
      if (occ[ni] || seen[ni]) continue;
      const step = d.x !== 0 && d.y !== 0 ? Math.SQRT2 : 1;
      const g = cur.g + step;
      if (g >= gScore[ni]) continue;
      gScore[ni] = g;
      came[ni] = ci;
      open.push({ c: { x: nx, y: ny }, f: g + octile({ x: nx, y: ny }, goal), g });
    }
  }
  return { path: [], expanded, cost: Infinity, ok: false };
}

export function inflate(occ: Uint8Array, w: number, h: number, r = 1) {
  const out = new Uint8Array(occ);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!occ[y * w + x]) continue;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          out[ny * w + nx] = 1;
        }
      }
    }
  }
  return out;
}
