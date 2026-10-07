/** 2-stage point-mass GNC. Numbers are HV-9 class, not a named vehicle. */

export const G0 = 9.80665;

export type Phase =
  | "idle"
  | "countdown"
  | "powered"
  | "meco"
  | "sep"
  | "upper"
  | "seco"
  | "orbit"
  | "abort";

export type Sample = { t: number; alt: number; vel: number; q: number; ax: number; x: number };

export type Event = { t: number; msg: string };

export type Vehicle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pitch: number;
  prop: number;
  dry: number;
  throttle: number;
  isp: number;
  thrustEach: number;
  engines: boolean[];
  area: number;
  cd: number;
};

export type Flight = {
  t: number;
  phase: Phase;
  stack: Vehicle;
  booster: Vehicle | null;
  events: Event[];
  samples: Sample[];
  q: number;
  maxQ: number;
  ax: number;
  running: boolean;
  speed: number;
  enginesOut: number;
};

function atmDensity(h: number) {
  return 1.225 * Math.exp(-Math.max(0, h) / 8500);
}

function liveEngines(v: Vehicle) {
  return v.engines.reduce((n, e) => n + (e ? 1 : 0), 0);
}

function mass(v: Vehicle) {
  return v.dry + Math.max(0, v.prop);
}

function pitchProgram(tPowered: number, phase: Phase) {
  if (phase === "upper" || phase === "seco" || phase === "orbit") {
    return (18 * Math.PI) / 180;
  }
  if (tPowered < 12) return Math.PI / 2;
  const over = Math.min(1, (tPowered - 12) / 70);
  return Math.PI / 2 - over * ((52 * Math.PI) / 180);
}

function integrate(v: Vehicle, dt: number, gravity: boolean): { next: Vehicle; ax: number; q: number } {
  const n = liveEngines(v);
  const m = Math.max(1, mass(v));
  const thrust = n * v.thrustEach * v.throttle;
  const mdot = thrust > 0 && v.isp > 0 ? thrust / (v.isp * G0) : 0;
  const burn = Math.min(v.prop, mdot * dt);
  const actualThrust = mdot > 0 ? thrust * (burn / (mdot * dt || 1)) : 0;
  const rho = atmDensity(v.y);
  const spd = Math.hypot(v.vx, v.vy);
  const q = 0.5 * rho * spd * spd;
  const drag = q * v.cd * v.area;
  const ux = spd > 1 ? v.vx / spd : Math.cos(v.pitch);
  const uy = spd > 1 ? v.vy / spd : Math.sin(v.pitch);
  const fx = actualThrust * Math.cos(v.pitch) - drag * ux;
  const fy = actualThrust * Math.sin(v.pitch) - drag * uy - (gravity ? m * G0 : 0);
  const ax = fx / m;
  const ay = fy / m;
  const next: Vehicle = {
    ...v,
    prop: v.prop - burn,
    vx: v.vx + ax * dt,
    vy: v.vy + ay * dt,
    x: v.x + v.vx * dt,
    y: Math.max(0, v.y + v.vy * dt),
    throttle: v.prop - burn <= 1 ? 0 : v.throttle,
  };
  if (next.y <= 0 && next.vy < 0) {
    next.y = 0;
    next.vy = 0;
    next.vx *= 0.2;
  }
  return { next, ax: actualThrust / m, q };
}

export function makeStack(): Vehicle {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    pitch: Math.PI / 2,
    prop: 395_000,
    dry: 25_600 + 4_000 + 92_670 + 15_000,
    throttle: 0,
    isp: 305,
    thrustEach: 845_000,
    engines: Array.from({ length: 9 }, () => true),
    area: 10.5,
    cd: 0.55,
  };
}

export function makeUpper(from: Vehicle): Vehicle {
  return {
    x: from.x,
    y: from.y,
    vx: from.vx,
    vy: from.vy,
    pitch: from.pitch,
    prop: 92_670,
    dry: 4_000 + 15_000,
    throttle: 0,
    isp: 348,
    thrustEach: 990_000,
    engines: [true],
    area: 8.2,
    cd: 0.35,
  };
}

export function makeBooster(from: Vehicle): Vehicle {
  return {
    ...from,
    prop: Math.min(from.prop, 18_000),
    dry: 25_600,
    throttle: 0,
    engines: from.engines,
    pitch: Math.PI,
  };
}

export function initialFlight(): Flight {
  return {
    t: -10,
    phase: "idle",
    stack: makeStack(),
    booster: null,
    events: [{ t: -10, msg: "HV-9 on pad. Autosequence armed." }],
    samples: [],
    q: 0,
    maxQ: 0,
    ax: 0,
    running: false,
    speed: 4,
    enginesOut: 0,
  };
}

function pushEvent(f: Flight, msg: string): Event[] {
  return [{ t: f.t, msg }, ...f.events].slice(0, 48);
}

