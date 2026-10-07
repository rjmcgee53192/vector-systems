import type { ReactNode } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatClock } from "@/projects/shared/use-sim-loop";

const SPEEDS = [1, 2, 4, 8];

export function SimBar({
  running,
  speed,
  t,
  live,
  onToggle,
  onReset,
  onSpeed,
  extra,
}: {
  running: boolean;
  speed: number;
  t: number;
  live?: boolean;
  onToggle: () => void;
  onReset: () => void;
  onSpeed: (n: number) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary" size="sm" onClick={onToggle} aria-label={running ? "Pause" : "Run"}>
        {running ? <Pause className="size-4" /> : <Play className="size-4" />}
        {running ? "Pause" : "Run"}
      </Button>
      <Button variant="outline" size="sm" onClick={onReset} aria-label="Reset">
        <RotateCcw className="size-4" />
        Reset
      </Button>
      <div className="flex rounded-[8px] border border-border p-0.5">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeed(s)}
            className={`h-8 min-w-11 rounded-[6px] px-2 font-mono text-xs tabular-nums ${
              speed === s ? "bg-elevated text-fg" : "text-muted"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
      <span className="font-mono text-sm tabular-nums text-signal">{formatClock(t)}</span>
      <Badge tone={live === false ? "idle" : running ? "live" : "idle"}>
        {live === false ? "armed" : running ? "live" : "hold"}
      </Badge>
      {extra}
    </div>
  );
}
