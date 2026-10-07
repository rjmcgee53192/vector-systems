import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Panel({
  title,
  meta,
  className,
  children,
}: {
  title?: string;
  meta?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-surface p-4 md:p-5", className)}>
      {(title || meta) && (
        <header className="mb-3 flex items-baseline justify-between gap-3">
          {title ? (
            <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{title}</h2>
          ) : (
            <span />
          )}
          {meta ? <span className="font-mono text-[11px] tabular-nums text-subtle">{meta}</span> : null}
        </header>
      )}
      {children}
    </section>
  );
}
