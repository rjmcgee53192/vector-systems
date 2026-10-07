import { useCallback } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Metric } from "@/components/metric";
import { Panel } from "@/components/panel";
import { SimBar } from "@/components/sim-bar";
import { useSimLoop } from "@/projects/shared/use-sim-loop";
import { oee } from "./sim";
import { useForge } from "./store";

export function ForgeApp() {
  const s = useForge();
  const step = useCallback((dt: number) => useForge.getState().step(dt), []);
  useSimLoop(step, s.running, s.speed);
  const k = oee(s);

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
          <Metric label="OEE" value={(k.oee * 100).toFixed(1)} unit="%" tone={k.oee > 0.7 ? "ok" : "warn"} />
        </Panel>
        <Panel>
          <Metric label="Availability" value={(k.availability * 100).toFixed(1)} unit="%" />
        </Panel>
        <Panel>
          <Metric label="Performance" value={(k.performance * 100).toFixed(1)} unit="%" />
        </Panel>
        <Panel>
          <Metric label="Quality" value={(k.quality * 100).toFixed(1)} unit="%" />
        </Panel>
      </div>
      <Panel title="Body line" meta={`WIP ${s.wip} · good ${s.good} · total ${s.total}`}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {s.stations.map((st) => (
            <div key={st.id} className="rounded-lg border border-border bg-elevated p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-subtle">{st.id}</span>
                <span className={`font-mono text-[11px] ${st.jammed > 0 ? "text-danger" : "text-ok"}`}>
                  {st.jammed > 0 ? "JAM" : st.busy > 0 ? "RUN" : "IDLE"}
                </span>
              </div>
              <div className="mt-1 text-sm text-fg">{st.name}</div>
              <div className="mt-2 flex justify-between font-mono text-xs tabular-nums text-muted">
                <span>q {st.queue}</span>
                <span>out {st.done}</span>
                <span>scrap {st.scrap}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => s.jam(st.id)}
              >
                Inject jam
              </Button>
            </div>
          ))}
        </div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="EOL dimension" meta="µm vs nominal 12" className="lg:col-span-3">
          <div className="h-44">
            <ResponsiveContainer>
              <LineChart data={s.samples}>
                <XAxis dataKey="t" hide />
                <YAxis domain={[0, 30]} tick={{ fill: "#8b919a", fontSize: 11 }} width={32} />
                <Tooltip
                  contentStyle={{ background: "#111317", border: "1px solid #23262d", borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="um" stroke="#9bb4c8" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Shift log" className="lg:col-span-2">
          <ul className="max-h-44 space-y-1.5 overflow-auto font-mono text-xs text-muted">
            {s.events.map((e, i) => (
              <li key={`${e.t}-${i}`} className="flex gap-3">
                <span className="tabular-nums text-subtle">{e.t.toFixed(0)}s</span>
                <span className="text-fg">{e.msg}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