export function stepFlight(f: Flight, dt: number): Flight {
  if (f.phase === "idle" || f.phase === "orbit" || f.phase === "abort" || f.phase === "seco") {
    if (f.phase === "idle") return f;
    if (f.phase === "orbit" || f.phase === "seco" || f.phase === "abort") {
      const t = f.t + dt;
      const { next, q, ax } = integrate(
        { ...f.stack, throttle: 0 },
        dt,
        f.phase !== "orbit",
      );
      const samples =
        t - (f.samples.at(-1)?.t ?? -999) > 0.4
          ? [...f.samples, { t, alt: next.y, vel: Math.hypot(next.vx, next.vy), q, ax, x: next.x }].slice(-180)
          : f.samples;
      return { ...f, t, stack: next, q, ax, samples };
    }
  }

  let t = f.t + dt;
  let phase: Phase = f.phase;
  let stack = f.stack;
  let booster = f.booster;
  let events = f.events;

  if (phase === "countdown") {
    if (t >= -2 && f.t < -2) {
      stack = { ...stack, throttle: 1 };
      events = pushEvent({ ...f, t }, "Engine start. Chamber pressure rising.");
    }
    if (t >= 0) {
      phase = "powered";
      events = pushEvent({ ...f, t: 0 }, "Liftoff.");
    }
    return { ...f, t, phase, stack, events };
  }

  const tPowered = Math.max(0, t);
  stack = { ...stack, pitch: pitchProgram(tPowered, phase) };

  if (phase === "powered") {
    const { next, q, ax } = integrate(stack, dt, true);
    stack = next;
    const vel = Math.hypot(stack.vx, stack.vy);
    const samples =
      t - (f.samples.at(-1)?.t ?? -999) > 0.35
        ? [...f.samples, { t, alt: stack.y, vel, q, ax, x: stack.x }].slice(-180)
        : f.samples;
    const maxQ = Math.max(f.maxQ, q);
    if (f.maxQ < 30_000 && maxQ >= 30_000) {
      events = pushEvent({ ...f, t }, "Max-Q.");
    }
    if (stack.prop < 2_000 || t > 155) {
      phase = "meco";
      stack = { ...stack, throttle: 0 };
      events = pushEvent({ ...f, t }, "MECO.");
    }
    if (liveEngines(stack) <= 6 && t < 40) {
      phase = "abort";
      stack = { ...stack, throttle: 0 };
      events = pushEvent({ ...f, t }, "RTLS abort. Engine-out limit exceeded.");
    }
    let b = booster;
    if (b) {
      b = integrate({ ...b, throttle: 0.4, pitch: Math.PI * 0.92 }, dt, true).next;
    }
    return { ...f, t, phase, stack, booster: b, events, samples, q, maxQ, ax };
  }

  if (phase === "meco") {
    const { next, q, ax } = integrate({ ...stack, throttle: 0 }, dt, true);
    stack = next;
    if (t > (f.events.find((e) => e.msg === "MECO.")?.t ?? t) + 2.2) {
      phase = "sep";
      booster = makeBooster(stack);
      stack = makeUpper(stack);
      events = pushEvent({ ...f, t }, "Stage sep. Ullage.");
    }
    return { ...f, t, phase, stack, booster, events, q, ax };
  }

  if (phase === "sep") {
    const { next, q, ax } = integrate({ ...stack, throttle: 0 }, dt, true);
    stack = next;
    if (booster) booster = integrate({ ...booster, throttle: 0.55, pitch: Math.PI * 0.9 }, dt, true).next;
    if (t > (f.events.find((e) => e.msg.startsWith("Stage sep"))?.t ?? t) + 4) {
      phase = "upper";
      stack = { ...stack, throttle: 1, pitch: (22 * Math.PI) / 180 };
      events = pushEvent({ ...f, t }, "SES-1. Vacuum engine at 100%.");
    }
    return { ...f, t, phase, stack, booster, events, q, ax };
  }

  if (phase === "upper") {
    stack = { ...stack, pitch: (18 * Math.PI) / 180 };
    const { next, q, ax } = integrate(stack, dt, true);
    stack = next;
    if (booster) booster = integrate({ ...booster, throttle: 0.2, pitch: Math.PI }, dt, true).next;
    const vel = Math.hypot(stack.vx, stack.vy);
    const samples =
      t - (f.samples.at(-1)?.t ?? -999) > 0.4
        ? [...f.samples, { t, alt: stack.y, vel, q, ax, x: stack.x }].slice(-180)
        : f.samples;
    if (stack.prop < 400 || vel > 7600) {
      phase = vel > 7200 ? "orbit" : "seco";
      stack = { ...stack, throttle: 0 };
      events = pushEvent({ ...f, t }, phase === "orbit" ? "SECO. Insertion." : "SECO.");
    }
    return { ...f, t, phase, stack, booster, events, samples, q, ax };
  }

  return { ...f, t };
}

export function killEngine(f: Flight, index: number): Flight {
  if (f.phase !== "powered" && f.phase !== "countdown") return f;
  if (!f.stack.engines[index]) return f;
  const engines = f.stack.engines.map((e, i) => (i === index ? false : e));
  return {
    ...f,
    stack: { ...f.stack, engines },
    enginesOut: f.enginesOut + 1,
    events: pushEvent(f, `Engine ${index + 1} out.`),
  };
}

export function arm(f: Flight): Flight {
  if (f.phase !== "idle") return f;
  return {
    ...f,
    phase: "countdown",
    running: true,
    events: pushEvent({ ...f, t: -10 }, "T-10. Autosequence."),
  };
}
