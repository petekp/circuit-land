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
// Both lanes are a seamless procession — before one agent has left the
// board, the next is already entering, so the lane never sits empty.
// Top lane (without Circuit): every run improvises a DIFFERENT route in
// plain white, and the whole actor — head, aura, trail — flashes red
// when it hits an error, then fades back to white as it recovers. After
// each collision a small chat bubble pops in: the user has to step in
// and steer. Dim markdown notes sit scattered around the board; runs
// detour past them to re-read context that lives nowhere in particular.
// Nothing persists: trails evaporate, even the error marks fade, and
// the next run repeats the experience from zero.
//
// Bottom lane (with Circuit): every run rides the same rail and WRITES
// ITS RECORD as it goes — a small document rides level with the pulse,
// gaining a line as steps complete. Skill-slot sockets sit above select
// pads; a chip snaps into each as the run seats into the step below,
// so capability visibly arrives at the step that needs it (the counter
// to lane A's wandering off to scattered notes). When the run finishes, the document
// visibly drops onto a STACK below the last pad — one card per run, the
// stack growing across the loop — and a ring pings around the stack as
// each new run consults it at its first step. The run compounds —
// dwells shrink and segments quicken step over step (paceWeight), the
// pulse's aura stretches into a streak — so four runs complete in the
// time the lane above manages three. Tally ticks at the right edge of
// each lane keep the score, so the lap advantage reads at a glance.
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
const RECORD_SLOT_Y = 288;
// Each filed record sits this much higher than the one before it, so
// the stack visibly grows upward run over run.
const CARD_LIFT = 4;

// Lane A's ink is pure white — the agent and its route, nothing else.
// The red flash on error is animated on `color`, so trail, head, and
// aura all pulse together.
const INK_A = "hsl(0 0% 100%)";

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

// Tally ticks: a right-aligned scoreboard per lane. Both lanes end at
// the same x, so "four ticks vs three" reads instantly.
const TICK_EDGE = 28;
const TICK_SPACING = 14;
const TICK_RESIDUE = 0.25;

