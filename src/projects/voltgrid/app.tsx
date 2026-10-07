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
import {
  energyCost,
  priceCurve,
  SLOT_H,
  SLOTS,
  siteSeries,
} from "./optimizer";
import { useVolt } from "./store";

export function VoltgridApp() {
  const { vehicles, plans, selected, select, replan } = useVolt();
  const opt = plans.reduce((n, p) => n + energyCost(p.kw), 0);
  const naive = plans.reduce((n, p) => n + energyCost(p.naiveKw), 0);
  const save = naive > 0 ? ((naive - opt) / naive) * 100 : 0;
  const price = Array.from({ length: SLOTS }, (_, s) => ({
    h: s * SLOT_H,
    price: priceCurve(s),
  }));
  const sites = siteSeries(plans, vehicles, "kw");
  const sel = vehicles.find((v) => v.id === selected);
  const plan = plans.find((p) => p.vehicleId === selected);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={replan}>
          Resample fleet
        </Button>
        <span className="font-mono text-xs text-muted">
          16 vehicles · 4 sites · 8h horizon · 15 min LMP
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel>
          <Metric label="Optimized cost" value={opt.toFixed(1)} unit="k$" tone="signal" />
        </Panel>
        <Panel>
          <Metric label="Naive plug-in" value={naive.toFixed(1)} unit="k$" />
        </Panel>
        <Panel>
          <Metric label="Delta" value={save.toFixed(1)} unit="%" tone="ok" />
        </Panel>
        <Panel>
          <Metric label="Energy" value={vehicles.reduce((n, v) => n + v.needKwh, 0).toFixed(0)} unit="kWh" />
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Locational marginal price" meta="$/MWh" className="lg:col-span-3">
          <div className="h-48">
            <ResponsiveContainer>
              <AreaChart data={price}>
                <XAxis dataKey="h" tick={{ fill: "#8b919a", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8b919a", fontSize: 11 }} width={36} />
                <Tooltip
                  contentStyle={{ background: "#111317", border: "1px solid #23262d", borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="price" stroke="#9bb4c8" fill="#9bb4c822" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Site load" className="lg:col-span-2">
          <ul className="space-y-3">
            {sites.map(({ site, series }) => {
              const peak = Math.max(...series, 1);
              return (
                <li key={site.id}>
                  <div className="mb-1 flex justify-between font-mono text-[11px] text-muted">
                    <span>{site.name}</span>
                    <span className="tabular-nums">
                      {peak.toFixed(0)} / {site.capKw} kW
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full bg-signal"
                      style={{ width: `${Math.min(100, (peak / site.capKw) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
      <Panel title="Fleet" meta="click a vehicle">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">
              <tr>
                <th className="py-2 pr-3 font-medium">ID</th>
                <th className="py-2 pr-3 font-medium">Model</th>
                <th className="py-2 pr-3 font-medium">Site</th>
                <th className="py-2 pr-3 font-medium">SoC</th>
                <th className="py-2 pr-3 font-medium">Need</th>
                <th className="py-2 font-medium">Depart</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => select(v.id)}
                  className={`cursor-pointer border-t border-border ${selected === v.id ? "bg-elevated" : ""}`}
                >
                  <td className="py-2.5 pr-3 font-mono text-xs">{v.id}</td>
                  <td className="py-2.5 pr-3">{v.model}</td>
                  <td className="py-2.5 pr-3 capitalize text-muted">{v.site}</td>
                  <td className="py-2.5 pr-3 font-mono tabular-nums">{(v.soc * 100).toFixed(0)}%</td>
                  <td className="py-2.5 pr-3 font-mono tabular-nums">{v.needKwh.toFixed(0)} kWh</td>
                  <td className="py-2.5 font-mono tabular-nums">{(v.departSlot * SLOT_H).toFixed(1)} h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {sel && plan ? (
        <Panel title={`${sel.id} charge plan`} meta="kW by slot · steel = optimal, muted = naive">
          <div className="flex h-24 items-end gap-px">
            {plan.kw.map((k, i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col justify-end gap-px">
                <div
                  className="rounded-t-[2px] bg-signal"
                  style={{ height: `${(k / sel.maxKw) * 100}%`, minHeight: k > 0 ? 2 : 0 }}
                />
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
