import { useCallback, useEffect, useRef } from "react";
import { Metric } from "@/components/metric";
import { Panel } from "@/components/panel";
import { SimBar } from "@/components/sim-bar";
import { useSimLoop } from "@/projects/shared/use-sim-loop";
import { useHelios } from "./store";
import { H, W } from "./world";

export function HeliosApp() {
  const s = useHelios();
  const step = useCallback((dt: number) => useHelios.getState().step(dt), []);
  useSimLoop(step, s.running, s.speed);

  return (
    <div className="space-y-4">
      <SimBar
        running={s.running}
        speed={s.speed}
        t={s.t}
        onToggle={s.toggle}
        onReset={s.reset}
        onSpeed={s.setSpeed}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel>
          <Metric label="Path" value={s.plan.ok ? s.plan.cost.toFixed(1) : "none"} unit="cells" tone={s.plan.ok ? "ok" : "danger"} />
        </Panel>
        <Panel>
          <Metric label="Expanded" value={String(s.plan.expanded)} />
        </Panel>
        <Panel>
          <Metric label="Tracks" value={String(s.tracks.length)} />
        </Panel>
        <Panel>
          <Metric label="Grid" value={`${W}×${H}`} />
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Occupancy" meta="tap a cell to pin an obstacle" className="lg:col-span-3">
          <Grid />
        </Panel>
        <Panel title="Tracks" className="lg:col-span-2">
          <ul className="space-y-2 font-mono text-xs">
            {s.tracks.map((t) => (
              <li key={t.id} className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-fg">
                  {t.id} <span className="text-muted">{t.cls}</span>
                </span>
                <span className="tabular-nums text-subtle">
                  {t.x.toFixed(1)},{t.y.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            Planner inflates occupied cells by 1, then A* with an octile heuristic. Path is
            recomputed every tick as tracks move.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function Grid() {
  const ref = useRef<HTMLCanvasElement>(null);
  const occ = useHelios((s) => s.occ);
  const plan = useHelios((s) => s.plan);
  const start = useHelios((s) => s.start);
  const goal = useHelios((s) => s.goal);
  const tracks = useHelios((s) => s.tracks);
  const click = useHelios((s) => s.click);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    const h = c.clientHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cw = w / W;
    const ch = h / H;
    ctx.fillStyle = "#111317";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!occ[y * W + x]) continue;
        ctx.fillStyle = "#2a3038";
        ctx.fillRect(x * cw, y * ch, cw - 0.5, ch - 0.5);
      }
    }
    ctx.fillStyle = "#9bb4c8";
    for (const p of plan.path) {
      ctx.fillRect(p.x * cw + cw * 0.25, p.y * ch + ch * 0.25, cw * 0.5, ch * 0.5);
    }
    ctx.fillStyle = "#eceef1";
    ctx.fillRect(start.x * cw, start.y * ch, cw, ch);
    ctx.fillStyle = "#7dcea0";
    ctx.fillRect(goal.x * cw, goal.y * ch, cw, ch);
    ctx.strokeStyle = "#d7dde6";
    ctx.lineWidth = 1;
    for (const t of tracks) {
      ctx.strokeRect(t.x * cw, t.y * ch, t.w * cw, t.h * ch);
    }
  }, [occ, plan, start, goal, tracks]);

  return (
    <canvas
      ref={ref}
      className="h-64 w-full touch-none md:h-80"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = Math.floor(((e.clientX - r.left) / r.width) * W);
        const y = Math.floor(((e.clientY - r.top) / r.height) * H);
        if (x >= 0 && y >= 0 && x < W && y < H) click(x, y);
      }}
    />
  );
}
