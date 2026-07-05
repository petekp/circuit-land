"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import {
  AnimatePresence,
  LazyMotion,
  LayoutGroup,
  domMax,
  m,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionProps,
  type MotionStyle,
  type MotionValue,
} from "motion/react";

/* The flow explorer. The masthead narrows to one idea; this is where the idea
   gets shown. It reuses the diagram engine from the old composer — measured SVG
   connectors that route between tiles by their real boxes, and a FLIP morph that
   glides shared steps when you switch flows — but it now reads top to bottom:
   one step per row with room to breathe, and a few tightly-coupled steps sharing
   a row, centered so the wire between them stays straight. Each tile carries
   everything a step is scoped on: its model and effort, its allowed tools, the
   context it sees, and the skills it pulls in. Switch flows along the top; the
   diagram morphs. The whole point is legible in one read: expensive judgment
   (opus, high effort) sits at the few steps that decide direction, and the
   bulk work runs on cheap models, sometimes many at once in a fan-out. Model
   names use the same lowercase tier vocabulary as `circuit preview` output
   and the dial section's matrix.

   These are EXAMPLE flows. The per-step model, effort, tools, and skills are a
   real Circuit capability (each step is configured on its own); the specific
   values here illustrate one sensible configuration, they are not a fixed
   default. */

// ---- Data model -------------------------------------------------------------

// Brightness encodes cost. Strategic steps get the bright signal badge; the
// bulk execution runs dim. "none" is for steps with no model opinion at all —
// the deterministic gate, the human checkpoint.
type Tier = "strategic" | "balanced" | "execution" | "none";

type Effort = "minimal" | "low" | "medium" | "high" | "max" | "none";

// The shape a step takes in the diagram. Most are plain steps; a few are the
// control structures that make the flow interesting. "prompt" is the synthetic
// first node — the operator's prompt, drawn as a terminal bar — not a real step.
type Shape = "step" | "fanout" | "checkpoint" | "subrun" | "loop" | "prompt";

type StepSpec = {
  // Unique within the flow. Used as the FLIP layoutId and the connector key.
  id: string;
  name: string;
  role: string;
  shape?: Shape;
  // Marks a plain step that departs from the default relay kind: the
  // deterministic gate ("verification") and the written artifact ("compose")
  // get a head glyph. Control shapes carry their own glyphs; plain relay
  // steps stay unmarked, the way a default task does in most diagram
  // languages.
  kind?: "verification" | "compose";
  model?: string;
  tier?: Tier;
  effort?: Effort;
  context?: string[];
  tools?: { allow: string[]; blocked?: number };
  skills?: string[];
  // For shape "fanout": the parallel branch labels.
  branches?: string[];
  // For shape "checkpoint": the options surfaced for the operator to pick.
  options?: string[];
  // For shape "loop": the id of the step this one loops back to.
  loopTo?: string;
  // A short trailing note (e.g. "sub-run -> child flow", "deterministic").
  note?: string;
};

// The flow reads top to bottom as a list of rows. A row holds one step, or two
// tightly-coupled steps side by side (centered, so their connector is a clean
// horizontal). The flat step order — rows flattened — drives the connectors.
type StepRow = StepSpec[];

type ExampleFlow = {
  key: string;
  name: string;
  color: string;
  accent: string;
  prompt: string;
  summary: string;
  rows: StepRow[];
};

const FLOWS: ExampleFlow[] = [
  {
    key: "prototype-react",
    name: "Prototype a React app",
    color: "var(--flow-prototype)",
    accent: "var(--flow-prototype-accent)",
    prompt: "create a pure CSS mesh gradient generator",
    summary:
      "From one prompt to a working prototype. You make one decision; the flow carries the research, the plan, the build, and the checks around it.",
    rows: [
      [
        {
          id: "frame",
          name: "Frame",
          role: "turns the prompt into a spec and acceptance criteria",
          model: "opus",
          tier: "strategic",
          effort: "high",
          context: ["prompt", "constraints"],
          tools: { allow: ["read"] },
        },
      ],
      [
        {
          id: "research",
          name: "Research",
          role: "explores the space in parallel, then merges one brief",
          shape: "fanout",
          model: "haiku",
          tier: "execution",
          effort: "low",
          branches: [
            "techniques",
            "color math",
            "paint cost",
            "browser support",
            "prior art",
          ],
          tools: { allow: ["read", "web"] },
        },
      ],
      [
        {
          id: "synthesize",
          name: "Synthesize",
          role: "reduces the research to two or three viable approaches",
          model: "opus",
          tier: "strategic",
          effort: "high",
          context: ["research brief"],
          tools: { allow: ["read"] },
        },
        {
          id: "plan",
          name: "Plan",
          role: "turns the direction into a build plan",
          model: "opus",
          tier: "strategic",
          effort: "high",
          context: ["approaches", "repo map"],
          tools: { allow: ["read"] },
        },
      ],
      [
        {
          id: "checkpoint",
          name: "Checkpoint",
          role: "the flow pauses and hands you the decision, then picks back up",
          shape: "checkpoint",
          model: "you decide",
          tier: "none",
          options: [
            "A · layered conic-gradients",
            "B · blurred radial blobs",
            "C · SVG filter mesh",
          ],
        },
      ],
      [
        {
          id: "implement",
          name: "Implement",
          role: "builds the prototype",
          shape: "subrun",
          model: "sonnet",
          tier: "balanced",
          effort: "medium",
          note: "sub-run → child build flow",
          context: ["plan", "target files"],
          tools: { allow: ["edit", "write", "bash"], blocked: 12 },
          skills: [
            "vercel-react-best-practices",
            "vercel-composition-patterns",
            "tailwind-css-patterns",
            "css-architecture",
          ],
        },
      ],
      [
        {
          id: "verify",
          name: "Verify",
          role: "build, lint, and tests: the mechanical gate",
          kind: "verification",
          model: "deterministic",
          tier: "none",
          note: "no model opinion",
          context: ["diff", "checks"],
          tools: { allow: ["bash"] },
        },
        {
          id: "converge",
          name: "Converge",
          role: "reworks and re-checks until the gate passes",
          shape: "loop",
          loopTo: "implement",
          model: "sonnet",
          tier: "balanced",
          effort: "medium",
          note: "loops back until the check passes",
        },
      ],
      [
        {
          id: "review",
          name: "Review",
          role: "reads the prototype against the original intent",
          // A different provider than the build, on purpose: an independent
          // model reviewing the work catches what the builder's own model talks
          // itself past. This is the flow's proof that models mix per step.
          model: "gpt-5",
          tier: "strategic",
          effort: "high",
          context: ["diff", "intent"],
          tools: { allow: ["read"] },
        },
        {
          id: "record",
          name: "Record",
          role: "the durable run folder it all leaves behind",
          kind: "compose",
          model: "deterministic",
          tier: "none",
          note: "trace · reports · evidence",
        },
      ],
    ],
  },
  {
    key: "fix-flaky",
    name: "Fix a flaky test",
    color: "var(--flow-fix)",
    accent: "var(--flow-fix-accent)",
    prompt: "the checkout test fails about one run in five",
    summary:
      "A leaner shape. No fan-out, no subflow: just find the cause, make the fix, and prove it with the evidence attached.",
    rows: [
      [
        {
          id: "frame",
          name: "Frame",
          role: "scopes the failing test",
          model: "sonnet",
          tier: "balanced",
          effort: "medium",
          context: ["report", "test id"],
          tools: { allow: ["read"] },
        },
      ],
      [
        {
          id: "reproduce",
          name: "Reproduce",
          role: "runs it until it fails, captures the flake",
          model: "haiku",
          tier: "execution",
          effort: "low",
          context: ["test", "seed"],
          tools: { allow: ["bash"] },
        },
        {
          id: "diagnose",
          name: "Diagnose",
          role: "finds the race or the shared state",
          model: "opus",
          tier: "strategic",
          effort: "high",
          context: ["trace", "test"],
          tools: { allow: ["read"] },
        },
      ],
      [
        {
          id: "fix",
          name: "Fix",
          role: "makes the change",
          model: "sonnet",
          tier: "balanced",
          effort: "medium",
          context: ["diagnosis", "target files"],
          tools: { allow: ["edit", "write"], blocked: 13 },
          skills: ["testing-patterns"],
        },
      ],
      [
        {
          id: "verify",
          name: "Verify",
          role: "reruns it 50 times: the mechanical gate",
          kind: "verification",
          model: "deterministic",
          tier: "none",
          note: "no model opinion",
          context: ["diff"],
          tools: { allow: ["bash"] },
        },
      ],
      [
        {
          id: "review",
          name: "Review",
          role: "reads the fix against the cause",
          model: "opus",
          tier: "strategic",
          effort: "high",
          context: ["diff", "diagnosis"],
          tools: { allow: ["read"] },
        },
        {
          id: "record",
          name: "Record",
          role: "the durable run folder it all leaves behind",
          kind: "compose",
          model: "deterministic",
          tier: "none",
          note: "trace · reports · evidence",
        },
      ],
    ],
  },
];

// ---- Power dial -------------------------------------------------------------

// One control moves the whole flow's model and effort at once — but not
// uniformly. The steps that decide direction hold their model at every setting
// (a floor: judgment compounds, so it never runs cheap). The balanced and bulk
// steps track the dial. This mirrors Circuit's real per-role power allocation:
// the researcher is pinned high while the implementer follows the dial.
//
// The authored values in FLOWS above are the MEDIUM setting. So at medium the
// diagram is exactly what each step is authored with; low and high are derived
// shifts from that baseline.
type Dial = "low" | "medium" | "high";

const DIALS: Dial[] = ["low", "medium", "high"];

// How a tracking step's (model, effort, tier) resolves at each dial, keyed by
// its authored (medium) tier. "strategic" and "none" are absent on purpose:
// strategic is pinned to its authored value (the floor) and "none" has no model
// opinion at all — both are returned unchanged.
const DIAL_TABLE: Record<
  "balanced" | "execution",
  Record<Dial, { model: string; effort: Effort; tier: Tier }>
> = {
  balanced: {
    low: { model: "haiku", effort: "low", tier: "execution" },
    medium: { model: "sonnet", effort: "medium", tier: "balanced" },
    high: { model: "opus", effort: "high", tier: "strategic" },
  },
  execution: {
    low: { model: "haiku", effort: "minimal", tier: "execution" },
    medium: { model: "haiku", effort: "low", tier: "execution" },
    high: { model: "sonnet", effort: "medium", tier: "balanced" },
  },
};

function resolveStepForDial(step: StepSpec, dial: Dial): StepSpec {
  const tier = step.tier ?? "none";
  // No model opinion (gate, checkpoint, record) or a pinned direction-setting
  // step: unchanged at every dial.
  if (tier === "none" || tier === "strategic") return step;
  return { ...step, ...DIAL_TABLE[tier][dial] };
}

