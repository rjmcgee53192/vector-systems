import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { GITHUB_REPO, PROJECTS } from "@/lib/catalog";
import { cn } from "@/lib/cn";

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-[8px] border border-border bg-elevated font-mono text-[11px] tracking-[0.16em] text-fg">
              V
            </span>
            <span className="min-w-0">
              <span className="block font-medium tracking-tight text-fg">VECTOR</span>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-subtle sm:block">
                Systems monorepo
              </span>
            </span>
          </Link>
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center rounded-[8px] border border-border px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted hover:text-fg"
          >
            GitHub
          </a>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:px-6">
          <NavLink href="/" active={pathname === "/"} label="Overview" code="00" />
          {PROJECTS.map((p) => (
            <NavLink
              key={p.id}
              href={p.href}
              active={pathname === p.href}
              label={p.name}
              code={p.code}
            />
          ))}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  active,
  label,
  code,
}: {
  href: "/" | "/aether" | "/voltgrid" | "/helios" | "/forge" | "/tensorlab";
  active: boolean;
  label: string;
  code: string;
}) {
  return (
    <Link
      to={href}
      className={cn(
        "flex h-11 shrink-0 items-center gap-2 rounded-[8px] px-3 font-medium",
        active ? "bg-elevated text-fg" : "text-muted hover:text-fg",
      )}
    >
      <span className="font-mono text-[10px] text-subtle">{code}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}
