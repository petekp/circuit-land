import {
  EASE,
  PADS,
  PAD_RADIUS,
  PAD_SIZE,
  PULSE_SIZE,
  buildJourney,
  type Journey,
  type Waypoint,
} from "./geometry";
import { RunStageReveal } from "./reveal";

// Chapter one: the same work, two worlds, running forever.
//
// Both lanes are a seamless procession — as one agent leaves the board,
// the next enters. Top lane (without Circuit): every run improvises a
// DIFFERENT route, hits errors at different moments, backtracks, and
// leaves nothing behind; even the error marks fade, so the next run
// repeats the experience from zero. Three authored variants play
// back-to-back inside the master loop, so the lane never visibly
// repeats itself on a casual watch.
//
// Bottom lane (with Circuit): every run rides the same rail and WRITES
// ITS RECORD as it goes — a small document rides level with the pulse,
// trailing just behind it, gaining a line as steps complete — and gets
// filed below the last pad when the run finishes. The run compounds —
// dwells shrink and segments quicken step over step (paceWeight), the
// pulse's aura stretches into a streak — so each run finishes early and
// four runs complete in the time the lane above manages three. When a
// new run enters, the filed record and the seated steps dim to a
// residue (the record recedes into history; it never un-writes); the
// record brightens briefly as the new run passes the first pad —
// consulted, which is why this lane is fast.
//
// All pulses share one bright ink: it is the same agent. Only the
// world around it differs.
//
// The chapter ships as TWO designed crops of the same story, not one
// scaled drawing: a wide 1440-unit board (8 pads) and a narrow
// 720-unit board (4 pads) that swap at the lg breakpoint, so phone
// viewers get readable pads instead of a miniature. Every class and
// keyframe is prefixed per stage so both style blocks can share the
// document. A reveal wrapper adds `.is-live` on first
// scroll-into-view; the stage furniture (rail, pads, tags) then draws
// itself in before the procession fades up. Without JavaScript or with
// reduced motion, the stage is simply visible.

const LOOP_SECONDS = 24;
const TRAIL_A_UNITS = 22;
const LANE_A_WINDOW = 8;
const LANE_B_PERIOD = 6;
const LANE_B_RUN_COUNT = 4;

const RAIL_B_Y = 256;
const RECORD_SLOT_Y = 286;

// The record document: a small card that rides LEVEL with the pulse —
// same y-center, trailing just behind it — so card and agent read as
// one moving unit. The card is filled with the page background so the
// rail doesn't strike through it. Local offsets are relative to the
// pulse group's origin.
const DOC = { width: 22, height: 30, rx: 2 };
const DOC_Y = -DOC.height / 2;
const DOC_LINE = { inset: 4, width: 14, height: 2.5, gap: 6, top: 5 };
const DOC_FILL = "var(--background)";

const RECORD_SETTLE = 0.9;
const RECORD_RESIDUE = 0.35;
const SEAT_SETTLE = 0.5;
const SEAT_RESIDUE = 0.15;
const DWELL_BASE = 0.3;

// Lane A (without): improvised wanders, each with its own error
// schedule. The dwell at each collision is the stunned beat before
// retreating. Error marks sit just past the collision point, in the
// direction of travel; errorAt names the waypoint index of the hit.
type LaneARun = {
  waypoints: Waypoint[];
  // axis: the direction of travel at the collision, so the impact jolt
  // shakes the pulse along the axis it was moving on.
  errors: { x: number; y: number; errorAt: number; axis: "x" | "y" }[];
};

type StageConfig = {
  prefix: string;
  frame: { width: number; height: number };
  pads: { x: number }[];
  label: { x: number; fontSize: number; letterSpacing: number };
  // Where the traveling document trails, relative to the pulse.
  docTrailX: number;
  laneA: {
    // Travel + trail fade fill the window exactly: each run's trail
    // finishes eroding at the moment the next run enters, and the last
    // run's erosion completes precisely at the loop boundary (no
    // keyframe may land past 100% of the master loop).
    travel: number;
    trailFade: number;
    // Mid-journey waypoint of run 1 used as the reduced-motion tableau.
    stillWaypoint: number;
    runs: LaneARun[];
  };
  laneB: {
    travel: number;
    // Compounding is carried by the numbers: every pad's dwell is
    // shorter and every segment's paceWeight smaller than the one
    // before.
    dwellStep: number;
    paceStep: number;
    exitPace: number;
    // One record line lands as each of these pads completes.
    docLinePads: number[];
    // The reduced-motion still freezes one with-run mid-route: some
    // steps freshly seated, the rest showing the previous run's residue.
    stillX: number;
    stillSeated: number;
    stillDocLines: number;
  };
};

