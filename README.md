# VECTOR

Five production-grade systems in one TypeScript monorepo.

Built to be read by hiring teams at **SpaceX**, **Tesla**, and **NVIDIA** — real control loops, not CRUD clones.

| Code | System | Domain | Read this first |
| --- | --- | --- | --- |
| AE-01 | **Aether** | Launch GNC / telemetry | [`src/projects/aether/physics.ts`](src/projects/aether/physics.ts) |
| VG-02 | **Voltgrid** | EV energy dispatch | [`src/projects/voltgrid/optimizer.ts`](src/projects/voltgrid/optimizer.ts) |
| HL-03 | **Helios** | Occupancy + A* planner | [`src/projects/helios/astar.ts`](src/projects/helios/astar.ts) |
| FG-04 | **Forge** | Factory MES / OEE | [`src/projects/forge/sim.ts`](src/projects/forge/sim.ts) |
| TL-05 | **Tensorlab** | GPU gang scheduler | [`src/projects/tensorlab/scheduler.ts`](src/projects/tensorlab/scheduler.ts) |

Live consoles are wired as routes: `/aether` `/voltgrid` `/helios` `/forge` `/tensorlab`.

---

## Why this repo

Those companies do not hire for another todo app. They hire people who can write:

- **Flight software** — discrete time, mass flow, abort modes
- **Energy** — constrained optimization against a price signal
- **Autonomy** — occupancy, inflation, search
- **Manufacturing** — queues, takt, OEE as a real product of three numbers
- **Accelerators** — gang scheduling, locality, preemption

Each engine is framework-agnostic TypeScript. React is only the console.

---

## Architecture

```
src/projects/<system>/
  physics.ts | optimizer.ts | astar.ts | sim.ts | scheduler.ts   ← the work
  store.ts                                                    ← sim clock
  app.tsx                                                     ← console
src/routes/                                                     ← one route per system
src/components/                                                 ← shared ops chrome
```

No accounts. No fake backend. State is a deterministic step function `s, dt → s'`.

---

## Systems

### Aether — HV-9 mission control (SpaceX)

Two-stage point-mass vehicle. Exponential atmosphere, quadratic drag, pitch program, MECO / stage sep / SES-1, engine-out abort if too many first-stage engines drop before T+40s. Click an engine to kill it in flight.

### Voltgrid — fleet charging (Tesla)

Sixteen vehicles, four sites, 8-hour horizon, 15-minute LMP. Valley-fill assigns energy to the cheapest feasible slots before each vehicle's departure, under transformer kW caps. Reports optimized cost vs naive “plug in now.”

### Helios — bird's-eye planner (Tesla Autopilot / NVIDIA Drive)

48×32 occupancy grid. Dynamic tracks rasterize every tick, inflate by one cell, then 8-connected A* with an octile heuristic. Tap a cell to pin a static obstacle and force a replan.

### Forge — body line MES (Tesla manufacturing)

Eight stations, queues, cycle-time noise, scrap, jam injection. OEE is Availability × Performance × Quality, not a painted gauge.

### Tensorlab — GPU cluster (NVIDIA)

8 nodes × 8 GPUs. Jobs gang-schedule with first-fit decreasing, preferring a single node. Priority preemption frees a placement and the queue refills. Submit a 1/2/4/8-GPU job from the console.

---

## Stack

TypeScript, React 19, TanStack Start, Zustand, Canvas + Recharts.

Engines have no UI imports. You can unit-test `stepFlight`, `valleyFill`, `astar`, `stepPlant`, and `schedule` in isolation.

---

## What I want to work on

Flight software, vehicle software, energy, autonomy, or GPU systems. This repo is the packet.