function flowAtDial(flow: ExampleFlow, dial: Dial): ExampleFlow {
  // Medium is the authored baseline. Return the same object so its identity is
  // stable and the diagram never re-measures just for sitting at rest.
  if (dial === "medium") return flow;
  return {
    ...flow,
    rows: flow.rows.map((row) => row.map((step) => resolveStepForDial(step, dial))),
  };
}

// ---- Feature tour -----------------------------------------------------------

// The tabs along the top are NAMED FEATURES, not flow types. Selecting one
// highlights where that feature lives in the diagram and shows a short blurb.
// Every blurb is written to stay honest to what ships (docs/positioning.md):
// mechanism only — no "learns" / "gets better", no "can't fake done", and the
// loop is "until the check passes", bounded. The canvas is the prototype-react
// flow because it is the one flow that depicts every control shape.

// Which part of a tile a feature points at. "whole" rings the tile; the rest
// ring one inner block and quiet the others.
type FeatureElement =
  | "whole"
  | "model"
  | "ctx"
  | "tools"
  | "skills"
  | "branches"
  | "options"
  | "note";

type Feature = {
  key: string;
  label: string;
  blurb: string;
  // step.id values in the canvas flow this feature highlights.
  stepIds: string[];
  element: FeatureElement;
  // What the feature IS to a reader: a guarantee the engine enforces, a scope
  // a step is boxed to, or a structural shape a flow can take. The vertical
  // nav renders these as labeled clusters.
  group: "guarantees" | "scoping" | "structure";
};

// The flow the tour is pinned to. Feature selection never swaps the flow, so the
// diagram stays put (no morph) while a feature lights up inside it.
const TOUR_FLOW_KEY = "prototype-react";

// Ordered group-contiguous so the vertical nav can render labeled clusters by
// walking the array once. Nothing keys off array position (resolveSelection
// finds by key, no default selection), so the order is free to serve reading.
const FEATURES: Feature[] = [
  {
    key: "mechanical-check",
    label: "Mechanical check",
    blurb:
      "The engine runs the build, lint, and tests itself. A step cannot close until that check actually passes, so 'done' has to clear a real bar, not just get asserted.",
    stepIds: ["verify"],
    element: "whole",
    group: "guarantees",
  },
  {
    key: "converge-loop",
    label: "Loops until it passes",
    blurb:
      "If the check fails, the flow loops back, reworks, and re-checks. It keeps going until the gate passes, within a bounded number of tries.",
    stepIds: ["converge", "verify"],
    element: "whole",
    group: "guarantees",
  },
  {
    key: "checkpoint",
    label: "Checkpoint",
    blurb:
      "The run can pause and hand you a decision, then pick back up with your choice. You make the call the flow shouldn't make for you.",
    stepIds: ["checkpoint"],
    element: "options",
    group: "guarantees",
  },
  {
    key: "context-isolation",
    label: "Fresh context",
    blurb:
      "Each step starts from a clean slate and sees only the inputs it declares, not the full running transcript. Later steps don't get polluted by the chatter of earlier ones.",
    stepIds: ["frame", "synthesize", "plan", "implement", "verify", "review"],
    element: "ctx",
    group: "scoping",
  },
  {
    key: "tool-scope",
    label: "Tool scope",
    blurb:
      "The step that writes code can be walled to just its editor tools (a hard wall on Claude Code); the research and review steps stay read-only by role.",
    stepIds: ["implement"],
    element: "tools",
    group: "scoping",
  },
  {
    key: "model-routing",
    label: "Model routing",
    blurb:
      "The model, effort, and even the provider are set per step. The few steps that decide direction run on a top model at high effort; the bulk work runs cheaper and faster; and review here runs on a different provider than the build, so a second model checks the work.",
    stepIds: [
      "frame",
      "research",
      "synthesize",
      "plan",
      "implement",
      "converge",
      "review",
    ],
    element: "model",
    group: "scoping",
  },
  {
    key: "fan-out",
    label: "Fan-out",
    blurb:
      "One step can fan out into parallel scouts that each explore a slice, then merge into a single brief. The badge counts the real branches.",
    stepIds: ["research"],
    element: "branches",
    group: "structure",
  },
  {
    key: "subrun",
    label: "Subrun",
    blurb:
      "A step can expand into its own run with its own steps. The build here hands off to a child flow instead of trying to do everything in one step.",
    stepIds: ["implement"],
    element: "note",
    group: "structure",
  },
];

// The cluster headings, in nav order. "Guarantees" leads because it is the
// pitch (what the engine enforces); scoping explains the per-step box;
// structure names the shapes a flow can take.
const FEATURE_GROUPS: Array<{ key: Feature["group"]; label: string }> = [
  { key: "guarantees", label: "Guarantees" },
  { key: "scoping", label: "Scoping" },
  { key: "structure", label: "Structure" },
];

// ---- Unified selection ------------------------------------------------------

// Two things can drive the highlight: a feature tab, or a direct click on a tile
// in the diagram. They share one selection so the dimming, the focus scroll, and
// the blurb all read a single source. A feature selection lights the steps that
// feature touches; an element selection lights one clicked tile and describes it.
type Selection =
  | { kind: "feature"; key: string }
  | { kind: "element"; stepId: string; element: FeatureElement };

// Everything downstream (dimming, the focus scroll target, the blurb, the
// blurb-align anchor) reads this one shape, so no consumer ever branches on which
// kind of selection produced it.
type ResolvedFocus = {
  stepIds: string[];
  element: FeatureElement;
  // The tile the blurb aligns to and the focus scroll leads with. The first of
  // stepIds in flow order (stepIds are authored in flow order, so [0] is topmost).
  anchorStepId: string;
  label: string;
  blurb: string;
};

// Find a real step by id in the pinned flow. The synthetic prompt node is never a
// selectable element, so it does not need to resolve here.
function findStep(flow: ExampleFlow, id: string): StepSpec | undefined {
  for (const row of flow.rows) {
    for (const step of row) if (step.id === id) return step;
  }
  return undefined;
}

// Turn a role fragment ("writes the prototype") into a sentence.
function sentence(text: string): string {
  const t = text.trim();
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?·]$/.test(capped) ? capped : `${capped}.`;
}

// The blurb shown when a tile is clicked. It only ever restates fields the tile
// already carries (role, the scope it runs with, its branches/options/note), so
// it stays mechanism-only and invents no new copy.
function stepBlurb(step: StepSpec, element: FeatureElement): string {
  const lead = sentence(step.role);
  switch (element) {
    case "branches":
      return step.branches && step.branches.length > 0
        ? `${lead} It fans out into ${step.branches.length} parallel scouts: ${step.branches.join(", ")}.`
        : lead;
    case "options":
      return step.options && step.options.length > 0
        ? `${lead} It pauses and hands you the call: ${step.options.join(" · ")}.`
        : lead;
    case "note":
      return step.note ? `${lead} ${sentence(step.note)}` : lead;
    default: {
      const scope: string[] = [];
      if (step.tools && step.tools.allow.length > 0) {
        const allow = step.tools.allow.join(", ");
        scope.push(
          step.tools.blocked ? `uses ${allow} (${step.tools.blocked} blocked)` : `uses ${allow}`,
        );
      }
      if (step.skills && step.skills.length > 0) {
        scope.push(`pulls in ${step.skills.join(", ")}`);
      }
      if (step.model && step.tier !== "none") {
        scope.push(`on ${step.model}`);
      }
      return scope.length > 0 ? `${lead} It ${scope.join(", ")}.` : lead;
    }
  }
}

// Collapse either selection kind to the one shape every consumer reads.
function resolveSelection(
  selection: Selection | null,
  flow: ExampleFlow,
): ResolvedFocus | null {
  if (!selection) return null;
  if (selection.kind === "feature") {
    const feature = FEATURES.find((f) => f.key === selection.key);
    if (!feature) return null;
    return {
      stepIds: feature.stepIds,
      element: feature.element,
      anchorStepId: feature.stepIds[0],
      label: feature.label,
      blurb: feature.blurb,
    };
  }
  const step = findStep(flow, selection.stepId);
  if (!step) return null;
  return {
    stepIds: [selection.stepId],
    element: selection.element,
    anchorStepId: selection.stepId,
    label: step.name,
    blurb: stepBlurb(step, selection.element),
  };
}

// The three treatments compared on the preview route. The real hero renders the
// default ("spotlight"). They differ only in how the highlight reads and where
// the blurb sits — the diagram, the data, and the FLIP/connector engine are
// shared. Each suppression style is composited-only (opacity/filter), so a
// highlight never changes a tile's box and the measured connectors never move.
type TourVariant = "spotlight" | "glow" | "focus";

// How far a non-target tile fades when a feature is active. Glow does not dim at
// all (it adds emphasis to the target instead); focus adds a light blur on top.
// Focus keeps the fade gentle: the rest of the diagram should read as quieted
// but still legible, not fogged out.
const DIM_OPACITY: Record<TourVariant, number> = {
  spotlight: 0.34,
  glow: 1,
  focus: 0.6,
};

// Fold the dim/blur into the tile's existing animate target so Framer transitions
// to it smoothly. Only opacity and filter change — both composited, neither
// touches layout — so the connector measurement stays valid.
function withDim(
  base: MotionProps,
  variant: TourVariant,
  reduceMotion: boolean,
): MotionProps {
  const opacity = DIM_OPACITY[variant];
  const animate = { ...(base.animate as Record<string, unknown>) };
  if (opacity < 1) animate.opacity = opacity;
  if (variant === "focus" && !reduceMotion) animate.filter = "blur(1.5px)";
  return { ...base, animate: animate as MotionProps["animate"] };
}

// ---- Diagram engine (lifted from the old composer) --------------------------
// The connector overlay and FLIP choreography are unchanged in spirit: tiles are
// measured by their real boxes, so richer tiles still get correctly routed
// wires. Everything tints off the inline --flow-color.

const CONNECTOR_STROKE =
  "color-mix(in oklab, var(--flow-color) 60%, var(--border))";
// The loop's return edge sits under the sequential wires: dimmer and dashed,
// so "again" never outshouts "then".
const RETURN_STROKE =
  "color-mix(in oklab, var(--flow-color) 42%, var(--border))";

// The page-space focal plane, as a fraction of the viewport height. A step
// whose center sits on this line reads fully sharp; the depth-of-field layer
// grades everything else by its distance from it, and selecting a feature
// scrolls the page to bring the anchor step here. Above center: the reader's
// eye rests in the upper third, and it leaves room below for the next steps
// to visibly wait out of focus.
const FOCAL_LINE = 0.38;

