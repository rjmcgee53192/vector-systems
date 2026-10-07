import type { ReactNode } from "react";
import type { ProjectId } from "@/lib/catalog";
import { PROJECTS } from "@/lib/catalog";

export function ProjectPage({ id, children }: { id: ProjectId; children: ReactNode }) {
  const p = PROJECTS.find((x) => x.id === id);
  if (!p) return null;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
        {p.code} · {p.domain}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-medium tracking-tight md:text-4xl">{p.name}</h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal">{p.target}</p>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted">{p.tagline}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
