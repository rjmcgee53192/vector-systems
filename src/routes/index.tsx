import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { GITHUB_REPO, PROJECTS } from "@/lib/catalog";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-subtle">
        Hiring packet · SpaceX · Tesla · NVIDIA
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl font-medium leading-[1.1] tracking-tight text-fg md:text-6xl">
        Five systems. One monorepo. Built to be read by hiring teams.
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
        VECTOR is a full-stack TypeScript monorepo: launch GNC, EV energy dispatch,
        occupancy planning, factory MES, and GPU gang scheduling. Each app is a live
        control loop, not a CRUD clone.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/aether"
          className="inline-flex h-11 items-center rounded-[8px] bg-primary px-4 text-sm font-medium text-primary-fg"
        >
          Open Aether
        </Link>
        <a
          href={GITHUB_REPO}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-border px-4 text-sm text-fg"
        >
          Source on GitHub
          <ArrowUpRight className="size-4" />
        </a>
      </div>

      <ol className="mt-14 grid gap-3 md:grid-cols-2">
        {PROJECTS.map((p) => (
          <li key={p.id}>
            <Link
              to={p.href}
              className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:bg-elevated"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[11px] text-subtle">{p.code}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-signal">
                  {p.target}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-medium tracking-tight">{p.name}</h2>
              <p className="mt-2 text-sm text-muted">{p.tagline}</p>
              <p className="mt-4 font-mono text-[11px] leading-relaxed text-subtle">{p.algorithm}</p>
              <span className="mt-5 font-mono text-[11px] text-fg">
                Read {p.readFirst.split("/").pop()}
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <section className="mt-16 border-t border-border pt-10">
        <h2 className="text-xl font-medium tracking-tight">What to read first</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Interviewers should skip the chrome and open the engines. The UI is the
          demo; the files below are the work.
        </p>
        <ul className="mt-6 space-y-3 font-mono text-sm text-signal">
          {PROJECTS.map((p) => (
            <li key={p.id} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <span className="w-28 text-subtle">{p.code}</span>
              <span>{p.readFirst}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