// One master loop holds 3 without-runs (8s windows) and 4 with-runs
// (6s windows). Every animation's first and last keyframe values agree,
// so the loop has no visible seam.
const WIDE: StageConfig = {
  prefix: "rs-g2w",
  frame: { width: 1440, height: 356 },
  pads: PADS.map((pad) => ({ x: pad.x })),
  label: { x: 102, fontSize: 13, letterSpacing: 2 },
  docTrailX: -50,
  laneA: {
    travel: 7.4,
    trailFade: 0.6,
    stillWaypoint: 7,
    runs: [
      // Run 1: two collisions, mid and late.
      {
        waypoints: [
          { x: -30, y: 110 },
          { x: 180, y: 110 },
          { x: 180, y: 60 },
          { x: 460, y: 60, dwellSeconds: 0.45 },
          { x: 420, y: 60 },
          { x: 420, y: 150 },
          { x: 700, y: 150 },
          { x: 700, y: 75 },
          { x: 940, y: 75, dwellSeconds: 0.45 },
          { x: 860, y: 75 },
          { x: 860, y: 160 },
          { x: 1150, y: 160 },
          { x: 1150, y: 100 },
          { x: 1480, y: 100 },
        ],
        errors: [
          { x: 478, y: 60, errorAt: 3, axis: "x" },
          { x: 958, y: 75, errorAt: 8, axis: "x" },
        ],
      },
      // Run 2: a collision almost immediately, then one near the far edge.
      {
        waypoints: [
          { x: -30, y: 150 },
          { x: 170, y: 150, dwellSeconds: 0.4 },
          { x: 120, y: 150 },
          { x: 120, y: 80 },
          { x: 520, y: 80 },
          { x: 520, y: 160 },
          { x: 900, y: 160 },
          { x: 900, y: 55 },
          { x: 1230, y: 55, dwellSeconds: 0.4 },
          { x: 1170, y: 55 },
          { x: 1170, y: 120 },
          { x: 1480, y: 120 },
        ],
        errors: [
          { x: 188, y: 150, errorAt: 1, axis: "x" },
          { x: 1248, y: 55, errorAt: 8, axis: "x" },
        ],
      },
      // Run 3: one mid-route collision, then a long lost meander.
      {
        waypoints: [
          { x: -30, y: 70 },
          { x: 320, y: 70 },
          { x: 320, y: 155 },
          { x: 640, y: 155 },
          { x: 640, y: 90, dwellSeconds: 0.35 },
          { x: 640, y: 130 },
          { x: 980, y: 130 },
          { x: 980, y: 60 },
          { x: 1300, y: 60 },
          { x: 1300, y: 110 },
          { x: 1480, y: 110 },
        ],
        errors: [{ x: 640, y: 74, errorAt: 4, axis: "y" }],
      },
    ],
  },
  laneB: {
    travel: 5.8,
    dwellStep: 0.032,
    paceStep: 0.08,
    exitPace: 0.38,
    docLinePads: [0, 2, 4, 6],
    stillX: 885,
    stillSeated: 5,
    stillDocLines: 3,
  },
};

