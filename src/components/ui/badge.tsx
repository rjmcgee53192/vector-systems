import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
  idle: "text-muted border-border",
  live: "text-ok border-ok/30",
  warn: "text-warn border-warn/30",
  danger: "text-danger border-danger/30",
  signal: "text-signal border-signal/30",
} as const;

export function Badge({
  tone = "idle",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
