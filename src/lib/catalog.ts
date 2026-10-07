export type ProjectId = "aether" | "voltgrid" | "helios" | "forge" | "tensorlab";

export type ProjectHref = "/aether" | "/voltgrid" | "/helios" | "/forge" | "/tensorlab";

export type Project = {
  id: ProjectId;
  code: string;
  name: string;
  href: ProjectHref;
  target: string;
  domain: string;
  tagline: string;
  algorithm: string;
  readFirst: string;
};

export const PROJECTS: Project[] = [
  {
    id: "aether",
    code: "AE-01",
    name: "Aether",
    href: "/aether",
    target: "SpaceX",
    domain: "Flight software · telemetry · GNC",
    tagline: "Launch vehicle mission control with a 2-stage point-mass GNC loop.",
    algorithm:
      "Exponential atmosphere, quadratic drag, pitch program, MECO/sep/SES, engine-out abort logic.",
    readFirst: "src/projects/aether/physics.ts",
  },
  {
    id: "voltgrid",
    code: "VG-02",
    name: "Voltgrid",
    href: "/voltgrid",
    target: "Tesla",
    domain: "Energy · fleet · optimization",
    tagline: "Valley-fill EV charging against a live locational marginal price.",
    algorithm:
      "Deadline-aware cheapest-slot fill with site transformer capacity and naive-vs-optimal cost.",
    readFirst: "src/projects/voltgrid/optimizer.ts",
  },
  {
    id: "helios",
    code: "HL-03",
    name: "Helios",
    href: "/helios",
    target: "Tesla · NVIDIA",
    domain: "Perception · planning · occupancy",
    tagline: "Bird's-eye occupancy grid, inflated obstacles, 8-connected A*.",
    algorithm:
      "Dynamic rasterization of tracks, 1-cell inflation, A* with octile heuristic and replans.",
    readFirst: "src/projects/helios/astar.ts",
  },
  {
    id: "forge",
    code: "FG-04",
    name: "Forge",
    href: "/forge",
    target: "Tesla",
    domain: "Manufacturing · MES · OEE",
    tagline: "Discrete-event body shop with takt, scrap, and real OEE.",
    algorithm:
      "Station queues, cycle-time noise, jam injection; Availability × Performance × Quality.",
    readFirst: "src/projects/forge/sim.ts",
  },
  {
    id: "tensorlab",
    code: "TL-05",
    name: "Tensorlab",
    href: "/tensorlab",
    target: "NVIDIA",
    domain: "GPU scheduling · clusters · training",
    tagline: "Gang-scheduled GPU cluster with rack-aware first-fit decreasing.",
    algorithm:
      "Jobs claim contiguous GPUs; FFD placement prefers same node; preemption by priority.",
    readFirst: "src/projects/tensorlab/scheduler.ts",
  },
];

export const GITHUB_REPO = "https://github.com/rjmcgee53192/vector-systems";