// The narrow stage retells the same 24 seconds on a 4-pad spine. The
// routes are re-authored for the tighter board, not scaled down, so
// collisions and backtracks stay legible at phone width.
const NARROW: StageConfig = {
  prefix: "rs-g2n",
  frame: { width: 720, height: 356 },
  pads: [{ x: 100 }, { x: 272 }, { x: 444 }, { x: 616 }],
  label: { x: 82, fontSize: 19, letterSpacing: 2.5 },
  docTrailX: -40,
  laneA: {
    travel: 6.8,
    trailFade: 1.2,
    stillWaypoint: 7,
    runs: [
      // Run 1: two collisions, mid and late.
      {
        waypoints: [
          { x: -30, y: 110 },
          { x: 120, y: 110 },
          { x: 120, y: 60 },
          { x: 328, y: 60, dwellSeconds: 0.45 },
          { x: 288, y: 60 },
          { x: 288, y: 150 },
          { x: 430, y: 150 },
          { x: 430, y: 80 },
          { x: 618, y: 80, dwellSeconds: 0.45 },
          { x: 560, y: 80 },
          { x: 560, y: 155 },
          { x: 760, y: 155 },
        ],
        errors: [
          { x: 346, y: 60, errorAt: 3, axis: "x" },
          { x: 636, y: 80, errorAt: 8, axis: "x" },
        ],
      },
      // Run 2: a collision almost immediately, then a clean-but-lost arc.
      {
        waypoints: [
          { x: -30, y: 150 },
          { x: 118, y: 150, dwellSeconds: 0.4 },
          { x: 70, y: 150 },
          { x: 70, y: 80 },
          { x: 300, y: 80 },
          { x: 300, y: 160 },
          { x: 520, y: 160 },
          { x: 520, y: 60 },
          { x: 760, y: 60 },
        ],
        errors: [{ x: 136, y: 150, errorAt: 1, axis: "x" }],
      },
      // Run 3: one mid-route collision, then a meander out.
      {
        waypoints: [
          { x: -30, y: 70 },
          { x: 220, y: 70 },
          { x: 220, y: 155 },
          { x: 420, y: 155 },
          { x: 420, y: 90, dwellSeconds: 0.35 },
          { x: 420, y: 125 },
          { x: 580, y: 125 },
          { x: 580, y: 60 },
          { x: 760, y: 60 },
        ],
        errors: [{ x: 420, y: 76, errorAt: 4, axis: "y" }],
      },
    ],
  },
  laneB: {
    travel: 5.2,
    dwellStep: 0.06,
    paceStep: 0.16,
    exitPace: 0.45,
    docLinePads: [0, 1, 2, 3],
    stillX: 520,
    stillSeated: 3,
    stillDocLines: 3,
  },
};

const pct = (seconds: number) =>
  Number(((seconds / LOOP_SECONDS) * 100).toFixed(3));

// A seat lands as an event, not a tween — but the event has weight:
// it pops in slightly small and overshoots (a press), then settles and
// persists. When the next run enters the board it dims to a residue —
// the record recedes into history, it never un-writes — and re-stamps
// when the new pulse reaches the pad. First and last keyframes both
// sit at the settled value, so the loop is seamless.
function seatKeyframes(name: string, arrivals: number[]) {
  const frames = arrivals
    .map((arrival, k) => {
      const runStart = k * LANE_B_PERIOD;
      return `${pct(runStart)}% { opacity: ${SEAT_SETTLE}; transform: scale(1); }
  ${pct(runStart + 0.3)}% { opacity: ${SEAT_RESIDUE}; transform: scale(1); }
  ${pct(arrival - 0.02)}% { opacity: ${SEAT_RESIDUE}; transform: scale(1); }
  ${pct(arrival)}% { opacity: 1; transform: scale(0.55); }
  ${pct(arrival + 0.12)}% { opacity: 1; transform: scale(1.12); }
  ${pct(arrival + 0.35)}% { opacity: ${SEAT_SETTLE}; transform: scale(1); }`;
    })
    .join("\n  ");
  return `@keyframes ${name} {
  ${frames}
  100% { opacity: ${SEAT_SETTLE}; transform: scale(1); }
}`;
}

// The traveling document is visible only while its run is on the board;
// it blinks out at the close pad, where the filed record pops in (the
// handoff to the slot).
function docGroupKeyframes(name: string, start: number, close: number) {
  return `@keyframes ${name} {
  0% { opacity: 0; }
  ${pct(start)}% { opacity: 0; }
  ${pct(start + 0.05)}% { opacity: 0.95; }
  ${pct(close)}% { opacity: 0.95; }
  ${pct(close + 0.04)}% { opacity: 0; }
  100% { opacity: 0; }
}`;
}

