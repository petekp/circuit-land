// The master board for the run-stage illustration system.
//
// Every chapter SVG is a viewBox window onto this one coordinate space,
// so positions agree across sections by construction: the dotted pad a
// viewer sees in the gap chapter sits at the exact coordinates where the
// real pad seats in later chapters.

export const BOARD = { width: 1440, height: 360 };

// The rail (the flow) runs horizontally; pads (typed steps) sit on it.
export const RAIL_Y = 180;
// Facts written to the record accumulate on the ledger row.
export const LEDGER_Y = 300;
// Past runs stack below the board like sediment.
export const ARCHIVE_BAND = { x: 102, y: 326, width: 1226, height: 26 };

export const PAD_SIZE = 36;
export const PAD_RADIUS = 2;
export const PULSE_SIZE = 14;
export const TICK = { width: 24, height: 4 };

// The run's spine: an eight-pad abridgment of the Fix flow. Openly
// compressed; it never contradicts a field the real fix-result.json shows.
export const PADS = [
  { id: "frame", x: 120 },
  { id: "context", x: 290 },
  { id: "diagnose", x: 460 },
  { id: "plan", x: 630 },
  { id: "act", x: 800 },
  { id: "verify", x: 970 },
  { id: "review", x: 1140 },
  { id: "close", x: 1310 },
] as const;

// The channel to the human rises from the plan pad toward the top edge.
// The human lives offscreen above the board.
export const PORT_STUB_X = 630;

// paceWeight scales the TIME cost of the segment that arrives at this
// waypoint (default 1, time stays proportional to Manhattan length). It
// is a rhythm knob: a weight below 1 covers that segment in less time, a
// weight above 1 lingers. The with-lane keeps every step at weight 1 so
// the pace is even; only the off-board exit segment uses a lighter weight
// to clear the pulse before the next run enters.
export type Waypoint = {
  x: number;
  y: number;
  dwellSeconds?: number;
  paceWeight?: number;
};

// Shared easing token: depart quick, arrive soft. Identical in every
// chapter — the protagonist's competence is a constant.
export const EASE = "cubic-bezier(0.6, 0, 0.2, 1)";

function fmt(n: number) {
  return Number(n.toFixed(3));
}

export type Journey = {
  pathD: string;
  pulseKeyframes: string;
  trailKeyframes: string;
  // First-touch time at each waypoint index, in seconds.
  arrivalSeconds: number[];
  // Path percent (0-100) at each waypoint index, for static tableaus.
  percentAtWaypoint: number[];
};

// Keyframe percentages are derived from segment lengths so the pulse
// rhythm is a function of the geometry, never hand-tuned drift: time on
// each segment is proportional to its Manhattan length (scaled by the
// destination waypoint's paceWeight), dwells are explicit holds, and the
// trail comet shares the same timetable so its head stays glued to the
// pulse.
//
// The trail is a single dash window sliding along the path: with
// pathLength=100 and stroke-dasharray "T 100" only one dash instance can
// be visible, covering [-offset, -offset + T]. Keeping the dash head at
// the pulse's position means offset = T - pulsePercent. After the pulse
// exits, the offset keeps falling to -100 so the tail erodes off the end.
export function buildJourney(opts: {
  waypoints: Waypoint[];
  loopSeconds: number;
  travelStartSeconds: number;
  travelEndSeconds: number;
  trailUnits: number;
  trailFadeSeconds: number;
}): Journey {
  const {
    waypoints,
    loopSeconds,
    travelStartSeconds,
    travelEndSeconds,
    trailUnits,
    trailFadeSeconds,
  } = opts;

  const segmentLengths: number[] = [];
  const segmentTimeWeights: number[] = [];
  let totalLength = 0;
  let totalTimeWeight = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const length =
      Math.abs(waypoints[i].x - waypoints[i - 1].x) +
      Math.abs(waypoints[i].y - waypoints[i - 1].y);
    const timeWeight = length * (waypoints[i].paceWeight ?? 1);
    segmentLengths.push(length);
    segmentTimeWeights.push(timeWeight);
    totalLength += length;
    totalTimeWeight += timeWeight;
  }

  const dwellTotal = waypoints.reduce(
    (sum, w) => sum + (w.dwellSeconds ?? 0),
    0,
  );
  const motionBudget = travelEndSeconds - travelStartSeconds - dwellTotal;

  type TimedPoint = { atSeconds: number; pathPercent: number; x: number; y: number };
  const points: TimedPoint[] = [];
  const arrivalSeconds: number[] = [];
  const percentAtWaypoint: number[] = [];

  let t = travelStartSeconds;
  let traveled = 0;
  waypoints.forEach((w, i) => {
    if (i > 0) {
      traveled += segmentLengths[i - 1];
      t += (segmentTimeWeights[i - 1] / totalTimeWeight) * motionBudget;
    }
    const pathPercent = (traveled / totalLength) * 100;
    arrivalSeconds.push(fmt(t));
    percentAtWaypoint.push(fmt(pathPercent));
    points.push({ atSeconds: t, pathPercent, x: w.x, y: w.y });
    if (w.dwellSeconds) {
      t += w.dwellSeconds;
      points.push({ atSeconds: t, pathPercent, x: w.x, y: w.y });
    }
  });

  const pct = (seconds: number) => fmt((seconds / loopSeconds) * 100);

  const pulseFrames: string[] = [];
  const trailFrames: string[] = [];

  if (travelStartSeconds > 0) {
    const w0 = waypoints[0];
    pulseFrames.push(
      `0% { transform: translate(${w0.x}px, ${w0.y}px); animation-timing-function: linear; }`,
    );
    trailFrames.push(
      `0% { stroke-dashoffset: ${trailUnits}; animation-timing-function: linear; }`,
    );
  }

  points.forEach((p) => {
    pulseFrames.push(
      `${pct(p.atSeconds)}% { transform: translate(${p.x}px, ${p.y}px); animation-timing-function: ${EASE}; }`,
    );
    trailFrames.push(
      `${pct(p.atSeconds)}% { stroke-dashoffset: ${fmt(trailUnits - p.pathPercent)}; animation-timing-function: ${EASE}; }`,
    );
  });

  const last = waypoints[waypoints.length - 1];
  pulseFrames.push(`100% { transform: translate(${last.x}px, ${last.y}px); }`);

  trailFrames.push(
    `${pct(travelEndSeconds + trailFadeSeconds)}% { stroke-dashoffset: -100; animation-timing-function: linear; }`,
  );
  trailFrames.push(`100% { stroke-dashoffset: -100; }`);

  const pathD = waypoints
    .map((w, i) => `${i === 0 ? "M" : "L"} ${w.x} ${w.y}`)
    .join(" ");

  return {
    pathD,
    pulseKeyframes: pulseFrames.join("\n  "),
    trailKeyframes: trailFrames.join("\n  "),
    arrivalSeconds,
    percentAtWaypoint,
  };
}