// Skill slots: a socket on a stem above select pads. The socket is
// fixed furniture, like the pads; the chip inside snaps in as the run
// seats into the step below, then dims to residue with the seats.
const SLOT_Y = RAIL_B_Y - 46;
const SLOT_SIZE = 18;
const CHIP_SIZE = 10;

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
    // Runs overlap on purpose: travel runs PAST the 8s window, so the
    // next run is already entering while the previous one is still
    // finishing — the procession never gaps. The final run instead uses
    // lastTravel + lastTrailFade, sized so its erosion completes
    // exactly at the loop boundary (no keyframe may land past 100% of
    // the master loop).
    travel: number;
    trailFade: number;
    lastTravel: number;
    lastTrailFade: number;
    // Mid-journey waypoint of run 1 used as the reduced-motion tableau.
    stillWaypoint: number;
    // Scattered markdown notes: dim furniture the runs detour past to
    // re-read context. `run`/`at` name the journey and waypoint of the
    // visit; `lead` shifts the brighten earlier when the note sits
    // mid-segment rather than at the waypoint itself.
    notes: {
      x: number;
      y: number;
      rotate: number;
      run: number;
      at: number;
      lead: number;
    }[];
    runs: LaneARun[];
  };
  laneB: {
    // Same overlap trick: travel runs past the 6s period so the next
    // run enters while the previous one exits. The final run's
    // lastTravel lands its record just before the seam.
    travel: number;
    lastTravel: number;
    // Compounding is carried by the numbers: every pad's dwell is
    // shorter and every segment's paceWeight smaller than the one
    // before.
    dwellStep: number;
    paceStep: number;
    exitPace: number;
    // One record line lands as each of these pads completes.
    docLinePads: number[];
    // Pads that carry a skill slot: a socket above the rail where a
    // chip snaps in as the run seats into that step. The contrast with
    // lane A: capability arrives at the step that needs it, instead of
    // the run wandering off to scattered notes.
    skillSlotPads: number[];
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
    travel: 8.3,
    trailFade: 0.6,
    lastTravel: 7.7,
    lastTrailFade: 0.3,
    stillWaypoint: 7,
    notes: [
      { x: 398, y: 122, rotate: -8, run: 0, at: 5, lead: 0.25 },
      { x: 98, y: 96, rotate: 6, run: 1, at: 3, lead: 0.25 },
      { x: 810, y: 142, rotate: -5, run: 2, at: 6, lead: 0.8 },
    ],
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
    travel: 6.3,
    lastTravel: 5.9,
    dwellStep: 0.032,
    paceStep: 0.08,
    exitPace: 0.38,
    docLinePads: [0, 2, 4, 6],
    skillSlotPads: [2, 5],
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
    travel: 8.25,
    trailFade: 0.5,
    lastTravel: 7.6,
    lastTrailFade: 0.4,
    stillWaypoint: 7,
    notes: [
      { x: 266, y: 118, rotate: -8, run: 0, at: 5, lead: 0.25 },
      { x: 52, y: 108, rotate: 6, run: 1, at: 3, lead: 0.25 },
      { x: 552, y: 138, rotate: -5, run: 2, at: 6, lead: 0.3 },
    ],
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
    travel: 6.2,
    lastTravel: 5.8,
    dwellStep: 0.06,
    paceStep: 0.16,
    exitPace: 0.45,
    docLinePads: [0, 1, 2, 3],
    skillSlotPads: [1],
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
// sit at the settled value, so the loop is seamless. The pop frames are
// shaped like a tight spring: undershoot, overshoot, small counter,
// rest.
function seatKeyframes(name: string, arrivals: number[]) {
  const frames = arrivals
    .map((arrival, k) => {
      const runStart = k * LANE_B_PERIOD;
      return `${pct(runStart)}% { opacity: ${SEAT_SETTLE}; transform: scale(1); }
  ${pct(runStart + 0.3)}% { opacity: ${SEAT_RESIDUE}; transform: scale(1); }
  ${pct(arrival - 0.02)}% { opacity: ${SEAT_RESIDUE}; transform: scale(1); }
  ${pct(arrival)}% { opacity: 1; transform: scale(0.6); }
  ${pct(arrival + 0.1)}% { opacity: 1; transform: scale(1.1); }
  ${pct(arrival + 0.18)}% { opacity: 1; transform: scale(0.96); }
  ${pct(arrival + 0.3)}% { opacity: ${SEAT_SETTLE}; transform: scale(1); }`;
    })
    .join("\n  ");
  return `@keyframes ${name} {
  ${frames}
  100% { opacity: ${SEAT_SETTLE}; transform: scale(1); }
}`;
}

// A skill chip drops into its socket as the pulse seats into the step
// below: it vanishes upward just before arrival, snaps back in from
// above with a small overshoot, then follows the seats' residue
// rhythm. Same event grammar as a seat, plus the drop-in.
function chipKeyframes(name: string, arrivals: number[]) {
  const frames = arrivals
    .map((arrival, k) => {
      const runStart = k * LANE_B_PERIOD;
      return `${pct(runStart)}% { opacity: ${SEAT_SETTLE}; transform: translateY(0px); }
  ${pct(runStart + 0.3)}% { opacity: ${SEAT_RESIDUE}; transform: translateY(0px); }
  ${pct(arrival - 0.24)}% { opacity: ${SEAT_RESIDUE}; transform: translateY(0px); }
  ${pct(arrival - 0.18)}% { opacity: 0; transform: translateY(-8px); }
  ${pct(arrival - 0.04)}% { opacity: 0; transform: translateY(-8px); }
  ${pct(arrival)}% { opacity: 1; transform: translateY(0px); }
  ${pct(arrival + 0.08)}% { opacity: 1; transform: translateY(1.5px); }
  ${pct(arrival + 0.16)}% { opacity: 1; transform: translateY(0px); }
  ${pct(arrival + 0.3)}% { opacity: ${SEAT_SETTLE}; transform: translateY(0px); }`;
    })
    .join("\n  ");
  return `@keyframes ${name} {
  ${frames}
  100% { opacity: ${SEAT_SETTLE}; transform: translateY(0px); }
}`;
}

// The traveling document is visible only while its run is on the board;
// it blinks out at the close pad, where the drop ghost takes over and
// slides it down onto the stack.
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

// The drop ghost: a stationary copy of the finished document, parked at
// the handoff point beside the close pad. The traveling copy blinks out
// there, the ghost appears in its place and slides down onto the stack
// (eased via a per-keyframe timing function under the linear master
// loop), then hands off to the stack card popping bright.
function dropKeyframes(
  name: string,
  close: number,
  land: number,
  dx: number,
  dy: number,
) {
  return `@keyframes ${name} {
  0% { opacity: 0; transform: translate(0px, 0px); }
  ${pct(close - 0.01)}% { opacity: 0; transform: translate(0px, 0px); }
  ${pct(close + 0.03)}% { opacity: 0.95; transform: translate(0px, 0px); animation-timing-function: cubic-bezier(0.45, 0, 0.2, 1); }
  ${pct(land)}% { opacity: 0.95; transform: translate(${dx}px, ${dy}px); }
  ${pct(land + 0.06)}% { opacity: 0; transform: translate(${dx}px, ${dy}px); }
  100% { opacity: 0; transform: translate(0px, 0px); }
}`;
}

// One stack card per run. The whole stack starts the loop bright (the
// previous cycle's history), dims to a residue as the first run enters,
// and each card re-stamps — a small press as its ghost settles into it —
// when its run files the record. Cards then HOLD their settled
// brightness for the rest of the loop, so the stack visibly accumulates
// run over run; 100% matches 0% (all bright), keeping the seam
// invisible.
function cardKeyframes(name: string, land: number) {
  return `@keyframes ${name} {
  0% { opacity: ${RECORD_SETTLE}; transform: scale(1); }
  ${pct(0.35)}% { opacity: ${RECORD_RESIDUE}; transform: scale(1); }
  ${pct(land - 0.02)}% { opacity: ${RECORD_RESIDUE}; transform: scale(1); }
  ${pct(land)}% { opacity: 1; transform: scale(1.06); }
  ${pct(land + 0.12)}% { opacity: 1; transform: scale(0.98); }
  ${pct(land + 0.22)}% { opacity: ${RECORD_SETTLE}; transform: scale(1); }
  100% { opacity: ${RECORD_SETTLE}; transform: scale(1); }
}`;
}

// The consult ping: a ring around the stack that flares and expands as
// each new run passes its first pad — the stack is being read, which is
// why this lane is fast.
function pingKeyframes(name: string, consults: number[]) {
  const frames = consults
    .map(
      (t) => `${pct(t - 0.02)}% { opacity: 0; transform: scale(1); }
  ${pct(t + 0.04)}% { opacity: 0.65; transform: scale(1); }
  ${pct(t + 0.5)}% { opacity: 0; transform: scale(1.3); }
  ${pct(t + 0.55)}% { opacity: 0; transform: scale(1); }`,
    )
    .join("\n  ");
  return `@keyframes ${name} {
  0% { opacity: 0; transform: scale(1); }
  ${frames}
  100% { opacity: 0; transform: scale(1); }
}`;
}

// Lane A's ink: white at rest; the WHOLE actor (trail + head + aura)
// flashes red at each collision, holds through the stunned dwell, and
// fades back to white as the run recovers.
function inkKeyframes(name: string, hits: number[]) {
  const frames = hits
    .map(
      (hit) => `${pct(hit - 0.03)}% { color: ${INK_A}; }
  ${pct(hit + 0.05)}% { color: var(--destructive); }
  ${pct(hit + 0.7)}% { color: var(--destructive); }
  ${pct(hit + 1.5)}% { color: ${INK_A}; }`,
    )
    .join("\n  ");
  return `@keyframes ${name} {
  0% { color: ${INK_A}; }
  ${frames}
  100% { color: ${INK_A}; }
}`;
}

// The steer bubble: right after each collision, a chat bubble pops in
// beside the stunned pulse — the user stepping in to point the way —
// and the run only backtracks once it has been told to.
function steerKeyframes(name: string, hit: number) {
  return `@keyframes ${name} {
  0% { opacity: 0; transform: scale(0.5); }
  ${pct(hit + 0.16)}% { opacity: 0; transform: scale(0.5); }
  ${pct(hit + 0.26)}% { opacity: 1; transform: scale(1.08); }
  ${pct(hit + 0.34)}% { opacity: 1; transform: scale(1); }
  ${pct(hit + 1)}% { opacity: 1; transform: scale(1); }
  ${pct(hit + 1.2)}% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 0; transform: scale(0.5); }
}`;
}

// A scattered note brightens as its run detours past it — context being
// re-read from a stray file — then dims back to furniture.
function noteKeyframes(name: string, at: number) {
  return `@keyframes ${name} {
  0% { opacity: 0.22; transform: scale(1); }
  ${pct(at - 0.02)}% { opacity: 0.22; transform: scale(1); }
  ${pct(at + 0.08)}% { opacity: 0.9; transform: scale(1.1); }
  ${pct(at + 0.25)}% { opacity: 0.85; transform: scale(1); }
  ${pct(at + 1.2)}% { opacity: 0.85; transform: scale(1); }
  ${pct(at + 2)}% { opacity: 0.22; transform: scale(1); }
  100% { opacity: 0.22; transform: scale(1); }
}`;
}

// A tally tick pops bright the moment its run finishes and holds for
// the rest of the loop; the whole scoreboard starts the loop bright
// (last cycle's score) and dims as the first run enters.
function tickKeyframes(name: string, at: number, settle: number) {
  return `@keyframes ${name} {
  0% { opacity: ${settle}; transform: scale(1); }
  ${pct(0.3)}% { opacity: ${TICK_RESIDUE}; transform: scale(1); }
  ${pct(at - 0.02)}% { opacity: ${TICK_RESIDUE}; transform: scale(1); }
  ${pct(at)}% { opacity: 1; transform: scale(1.4); }
  ${pct(at + 0.14)}% { opacity: ${settle}; transform: scale(1); }
  100% { opacity: ${settle}; transform: scale(1); }
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
  ${pct(start + travel + 0.02)}% { ${streak(padCount)} }
  ${pct(start + travel + 0.1)}% { transform: scale(1, 1); opacity: 0.12; }
  100% { transform: scale(1, 1); opacity: 0.12; }
}`;
}

// The aura only draws when a lane animates it (lane B's working glow).
// A static aura on the white lane-A square reads as a gray outline.
function Pulse({ auraClassName }: { auraClassName?: string }) {
  return (
    <>
      {auraClassName && (
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
      )}
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

// A small markdown note: page-filled card, a few text lines, slightly
// rotated — context living loose on the board.
function NoteGlyph() {
  return (
    <>
      <rect
        x={-7.5}
        y={-9.5}
        width={15}
        height={19}
        rx={2}
        style={{ fill: DOC_FILL }}
        stroke="currentColor"
        strokeWidth={1.2}
      />
      <rect x={-4} y={-5} width={8} height={1.8} rx={0.9} fill="currentColor" />
      <rect
        x={-4}
        y={-1}
        width={6.5}
        height={1.8}
        rx={0.9}
        fill="currentColor"
      />
      <rect x={-4} y={3} width={7.5} height={1.8} rx={0.9} fill="currentColor" />
    </>
  );
}

// The steer bubble: a white chat bubble with a tail pointing back down
// toward the stunned pulse, dots in the page color.
function SteerGlyph() {
  return (
    <>
      <path d="M -7 7 L -11 14.5 L 0 7.5 Z" fill={INK_A} />
      <rect x={-12} y={-8} width={24} height={16} rx={5.5} fill={INK_A} />
      <circle cx={-5.5} cy={0} r={1.7} fill="var(--background)" />
      <circle cx={0} cy={0} r={1.7} fill="var(--background)" />
      <circle cx={5.5} cy={0} r={1.7} fill="var(--background)" />
    </>
  );
}

const half = PAD_SIZE / 2;

// Hover tooltips: each zone is an invisible hit area over one of the
// stage's fixtures; the card inside appears on :hover via the stage
// CSS, so the whole layer is plain SVG with no client JS. Cards
// prefer to sit above their zone and flip below when that would leave
// the frame. The cards are a pointer nicety — the aria-label already
// narrates the full scene.
type StageTip = {
  id: string;
  title: string;
  lines: string[];
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  ink: string;
};

function TipZone({
  p,
  tip,
  frame,
}: {
  p: string;
  tip: StageTip;
  frame: { width: number; height: number };
}) {
  const width = Math.ceil(
    Math.max(tip.title.length * 7.6, ...tip.lines.map((l) => l.length * 6.3)) +
      26,
  );
  const height = 36 + tip.lines.length * 17;
  const bx = Math.min(
    Math.max(tip.cx - width / 2, 10),
    frame.width - width - 10,
  );
  let by = tip.cy - tip.ry - 10 - height;
  if (by < 8) by = tip.cy + tip.ry + 10;
  return (
    <g className={`${p}-tipzone`} style={{ color: tip.ink }} aria-hidden="true">
      <rect
        x={tip.cx - tip.rx}
        y={tip.cy - tip.ry}
        width={tip.rx * 2}
        height={tip.ry * 2}
        rx={10}
        fill="transparent"
      />
      <g className={`${p}-tipcard`}>
        <rect
          x={bx}
          y={by}
          width={width}
          height={height}
          rx={7}
          style={{ fill: "var(--background)" }}
          stroke="currentColor"
          strokeOpacity={0.35}
          strokeWidth={1}
        />
        <text
          x={bx + 13}
          y={by + 22}
          fill="currentColor"
          fontSize={13}
          fontWeight={600}
        >
          {tip.title}
        </text>
        {tip.lines.map((line, i) => (
          <text
            key={line}
            x={bx + 13}
            y={by + 41 + i * 17}
            style={{ fill: "var(--foreground)" }}
            opacity={0.8}
            fontSize={12.5}
          >
            {line}
          </text>
        ))}
      </g>
    </g>
  );
}

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
  const lastRunA = laneA.runs.length - 1;

  const laneAJourneys: Journey[] = laneA.runs.map((run, i) =>
    buildJourney({
      waypoints: run.waypoints,
      loopSeconds: LOOP_SECONDS,
      travelStartSeconds: i * LANE_A_WINDOW,
      travelEndSeconds:
        i * LANE_A_WINDOW + (i === lastRunA ? laneA.lastTravel : laneA.travel),
      trailUnits: TRAIL_A_UNITS,
      trailFadeSeconds: i === lastRunA ? laneA.lastTrailFade : laneA.trailFade,
    }),
  );

  // When each without-run leaves the board — its tally moment.
  const laneAEnds = laneA.runs.map(
    (_, i) =>
      i * LANE_A_WINDOW + (i === lastRunA ? laneA.lastTravel : laneA.travel),
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
        travelEndSeconds:
          k * LANE_B_PERIOD +
          (k === LANE_B_RUN_COUNT - 1 ? laneB.lastTravel : laneB.travel),
        trailUnits: 10, // lane B draws no trail; the rail is already there
        trailFadeSeconds: 1,
      }),
  );

  const recordSlotX = pads[closeIndex - 1].x - DOC.width / 2;

  // The record-filing schedule: when each run reaches the close pad,
  // and when its ghost finishes the slide onto the stack. The last
  // land is clamped clear of the seam so every settle frame stays
  // inside the loop.
  const closes = laneBJourneys.map((j) => j.arrivalSeconds[closeIndex]);
  const lands = closes.map((close) =>
    Math.min(close + 0.24, LOOP_SECONDS - 0.25),
  );
  const dropDx = -DOC.width / 2 - config.docTrailX;

  const laneACss = laneAJourneys
    .map((journey, i) => {
      const hits = laneA.runs[i].errors.map(
        (err) => journey.arrivalSeconds[err.errorAt],
      );
      const errors = laneA.runs[i].errors
        .map(
          (err, j) => `.${p}-err-${i}-${j} { animation: ${p}-err-${i}-${j} ${LOOP_SECONDS}s linear infinite; }
${errorKeyframes(`${p}-err-${i}-${j}`, journey.arrivalSeconds[err.errorAt])}`,
        )
        .join("\n");
      const steers = laneA.runs[i].errors
        .map(
          (err, j) => `.${p}-steer-${i}-${j} { animation: ${p}-steer-${i}-${j} ${LOOP_SECONDS}s linear infinite; transform-box: fill-box; transform-origin: center; }
${steerKeyframes(`${p}-steer-${i}-${j}`, journey.arrivalSeconds[err.errorAt])}`,
        )
        .join("\n");
      const jolt = joltKeyframes(
        `${p}-jolt-a${i}`,
        laneA.runs[i].errors.map((err) => ({
          sec: journey.arrivalSeconds[err.errorAt],
          axis: err.axis,
        })),
      );
      return `.${p}-pulse-a${i} { animation: ${p}-pulse-a${i} ${LOOP_SECONDS}s linear infinite, ${p}-ink-a${i} ${LOOP_SECONDS}s linear infinite; }
.${p}-trail-a${i} { animation: ${p}-trail-a${i} ${LOOP_SECONDS}s linear infinite, ${p}-ink-a${i} ${LOOP_SECONDS}s linear infinite; }
.${p}-jolt-a${i} { animation: ${p}-jolt-a${i} ${LOOP_SECONDS}s linear infinite; }
@keyframes ${p}-pulse-a${i} {
${journey.pulseKeyframes}
}
@keyframes ${p}-trail-a${i} {
${journey.trailKeyframes}
}
${inkKeyframes(`${p}-ink-a${i}`, hits)}
${jolt}
${errors}
${steers}`;
    })
    .join("\n");

  const noteCss = laneA.notes
    .map((note, n) => {
      const at = laneAJourneys[note.run].arrivalSeconds[note.at] - note.lead;
      const name = `${p}-note-${n}`;
      return `.${name} { animation: ${name} ${LOOP_SECONDS}s linear infinite; transform-box: fill-box; transform-origin: center; }
${noteKeyframes(name, at)}`;
    })
    .join("\n");

  const laneBPulseCss = laneBJourneys
    .map(
      (journey, k) => `.${p}-pulse-b${k} { animation: ${p}-pulse-b${k} ${LOOP_SECONDS}s linear infinite; }
.${p}-aura-b${k} { animation: ${p}-aura-b${k} ${LOOP_SECONDS}s linear infinite; }
@keyframes ${p}-pulse-b${k} {
${journey.pulseKeyframes}
}
${auraKeyframes(
  `${p}-aura-b${k}`,
  journey,
  k,
  closeIndex,
  k === LANE_B_RUN_COUNT - 1 ? laneB.lastTravel : laneB.travel,
)}`,
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

  const chipCss = laneB.skillSlotPads
    .map((padIdx) => {
      const name = `${p}-chip-${padIdx}`;
      const arrivals = laneBJourneys.map((j) => j.arrivalSeconds[padIdx + 1]);
      return `.${name} { animation: ${name} ${LOOP_SECONDS}s linear infinite; transform-box: fill-box; transform-origin: center; }
${chipKeyframes(name, arrivals)}`;
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

  const cardCss = lands
    .map((land, k) => {
      const name = `${p}-card-${k}`;
      return `.${name} { animation: ${name} ${LOOP_SECONDS}s linear infinite; transform-box: fill-box; transform-origin: center; }
${cardKeyframes(name, land)}`;
    })
    .join("\n");

  const ghostCss = lands
    .map((land, k) => {
      const name = `${p}-drop-${k}`;
      const dy = RECORD_SLOT_Y - k * CARD_LIFT - (RAIL_B_Y + DOC_Y);
      return `.${name} { animation: ${name} ${LOOP_SECONDS}s linear infinite; }
${dropKeyframes(name, closes[k], land, dropDx, dy)}`;
    })
    .join("\n");

  const pingCss = `.${p}-ping { animation: ${p}-ping ${LOOP_SECONDS}s linear infinite; transform-box: fill-box; transform-origin: center; }
${pingKeyframes(
  `${p}-ping`,
  laneBJourneys.map((j) => j.arrivalSeconds[1]),
)}`;

  const tallyCss = [
    ...laneA.runs.map((_, i) => {
      const name = `${p}-tick-a${i}`;
      return `.${name} { animation: ${name} ${LOOP_SECONDS}s linear infinite; transform-box: fill-box; transform-origin: center; }
${tickKeyframes(name, laneAEnds[i], 0.8)}`;
    }),
    ...lands.map((land, k) => {
      const name = `${p}-tick-b${k}`;
      return `.${name} { animation: ${name} ${LOOP_SECONDS}s linear infinite; transform-box: fill-box; transform-origin: center; }
${tickKeyframes(name, land, 0.95)}`;
    }),
  ].join("\n");

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
  // run's residue on the pads ahead of it, two filed records on the
  // stack with two ghost slots above them).
  const css = `
.rs-gap2-without { color: ${INK_A}; }
.rs-gap2-with { color: var(--signal); }
.rs-gap2-pulse-ink { color: var(--ink-bright); }
.rs-gap2-error { color: var(--destructive); transform-box: fill-box; transform-origin: center; }
.${p}-tipzone { cursor: help; }
.${p}-tipzone .${p}-tipcard { opacity: 0; pointer-events: none; }
.${p}-tipzone:hover .${p}-tipcard { opacity: 1; }
@media (prefers-reduced-motion: no-preference) {
${laneACss}
${noteCss}
${laneBPulseCss}
${seatCss}
${chipCss}
${docCss}
${cardCss}
${ghostCss}
${pingCss}
${tallyCss}
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
  const tickX = (index: number, count: number) =>
    frame.width - TICK_EDGE - (count - 1 - index) * TICK_SPACING;

  // The hover layer's zones, anchored to the stage's fixed furniture
  // (labels, notes, error marks, rail, slots, stack, tallies). Later
  // entries paint on top where zones overlap.
  const inkB = "var(--signal)";
  const tips: StageTip[] = [
    {
      id: "label-a",
      title: "The same agent",
      lines: [
        "No supplied process. Each run improvises",
        "its route from zero.",
      ],
      cx: label.x + 80,
      cy: 31,
      rx: 95,
      ry: 14,
      ink: INK_A,
    },
    ...laneA.notes.map((note, n) => ({
      id: `note-${n}`,
      title: "Scattered context",
      lines: [
        "Plan files and notes the run leaves itself,",
        "then detours back to re-read.",
      ],
      cx: note.x,
      cy: note.y,
      rx: 22,
      ry: 22,
      ink: INK_A,
    })),
    ...laneA.runs.flatMap((run, i) =>
      run.errors.map((err, j) => ({
        id: `errzone-${i}-${j}`,
        title: "An issue",
        lines: [
          "The whole run flashes red and stalls.",
          "The bubble is you, steering it back.",
        ],
        cx: err.x,
        cy: err.y,
        rx: 20,
        ry: 20,
        ink: INK_A,
      })),
    ),
    {
      id: "tally-a",
      title: "The score",
      lines: ["Three runs finish in this loop."],
      cx: tickX(1, laneA.runs.length),
      cy: 32,
      rx: 34,
      ry: 16,
      ink: INK_A,
    },
    {
      id: "label-b",
      title: "The same agent, on a flow",
      lines: [
        "Circuit supplies the steps, the checks,",
        "and the record of the work.",
      ],
      cx: label.x + 80,
      cy: 207,
      rx: 95,
      ry: 14,
      ink: inkB,
    },
    {
      id: "rail",
      title: "The flow's steps",
      lines: [
        "Every run rides the same rail and seats",
        "into each step in order.",
      ],
      cx: frame.width / 2,
      cy: RAIL_B_Y,
      rx: frame.width / 2 - 140,
      ry: 17,
      ink: inkB,
    },
    ...laneB.skillSlotPads.map((padIdx) => ({
      id: `slotzone-${padIdx}`,
      title: "A skill slot",
      lines: ["The capability this step needs", "snaps in right here."],
      cx: pads[padIdx].x,
      cy: SLOT_Y,
      rx: 18,
      ry: 18,
      ink: inkB,
    })),
    {
      id: "stack",
      title: "Run records",
      lines: [
        "Each run files what it did and checked.",
        "The next one reads the stack as it starts.",
      ],
      cx: recordSlotX + DOC.width / 2,
      cy: RECORD_SLOT_Y + DOC.height / 2 - 4,
      rx: DOC.width / 2 + 12,
      ry: 30,
      ink: inkB,
    },
    {
      id: "tally-b",
      title: "The score",
      lines: ["Four runs finish in the same loop."],
      cx: tickX(1, LANE_B_RUN_COUNT) + TICK_SPACING / 2,
      cy: 208,
      rx: 36,
      ry: 16,
      ink: inkB,
    },
  ];

  return (
    <svg
      viewBox={`0 0 ${frame.width} ${frame.height}`}
      className={className}
      role="img"
      aria-label="An endless procession of runs, shown in two lanes; each lane's next run is already entering as the last one finishes. Without Circuit, each agent improvises a different route in white, flashes red when it hits an error, waits for the user to steer it onward, detours past markdown notes scattered around the board to re-read context, and its route evaporates behind it; nothing carries over to the next run. With Circuit, every run rides the same rail and writes a small document as it works, one line per completed step. Sockets above some steps show a skill chip snapping in as the run reaches them: the capability a step needs arrives exactly there. When the run finishes, the document drops onto a growing stack of records, and each new run consults the stack as it starts and gains speed as it goes. Tally marks at the right edge keep score: four runs finish with Circuit in the time three finish without."
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
          {laneA.notes.map((note, n) => (
            <g
              key={`note-${note.x}-${note.y}`}
              transform={`translate(${note.x} ${note.y}) rotate(${note.rotate})`}
              aria-hidden="true"
            >
              <g className={`${p}-note-${n}`} opacity={0.22}>
                <NoteGlyph />
              </g>
            </g>
          ))}
          {laneA.runs.map((run, i) => (
            <path
              key={`trail-${run.waypoints[1].x}-${run.waypoints[1].y}`}
              className={`${p}-trail-a${i}`}
              d={laneAJourneys[i].pathD}
              pathLength={100}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeOpacity={0.7}
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
            const home = i === 0 ? stillA : run.waypoints[0];
            return (
              <g
                key={`pulse-${run.waypoints[1].x}-${run.waypoints[1].y}`}
                className={`${p}-pulse-a${i}`}
                transform={`translate(${home.x} ${home.y})`}
              >
                <g className={`${p}-jolt-a${i}`}>
                  <Pulse />
                </g>
              </g>
            );
          })}
          {laneA.runs.flatMap((run, i) =>
            run.errors.map((mark, j) => (
              <g
                key={`steer-${mark.x}-${mark.y}`}
                transform={`translate(${mark.x + 14} ${mark.y - 26})`}
                aria-hidden="true"
              >
                <g className={`${p}-steer-${i}-${j}`} opacity={0}>
                  <SteerGlyph />
                </g>
              </g>
            )),
          )}
          {laneA.runs.map((_, i) => {
            const x = tickX(i, laneA.runs.length);
            return (
              <rect
                key={`tick-a-${x}`}
                className={`${p}-tick-a${i}`}
                x={x - 1.25}
                y={27}
                width={2.5}
                height={10}
                rx={1.25}
                fill="currentColor"
                opacity={0.3}
              />
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
        {/* Skill-slot sockets: fixed furniture above their pads, popped
            in with the same entrance as the pads they serve. */}
        {laneB.skillSlotPads.map((padIdx) => (
          <g
            key={`slot-${padIdx}`}
            className={`${p}-pad`}
            style={{
              animationDelay: `${(0.15 + padIdx * padStagger).toFixed(3)}s`,
            }}
            aria-hidden="true"
          >
            <line
              x1={pads[padIdx].x}
              y1={SLOT_Y + SLOT_SIZE / 2}
              x2={pads[padIdx].x}
              y2={RAIL_B_Y - half}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeOpacity={0.3}
            />
            <rect
              x={pads[padIdx].x - SLOT_SIZE / 2}
              y={SLOT_Y - SLOT_SIZE / 2}
              width={SLOT_SIZE}
              height={SLOT_SIZE}
              rx={3}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeOpacity={0.45}
            />
          </g>
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
          {/* Skill chips: one per socket, snapping in as the run seats
              into the step below. */}
          {laneB.skillSlotPads.map((padIdx) => (
            <rect
              key={`chip-${padIdx}`}
              className={`${p}-chip-${padIdx}`}
              x={pads[padIdx].x - CHIP_SIZE / 2}
              y={SLOT_Y - CHIP_SIZE / 2}
              width={CHIP_SIZE}
              height={CHIP_SIZE}
              rx={1.5}
              fill="currentColor"
              opacity={padIdx < laneB.stillSeated ? SEAT_SETTLE : SEAT_RESIDUE}
            />
          ))}
          {/* The consult ping: flares around the stack as each new run
              reads it at its first step. */}
          <rect
            className={`${p}-ping`}
            x={recordSlotX - 5}
            y={RECORD_SLOT_Y - (LANE_B_RUN_COUNT - 1) * CARD_LIFT - 5}
            width={DOC.width + 10}
            height={DOC.height + (LANE_B_RUN_COUNT - 1) * CARD_LIFT + 10}
            rx={5}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            opacity={0}
          />
          {/* The record stack: one card per run, each filed slightly
              above the last, accumulating across the loop. */}
          {laneBJourneys.map((_, k) => (
            <g
              key={`card-${k * LANE_B_PERIOD}`}
              className={`${p}-card-${k}`}
              opacity={k < 2 ? 0.55 : 0.25}
            >
              <rect
                x={recordSlotX}
                y={RECORD_SLOT_Y - k * CARD_LIFT}
                width={DOC.width}
                height={DOC.height}
                rx={DOC.rx}
                style={{ fill: DOC_FILL }}
                stroke="currentColor"
                strokeWidth={1.2}
              />
              {laneB.docLinePads.map((padIdx, j) => (
                <rect
                  key={`card-l-${padIdx}`}
                  x={recordSlotX + DOC_LINE.inset}
                  y={
                    RECORD_SLOT_Y -
                    k * CARD_LIFT +
                    DOC_LINE.top +
                    j * DOC_LINE.gap
                  }
                  width={DOC_LINE.width}
                  height={DOC_LINE.height}
                  rx={1}
                  fill="currentColor"
                />
              ))}
            </g>
          ))}
          {/* The drop ghosts: the finished document sliding from the
              pulse's side down onto the stack. */}
          {laneBJourneys.map((_, k) => (
            <g
              key={`drop-${k * LANE_B_PERIOD}`}
              transform={`translate(${pads[closeIndex - 1].x + config.docTrailX} ${RAIL_B_Y + DOC_Y})`}
              aria-hidden="true"
            >
              <g className={`${p}-drop-${k}`} opacity={0}>
                <rect
                  x={0}
                  y={0}
                  width={DOC.width}
                  height={DOC.height}
                  rx={DOC.rx}
                  style={{ fill: DOC_FILL }}
                  stroke="currentColor"
                  strokeWidth={1.2}
                />
                {laneB.docLinePads.map((padIdx, j) => (
                  <rect
                    key={`drop-l-${padIdx}`}
                    x={DOC_LINE.inset}
                    y={DOC_LINE.top + j * DOC_LINE.gap}
                    width={DOC_LINE.width}
                    height={DOC_LINE.height}
                    rx={1}
                    fill="currentColor"
                  />
                ))}
              </g>
            </g>
          ))}
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
          {lands.map((_, k) => {
            const x = tickX(k, LANE_B_RUN_COUNT);
            return (
              <rect
                key={`tick-b-${x}`}
                className={`${p}-tick-b${k}`}
                x={x - 1.25}
                y={203}
                width={2.5}
                height={10}
                rx={1.25}
                fill="currentColor"
                opacity={0.3}
              />
            );
          })}
        </g>
      </g>

      {/* The hover layer sits above both lanes so its cards are never
          painted over by stage elements. */}
      <g>
        {tips.map((tip) => (
          <TipZone key={tip.id} p={p} tip={tip} frame={frame} />
        ))}
      </g>
    </svg>
  );
}

export function GapChapter() {
  return (
    <figure className="flex w-full flex-col">
      {/* Full-bleed breakout: the stage spans the viewport while the
          figure stays in the content column. The body's overflow-x-clip
          absorbs any scrollbar-width excess. The reveal wrapper adds
          .is-live on first scroll-into-view so the stages can play their
          entrance. The section prose below the figure carries the
          explanation, so there is no caption. */}
      <RunStageReveal className="relative left-1/2 w-screen -translate-x-1/2">
        <GapStage config={WIDE} className="hidden w-full lg:block" />
        <GapStage config={NARROW} className="w-full lg:hidden" />
      </RunStageReveal>
    </figure>
  );
}