// A record line lands the moment its step completes: an event, not a
// tween. Lines reset only after the group has already hidden.
function docLineKeyframes(name: string, appear: number, close: number) {
  return `@keyframes ${name} {
  0% { opacity: 0; }
  ${pct(appear - 0.02)}% { opacity: 0; }
  ${pct(appear)}% { opacity: 0.95; }
  ${pct(close + 0.04)}% { opacity: 0.95; }
  ${pct(close + 0.1)}% { opacity: 0; }
  100% { opacity: 0; }
}`;
}

// The filed record below the close pad: lands with a drop when each run
// finishes, dims to a residue when the next run enters, and brightens
// briefly as the new run passes the first pad — consulted.
function recordSlotKeyframes(
  name: string,
  journeys: Journey[],
  closeIndex: number,
) {
  const frames = journeys
    .map((journey, k) => {
      const runStart = k * LANE_B_PERIOD;
      const consult = journey.arrivalSeconds[1];
      const land = journey.arrivalSeconds[closeIndex] + 0.06;
      return `${pct(runStart)}% { opacity: ${RECORD_SETTLE}; transform: translateY(0); }
  ${pct(runStart + 0.3)}% { opacity: ${RECORD_RESIDUE}; transform: translateY(0); }
  ${pct(consult)}% { opacity: 0.6; transform: translateY(0); }
  ${pct(consult + 0.4)}% { opacity: ${RECORD_RESIDUE}; transform: translateY(0); }
  ${pct(land - 0.02)}% { opacity: ${RECORD_RESIDUE}; transform: translateY(0); }
  ${pct(land)}% { opacity: 1; transform: translateY(-14px); }
  ${pct(land + 0.22)}% { opacity: 1; transform: translateY(0); }
  ${pct(land + 0.32)}% { opacity: ${RECORD_SETTLE}; transform: translateY(0); }`;
    })
    .join("\n  ");
  return `@keyframes ${name} {
  ${frames}
  100% { opacity: ${RECORD_SETTLE}; transform: translateY(0); }
}`;
}

// An error pops in at the collision, lingers a beat, and fades away —
// in this lane even the mistakes leave nothing to learn from.
function errorKeyframes(name: string, hitSeconds: number) {
  return `@keyframes ${name} {
  0% { opacity: 0; transform: scale(0.5); }
  ${pct(hitSeconds - 0.02)}% { opacity: 0; transform: scale(0.5); }
  ${pct(hitSeconds)}% { opacity: 0.9; transform: scale(1.3); }
  ${pct(hitSeconds + 0.12)}% { opacity: 0.9; transform: scale(1); }
  ${pct(hitSeconds + 0.6)}% { opacity: 0.9; transform: scale(1); }
  ${pct(hitSeconds + 1.8)}% { opacity: 0; transform: scale(1); }
  ${pct(hitSeconds + 1.9)}% { opacity: 0; transform: scale(0.5); }
  100% { opacity: 0; transform: scale(0.5); }
}`;
}

// The collision lands on the pulse too: a quick jolt along the axis it
// was traveling, nested inside the journey transform so the two
// animations compose.
function joltKeyframes(
  name: string,
  hits: { sec: number; axis: "x" | "y" }[],
) {
  const t = (axis: "x" | "y", v: number) =>
    axis === "x" ? `translate(${v}px, 0)` : `translate(0, ${v}px)`;
  const frames = hits
    .map(
      (hit) => `${pct(hit.sec - 0.01)}% { transform: translate(0, 0); }
  ${pct(hit.sec + 0.05)}% { transform: ${t(hit.axis, 3.5)}; }
  ${pct(hit.sec + 0.1)}% { transform: ${t(hit.axis, -2.5)}; }
  ${pct(hit.sec + 0.16)}% { transform: ${t(hit.axis, 1.2)}; }
  ${pct(hit.sec + 0.22)}% { transform: translate(0, 0); }`,
    )
    .join("\n  ");
  return `@keyframes ${name} {
  0% { transform: translate(0, 0); }
  ${frames}
  100% { transform: translate(0, 0); }
}`;
}

