import { useCallback, useEffect, useRef } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Metric } from "@/components/metric";
import { Panel } from "@/components/panel";
import { SimBar } from "@/components/sim-bar";
import { useSimLoop } from "@/projects/shared/use-sim-loop";
import { useAether } from "./store";

export function AetherApp() {
  const s = useAether();
  const step = useCallback((dt: number) => useAether.getState().step(dt), []);
  useSimLoop(step, s.running && s.phase !== "idle", s.speed);
  const vel = Math.hypot(s.stack.vx, s.stack.vy);
  const fuelPct = s.stack.prop / (s.phase === "upper" || s.phase === "seco" || s.phase === "orbit" ? 92670 : 395000);

  return (
    <div className="space-y-4">
      <SimBar
        running={s.running}
        speed={s.speed}
        t={s.t}
        live={s.phase !== "idle"}
        onToggle={() => (s.phase === "idle" ? s.arm() : s.toggle())}
        onReset={s.reset}
        onSpeed={s.setSpeed}
        extra={
          <Button
            variant="danger"
            size="sm"
            disabled={s.phase !== "powered" && s.phase !== "countdown"}
            onClick={() => s.kill(0)}
          >
            Kill engine 1
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel>
          <Metric label="Altitude" value={(s.stack.y / 1000).toFixed(1)} unit="km" />
        </Panel>
        <Panel>
          <Metric label="Velocity" value={(vel / 1000).toFixed(2)} unit="km/s" tone="signal" />
        </Panel>
        <Panel>
          <Metric label="Dynamic Q" value={(s.q / 1000).toFixed(1)} unit="kPa" />
        </Panel>
        <Panel>
          <Metric
            label="Phase"
            value={s.phase.toUpperCase()}
            tone={s.phase === "abort" ? "danger" : s.phase === "orbit" ? "ok" : undefined}
          />
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Trajectory" meta="downrange vs altitude" className="lg:col-span-3">
          <Trajectory />
        </Panel>
        <Panel title="Propellant" meta={`${Math.max(0, fuelPct * 100).toFixed(0)}%`} className="lg:col-span-2">
          <div className="h-2 overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full bg-signal transition-[width] duration-150"
              style={{ width: `${Math.max(0, Math.min(100, fuelPct * 100))}%` }}
            />
          </div>
          <div className="mt-5">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
              First-stage engines
            </p>
            <div className="grid grid-cols-3 gap-2">
              {s.stack.engines.map((on, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => s.kill(i)}
                  disabled={s.phase !== "powered" && s.phase !== "countdown"}
                  className={`flex h-11 items-center justify-center rounded-[8px] border font-mono text-xs ${
                    on ? "border-ok/40 bg-elevated text-ok" : "border-danger/40 text-danger"
                  }`}
                >
                  E{i + 1}
                </button>
              ))}
            </div>
          </div>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Altitude" className="lg:col-span-3 min-h-48">
          <div className="h-44">
            <ResponsiveContainer>
              <AreaChart data={s.samples}>
                <XAxis dataKey="t" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#111317", border: "1px solid #23262d", borderRadius: 8 }}
                  labelFormatter={(v) => `t ${Number(v).toFixed(1)}s`}
                />
                <Area type="monotone" dataKey="alt" stroke="#9bb4c8" fill="#9bb4c822" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Event log" className="lg:col-span-2">
          <ul className="max-h-44 space-y-1.5 overflow-auto font-mono text-xs text-muted">
            {s.events.map((e, i) => (
              <li key={`${e.t}-${i}`} className="flex gap-3">
                <span className="tabular-nums text-subtle">{e.t.toFixed(1)}</span>
                <span className="text-fg">{e.msg}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Trajectory() {
  const ref = useRef<HTMLCanvasElement>(null);
  const samples = useAether((s) => s.samples);
  const stack = useAether((s) => s.stack);
  const booster = useAether((s) => s.booster);

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
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#23262d";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (h * i) / 4);
      ctx.lineTo(w, (h * i) / 4);
      ctx.stroke();
    }
    const maxX = Math.max(8_000, stack.x, booster?.x ?? 0, 1);
    const maxY = Math.max(12_000, stack.y, booster?.y ?? 0, 1);
    const px = (x: number) => 16 + (x / maxX) * (w - 32);
    const py = (y: number) => h - 16 - (y / maxY) * (h - 32);
    ctx.beginPath();
    samples.forEach((s, i) => {
      const x = px(s.x);
      const y = py(s.alt);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#9bb4c8";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px(stack.x), py(stack.y), 4, 0, Math.PI * 2);
    ctx.fillStyle = "#eceef1";
    ctx.fill();
    if (booster) {
      ctx.beginPath();
      ctx.arc(px(booster.x), py(booster.y), 3, 0, Math.PI * 2);
      ctx.fillStyle = "#8b919a";
      ctx.fill();
    }
  }, [samples, stack, booster]);

  return <canvas ref={ref} className="h-56 w-full md:h-72" />;
}
