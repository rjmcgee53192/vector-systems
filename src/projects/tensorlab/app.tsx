import { useCallback, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Metric } from "@/components/metric";
import { Panel } from "@/components/panel";
import { SimBar } from "@/components/sim-bar";
import { useSimLoop } from "@/projects/shared/use-sim-loop";
import { GPUS_PER, NODES, occupancy, TOTAL, util } from "./scheduler";
import { useTensor } from "./store";

export function TensorlabApp() {
  const s = useTensor();
  const step = useCallback((dt: number) => useTensor.getState().step(dt), []);
  useSimLoop(step, s.running, s.speed);
  const grid = occupancy(s.jobs);
  const u = util(s.jobs);
  const running = s.jobs.find((j) => j.status === "running" && j.loss.length > 2);
  const [gpus, setGpus] = useState(4);

  return (
    <div className="space-y-4">
      <SimBar
        running={s.running}
        speed={s.speed}
        t={s.t}
        onToggle={s.toggle}
        onReset={s.reset}
        onSpeed={s.setSpeed}
        extra={
          <>
            <label className="flex h-9 items-center gap-2 font-mono text-xs text-muted">
              GPUs
              <select
                value={gpus}
                onChange={(e) => setGpus(Number(e.target.value))}
                className="h-9 rounded-[8px] border border-border bg-elevated px-2 text-fg"
              >
                {[1, 2, 4, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => s.submit(gpus, `job-${s.seq}`, 2)}
            >
              Submit job
            </Button>
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel>
          <Metric label="Utilization" value={(u * 100).toFixed(0)} unit="%" tone="signal" />
        </Panel>
        <Panel>
          <Metric label="GPUs live" value={String(Math.round(u * TOTAL))} unit={`/ ${TOTAL}`} />
        </Panel>
        <Panel>
          <Metric label="Queue" value={String(s.jobs.filter((j) => j.status === "queued" || j.status === "preempted").length)} />
        </Panel>
        <Panel>
          <Metric label="Done" value={String(s.jobs.filter((j) => j.status === "done").length)} tone="ok" />
        </Panel>
      </div>
      <Panel title="Cluster" meta={`${NODES} nodes × ${GPUS_PER} GPUs`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: NODES }, (_, n) => (
            <div key={n}>
              <div className="mb-1.5 font-mono text-[11px] text-subtle">N{n}</div>
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: GPUS_PER }, (_, g) => {
                  const id = grid[n * GPUS_PER + g];
                  return (
                    <div
                      key={g}
                      title={id ?? "idle"}
                      className={`h-7 rounded-[4px] border ${
                        id ? "border-signal/40 bg-signal/30" : "border-border bg-elevated"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Jobs" className="lg:col-span-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">
                <tr>
                  <th className="py-2 pr-3 font-medium">Job</th>
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="py-2 pr-3 font-medium">GPUs</th>
                  <th className="py-2 pr-3 font-medium">Pri</th>
                  <th className="py-2 pr-3 font-medium">State</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {s.jobs.map((j) => (
                  <tr key={j.id} className="border-t border-border">
                    <td className="py-2.5 pr-3 font-mono text-xs">{j.id}</td>
                    <td className="py-2.5 pr-3">{j.name}</td>
                    <td className="py-2.5 pr-3 font-mono tabular-nums">{j.gpus}</td>
                    <td className="py-2.5 pr-3 font-mono tabular-nums">{j.priority}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs uppercase text-muted">{j.status}</td>
                    <td className="py-2.5 text-right">
                      {j.status === "running" ? (
                        <Button variant="ghost" size="sm" onClick={() => s.preempt(j.id)}>
                          Preempt
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Loss" meta={running ? running.name : "no active curve"} className="lg:col-span-2">
          <div className="h-44">
            {running ? (
              <ResponsiveContainer>
                <LineChart data={running.loss}>
                  <Tooltip
                    contentStyle={{ background: "#111317", border: "1px solid #23262d", borderRadius: 8 }}
                  />
                  <Line type="monotone" dataKey="v" stroke="#9bb4c8" dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted">Submit a job to watch a training curve.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