// The aura around a with-pulse stretches into a horizontal streak and
// brightens with each seated step — the run visibly picks up speed,
// drawing strength from the record it is writing — then resets
// off-board before the next run begins. Step sizes scale to the pad
// count so both boards reach the same final streak.
function auraKeyframes(
  name: string,
  journey: Journey,
  runIndex: number,
  padCount: number,
  travel: number,
) {
  const start = runIndex * LANE_B_PERIOD;
  const sx = 1.44 / padCount;
  const sy = 0.36 / padCount;
  const so = 0.184 / padCount;
  const streak = (n: number) =>
    `transform: scale(${(1 + n * sx).toFixed(2)}, ${(1 + n * sy).toFixed(3)}); opacity: ${(0.12 + n * so).toFixed(3)};`;
  const stops = Array.from(
    { length: padCount },
    (_, i) => `${pct(journey.arrivalSeconds[i + 1])}% { ${streak(i + 1)} }`,
  ).join("\n  ");
  return `@keyframes ${name} {
  0% { transform: scale(1, 1); opacity: 0.12; }
  ${pct(start)}% { transform: scale(1, 1); opacity: 0.12; }
  ${stops}
  ${pct(start + travel + 0.05)}% { ${streak(padCount)} }
  ${pct(start + travel + 0.15)}% { transform: scale(1, 1); opacity: 0.12; }
  100% { transform: scale(1, 1); opacity: 0.12; }
}`;
}

function Pulse({ auraClassName }: { auraClassName?: string }) {
  return (
    <>
      <rect
        className={auraClassName}
        x={-PULSE_SIZE / 2 - 3}
        y={-PULSE_SIZE / 2 - 3}
        width={PULSE_SIZE + 6}
        height={PULSE_SIZE + 6}
        rx={3.5}
        fill="currentColor"
        opacity={0.15}
      />
      <rect
        x={-PULSE_SIZE / 2}
        y={-PULSE_SIZE / 2}
        width={PULSE_SIZE}
        height={PULSE_SIZE}
        rx={2}
        fill="currentColor"
      />
    </>
  );
}

const half = PAD_SIZE / 2;