// The depth of field. Full focus holds for DOF_PLATEAU px either side of the
// plane (roughly half a tile, so a step doesn't shimmer while its center
// rides near the line), then decays to fully receded across DOF_FALLOFF px
// more. The curve is 1 - x², so focus lets go gently near the plane and
// falls faster into the distance.
const DOF_PLATEAU = 110;
const DOF_FALLOFF = 380;
// The two ends of the scale channel. Wires are measured from resting boxes, so
// a scaled tile's edge drifts off its wire ends; a receded tile hides that in
// its wire fade (see WireSegment), the focal tile can't. But the connectors
// already inset EDGE_INSET px from the tile edge, so a focal grow stays within
// that slack up to ~1.06 — past that the wire ports visibly detach and the fix
// is to re-measure on scroll, not to scale harder. The focal pop is this grow
// AND the rest receding further (lower min).
const DOF_SCALE_MIN = 0.9;
const DOF_SCALE_MAX = 1.06;
const DOF_BLUR_MAX = 4.5;
// The veil (flow-veil, riding --illum) owns the darkness of a receded tile
// now, so wrapper opacity only assists; a 0.55 floor on top of the veil
// crushed the neon elements that are supposed to survive recession.
const DOF_OPACITY_MIN = 0.72;
const DOF_WIRE_OPACITY_MIN = 0.25;

// Geometry the depth transforms read on every scroll frame: the canvas's
// page-space top plus each node's center relative to the canvas, refreshed by
// measure(). geomTick bumps after each refresh so the focus transforms
// re-evaluate even when the scroll position hasn't moved.
type DepthField = {
  active: boolean;
  scrollY: MotionValue<number>;
  geomTick: MotionValue<number>;
  geom: { current: { canvasTop: number; centers: Map<string, number> } };
};

// How in-focus a node is at a given page scroll: 1 on the plane, 0 fully
// receded. Unmeasured nodes read as sharp so nothing flashes blurry before
// the first measure lands.
function focusAt(
  geom: { canvasTop: number; centers: Map<string, number> },
  id: string,
  pageY: number,
): number {
  if (typeof window === "undefined") return 1;
  const cy = geom.centers.get(id);
  if (cy == null) return 1;
  const viewportY = geom.canvasTop + cy - pageY;
  const dist = Math.abs(viewportY - window.innerHeight * FOCAL_LINE);
  const x = Math.min(1, Math.max(0, (dist - DOF_PLATEAU) / DOF_FALLOFF));
  return 1 - x * x;
}

const ROW_EPSILON = 18;
const EDGE_INSET = 6;
const ELBOW_R = 9;

type Anchor = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  cx: number;
  cy: number;
};

type Segment = {
  id: string;
  d: string;
  head: { x: number; y: number; dir: "right" | "down" | "up" | "left" };
  // Where the wire leaves its source tile. Drawn as a port dot; the head's
  // chevron already marks the arrival end.
  tail: { x: number; y: number };
  // "return" is the loop's back edge; absent means a sequential wire.
  kind?: "return";
  // The step ids the wire connects, so the depth layer can grade the wire by
  // its endpoints' focus.
  from: string;
  to: string;
};

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function assignRef(ref: Ref<HTMLElement> | undefined, el: HTMLElement | null) {
  if (typeof ref === "function") ref(el);
  else if (ref) (ref as { current: HTMLElement | null }).current = el;
}

const emptySubscribe = () => () => {};

function toAnchor(el: HTMLElement, origin: DOMRect): Anchor {
  const r = el.getBoundingClientRect();
  const left = r.left - origin.left;
  const top = r.top - origin.top;
  return {
    left,
    top,
    right: left + r.width,
    bottom: top + r.height,
    cx: left + r.width / 2,
    cy: top + r.height / 2,
  };
}

function connectorSegment(
  a: Anchor,
  b: Anchor,
): Omit<Segment, "id" | "from" | "to"> {
  // Two steps share a row when their vertical CENTERS line up (the grid centers
  // same-row tiles), so a height difference between paired tiles never bends the
  // wire. Same-row wires run flat left to right; everything else flows downward.
  const sameRow = Math.abs(a.cy - b.cy) < ROW_EPSILON && b.left > a.right - 4;
  if (sameRow) {
    const x1 = a.right + EDGE_INSET;
    const y1 = a.cy;
    const x2 = b.left - EDGE_INSET;
    const y2 = b.cy;
    const k = Math.min(Math.max((x2 - x1) * 0.5, 12), 40);
    return {
      d: `M ${x1} ${y1} C ${x1 + k} ${y1}, ${x2 - k} ${y2}, ${x2} ${y2}`,
      head: { x: x2, y: y2, dir: "right" },
      tail: { x: x1, y: y1 },
    };
  }
  const x1 = a.cx;
  const y1 = a.bottom + EDGE_INSET;
  const x2 = b.cx;
  const y2 = b.top - EDGE_INSET;
  if (Math.abs(x2 - x1) < 6) {
    return {
      d: `M ${x1} ${y1} L ${x2} ${y2}`,
      head: { x: x2, y: y2, dir: "down" },
      tail: { x: x1, y: y1 },
    };
  }
  const midY = (a.bottom + b.top) / 2;
  const dir = x2 > x1 ? 1 : -1;
  const r = Math.min(
    ELBOW_R,
    Math.abs(x2 - x1) / 2,
    Math.abs(midY - y1),
    Math.abs(y2 - midY),
  );
  const d =
    `M ${x1} ${y1}` +
    ` L ${x1} ${midY - r}` +
    ` Q ${x1} ${midY} ${x1 + dir * r} ${midY}` +
    ` L ${x2 - dir * r} ${midY}` +
    ` Q ${x2} ${midY} ${x2} ${midY + r}` +
    ` L ${x2} ${y2}`;
  return { d, head: { x: x2, y: y2, dir: "down" }, tail: { x: x1, y: y1 } };
}

// The loop's return edge, from the loop tile back to the step it reworks.
// The route depends on how the responsive grid arranged the two tiles:
// side by side (two- and three-up), the wire dips under the row and rises
// into the target's bottom edge, exiting off-center so it never shares the
// forward wire's port; stacked, it bows around the right margin into the
// target's right edge. The one-column phone layout leaves no margin to bow
// through, so the wire is skipped and the loop tile's note carries it.
function returnSegment(
  a: Anchor,
  b: Anchor,
  canvasW: number,
): Omit<Segment, "id" | "from" | "to"> | null {
  const sameRow = Math.abs(a.cy - b.cy) < ROW_EPSILON && b.right < a.left;
  if (sameRow) {
    // Both ends sit off-center: the tail clear of the forward wire leaving
    // this tile's bottom, the head clear of the lane where the next
    // sequential wire descends past the target's bottom-center.
    const x1 = a.cx - 16;
    const y1 = a.bottom + EDGE_INSET;
    const x2 = b.cx + 24;
    const y2 = b.bottom + EDGE_INSET;
    // Deep enough that the long middle run clears the forward elbow that
    // shares this row gap; the tiles' center-alignment keeps the two rows
    // far apart at these depths.
    const k = 40;
    return {
      d: `M ${x1} ${y1} C ${x1} ${y1 + k}, ${x2} ${y2 + k}, ${x2} ${y2}`,
      head: { x: x2, y: y2, dir: "up" },
      tail: { x: x1, y: y1 },
      kind: "return",
    };
  }
  const edge = Math.max(a.right, b.right);
  const bow = 26;
  if (canvasW - edge < bow + 10) return null;
  const x1 = a.right + EDGE_INSET;
  const y1 = a.cy;
  const x2 = b.right + EDGE_INSET;
  const y2 = b.cy;
  const xc = edge + bow;
  return {
    d: `M ${x1} ${y1} C ${xc} ${y1}, ${xc} ${y2}, ${x2} ${y2}`,
    head: { x: x2, y: y2, dir: "left" },
    tail: { x: x1, y: y1 },
    kind: "return",
  };
}

function verticalCubic(x1: number, y1: number, x2: number, y2: number): string {
  const k = Math.max(Math.abs(y2 - y1) * 0.5, 12);
  return `M ${x1} ${y1} C ${x1} ${y1 + k}, ${x2} ${y2 - k}, ${x2} ${y2}`;
}

function chevron(head: Segment["head"]): string {
  const { x, y, dir } = head;
  if (dir === "right") return `M ${x - 5} ${y - 3} L ${x} ${y} L ${x - 5} ${y + 3}`;
  if (dir === "left") return `M ${x + 5} ${y - 3} L ${x} ${y} L ${x + 5} ${y + 3}`;
  if (dir === "up") return `M ${x - 3} ${y + 5} L ${x} ${y} L ${x + 3} ${y + 5}`;
  return `M ${x - 3} ${y - 5} L ${x} ${y} L ${x + 3} ${y - 5}`;
}

