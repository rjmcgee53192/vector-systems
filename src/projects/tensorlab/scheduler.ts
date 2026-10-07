/** Gang scheduler. First-fit decreasing, rack-local, priority preemption. */

export const NODES = 8;
export const GPUS_PER = 8;
export const TOTAL = NODES * GPUS_PER;

export type JobStatus = "queued" | "running" | "done" | "preempted";

export type Placement = { node: number; gpu: number };

export type Job = {
  id: string;
  name: string;
  gpus: number;
  total: number;
  remaining: number;
  priority: number;
  status: JobStatus;
  place: Placement[];
  loss: { t: number; v: number }[];
};

export type Cluster = {
  t: number;
  running: boolean;
  speed: number;
  jobs: Job[];
  seq: number;
};

const NAMES = [
  "llama-70b-sft",
  "dit-video-2b",
  "clip-align",
  "nerf-factory",
  "whisper-ft",
  "sdxl-lora",
  "policy-ppo",
  "codec-av1",
];

export function makeJob(seq: number, partial?: Partial<Job>): Job {
  const gpus = [1, 2, 4, 8][seq % 4];
  const total = 40 + (seq * 13) % 90;
  return {
    id: `J-${String(seq).padStart(3, "0")}`,
    name: NAMES[seq % NAMES.length],
    gpus,
    total,
    remaining: total,
    priority: 1 + (seq % 3),
    status: "queued",
    place: [],
    loss: [],
    ...partial,
  };
}

export function occupancy(jobs: Job[]) {
  const grid = Array.from({ length: TOTAL }, () => null as string | null);
  for (const j of jobs) {
    if (j.status !== "running") continue;
    for (const p of j.place) grid[p.node * GPUS_PER + p.gpu] = j.id;
  }
  return grid;
}

function pack(need: number, grid: (string | null)[]): Placement[] | null {
  for (let n = 0; n < NODES; n++) {
    const free: number[] = [];
    for (let g = 0; g < GPUS_PER; g++) if (!grid[n * GPUS_PER + g]) free.push(g);
    if (free.length >= need) {
      return free.slice(0, need).map((gpu) => ({ node: n, gpu }));
    }
  }
  const spread: Placement[] = [];
  for (let i = 0; i < TOTAL && spread.length < need; i++) {
    if (!grid[i]) spread.push({ node: (i / GPUS_PER) | 0, gpu: i % GPUS_PER });
  }
  return spread.length === need ? spread : null;
}

export function schedule(jobs: Job[]): Job[] {
  const next = jobs.map((j) => ({ ...j, place: [...j.place] }));
  const grid = occupancy(next);
  const queued = next
    .filter((j) => j.status === "queued" || j.status === "preempted")
    .sort((a, b) => b.priority - a.priority || b.gpus - a.gpus);
  for (const j of queued) {
    const place = pack(j.gpus, grid);
    if (!place) continue;
    j.status = "running";
    j.place = place;
    for (const p of place) grid[p.node * GPUS_PER + p.gpu] = j.id;
  }
  return next;
}

export function initialCluster(): Cluster {
  const jobs = Array.from({ length: 7 }, (_, i) => makeJob(i + 1));
  return { t: 0, running: true, speed: 6, jobs: schedule(jobs), seq: 8 };
}

export function stepCluster(c: Cluster, dt: number): Cluster {
  let jobs = c.jobs.map((j) => {
    if (j.status !== "running") return j;
    const remaining = Math.max(0, j.remaining - dt);
    const t = j.total - remaining;
    const loss = [...j.loss];
    if (loss.length === 0 || t - loss[loss.length - 1].t > 1.2) {
      const base = 2.4 * Math.exp(-t / (j.total * 0.55)) + 0.12;
      loss.push({ t, v: base + Math.random() * 0.08 });
      if (loss.length > 40) loss.shift();
    }
    if (remaining <= 0) return { ...j, remaining: 0, status: "done" as const, place: [], loss };
    return { ...j, remaining, loss };
  });
  if (jobs.some((j) => j.status === "done" && j.place.length) || jobs.some((j) => j.status === "queued")) {
    jobs = schedule(jobs);
  } else if (jobs.some((j) => j.status === "done")) {
    jobs = schedule(jobs);
  }
  return { ...c, t: c.t + dt, jobs };
}

export function submit(c: Cluster, gpus: number, name: string, priority: number): Cluster {
  const job = makeJob(c.seq, { gpus, name, priority, total: 50, remaining: 50 });
  return { ...c, seq: c.seq + 1, jobs: schedule([...c.jobs, job]) };
}

export function preempt(c: Cluster, id: string): Cluster {
  const jobs = c.jobs.map((j) =>
    j.id === id && j.status === "running"
      ? { ...j, status: "preempted" as const, place: [] }
      : j,
  );
  return { ...c, jobs: schedule(jobs) };
}

export function util(jobs: Job[]) {
  const used = jobs.filter((j) => j.status === "running").reduce((n, j) => n + j.gpus, 0);
  return used / TOTAL;
}