function GapStage({
  config,
  className,
}: {
  config: StageConfig;
  className?: string;
}) {
  const p = config.prefix;
  const { frame, pads, laneA, laneB, label } = config;
  const closeIndex = pads.length;

  const laneAJourneys: Journey[] = laneA.runs.map((run, i) =>
    buildJourney({
      waypoints: run.waypoints,
      loopSeconds: LOOP_SECONDS,
      travelStartSeconds: i * LANE_A_WINDOW,
      travelEndSeconds: i * LANE_A_WINDOW + laneA.travel,
      trailUnits: TRAIL_A_UNITS,
      trailFadeSeconds: laneA.trailFade,
    }),
  );

  const laneBWaypoints: Waypoint[] = [
    { x: -30, y: RAIL_B_Y },
    ...pads.map((pad, i) => ({
      x: pad.x,
      y: RAIL_B_Y,
      dwellSeconds: Number((DWELL_BASE - i * laneB.dwellStep).toFixed(3)),
      paceWeight: Number((1 - i * laneB.paceStep).toFixed(3)),
    })),
    { x: frame.width + 40, y: RAIL_B_Y, paceWeight: laneB.exitPace },
  ];

  const laneBJourneys: Journey[] = Array.from(
    { length: LANE_B_RUN_COUNT },
    (_, k) =>
      buildJourney({
        waypoints: laneBWaypoints,
        loopSeconds: LOOP_SECONDS,
        travelStartSeconds: k * LANE_B_PERIOD,
        travelEndSeconds: k * LANE_B_PERIOD + laneB.travel,
        trailUnits: 10, // lane B draws no trail; the rail is already there
        trailFadeSeconds: 1,
      }),
  );

  const recordSlotX = pads[closeIndex - 1].x - DOC.width / 2;

  const laneACss = laneAJourneys
    .map((journey, i) => {
      const errors = laneA.runs[i].errors
        .map(
          (err, j) => `.${p}-err-${i}-${j} { animation: ${p}-err-${i}-${j} ${LOOP_SECONDS}s linear infinite; }
${errorKeyframes(`${p}-err-${i}-${j}`, journey.arrivalSeconds[err.errorAt])}`,
        )
        .join("\n");
      const jolt = joltKeyframes(
        `${p}-jolt-a${i}`,
        laneA.runs[i].errors.map((err) => ({
          sec: journey.arrivalSeconds[err.errorAt],
          axis: err.axis,
        })),
      );
      return `.${p}-pulse-a${i} { animation: ${p}-pulse-a${i} ${LOOP_SECONDS}s linear infinite; }
.${p}-trail-a${i} { animation: ${p}-trail-a${i} ${LOOP_SECONDS}s linear infinite; }
.${p}-jolt-a${i} { animation: ${p}-jolt-a${i} ${LOOP_SECONDS}s linear infinite; }
@keyframes ${p}-pulse-a${i} {
${journey.pulseKeyframes}
}
@keyframes ${p}-trail-a${i} {
${journey.trailKeyframes}
}
${jolt}
${errors}`;
    })
    .join("\n");

  const laneBPulseCss = laneBJourneys
    .map(
      (journey, k) => `.${p}-pulse-b${k} { animation: ${p}-pulse-b${k} ${LOOP_SECONDS}s linear infinite; }
.${p}-aura-b${k} { animation: ${p}-aura-b${k} ${LOOP_SECONDS}s linear infinite; }
@keyframes ${p}-pulse-b${k} {
${journey.pulseKeyframes}
}
${auraKeyframes(`${p}-aura-b${k}`, journey, k, closeIndex, laneB.travel)}`,
    )
    .join("\n");

  const seatCss = pads
    .map((_, i) => {
      const name = `${p}-seat-${i}`;
      const arrivals = laneBJourneys.map((j) => j.arrivalSeconds[i + 1]);
      return `.${name} { animation: ${name} ${LOOP_SECONDS}s linear infinite; transform-box: fill-box; transform-origin: center; }
${seatKeyframes(name, arrivals)}`;
    })
    .join("\n");

  const docCss = laneBJourneys
    .map((journey, k) => {
      const start = k * LANE_B_PERIOD;
      const close = journey.arrivalSeconds[closeIndex];
      const lines = laneB.docLinePads
        .map((padIdx, j) => {
          const name = `${p}-doc-${k}-l${j}`;
          return `.${name} { animation: ${name} ${LOOP_SECONDS}s linear infinite; }
${docLineKeyframes(name, journey.arrivalSeconds[padIdx + 1], close)}`;
        })
        .join("\n");
      return `.${p}-doc-${k} { animation: ${p}-doc-${k} ${LOOP_SECONDS}s linear infinite; }
${docGroupKeyframes(`${p}-doc-${k}`, start, close)}
${lines}`;
    })
    .join("\n");

  const recordCss = `.${p}-rec { animation: ${p}-rec ${LOOP_SECONDS}s linear infinite; }
${recordSlotKeyframes(`${p}-rec`, laneBJourneys, closeIndex)}`;

  // The entrance: once the reveal wrapper goes live, the rail draws in
  // from the left, pads pop on in order (delays set inline per pad),
  // the lane tags fade up, and only then do the actors fade in over a
  // stage that now exists. The fade keyframes have no 100% frame on
  // purpose: each element animates back to its OWN resting opacity
  // (tags rest at 0.6/0.7), so the entrance never overrides the
  // designed values.
  const entranceCss = `.is-live .${p}-tag { animation: ${p}-enter-fade 0.6s ${EASE} both; }
.is-live .${p}-rail { stroke-dasharray: 100; animation: ${p}-rail-in 0.9s ${EASE} 0.1s both; }
.is-live .${p}-pad { transform-box: fill-box; transform-origin: center; animation: ${p}-pad-in 0.45s ${EASE} both; }
.is-live .${p}-actors { animation: ${p}-enter-fade 0.6s ${EASE} 0.55s both; }
@keyframes ${p}-enter-fade { 0% { opacity: 0; } }
@keyframes ${p}-rail-in { 0% { stroke-dashoffset: 100; } }
@keyframes ${p}-pad-in { 0% { opacity: 0; transform: scale(0.7); } }`;

  // All motion lives behind prefers-reduced-motion; the SVG's default
  // attribute values below ARE the designed still (one wandering pulse
  // mid-route, one with-pulse partway into its record, the previous
  // run's residue on the pads ahead of it).
  const css = `
.rs-gap2-without { color: var(--ink-dim); }
.rs-gap2-with { color: var(--signal); }
.rs-gap2-pulse-ink { color: var(--ink-bright); }
.rs-gap2-error { color: var(--destructive); transform-box: fill-box; transform-origin: center; }
@media (prefers-reduced-motion: no-preference) {
${laneACss}
${laneBPulseCss}
${seatCss}
${docCss}
${recordCss}
${entranceCss}
}
`;

  const stillA = laneA.runs[0].waypoints[laneA.stillWaypoint];
  const stillTrailDashoffset = Number(
    (
      TRAIL_A_UNITS - laneAJourneys[0].percentAtWaypoint[laneA.stillWaypoint]
    ).toFixed(3),
  );
  const padStagger = Number((0.48 / pads.length).toFixed(3));

  return (
    <svg
      viewBox={`0 0 ${frame.width} ${frame.height}`}
      className={className}
      role="img"
      aria-label="An endless procession of runs, shown in two lanes. Without Circuit, each agent improvises a different route through empty space, hits errors at different moments, backtracks, and its route evaporates behind it; nothing carries over to the next run. With Circuit, every run rides the same rail and writes a small document as it works, one line per completed step. The document is filed when the run finishes, the run gains speed as it goes, and the next run consults the filed record as it starts. More runs finish in the same time."
    >
      <style>{css}</style>

      {/* Lane A: without. Empty space, errors, evaporating routes. */}
      <g className="rs-gap2-without">
        <text
          className={`${p}-tag`}
          style={{ animationDelay: "0.1s" }}
          x={label.x}
          y={36}
          fill="currentColor"
          opacity={0.6}
          fontSize={label.fontSize}
          letterSpacing={label.letterSpacing}
          aria-hidden="true"
        >
          WITHOUT CIRCUIT
        </text>
        <g className={`${p}-actors`}>
          {laneA.runs.map((run, i) => (
            <path
              key={`trail-${run.waypoints[1].x}-${run.waypoints[1].y}`}
              className={`${p}-trail-a${i}`}
              d={laneAJourneys[i].pathD}
              pathLength={100}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeOpacity={0.55}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${TRAIL_A_UNITS} 100`}
              strokeDashoffset={
                i === 0 ? stillTrailDashoffset : TRAIL_A_UNITS
              }
            />
          ))}
          {laneA.runs.flatMap((run, i) =>
            run.errors.map((mark, j) => (
              <g
                key={`err-${mark.x}-${mark.y}`}
                className={`${p}-err-${i}-${j} rs-gap2-error`}
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                opacity={0}
              >
                <line
                  x1={mark.x - 6}
                  y1={mark.y - 6}
                  x2={mark.x + 6}
                  y2={mark.y + 6}
                />
                <line
                  x1={mark.x - 6}
                  y1={mark.y + 6}
                  x2={mark.x + 6}
                  y2={mark.y - 6}
                />
              </g>
            )),
          )}
          {laneA.runs.map((run, i) => {
            const home =
              i === 0 ? stillA : run.waypoints[0];
            return (
              <g
                key={`pulse-${run.waypoints[1].x}-${run.waypoints[1].y}`}
                className={`${p}-pulse-a${i} rs-gap2-pulse-ink`}
                transform={`translate(${home.x} ${home.y})`}
              >
                <g className={`${p}-jolt-a${i}`}>
                  <Pulse />
                </g>
              </g>
            );
          })}
        </g>
      </g>

      {/* Lane B: with. The rail is laid out in advance; run after
          run seats each step, writes its record, and accelerates. */}
      <g className="rs-gap2-with">
        <text
          className={`${p}-tag`}
          style={{ animationDelay: "0.2s" }}
          x={label.x}
          y={212}
          fill="currentColor"
          opacity={0.7}
          fontSize={label.fontSize}
          letterSpacing={label.letterSpacing}
          aria-hidden="true"
        >
          WITH CIRCUIT
        </text>
        <line
          className={`${p}-rail`}
          x1={0}
          y1={RAIL_B_Y}
          x2={frame.width}
          y2={RAIL_B_Y}
          pathLength={100}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeOpacity={0.3}
        />
        {pads.map((pad, i) => (
          <rect
            key={pad.x}
            className={`${p}-pad`}
            style={{
              animationDelay: `${(0.15 + i * padStagger).toFixed(3)}s`,
            }}
            x={pad.x - half}
            y={RAIL_B_Y - half}
            width={PAD_SIZE}
            height={PAD_SIZE}
            rx={PAD_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeOpacity={0.45}
          />
        ))}
        <g className={`${p}-actors`}>
          {pads.map((pad, i) => (
            <rect
              key={`seat-${pad.x}`}
              className={`${p}-seat-${i}`}
              x={pad.x - 11}
              y={RAIL_B_Y - 11}
              width={22}
              height={22}
              rx={1.5}
              fill="currentColor"
              opacity={i < laneB.stillSeated ? SEAT_SETTLE : SEAT_RESIDUE}
            />
          ))}
          {/* The filed record: each finished run drops its document
              into the slot below the close pad. */}
          <g className={`${p}-rec`} opacity={RECORD_SETTLE}>
            <rect
              x={recordSlotX}
              y={RECORD_SLOT_Y}
              width={DOC.width}
              height={DOC.height}
              rx={DOC.rx}
              style={{ fill: DOC_FILL }}
              stroke="currentColor"
              strokeWidth={1.2}
            />
            {laneB.docLinePads.map((padIdx, j) => (
              <rect
                key={`rec-l-${padIdx}`}
                x={recordSlotX + DOC_LINE.inset}
                y={RECORD_SLOT_Y + DOC_LINE.top + j * DOC_LINE.gap}
                width={DOC_LINE.width}
                height={DOC_LINE.height}
                rx={1}
                fill="currentColor"
              />
            ))}
          </g>
          {laneBJourneys.map((_, k) => (
            <g
              key={`pulse-b-${k * LANE_B_PERIOD}`}
              className={`${p}-pulse-b${k} rs-gap2-pulse-ink`}
              transform={
                k === 0
                  ? `translate(${laneB.stillX} ${RAIL_B_Y})`
                  : `translate(-30 ${RAIL_B_Y})`
              }
            >
              {/* The document being written, riding level with the
                  work. The background fill keeps the rail from
                  striking through the card. */}
              <g
                className={`rs-gap2-with ${p}-doc-${k}`}
                opacity={k === 0 ? 0.95 : 0}
              >
                <rect
                  x={config.docTrailX}
                  y={DOC_Y}
                  width={DOC.width}
                  height={DOC.height}
                  rx={DOC.rx}
                  style={{ fill: DOC_FILL }}
                  stroke="currentColor"
                  strokeWidth={1.2}
                />
                {laneB.docLinePads.map((padIdx, j) => (
                  <rect
                    key={`doc-l-${padIdx}`}
                    className={`${p}-doc-${k}-l${j}`}
                    x={config.docTrailX + DOC_LINE.inset}
                    y={DOC_Y + DOC_LINE.top + j * DOC_LINE.gap}
                    width={DOC_LINE.width}
                    height={DOC_LINE.height}
                    rx={1}
                    fill="currentColor"
                    opacity={k === 0 && j < laneB.stillDocLines ? 0.95 : 0}
                  />
                ))}
              </g>
              <Pulse auraClassName={`${p}-aura-b${k}`} />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}

export function GapChapter() {
  return (
    <figure className="flex w-full flex-col gap-3">
      {/* Full-bleed breakout: the stage spans the viewport while the
          figure (and caption) stay in the content column. The body's
          overflow-x-clip absorbs any scrollbar-width excess. The
          reveal wrapper adds .is-live on first scroll-into-view so the
          stages can play their entrance. */}
      <RunStageReveal className="relative left-1/2 w-screen -translate-x-1/2">
        <GapStage config={WIDE} className="hidden w-full lg:block" />
        <GapStage config={NARROW} className="w-full lg:hidden" />
      </RunStageReveal>
      <figcaption className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          the same work, two worlds
        </span>
        <span className="text-sm text-muted-foreground">
          Without Circuit, every run improvises a fresh route, hits fresh
          errors, and leaves nothing behind. With Circuit, every run
          writes its record as it works, files it at the finish, and the
          next run starts already knowing it.
        </span>
      </figcaption>
    </figure>
  );
}