function tileMotionProps(
  reduceMotion: boolean,
  spring: Parameters<typeof m.div>[0]["transition"],
): MotionProps {
  if (reduceMotion) {
    return {
      initial: false,
      animate: { opacity: 1 },
      exit: { opacity: 0, transition: { duration: 0 } },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: {
      opacity: 0,
      scale: 0.96,
      filter: "blur(8px)",
      transition: { duration: 0.22, ease: "easeIn" },
    },
    transition: {
      layout: spring,
      opacity: { duration: 0.34, ease: "easeOut" },
      scale: { duration: 0.4, ease: "easeOut" },
      filter: { duration: 0.34, ease: "easeOut" },
    },
  };
}

function connectorGroupProps(reduceMotion: boolean, delay: number): MotionProps {
  if (reduceMotion) {
    return {
      initial: false,
      animate: { opacity: 1, filter: "blur(0px)" },
      exit: { opacity: 0, transition: { duration: 0 } },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 1, filter: "blur(8px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: {
      opacity: 0,
      filter: "blur(8px)",
      transition: { duration: 0.24, ease: "easeIn" },
    },
    transition: { filter: { delay, duration: 0.4, ease: "easeOut" } },
  };
}

// ---- Per-step detail chrome -------------------------------------------------

// Which vendor runs a model, inferred from its name. Drives the badge's logo
// and color, so a mixed-provider flow shows at a glance whose model each step
// runs on. Markers that aren't a real model ("deterministic", "you decide")
// have no provider and stay neutral.
function providerFor(model: string): "anthropic" | "openai" | null {
  const m = model.toLowerCase();
  if (/opus|sonnet|haiku|claude/.test(m)) return "anthropic";
  if (/^gpt|openai|^o\d/.test(m)) return "openai";
  return null;
}

// Provider logomarks, drawn from each vendor's own single-path mark at badge
// scale. They ink in currentColor, so the badge sets the provider tint on the
// wrapping span and the glyph inherits it.
function AnthropicMark({ size = 12 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
    </svg>
  );
}

function OpenAIMark({ size = 12 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M22.282 9.821a6 6 0 0 0-.516-4.91a6.05 6.05 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a6 6 0 0 0-3.998 2.9a6.05 6.05 0 0 0 .743 7.097a5.98 5.98 0 0 0 .51 4.911a6.05 6.05 0 0 0 6.515 2.9A6 6 0 0 0 13.26 24a6.06 6.06 0 0 0 5.772-4.206a6 6 0 0 0 3.997-2.9a6.06 6.06 0 0 0-.747-7.073M13.26 22.43a4.48 4.48 0 0 1-2.876-1.04l.141-.081l4.779-2.758a.8.8 0 0 0 .392-.681v-6.737l2.02 1.168a.07.07 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494M3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085l4.783 2.759a.77.77 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646M2.34 7.896a4.5 4.5 0 0 1 2.366-1.973V11.6a.77.77 0 0 0 .388.677l5.815 3.354l-2.02 1.168a.08.08 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.08.08 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667m2.01-3.023l-.141-.085l-4.774-2.782a.78.78 0 0 0-.785 0L9.409 9.23V6.897a.07.07 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.8.8 0 0 0-.393.681zm1.097-2.365l2.602-1.5l2.607 1.5v2.999l-2.597 1.5l-2.607-1.5Z" />
    </svg>
  );
}

const EFFORT_PIPS: Record<Effort, number> = {
  none: 0,
  minimal: 1,
  low: 1,
  medium: 2,
  high: 3,
  max: 3,
};

function ModelBadge({
  step,
  hot,
  pulse = 0,
  onSelect,
  selected = false,
}: {
  step: StepSpec;
  hot?: boolean;
  // Bumped when the power dial re-tiers this step. Keys the badge so the
  // one-shot flash replays on every move that touches it.
  pulse?: number;
  // When present, the badge is its own hit target: clicking it surfaces the
  // model's blurb. Absent for markers that aren't a real model.
  onSelect?: () => void;
  selected?: boolean;
}) {
  if (!step.model) return null;
  const tier = step.tier ?? "none";
  const provider = providerFor(step.model);
  const pips = EFFORT_PIPS[step.effort ?? "none"];
  // The fan-out badge counts the real branches, so it stays truthful for any
  // flow added later, not just the one that happens to have five scouts.
  const branchCount = step.branches?.length ?? 0;
  const prefix =
    step.shape === "fanout" && branchCount ? `${branchCount} × ` : "";

  // A real model wears its provider's color; brightness still ladders by tier
  // (strategic brightest, execution faintest) so model routing stays readable
  // at a glance. A non-model marker keeps the neutral ghost hairline.
  const provColor =
    provider === "anthropic"
      ? "var(--prov-anthropic)"
      : provider === "openai"
        ? "var(--prov-openai)"
        : null;
  let style: CSSProperties;
  let pipColor: string;
  if (provColor) {
    const fillPct = tier === "strategic" ? 22 : tier === "balanced" ? 15 : 9;
    const textPct = tier === "strategic" ? 100 : tier === "balanced" ? 88 : 68;
    style = {
      background: `color-mix(in oklab, ${provColor} ${fillPct}%, transparent)`,
      color: `color-mix(in oklab, var(--foreground) ${textPct}%, transparent)`,
    };
    pipColor = provColor;
  } else {
    style = {
      color: "var(--muted-foreground)",
      boxShadow:
        "inset 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent)",
    };
    pipColor = "var(--muted-foreground)";
  }

  const cls = `flow-neon inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[11px] ${hot ? "flow-badge-hot" : ""} ${pulse > 0 ? "flow-badge-pulse" : ""}`;

  const body = (
    <>
      {provColor ? (
        <span
          aria-hidden="true"
          className="inline-flex shrink-0"
          style={{ color: provColor }}
        >
          {provider === "anthropic" ? <AnthropicMark /> : <OpenAIMark />}
        </span>
      ) : null}
      {prefix}
      {step.model}
      {pips > 0 ? (
        <span aria-hidden="true" className="inline-flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-[4px] w-[4px] rounded-full"
              style={{
                background:
                  i < pips
                    ? pipColor
                    : "color-mix(in oklab, var(--foreground) 18%, transparent)",
              }}
            />
          ))}
        </span>
      ) : null}
    </>
  );

  if (onSelect) {
    return (
      <button
        key={pulse}
        type="button"
        aria-pressed={selected}
        aria-label={`model: ${step.model}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSelect}
        className={`flow-elhit ${cls}`}
        style={style}
      >
        {body}
      </button>
    );
  }
  return (
    <span key={pulse} className={cls} style={style}>
      {body}
    </span>
  );
}

function DetailRow({
  label,
  children,
  state,
  onSelect,
  selected = false,
}: {
  label: string;
  children: ReactNode;
  state?: "hot" | "cool" | null;
  // When present the whole row is a hit target: clicking it surfaces that
  // scope's blurb and quiets the sibling rows.
  onSelect?: () => void;
  selected?: boolean;
}) {
  const cls =
    state === "hot" ? "flow-row-hot" : state === "cool" ? "flow-row-cool" : "";
  const inner = (
    <>
      <span className="w-14 shrink-0 pt-[2px] text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      {/* min-w-0: without it this wrapper's min-width:auto tracks the widest
          chip, the row overflows the tile, and the chips' own max-w-full cap
          (and truncation) never engages. Same gotcha .flow-grid-item pins. */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {children}
      </div>
    </>
  );
  if (onSelect) {
    return (
      <button
        type="button"
        aria-pressed={selected}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSelect}
        className={`flow-elhit flex w-full appearance-none items-start gap-2.5 border-0 bg-transparent text-left ${cls}`}
      >
        {inner}
      </button>
    );
  }
  return <div className={`flex items-start gap-2.5 ${cls}`}>{inner}</div>;
}

// A tile lists at most this many skill chips; the rest fold into a "+N"
// counter (full names in its title). The long skill tokens each eat a full
// chip line, so an uncapped stack is what made one tile twice its neighbors'
// height.
const MAX_SKILL_CHIPS = 2;

// A scope token, weighted by what kind of grant it names. A "tool" is a power
// the step was GRANTED, so it reads solid; a "skill" is knowledge it
// REFERENCES, so it reads as a quiet outline; a "context" input is what it was
// GIVEN, the lightest — a faint token. The model badge stays the tile's one
// color moment, so the weights differ in presence, not hue. A long token
// truncates (full text in the title) instead of wrapping into a ragged line.
function Chip({
  children,
  variant,
}: {
  children: string;
  variant: "tool" | "skill" | "context";
}) {
  return (
    <span
      title={children}
      className={`flow-chip flow-chip--${variant} inline-flex min-w-0 max-w-full items-center rounded-md px-1.5 py-[2px] font-mono text-[11px] leading-tight`}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

function StepDetail({
  step,
  highlightElement,
  selectEl,
  selectedElement = null,
}: {
  step: StepSpec;
  highlightElement?: FeatureElement | null;
  // Clicking a spec row selects that element; null when the tile isn't
  // interactive (static previews).
  selectEl?: (element: FeatureElement) => void;
  selectedElement?: FeatureElement | null;
}) {
  const hasContext = step.context && step.context.length > 0;
  const hasTools = step.tools && step.tools.allow.length > 0;
  const hasSkills = step.skills && step.skills.length > 0;
  // When a context/tools/skills element is active (from a tab or a direct
  // click), ring the matching row and quiet the siblings. The other elements
  // light up elsewhere in the tile.
  const rowFeature =
    highlightElement === "ctx" ||
    highlightElement === "tools" ||
    highlightElement === "skills"
      ? highlightElement
      : null;
  const rowState = (el: "ctx" | "tools" | "skills"): "hot" | "cool" | null =>
    rowFeature === null ? null : rowFeature === el ? "hot" : "cool";
  // Plain steps surface their note here (e.g. Verify's "no model opinion",
  // Record's trail). Subrun and loop steps render their own note up in the tile
  // head, so it must not repeat for them.
  const showNote =
    !!step.note && step.shape !== "loop" && step.shape !== "subrun";
  if (!hasContext && !hasTools && !hasSkills && !showNote) return null;
  return (
    <div className="flow-spec mt-4 flex flex-col gap-2.5 pt-4">
      {hasContext ? (
        <DetailRow
          label="context"
          state={rowState("ctx")}
          onSelect={selectEl ? () => selectEl("ctx") : undefined}
          selected={selectedElement === "ctx"}
        >
          {/* Inputs the step is handed — the lightest grant, so they read as
              faint tokens, quieter than the tools and skills below. */}
          {step.context!.map((c) => (
            <Chip key={c} variant="context">
              {c}
            </Chip>
          ))}
        </DetailRow>
      ) : null}
      {hasTools ? (
        <DetailRow
          label="tools"
          state={rowState("tools")}
          onSelect={selectEl ? () => selectEl("tools") : undefined}
          selected={selectedElement === "tools"}
        >
          {step.tools!.allow.map((t) => (
            <Chip key={t} variant="tool">
              {t}
            </Chip>
          ))}
          {step.tools!.blocked ? (
            // Not an error — a boundary the step runs inside. The lock and the
            // count read as a deliberate wall, the one place a second meaning
            // (denied) earns its own tint.
            <span className="flow-walled inline-flex items-center gap-1 rounded-md px-1.5 py-[2px] font-mono text-[11px] leading-tight">
              <LockIcon />
              {step.tools!.blocked} blocked
            </span>
          ) : null}
        </DetailRow>
      ) : null}
      {hasSkills ? (
        <DetailRow
          label="skills"
          state={rowState("skills")}
          onSelect={selectEl ? () => selectEl("skills") : undefined}
          selected={selectedElement === "skills"}
        >
          {step.skills!.slice(0, MAX_SKILL_CHIPS).map((s) => (
            <Chip key={s} variant="skill">
              {s}
            </Chip>
          ))}
          {step.skills!.length > MAX_SKILL_CHIPS ? (
            <span
              title={step.skills!.slice(MAX_SKILL_CHIPS).join(", ")}
              className="flow-chip flow-chip--skill inline-flex items-center rounded-md px-1.5 py-[2px] font-mono text-[11px] leading-tight"
            >
              +{step.skills!.length - MAX_SKILL_CHIPS}
            </span>
          ) : null}
        </DetailRow>
      ) : null}
      {showNote ? (
        <button
          type="button"
          aria-pressed={selectedElement === "note"}
          onMouseDown={(e) => e.preventDefault()}
          onClick={selectEl ? () => selectEl("note") : undefined}
          className={`flow-elhit inline-flex w-fit appearance-none items-center border-0 bg-transparent text-left font-mono text-[11px] leading-snug ${highlightElement === "note" ? "flow-note-hot" : ""} ${step.kind === "verification" ? "text-foreground/85" : "text-muted-foreground"}`}
        >
          {step.kind === "verification" ? (
            // The engine's line, not the model's: a gate step's check runs
            // deterministically, so it reads in the run-output register with
            // the signal caret.
            <span aria-hidden="true" className="flow-neon mr-1.5 text-signal">
              ›
            </span>
          ) : null}
          {step.note}
        </button>
      ) : null}
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      width="9"
      height="9"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

// ---- Tiles ------------------------------------------------------------------

// The diagram's first node: the operator's prompt, drawn as a terminal bar. It
// is not a real step — no model, tools, or skills — so it gets its own light
// treatment and never carries a feature ring. It still registers a node ref so
// the connector engine drops a wire from it into the first real step.
// Framer's FLIP (layout / layoutId) glides a tile when its box moves between
// renders. The tour never swaps the flow, so no box ever moves, and inside the
// windowed scroll frame a non-zero scrollTop between Framer's before/after box
// snapshots can corrupt the corrective transform (a one-frame jump). So we drop
// layout in windowed mode; elsewhere it stays on as a harmless no-op.
function layoutProps(disable: boolean, id: string): MotionProps {
  return disable ? {} : { layout: true, layoutId: id };
}

function PromptTile({
  step,
  motionProps,
  registerNode,
  disableLayout = false,
}: {
  step: StepSpec;
  motionProps: MotionProps;
  registerNode: (id: string) => (el: HTMLElement | null) => void;
  disableLayout?: boolean;
}) {
  const nodeRef = registerNode(step.id);
  return (
    <m.div
      ref={nodeRef}
      {...layoutProps(disableLayout, step.id)}
      {...motionProps}
      className="flow-prompt-node relative"
    >
      <div className="flow-prompt-bar">
        <span className="flow-prompt-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="flow-prompt-cmd font-mono">/circuit:run</span>
      </div>
      <div className="flow-prompt-line font-mono">
        <span className="flow-prompt-caret flow-neon" aria-hidden="true">
          ❯
        </span>
        <span className="flow-prompt-text">{step.role}</span>
        <span className="flow-prompt-cursor" aria-hidden="true" />
      </div>
      <span aria-hidden="true" className="flow-veil" />
    </m.div>
  );
}

function StepTile({
  step,
  motionProps,
  registerNode,
  targeted,
  highlightElement,
  variant,
  selectEl,
  selectedElement = null,
  disableLayout = false,
  dialPulseTick = 0,
  ref,
}: {
  step: StepSpec;
  motionProps: MotionProps;
  registerNode: (id: string) => (el: HTMLElement | null) => void;
  targeted?: boolean;
  highlightElement?: FeatureElement | null;
  variant: TourVariant;
  // Each element on the tile is its own hit target; this selects one. Absent on
  // static (non-interactive) renders.
  selectEl?: (element: FeatureElement) => void;
  // The element currently selected on THIS tile (for aria-pressed), null when
  // the selection is a feature tab or points at another tile.
  selectedElement?: FeatureElement | null;
  disableLayout?: boolean;
  dialPulseTick?: number;
  ref?: Ref<HTMLElement>;
}) {
  const nodeRef = registerNode(step.id);
  const composedRef = useCallback(
    (el: HTMLElement | null) => {
      nodeRef(el);
      assignRef(ref, el);
    },
    [nodeRef, ref],
  );
  const isCheckpoint = step.shape === "checkpoint";
  const isLoop = step.shape === "loop";
  // Clicking an element must not let the browser also scroll the freshly-focused
  // button into view — that instant jump is what fought the smooth focus pan.
  // Preventing the mousedown default suppresses the focus (and its scroll) for
  // pointer users; keyboard focus is untouched.
  const holdScroll = (e: { preventDefault: () => void }) => e.preventDefault();
  return (
    <m.div
      ref={composedRef}
      {...layoutProps(disableLayout, step.id)}
      {...motionProps}
      data-shape={step.shape ?? "step"}
      className="flow-step-tile relative flex w-full flex-col p-5 text-left text-foreground"
    >
      {targeted && highlightElement === "whole" ? (
        <span
          aria-hidden="true"
          className={`flow-tile-ring flow-tile-ring--${variant}`}
        />
      ) : null}
      <div className="flex items-start justify-between gap-2.5">
        <button
          type="button"
          aria-pressed={selectedElement === "whole"}
          aria-label={`${step.name}: ${step.role}`}
          onMouseDown={holdScroll}
          onClick={() => selectEl?.("whole")}
          className="flow-elhit flow-step-name inline-flex w-fit appearance-none items-center gap-1.5 border-0 bg-transparent text-[16px] font-semibold leading-[1.15] tracking-[-0.015em]"
        >
          <span className="inline-flex items-center gap-1.5">
            {isCheckpoint ? <PauseIcon /> : null}
            {isLoop ? <LoopIcon /> : null}
            {step.shape === "subrun" ? <SubrunIcon /> : null}
            {step.kind === "verification" ? <GateIcon /> : null}
            {step.kind === "compose" ? <ComposeIcon /> : null}
          </span>
          {step.name}
        </button>
        <ModelBadge
          step={step}
          hot={highlightElement === "model"}
          pulse={dialPulseTick}
          onSelect={selectEl ? () => selectEl("model") : undefined}
          selected={selectedElement === "model"}
        />
      </div>

      {step.shape === "subrun" && step.note ? (
        <button
          type="button"
          aria-pressed={selectedElement === "note"}
          onMouseDown={holdScroll}
          onClick={() => selectEl?.("note")}
          className={`flow-elhit mt-3 inline-flex w-fit appearance-none items-center rounded-md border-0 px-1.5 py-[2px] font-mono text-[11px] text-signal ${highlightElement === "note" ? "flow-note-hot" : ""}`}
          style={{
            background: "color-mix(in oklab, var(--signal) 13%, transparent)",
          }}
        >
          {step.note}
        </button>
      ) : null}

      {isCheckpoint && step.options ? (
        <button
          type="button"
          aria-pressed={selectedElement === "options"}
          onMouseDown={holdScroll}
          onClick={() => selectEl?.("options")}
          className={`flow-elhit flow-scope-well mt-4 flex w-full appearance-none flex-col gap-2 border-0 text-left ${highlightElement === "options" ? "flow-options-hot" : ""}`}
        >
          {step.options.map((o) => {
            // Options are authored "A · label"; the leading letter renders as
            // a keycap so the row reads as a decision waiting on one keypress.
            const [cap, ...rest] = o.split(" · ");
            const label = rest.join(" · ");
            return (
              <span
                key={o}
                className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[11px] leading-tight text-foreground/90"
                style={{
                  background:
                    "color-mix(in oklab, var(--flow-color) 14%, transparent)",
                }}
              >
                {label ? (
                  <>
                    <kbd className="flow-option-key font-mono">{cap}</kbd>
                    {label}
                  </>
                ) : (
                  o
                )}
              </span>
            );
          })}
        </button>
      ) : null}

      {isLoop && step.note ? (
        <button
          type="button"
          aria-pressed={selectedElement === "note"}
          onMouseDown={holdScroll}
          onClick={() => selectEl?.("note")}
          className={`flow-elhit mt-3 inline-flex w-fit appearance-none border-0 bg-transparent font-mono text-[11px] text-muted-foreground ${highlightElement === "note" ? "flow-note-hot" : ""}`}
        >
          {step.note}
        </button>
      ) : null}

      <StepDetail
        step={step}
        highlightElement={highlightElement}
        selectEl={selectEl}
        selectedElement={selectedElement}
      />
      {/* The recession scrim. Last child so it overlays the body; the neon
          signals ride above it on their own z. */}
      <span aria-hidden="true" className="flow-veil" />
    </m.div>
  );
}

function PauseIcon() {
  return (
    <svg
      aria-hidden="true"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ color: "var(--flow-color)" }}
    >
      <line x1="9" y1="7" x2="9" y2="17" />
      <line x1="15" y1="7" x2="15" y2="17" />
    </svg>
  );
}

function LoopIcon() {
  return (
    <svg
      aria-hidden="true"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--flow-color)" }}
    >
      <path d="M4 9a8 8 0 0 1 14-3l2 2" />
      <path d="M20 5v4h-4" />
      <path d="M20 15a8 8 0 0 1-14 3l-2-2" />
      <path d="M4 19v-4h4" />
    </svg>
  );
}

// The deterministic gate: a check between hard brackets. The brackets say the
// pass bar is code, not opinion; the check says it has to clear.
function GateIcon() {
  return (
    <svg
      aria-hidden="true"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--flow-color)" }}
    >
      <path d="M8 4.5H4.5v15H8" />
      <path d="M16 4.5h3.5v15H16" />
      <path d="M8.5 12.4l2.6 2.6 4.4-5.2" />
    </svg>
  );
}

// The written record: the report lines a run leaves behind.
function ComposeIcon() {
  return (
    <svg
      aria-hidden="true"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--flow-color)" }}
    >
      <path d="M5 6.5h14" />
      <path d="M5 12h14" />
      <path d="M5 17.5h8" />
    </svg>
  );
}

// A run nested inside a step: the child flow the step expands into.
function SubrunIcon() {
  return (
    <svg
      aria-hidden="true"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--flow-color)" }}
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <rect x="10.5" y="10.5" width="7" height="7" rx="2" />
    </svg>
  );
}

function FanoutCluster({
  step,
  reduceMotion,
  motionProps,
  registerNode,
  highlightElement,
  selectEl,
  selectedElement = null,
  disableLayout = false,
  dialPulseTick = 0,
  ref,
}: {
  step: StepSpec;
  reduceMotion: boolean;
  motionProps: MotionProps;
  registerNode: (id: string) => (el: HTMLElement | null) => void;
  highlightElement?: FeatureElement | null;
  selectEl?: (element: FeatureElement) => void;
  selectedElement?: FeatureElement | null;
  disableLayout?: boolean;
  dialPulseTick?: number;
  ref?: Ref<HTMLElement>;
}) {
  const holdScroll = (e: { preventDefault: () => void }) => e.preventDefault();
  const clusterRef = useRef<HTMLElement | null>(null);
  const branchRefs = useRef<(HTMLElement | null)[]>([]);
  const [fanSegs, setFanSegs] = useState<{ id: string; d: string }[]>([]);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const branches = step.branches ?? [];

  const setOuterRef = useCallback(
    (el: HTMLElement | null) => {
      assignRef(ref, el);
    },
    [ref],
  );

  const setCardRef = useCallback(
    (el: HTMLElement | null) => {
      clusterRef.current = el;
      registerNode(step.id)(el);
    },
    [registerNode, step.id],
  );

  const measureFan = useCallback(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;
    const origin = cluster.getBoundingClientRect();
    const w = origin.width;
    const h = origin.height;
    const segs: { id: string; d: string }[] = [];
    branchRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const bx = r.left - origin.left + r.width / 2;
      const top = r.top - origin.top;
      const bottom = top + r.height;
      segs.push({ id: `fan-${i}`, d: verticalCubic(w / 2, 0, bx, top) });
      segs.push({ id: `merge-${i}`, d: verticalCubic(bx, bottom, w / 2, h) });
    });
    setFanSegs(segs);
    setBox((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
  }, []);

  useIsomorphicLayoutEffect(() => {
    measureFan();
    const cluster = clusterRef.current;
    if (!cluster || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measureFan());
    ro.observe(cluster);
    return () => ro.disconnect();
  }, [measureFan]);

  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts?.ready) return;
    let active = true;
    document.fonts.ready.then(() => {
      if (active) measureFan();
    });
    return () => {
      active = false;
    };
  }, [measureFan]);

  return (
    <m.div
      ref={setOuterRef}
      {...layoutProps(disableLayout, step.id)}
      {...motionProps}
      className="relative flex w-full justify-center"
    >
      <div
        ref={setCardRef}
        className="flow-fanout-cluster relative w-fit max-w-[34rem] px-5 pb-5 pt-4 text-foreground"
      >
        <div className="relative z-20 flex items-center justify-between gap-3">
          <button
            type="button"
            aria-pressed={selectedElement === "whole"}
            aria-label={step.name}
            onMouseDown={holdScroll}
            onClick={() => selectEl?.("whole")}
            className="flow-elhit flow-step-name inline-flex w-fit appearance-none items-center gap-1.5 border-0 bg-transparent text-[16px] font-semibold leading-[1.15] tracking-[-0.015em]"
          >
            <BranchIcon />
            {step.name}
          </button>
          <ModelBadge
            step={step}
            hot={highlightElement === "model"}
            pulse={dialPulseTick}
            onSelect={selectEl ? () => selectEl("model") : undefined}
            selected={selectedElement === "model"}
          />
        </div>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 w-full overflow-visible"
          style={{ height: box.h, color: CONNECTOR_STROKE }}
          viewBox={`0 0 ${box.w} ${box.h}`}
          preserveAspectRatio="none"
          fill="none"
        >
          {fanSegs.map((s, i) => (
            <m.path
              key={s.id}
              d={s.d}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { delay: 0.12 + i * 0.03, duration: 0.4, ease: "easeOut" }
              }
            />
          ))}
        </svg>
        <button
          type="button"
          aria-pressed={selectedElement === "branches"}
          aria-label={`${branches.length} parallel branches`}
          onMouseDown={holdScroll}
          onClick={() => selectEl?.("branches")}
          className={`flow-elhit relative z-10 mt-4 flex w-full flex-wrap justify-center gap-2 appearance-none border-0 bg-transparent ${highlightElement === "branches" ? "flow-branches-hot" : ""}`}
        >
          {branches.map((label, i) => (
            <span
              key={label}
              ref={(el) => {
                branchRefs.current[i] = el;
              }}
              className="flow-fanout-branch px-3 py-1.5 font-mono text-[11px] font-medium leading-tight text-foreground/80"
            >
              {label}
            </span>
          ))}
        </button>
        <span aria-hidden="true" className="flow-veil" />
      </div>
    </m.div>
  );
}

function BranchIcon() {
  return (
    <svg
      aria-hidden="true"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--flow-color)" }}
    >
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="12" r="2.5" />
      <path d="M8.5 6H13a3 3 0 0 1 3 3v.5" />
      <path d="M8.5 18H13a3 3 0 0 0 3-3v-.5" />
    </svg>
  );
}

// Flatten the rows into the linear step order the connectors run along. The
// authored row groupings no longer pin tiles to fixed columns — the responsive
// grid packs them in source order, as many per row as the width allows, so the
// diagram stays short. Two tiles need to break that flow: the entry step reads
// as a single centered start, and the fan-out is a wide cluster. Both span the
// full width; everything else auto-flows. The flat order is unchanged, so the
// measured connectors and the reading order are exactly as before.
type PlacedStep = { step: StepSpec; gridStyle: CSSProperties };

// The diagram opens with the operator's prompt as a synthetic terminal node, then
// the real flow. The prompt text reuses the flow's existing `prompt` field, so
// there's one source of truth. This sequence drives the connectors, placement,
// and the aria order alike.
function flowRows(flow: ExampleFlow): StepRow[] {
  const promptStep: StepSpec = {
    id: "prompt",
    name: "Prompt",
    role: flow.prompt,
    shape: "prompt",
  };
  return [[promptStep], ...flow.rows];
}

function placeRows(rows: StepRow[], depth = false): PlacedStep[] {
  // Depth mode reads one step per row: the scroll IS the pacing, so each
  // step gets the stage to itself and passes the focal plane alone. Tiles
  // cap their own width and center via CSS ([data-depth]); the wires
  // become a single vertical spine.
  if (depth) {
    return rows.flat().map((step) => ({
      step,
      gridStyle: { gridColumn: "1 / -1" } as CSSProperties,
    }));
  }
  let entryPlaced = false;
  return rows.flat().map((step) => {
    if (step.shape === "prompt") {
      // The terminal sits on the full-width row but caps its own width (CSS) and
      // centers, so it reads as a contained window rather than a full-bleed bar.
      return { step, gridStyle: { gridColumn: "1 / -1", justifySelf: "center" } };
    }
    if (!entryPlaced) {
      // The first real step: a single entry tile across the full width.
      entryPlaced = true;
      return { step, gridStyle: { gridColumn: "1 / -1", justifySelf: "center" } };
    }
    if (step.shape === "fanout") {
      // The fan-out cluster spreads its branches, so give it the whole width.
      return { step, gridStyle: { gridColumn: "1 / -1" } };
    }
    return { step, gridStyle: {} };
  });
}

// The depth-of-field wrapper: one per grid slot. The tile inside keeps its
// mount/dim/layout animations — they own the tile element's animate channel —
// while this wrapper carries the scroll-linked focus grade on its own
// composited channels, so the two never fight. Scale, blur, and opacity all
// leave the layout box untouched, which is what keeps the measured wire
// geometry valid at any focus. The root stays a motion <li> so AnimatePresence
// popLayout can still measure and pop it on exit. Hooks run unconditionally
// (rules of hooks); inactive mode just doesn't attach their output.
function DepthTile({
  dof,
  id,
  gridStyle,
  children,
}: {
  dof: DepthField;
  id: string;
  gridStyle?: CSSProperties;
  children: ReactNode;
}) {
  const focus = useTransform(
    [dof.scrollY, dof.geomTick],
    ([y]: number[]) => focusAt(dof.geom.current, id, y),
  );
  const scale = useTransform(focus, [0, 1], [DOF_SCALE_MIN, DOF_SCALE_MAX]);
  const blur = useTransform(focus, [0, 1], [DOF_BLUR_MAX, 0]);
  // At the plane the filter must be literally ABSENT, not blur(0px): any
  // filter value makes this wrapper a backdrop root, so the terminal tile's
  // backdrop blur would sample this (empty) subtree instead of the page
  // behind the diagram. Same reason willChange pins only transform.
  const filter = useTransform(blur, (b) =>
    b < 0.05 ? "none" : `blur(${b}px)`,
  );
  const opacity = useTransform(focus, [0, 1], [DOF_OPACITY_MIN, 1]);
  // The recession also feeds CSS as --illum: the tile's material reads it to
  // fall into shadow as it leaves the focal plane.
  const illum = useTransform(focus, (f) => Math.round(f * 1000) / 1000);
  return (
    <m.li
      className="flow-grid-item relative z-10 w-full list-none"
      style={
        dof.active
          ? ({
              ...gridStyle,
              scale,
              filter,
              opacity,
              "--illum": illum,
              transformOrigin: "50% 50%",
              willChange: "transform",
            } as MotionStyle)
          : ({ ...gridStyle, "--illum": 1 } as MotionStyle)
      }
    >
      {children}
    </m.li>
  );
}

// One wire, graded by its endpoints: its opacity keys to the AVERAGE focus of
// the two tiles it connects, so a wire into the receded distance dims with
// them. The fade is also what hides the scale detachment — a receding tile
// shrinks a few px off its measured wire ends, and by the time that gap could
// read, the wire is too faint to betray it. Opacity only, no blur: a 1px
// stroke reads as distant through opacity alone, and a per-wire filter would
// cost real paint time. The grade lives on its own outer group because the
// inner group's mount/exit variants already own that element's opacity and
// filter.
function WireSegment({
  dof,
  seg,
  index,
  reduceMotion,
}: {
  dof: DepthField;
  seg: Segment;
  index: number;
  reduceMotion: boolean;
}) {
  const wireFocus = useTransform(
    [dof.scrollY, dof.geomTick],
    ([y]: number[]) => {
      const g = dof.geom.current;
      return (focusAt(g, seg.from, y) + focusAt(g, seg.to, y)) / 2;
    },
  );
  const dofOpacity = useTransform(
    wireFocus,
    [0, 1],
    [DOF_WIRE_OPACITY_MIN, 1],
  );
  const isReturn = seg.kind === "return";
  const stroke = isReturn ? RETURN_STROKE : "currentColor";
  const width = isReturn ? 1.1 : 1.25;
  return (
    <m.g style={dof.active ? { opacity: dofOpacity } : undefined}>
      <m.g {...connectorGroupProps(reduceMotion, index * 0.05)}>
        {/* The port: a small socket where the wire leaves its tile. */}
        <m.circle
          cx={seg.tail.x}
          cy={seg.tail.y}
          r={2.4}
          fill="var(--background)"
          stroke={stroke}
          strokeWidth={1.25}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { delay: index * 0.05, duration: 0.2 }
          }
        />
        {/* A return wire carries a static dash pattern, so it fades in whole:
            Framer's pathLength trick drives stroke-dasharray itself and the
            two would fight. */}
        <m.path
          d={seg.d}
          fill="none"
          stroke={stroke}
          strokeWidth={width}
          strokeDasharray={isReturn ? "4 5" : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={
            reduceMotion
              ? false
              : isReturn
                ? { opacity: 0 }
                : { pathLength: 0, opacity: 0 }
          }
          animate={isReturn ? { opacity: 1 } : { pathLength: 1, opacity: 1 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { delay: index * 0.05, duration: 0.45, ease: "easeOut" }
          }
        />
        <m.path
          d={chevron(seg.head)}
          fill="none"
          stroke={stroke}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { delay: index * 0.05 + 0.32, duration: 0.2 }
          }
        />
      </m.g>
    </m.g>
  );
}

function FlowDiagram({
  flow,
  reduceMotion,
  focus,
  selectedElementStepId,
  focusTick,
  variant,
  depth = false,
  dialPulse,
  onSelectElement,
}: {
  flow: ExampleFlow;
  reduceMotion: boolean;
  focus: ResolvedFocus | null;
  selectedElementStepId: string | null;
  focusTick: number;
  variant: TourVariant;
  // Depth mode (the focus variant): the diagram runs at full height in the
  // page flow and reads through a scroll-linked depth of field — the plane at
  // FOCAL_LINE is sharp, everything else recedes. Selection scrolls the PAGE
  // to bring the anchor step to that plane.
  depth?: boolean;
  // The steps the last dial move re-tiered, and a tick that keys the
  // one-shot badge flash.
  dialPulse: { ids: Set<string>; tick: number };
  onSelectElement: (stepId: string, element: FeatureElement) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Map<string, HTMLElement> | null>(null);
  const refCallbacks = useRef<Map<string, (el: HTMLElement | null) => void> | null>(null);
  const lastSig = useRef("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // The focus prop is rebuilt every render (a fresh object), so the focus-scroll
  // effect reads it through a ref to avoid stale closures. Synced in a layout
  // effect (not during render) so the ref is current before any effect reads it.
  const focusRef = useRef<ResolvedFocus | null>(focus);
  useIsomorphicLayoutEffect(() => {
    focusRef.current = focus;
  });
  if (nodeRefs.current === null) nodeRefs.current = new Map();
  if (refCallbacks.current === null) refCallbacks.current = new Map();
  const nodeRefMap = nodeRefs.current;
  const refCallbackMap = refCallbacks.current;

  // The scroll-linked depth of field. Page scroll and re-measures both feed
  // the per-tile focus transforms; the geometry itself lives in a ref, so a
  // re-measure never re-renders React — the MotionValues restyle the tiles on
  // the animation thread.
  const { scrollY } = useScroll();
  const geomTick = useMotionValue(0);
  const dofGeom = useRef<{ canvasTop: number; centers: Map<string, number> }>({
    canvasTop: 0,
    centers: new Map(),
  });
  const dofActive = depth && !reduceMotion;
  const dof: DepthField = useMemo(
    () => ({ active: dofActive, scrollY, geomTick, geom: dofGeom }),
    [dofActive, scrollY, geomTick],
  );
  const spring = reduceMotion
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 420, damping: 36, mass: 0.9 } as const);

  const motionProps = tileMotionProps(reduceMotion, spring);
  // The terminal prompt node leads; the real steps follow. One sequence feeds
  // placement, the connector measurement, and the aria order.
  const sequence = flowRows(flow);
  const placed = placeRows(sequence, depth);

  const registerNode = useCallback(
    (id: string) => {
      let cb = refCallbackMap.get(id);
      if (!cb) {
        cb = (el: HTMLElement | null) => {
          if (el) nodeRefMap.set(id, el);
          else nodeRefMap.delete(id);
        };
        refCallbackMap.set(id, cb);
      }
      return cb;
    },
    [nodeRefMap, refCallbackMap],
  );

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const origin = container.getBoundingClientRect();
    const seq = flowRows(flow).flat();
    const next: Segment[] = [];
    for (let i = 0; i < seq.length - 1; i += 1) {
      const elA = nodeRefMap.get(seq[i].id);
      const elB = nodeRefMap.get(seq[i + 1].id);
      if (!elA || !elB) continue;
      const seg = connectorSegment(toAnchor(elA, origin), toAnchor(elB, origin));
      next.push({
        id: `${flow.key}:${seq[i].id}->${seq[i + 1].id}`,
        from: seq[i].id,
        to: seq[i + 1].id,
        ...seg,
      });
    }
    // The loop's back edge. Sequential wires say "then"; this one says
    // "again", so it reads from the same measured boxes but routes and
    // dresses differently.
    for (const step of seq) {
      if (step.shape !== "loop" || !step.loopTo) continue;
      const elFrom = nodeRefMap.get(step.id);
      const elTo = nodeRefMap.get(step.loopTo);
      if (!elFrom || !elTo) continue;
      const seg = returnSegment(
        toAnchor(elFrom, origin),
        toAnchor(elTo, origin),
        origin.width,
      );
      if (seg) {
        next.push({
          id: `${flow.key}:${step.id}~>${step.loopTo}`,
          from: step.id,
          to: step.loopTo,
          ...seg,
        });
      }
    }
    // Refresh the depth geometry BEFORE the signature early-return below: the
    // wire shapes can be identical while the canvas's page position moved
    // (fonts settling above push the whole section down), and the focus
    // transforms must not keep grading against the stale position. The bump
    // nudges the scroll-linked transforms to recompute without a scroll.
    dofGeom.current.canvasTop = origin.top + window.scrollY;
    const centers = dofGeom.current.centers;
    centers.clear();
    for (const step of seq) {
      const el = nodeRefMap.get(step.id);
      if (el) centers.set(step.id, toAnchor(el, origin).cy);
    }
    geomTick.set(geomTick.get() + 1);
    const sig = `${flow.key}|${origin.width}x${origin.height}|${next.map((s) => s.d).join("|")}`;
    if (sig === lastSig.current) return;
    lastSig.current = sig;
    setSegments(next);
    setSize((prev) =>
      prev.w === origin.width && prev.h === origin.height
        ? prev
        : { w: origin.width, h: origin.height },
    );
  }, [flow, nodeRefMap, geomTick]);

  useIsomorphicLayoutEffect(() => {
    measure();
    if (reduceMotion) {
      const id = requestAnimationFrame(() => measure());
      return () => cancelAnimationFrame(id);
    }
    let raf = 0;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      measure();
      if (t - start < 700) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [measure, reduceMotion]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts?.ready) return;
    let active = true;
    document.fonts.ready.then(() => {
      if (active) measure();
    });
    return () => {
      active = false;
    };
  }, [measure]);

  // The focal line sits at a fraction of the viewport, so a window resize
  // moves it even when the canvas keeps its own size (a pure height change
  // never fires the canvas ResizeObserver). Re-measuring refreshes the depth
  // geometry against the new viewport.
  //
  // The body observer covers the other way geometry goes stale: content ABOVE
  // the canvas settling after mount (hydration, font swap, streamed sections).
  // That shifts the canvas in page space without resizing the window or the
  // canvas, which orphaned the cached canvasTop on phone loads with restored
  // scroll. Any such shift changes the body's height, and the depth transforms
  // are pure paint (scale/filter/opacity), so observing body can't feed back.
  useEffect(() => {
    if (!dofActive || typeof window === "undefined") return;
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    const bodyRo = new ResizeObserver(() => measure());
    bodyRo.observe(document.body);
    return () => {
      window.removeEventListener("resize", onResize);
      bodyRo.disconnect();
    };
  }, [dofActive, measure]);

  // Selecting a feature brings its anchor tile's center to the page's focal
  // line — the same line the depth-of-field layer treats as sharp — so a
  // selection always lands in focus. The page is the scroll container now;
  // there is no inner frame. A deselect never scrolls, and a manual scroll
  // never clears the selection (a page scroll is too global a gesture to
  // read as "dismiss").
  const applyFocusScroll = useCallback(() => {
    const focusNow = focusRef.current;
    if (!focusNow || typeof window === "undefined") return;
    const el = nodeRefMap.get(focusNow.anchorStepId);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const focal = window.innerHeight * FOCAL_LINE;
    const delta = r.top + r.height / 2 - focal;
    // Already at the plane: don't jolt the page over a rounding error.
    if (Math.abs(delta) < 24) return;
    window.scrollBy({ top: delta, behavior: reduceMotion ? "auto" : "smooth" });
  }, [nodeRefMap, reduceMotion]);

  // A new (or changed) selection scrolls it to the plane. Keyed on focusTick,
  // which bumps ONLY on a fresh selection, never on a reflow or resize, so the
  // engine never yanks a manually-scrolled page back.
  useEffect(() => {
    if (!depth || focusTick === 0) return;
    applyFocusScroll();
  }, [focusTick, depth, applyFocusScroll]);

  const orderedLabels = flow.rows.flat().map((s) => s.name).join(", then ");
  const ariaLabel = `${flow.name} flow. It starts from the prompt: "${flow.prompt}". Then it runs in order: ${orderedLabels}. Each step shows the scope it runs with.`;

  const canvas = (
    <div ref={containerRef} className="flow-diagram-canvas relative">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="none"
        fill="none"
        style={{ color: CONNECTOR_STROKE }}
      >
        <AnimatePresence initial={false}>
          {segments.map((seg, i) => (
            <WireSegment
              key={seg.id}
              dof={dof}
              seg={seg}
              index={i}
              reduceMotion={reduceMotion}
            />
          ))}
        </AnimatePresence>
      </svg>

      <ul
        aria-label={ariaLabel}
        data-depth={depth || undefined}
        className="flow-grid relative z-10 p-0"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {placed.map(({ step, gridStyle }) => {
            const targeted = focus ? focus.stepIds.includes(step.id) : false;
            const dimmed = focus ? !targeted : false;
            const element = targeted ? focus!.element : null;
            // aria-pressed on a tile reflects only an element selection of THIS
            // tile, never a feature that happens to target it — so the tab and the
            // tile never both announce as pressed for the same highlight.
            const pressed = step.id === selectedElementStepId;
            // Dim/blur folds into the tile's animate target; nothing here
            // changes a tile's box, so the measured connectors stay valid.
            const tileMotion = dimmed
              ? withDim(motionProps, variant, reduceMotion)
              : motionProps;
            const pulseTick = dialPulse.ids.has(step.id) ? dialPulse.tick : 0;
            return (
              <DepthTile
                key={step.id}
                dof={dof}
                id={step.id}
                gridStyle={gridStyle}
              >
                {step.shape === "prompt" ? (
                  <PromptTile
                    step={step}
                    motionProps={tileMotion}
                    registerNode={registerNode}
                    disableLayout={depth}
                  />
                ) : step.shape === "fanout" ? (
                  <FanoutCluster
                    step={step}
                    reduceMotion={reduceMotion}
                    motionProps={tileMotion}
                    registerNode={registerNode}
                    highlightElement={element}
                    selectEl={(el) => onSelectElement(step.id, el)}
                    selectedElement={pressed ? (focus?.element ?? null) : null}
                    disableLayout={depth}
                    dialPulseTick={pulseTick}
                  />
                ) : (
                  <StepTile
                    step={step}
                    motionProps={tileMotion}
                    registerNode={registerNode}
                    targeted={targeted}
                    highlightElement={element}
                    variant={variant}
                    selectEl={(el) => onSelectElement(step.id, el)}
                    selectedElement={pressed ? (focus?.element ?? null) : null}
                    disableLayout={depth}
                    dialPulseTick={pulseTick}
                  />
                )}
              </DepthTile>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );

  // Every variant renders the diagram inline at its natural height; the page
  // is the only scroll container. Depth mode adds its treatment per tile, not
  // per wrapper, so there is nothing to wrap here.
  return canvas;
}

// ---- Explorer shell ---------------------------------------------------------

function blurbMotion(reduceMotion: boolean): MotionProps {
  if (reduceMotion) {
    return {
      initial: false,
      animate: { opacity: 1 },
      exit: { opacity: 0, transition: { duration: 0 } },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: "easeOut" } },
    transition: { duration: 0.24, ease: "easeOut" },
  };
}

// The feature tabs. Plain aria-pressed toggles, not an ARIA tablist: selecting a
// feature highlights it in the diagram; selecting it again clears. "segmented"
// packs them into one grouped control; "horizontal" wraps them as loose pills;
// "vertical" stacks them as a left-hand nav (the focus layout) that flips back
// to wrapping pills below the lg breakpoint.
function FeatureTabs({
  active,
  onSelect,
  layout,
}: {
  active: string | null;
  onSelect: (key: string) => void;
  layout: "horizontal" | "segmented" | "vertical";
}) {
  const wrap =
    layout === "segmented"
      ? "flow-feature-tabs--segmented"
      : layout === "vertical"
        ? "flow-feature-nav"
        : "flex flex-wrap items-center gap-2";
  const align = layout === "vertical" ? "justify-start text-left" : "items-center";
  const renderTab = (f: Feature) => {
    const selected = f.key === active;
    return (
      <button
        key={f.key}
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(f.key)}
        className={`flow-feature-tab inline-flex min-h-8 ${align} px-3 py-1 text-[12.5px] font-medium transition-colors`}
        style={{
          color: selected ? "var(--foreground)" : "var(--muted-foreground)",
          background: selected
            ? "color-mix(in oklab, var(--flow-color) 22%, var(--muted))"
            : "color-mix(in oklab, var(--muted) 38%, transparent)",
          boxShadow: selected
            ? "inset 0 0 0 1px color-mix(in oklab, var(--flow-color) 45%, transparent)"
            : "none",
        }}
      >
        {f.label}
      </button>
    );
  };
  // The vertical nav clusters the tabs under group headings. The headings are
  // direct flex children (not wrappers) because the same markup renders as a
  // wrapped pill row below lg — there the labels display:none away and the
  // pills flow flat, so the fallback needs no branching here.
  if (layout === "vertical") {
    return (
      <div role="group" aria-label="Circuit features" className={wrap}>
        {FEATURE_GROUPS.map((g) => (
          <Fragment key={g.key}>
            <span className="flow-feature-group-label px-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/60">
              {g.label}
            </span>
            {FEATURES.filter((f) => f.group === g.key).map(renderTab)}
          </Fragment>
        ))}
      </div>
    );
  }
  return (
    <div role="group" aria-label="Circuit features" className={wrap}>
      {FEATURES.map(renderTab)}
    </div>
  );
}

// The power dial. One segmented control (styled like the feature tabs) that
// reallocates every step's model and effort at once. Low / medium / high are the
// three Power settings the engine actually resolves; medium is the flow as
// authored. Right-aligned in the header so it reads as a global control, not a
// per-step one.
function PowerDial({
  dial,
  onChange,
}: {
  dial: Dial;
  onChange: (next: Dial) => void;
}) {
  return (
    <div className="ml-auto flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
        power
      </span>
      <div
        role="group"
        aria-label="Power dial"
        className="flow-feature-tabs--segmented"
      >
        {DIALS.map((d) => {
          const selected = d === dial;
          return (
            <button
              key={d}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(d)}
              className="flow-feature-tab inline-flex min-h-8 items-center px-3 py-1 text-[12px] font-medium capitalize transition-colors"
              style={{
                // The active state speaks the brand signal, not the flow's
                // content color: controls are chrome, and the dial section
                // renders the same control in the same ink. Diagrams keep
                // their flow colors.
                color: selected ? "var(--foreground)" : "var(--muted-foreground)",
                background: selected
                  ? "color-mix(in oklab, var(--signal) 22%, var(--muted))"
                  : "color-mix(in oklab, var(--muted) 38%, transparent)",
                boxShadow: selected
                  ? "inset 0 0 0 1px color-mix(in oklab, var(--signal) 45%, transparent)"
                  : "none",
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// The swapping info region. With nothing selected it shows the one-line summary
// (the diagram's default caption). Select a feature tab OR click a tile and it
// crossfades to that selection's label and blurb. Both kinds arrive already
// resolved to one {label, blurb} shape, so this component never branches on which
// one produced it. A reserved min-height keeps the diagram from jumping as the
// text swaps.
function FeatureInfo({
  focus,
  flow,
  reduceMotion,
}: {
  focus: ResolvedFocus | null;
  flow: ExampleFlow;
  reduceMotion: boolean;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={focus?.label ?? "__default"}
        {...blurbMotion(reduceMotion)}
        className="flex flex-col gap-1.5"
      >
        {focus ? (
          <>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--flow-color)" }}
            >
              {focus.label}
            </span>
            <p className="max-w-2xl text-[14px] leading-relaxed text-foreground/90">
              {focus.blurb}
            </p>
          </>
        ) : (
          // The prompt now lives in the diagram's terminal node, so the resting
          // blurb is just the summary — which reads off that prompt above it.
          <p className="max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            {flow.summary}
          </p>
        )}
      </m.div>
    </AnimatePresence>
  );
}

// The tabs are NAMED FEATURES, not flow types. The three variants differ only in
// how the highlight reads and where the blurb sits — the diagram, the data, and
// the FLIP/connector engine are shared. The hero renders the default
// ("spotlight"); the other two are compared on the /preview/flow-tour route.
export function FlowExplorer({
  variant = "spotlight",
}: {
  variant?: TourVariant;
} = {}) {
  // One selection model for both inputs: a feature tab OR a clicked tile. The ref
  // mirrors it so the toggle handlers and the focusTick bump read the live value
  // without waiting for a re-render. focusTick bumps ONLY when a fresh selection is
  // made — never on clear — so the diagram scrolls to a new selection but a
  // deselect (or a reflow) never yanks a manually-scrolled diagram back.
  const [selection, setSelectionState] = useState<Selection | null>(null);
  const selectionRef = useRef<Selection | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const reduceMotion = !hydrated || prefersReducedMotion === true;

  const flow = FLOWS.find((f) => f.key === TOUR_FLOW_KEY) ?? FLOWS[0];
  // The Power dial. Medium is the flow as authored; low/high derive a whole-flow
  // reallocation from it. The memo keeps a stable identity per (flow, dial) so the
  // diagram only re-measures when the dial actually moves.
  const [dial, setDial] = useState<Dial>("medium");
  const dialedFlow = useMemo(() => flowAtDial(flow, dial), [flow, dial]);
  // The dial's receipt and flash. The pulse diffs the CURRENT dialed flow
  // against the NEXT one — not against the authored baseline — so turning
  // back to medium flashes the steps that just changed, same as leaving it.
  const [dialPulse, setDialPulse] = useState<{
    ids: Set<string>;
    tick: number;
  }>(() => ({ ids: new Set<string>(), tick: 0 }));
  const handleDial = useCallback(
    (next: Dial) => {
      if (next === dial) return;
      const before = dialedFlow.rows.flat();
      const after = flowAtDial(flow, next).rows.flat();
      const ids = new Set<string>();
      after.forEach((step, i) => {
        const prev = before[i];
        if (prev && (prev.model !== step.model || prev.effort !== step.effort)) {
          ids.add(step.id);
        }
      });
      setDialPulse((p) => ({ ids, tick: p.tick + 1 }));
      setDial(next);
    },
    [dial, dialedFlow, flow],
  );
  // One mono line under the dial saying what the setting did. Verbs stay
  // honest: at low a step may drop effort without changing model (research
  // stays haiku), so it "goes cheaper" rather than "drops a tier".
  const dialReceipt = useMemo(() => {
    if (dial === "medium") return "medium · every step runs as authored";
    const authored = flow.rows.flat();
    const dialed = dialedFlow.rows.flat();
    const moved: string[] = [];
    const held = new Set<string>();
    dialed.forEach((step, i) => {
      const base = authored[i];
      if (!base || (base.tier ?? "none") === "none") return;
      if (base.model !== step.model || base.effort !== step.effort) {
        moved.push(step.name.toLowerCase());
      } else if (base.tier === "strategic" && base.model) {
        held.add(base.model);
      }
    });
    const movedPart = moved.length
      ? `${moved.join(", ")} ${dial === "low" ? "go cheaper" : "step up"}`
      : "nothing moves";
    const heldPart = held.size
      ? ` · judgment holds ${[...held].join("/")}`
      : "";
    return `${dial} · ${movedPart}${heldPart}`;
  }, [dial, flow, dialedFlow]);
  // Feature focus and blurbs stay keyed off the authored flow — the dial changes
  // each step's model/effort, never its id — so highlighting still lines up.
  const focus = resolveSelection(selection, flow);
  const selectedElementStepId =
    selection?.kind === "element" ? selection.stepId : null;
  const activeFeatureKey = selection?.kind === "feature" ? selection.key : null;

  const applySelection = useCallback((next: Selection | null) => {
    selectionRef.current = next;
    setSelectionState(next);
    if (next) setFocusTick((t) => t + 1);
  }, []);
  const select = useCallback(
    (key: string) => {
      const prev = selectionRef.current;
      const same = prev?.kind === "feature" && prev.key === key;
      applySelection(same ? null : { kind: "feature", key });
    },
    [applySelection],
  );
  const selectElement = useCallback(
    (stepId: string, element: FeatureElement) => {
      const prev = selectionRef.current;
      const same =
        prev?.kind === "element" &&
        prev.stepId === stepId &&
        prev.element === element;
      applySelection(same ? null : { kind: "element", stepId, element });
    },
    [applySelection],
  );

  const diagram = (
    <LayoutGroup>
      <FlowDiagram
        flow={dialedFlow}
        reduceMotion={reduceMotion}
        focus={focus}
        selectedElementStepId={selectedElementStepId}
        focusTick={focusTick}
        variant={variant}
        depth={variant === "focus"}
        dialPulse={dialPulse}
        onSelectElement={selectElement}
      />
    </LayoutGroup>
  );

  const tabs = (
    <FeatureTabs
      active={activeFeatureKey}
      onSelect={select}
      layout={variant === "focus" ? "vertical" : "horizontal"}
    />
  );

  const info = (
    <FeatureInfo focus={focus} flow={flow} reduceMotion={reduceMotion} />
  );

  // The command token lives on the diagram's terminal node, so the header
  // doesn't repeat it; it carries the caption, the dial, and the dial's
  // receipt line. min-h on the receipt reserves its row so switching settings
  // never shifts the diagram below.
  const header = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[12px] text-muted-foreground">
          an example flow · select a feature to highlight where it lives
        </span>
        <PowerDial dial={dial} onChange={handleDial} />
      </div>
      <p
        aria-live="polite"
        className="flex min-h-[17px] items-center gap-2 font-mono text-[11px] leading-none text-muted-foreground"
      >
        <span aria-hidden="true" className="text-signal">
          ›
        </span>
        {dialReceipt}
      </p>
    </div>
  );

  let body: ReactNode;
  if (variant === "glow") {
    // Tabs on the left, blurb in a bordered card on the right; diagram below.
    body = (
      <>
        {header}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
          <div className="md:flex-1">{tabs}</div>
          <div className="flow-info-card min-h-[5.5rem] md:w-[18rem] md:shrink-0">
            {info}
          </div>
        </div>
        {diagram}
      </>
    );
  } else if (variant === "focus") {
    // Three columns on desktop: the vertical feature nav on the left, the diagram
    // in the center, the explanation on the right (the columns are placed by CSS;
    // the DOM order stays nav, blurb, diagram so the mobile stack reads tabs ->
    // blurb -> diagram). The nav pins near the top; the blurb pins at the focal
    // plane's height, so whatever the page scroll brings into focus sits right
    // beside its explanation. Stacks to a single column below lg.
    body = (
      <>
        {header}
        <div className="flow-focus-shell">
          <div className="flow-focus-nav">{tabs}</div>
          <div className="flow-focus-info">{info}</div>
          <div className="flow-focus-diagram min-w-0">{diagram}</div>
        </div>
      </>
    );
  } else {
    // Spotlight (default): tabs, caption blurb, diagram.
    body = (
      <>
        {header}
        {tabs}
        <div className="min-h-[4.75rem]">{info}</div>
        {diagram}
      </>
    );
  }

  return (
    <LazyMotion features={domMax}>
      <div
        className="flex w-full flex-col gap-6"
        style={{ "--flow-color": flow.color } as CSSProperties}
      >
        {body}
      </div>
    </LazyMotion>
  );
}
