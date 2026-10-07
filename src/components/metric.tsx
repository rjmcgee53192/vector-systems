import { cn } from "@/lib/cn";

export function Metric({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "ok" | "warn" | "danger" | "signal";
}) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-mono text-xl tabular-nums tracking-tight text-fg md:text-2xl",
            tone === "ok" && "text-ok",
            tone === "warn" && "text-warn",
            tone === "danger" && "text-danger",
            tone === "signal" && "text-signal",
          )}
        >
          {value}
        </span>
        {unit ? <span className="font-mono text-xs text-muted">{unit}</span> : null}
      </div>
    </div>
  );
}
