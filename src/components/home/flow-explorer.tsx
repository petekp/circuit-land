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
  useSpring,
  type MotionProps,
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
          model: "opus",
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
      "The model and effort are set per step. The few steps that decide direction run on the top model at high effort; the bulk work runs on a cheaper, faster model.",
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

// Clicking a tile selects the sub-block that carries that step's story: a fan-out
// is about its branches, a checkpoint about its options, a sub-run about its note;
// everything else rings whole and leads with its role.
function defaultElementFor(step: StepSpec): FeatureElement {
  switch (step.shape) {
    case "fanout":
      return "branches";
    case "checkpoint":
      return "options";
    case "subrun":
      return "note";
    default:
      return "whole";
  }
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

const TILE_FILL = "color-mix(in oklab, var(--flow-color) 16%, var(--muted))";
const CONNECTOR_STROKE =
  "color-mix(in oklab, var(--flow-color) 60%, var(--border))";
// The loop's return edge sits under the sequential wires: dimmer and dashed,
// so "again" never outshouts "then".
const RETURN_STROKE =
  "color-mix(in oklab, var(--flow-color) 42%, var(--border))";

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

function connectorSegment(a: Anchor, b: Anchor): Omit<Segment, "id"> {
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
): Omit<Segment, "id"> | null {
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

// The model badge. Brightness carries the tier: strategic is the bright signal
// fill, balanced a soft fill, execution a dim outline, none a ghost outline.
function tierStyle(tier: Tier): { className: string; style: CSSProperties } {
  switch (tier) {
    case "strategic":
      return {
        className: "text-signal",
        style: {
          background: "color-mix(in oklab, var(--signal) 16%, transparent)",
        },
      };
    case "balanced":
      return {
        className: "text-foreground",
        style: {
          background: "color-mix(in oklab, var(--brand-second) 20%, transparent)",
        },
      };
    case "execution":
      return {
        className: "text-muted-foreground",
        style: {
          boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--foreground) 16%, transparent)",
        },
      };
    default:
      // The ghost tier: no model spend at all. A hairline ring one step dimmer
      // than execution's, so "deterministic" and "you decide" hold the same
      // corner object as the model pills instead of floating as bare text.
      return {
        className: "text-muted-foreground",
        style: {
          boxShadow:
            "inset 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent)",
        },
      };
  }
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
}: {
  step: StepSpec;
  hot?: boolean;
  // Bumped when the power dial re-tiers this step. Keys the badge so the
  // one-shot flash replays on every move that touches it.
  pulse?: number;
}) {
  if (!step.model) return null;
  const tier = step.tier ?? "none";
  const { className, style } = tierStyle(tier);
  const pips = EFFORT_PIPS[step.effort ?? "none"];
  const pipColor =
    tier === "strategic"
      ? "var(--signal)"
      : tier === "balanced"
        ? "var(--brand-second)"
        : "var(--muted-foreground)";
  // The fan-out badge counts the real branches, so it stays truthful for any
  // flow added later, not just the one that happens to have five scouts.
  const branchCount = step.branches?.length ?? 0;
  const prefix =
    step.shape === "fanout" && branchCount ? `${branchCount} × ` : "";
  return (
    <span
      key={pulse}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[11px] ${className} ${hot ? "flow-badge-hot" : ""} ${pulse > 0 ? "flow-badge-pulse" : ""}`}
      style={style}
    >
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
    </span>
  );
}

function DetailRow({
  label,
  children,
  state,
}: {
  label: string;
  children: ReactNode;
  state?: "hot" | "cool" | null;
}) {
  const cls =
    state === "hot" ? "flow-row-hot" : state === "cool" ? "flow-row-cool" : "";
  return (
    <div className={`flex items-start gap-2 ${cls}`}>
      <span className="w-11 shrink-0 pt-[2px] text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      {/* min-w-0: without it this wrapper's min-width:auto tracks the widest
          chip, the row overflows the tile, and the chips' own max-w-full cap
          (and truncation) never engages. Same gotcha .flow-grid-item pins. */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
        {children}
      </div>
    </div>
  );
}

// A tile lists at most this many skill chips; the rest fold into a "+N"
// counter (full names in its title). The long skill tokens each eat a full
// chip line, so an uncapped stack is what made one tile twice its neighbors'
// height.
const MAX_SKILL_CHIPS = 2;

// One quiet material for every scope chip: the row label already names the
// kind, so per-kind tints read as noise at ten tiles, and the tier badge
// stays the tile's one color moment. A long token truncates (full text in the
// title attribute) instead of wrapping mid-word into a ragged extra line.
function Chip({ children }: { children: string }) {
  return (
    <span
      title={children}
      className="inline-flex min-w-0 max-w-full items-center rounded-md px-1.5 py-[2px] font-mono text-[11px] leading-tight text-foreground/80"
      style={{
        background: "color-mix(in oklab, var(--foreground) 7%, transparent)",
      }}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

function StepDetail({
  step,
  highlightElement,
}: {
  step: StepSpec;
  highlightElement?: FeatureElement | null;
}) {
  const hasContext = step.context && step.context.length > 0;
  const hasTools = step.tools && step.tools.allow.length > 0;
  const hasSkills = step.skills && step.skills.length > 0;
  // When a context/tools/skills feature is active, ring the matching row and
  // quiet the siblings. The other elements light up elsewhere in the tile.
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
    <div className="flow-scope-well mt-3 flex flex-col gap-1.5">
      {hasContext ? (
        <DetailRow label="ctx" state={rowState("ctx")}>
          {step.context!.map((c) => (
            <Chip key={c}>{c}</Chip>
          ))}
        </DetailRow>
      ) : null}
      {hasTools ? (
        <DetailRow label="tools" state={rowState("tools")}>
          {step.tools!.allow.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
          {step.tools!.blocked ? (
            <span className="ml-0.5 inline-flex items-center gap-1 font-mono text-[11px] text-destructive/85">
              <LockIcon />
              {step.tools!.blocked} blocked
            </span>
          ) : null}
        </DetailRow>
      ) : null}
      {hasSkills ? (
        <DetailRow label="skills" state={rowState("skills")}>
          {step.skills!.slice(0, MAX_SKILL_CHIPS).map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
          {step.skills!.length > MAX_SKILL_CHIPS ? (
            <span
              title={step.skills!.slice(MAX_SKILL_CHIPS).join(", ")}
              className="inline-flex items-center rounded-md px-1.5 py-[2px] font-mono text-[11px] leading-tight text-muted-foreground"
              style={{
                boxShadow:
                  "inset 0 0 0 1px color-mix(in oklab, var(--foreground) 10%, transparent)",
              }}
            >
              +{step.skills!.length - MAX_SKILL_CHIPS}
            </span>
          ) : null}
        </DetailRow>
      ) : null}
      {showNote ? (
        <span className="font-mono text-[11px] text-muted-foreground">
          {step.note}
        </span>
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
  gridStyle,
  registerNode,
  disableLayout = false,
}: {
  step: StepSpec;
  motionProps: MotionProps;
  gridStyle?: CSSProperties;
  registerNode: (id: string) => (el: HTMLElement | null) => void;
  disableLayout?: boolean;
}) {
  const nodeRef = registerNode(step.id);
  return (
    <m.li
      ref={nodeRef}
      {...layoutProps(disableLayout, step.id)}
      {...motionProps}
      className="flow-grid-item flow-prompt-node relative z-10 w-full list-none"
      style={gridStyle}
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
        <span className="flow-prompt-caret" aria-hidden="true">
          ❯
        </span>
        <span className="flow-prompt-text">{step.role}</span>
        <span className="flow-prompt-cursor" aria-hidden="true" />
      </div>
    </m.li>
  );
}

function StepTile({
  step,
  motionProps,
  gridStyle,
  registerNode,
  targeted,
  highlightElement,
  variant,
  onSelect,
  selected = false,
  disableLayout = false,
  dialPulseTick = 0,
  ref,
}: {
  step: StepSpec;
  motionProps: MotionProps;
  gridStyle?: CSSProperties;
  registerNode: (id: string) => (el: HTMLElement | null) => void;
  targeted?: boolean;
  highlightElement?: FeatureElement | null;
  variant: TourVariant;
  onSelect?: () => void;
  selected?: boolean;
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
  const tileStyle: CSSProperties = isCheckpoint
    ? {
        background: "color-mix(in oklab, var(--flow-color) 10%, var(--muted))",
        boxShadow:
          "inset 0 0 0 1px color-mix(in oklab, var(--flow-color) 45%, transparent)",
      }
    : isLoop
      ? {
          background: "color-mix(in oklab, var(--muted) 50%, transparent)",
          boxShadow:
            "inset 0 0 0 1px color-mix(in oklab, var(--flow-color) 32%, transparent)",
        }
      : { backgroundColor: TILE_FILL };
  return (
    <m.li
      ref={composedRef}
      {...layoutProps(disableLayout, step.id)}
      {...motionProps}
      className="flow-grid-item flow-step-tile relative z-10 flex w-full list-none flex-col p-4 text-left text-foreground"
      style={{ ...gridStyle, ...tileStyle }}
    >
      {onSelect ? (
        // A full-bleed hit target so the whole tile is clickable and keyboard
        // operable. It sits above the content and the highlight ring (the ring is
        // pointer-events:none and shows through this transparent button). It is
        // position:absolute, so it never enters the measured box the connectors
        // route from.
        <button
          type="button"
          aria-pressed={selected}
          aria-label={`${step.name}: ${step.role}`}
          onClick={onSelect}
          className="flow-tile-hit"
        />
      ) : null}
      {targeted && highlightElement === "whole" ? (
        <span
          aria-hidden="true"
          className={`flow-tile-ring flow-tile-ring--${variant}`}
        />
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[14px] font-medium leading-tight tracking-tight">
          {isCheckpoint ? <PauseIcon /> : null}
          {isLoop ? <LoopIcon /> : null}
          {step.shape === "subrun" ? <SubrunIcon /> : null}
          {step.kind === "verification" ? <GateIcon /> : null}
          {step.kind === "compose" ? <ComposeIcon /> : null}
          {step.name}
        </span>
        <ModelBadge
          step={step}
          hot={highlightElement === "model"}
          pulse={dialPulseTick}
        />
      </div>
      <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
        {step.role}
      </p>

      {step.shape === "subrun" && step.note ? (
        <span
          className={`mt-2 inline-flex w-fit items-center rounded-md px-1.5 py-[2px] font-mono text-[11px] text-signal ${highlightElement === "note" ? "flow-note-hot" : ""}`}
          style={{
            background: "color-mix(in oklab, var(--signal) 13%, transparent)",
          }}
        >
          {step.note}
        </span>
      ) : null}

      {isCheckpoint && step.options ? (
        <div
          className={`flow-scope-well mt-3 flex flex-col gap-1.5 ${highlightElement === "options" ? "flow-options-hot" : ""}`}
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
        </div>
      ) : null}

      {isLoop && step.note ? (
        <span className="mt-2 font-mono text-[11px] text-muted-foreground">
          {step.note}
        </span>
      ) : null}

      <StepDetail step={step} highlightElement={highlightElement} />
    </m.li>
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
  gridStyle,
  registerNode,
  highlightElement,
  onSelect,
  selected = false,
  disableLayout = false,
  dialPulseTick = 0,
  ref,
}: {
  step: StepSpec;
  reduceMotion: boolean;
  motionProps: MotionProps;
  gridStyle?: CSSProperties;
  registerNode: (id: string) => (el: HTMLElement | null) => void;
  highlightElement?: FeatureElement | null;
  onSelect?: () => void;
  selected?: boolean;
  disableLayout?: boolean;
  dialPulseTick?: number;
  ref?: Ref<HTMLElement>;
}) {
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
    <m.li
      ref={setOuterRef}
      {...layoutProps(disableLayout, step.id)}
      {...motionProps}
      className="flow-grid-item relative z-10 flex w-full list-none justify-center"
      style={gridStyle}
    >
      <div
        ref={setCardRef}
        className="flow-fanout-cluster relative w-fit max-w-[34rem] px-4 pb-4 pt-3.5 text-foreground"
      >
        {onSelect ? (
          <button
            type="button"
            aria-pressed={selected}
            aria-label={`${step.name}: ${step.role}`}
            onClick={onSelect}
            className="flow-tile-hit"
          />
        ) : null}
        <div className="relative z-20 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[14px] font-medium leading-tight tracking-tight">
            <BranchIcon />
            {step.name}
          </span>
          <ModelBadge
            step={step}
            hot={highlightElement === "model"}
            pulse={dialPulseTick}
          />
        </div>
        <p className="relative z-20 mt-1 max-w-[15rem] text-[12px] leading-snug text-muted-foreground">
          {step.role}
        </p>
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
        <div
          className={`relative z-10 mt-3 flex flex-wrap justify-center gap-1.5 ${highlightElement === "branches" ? "flow-branches-hot" : ""}`}
        >
          {branches.map((label, i) => (
            <div
              key={label}
              ref={(el) => {
                branchRefs.current[i] = el;
              }}
              className="flow-fanout-branch px-2.5 py-1.5 font-mono text-[11px] font-medium leading-tight text-foreground/80"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </m.li>
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

function placeRows(rows: StepRow[]): PlacedStep[] {
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

function FlowDiagram({
  flow,
  reduceMotion,
  focus,
  selectedElementStepId,
  focusTick,
  variant,
  windowed = false,
  dialPulse,
  onSelectElement,
  onClear,
  onFocalAlign,
}: {
  flow: ExampleFlow;
  reduceMotion: boolean;
  focus: ResolvedFocus | null;
  selectedElementStepId: string | null;
  focusTick: number;
  variant: TourVariant;
  windowed?: boolean;
  // The steps the last dial move re-tiered, and a tick that keys the
  // one-shot badge flash.
  dialPulse: { ids: Set<string>; tick: number };
  onSelectElement: (stepId: string, element: FeatureElement) => void;
  onClear: () => void;
  onFocalAlign: (
    info: { focalTop: number; frameTop: number; frameBottom: number } | null,
  ) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Map<string, HTMLElement> | null>(null);
  const refCallbacks = useRef<Map<string, (el: HTMLElement | null) => void> | null>(null);
  const lastSig = useRef("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // Windowed mode (the focus variant): the diagram sits in a fixed-height frame
  // (frameRef, .flow-window) that holds the edge fades and does not scroll; inside
  // it a native scroll container (windowRef, .flow-window-scroll) holds the canvas.
  // A focus scrolls the container with scrollTo; a manual scroll deselects. The
  // connector measurement is unaffected because the canvas (containerRef, the
  // measurement origin) scrolls as one unit, so every tile's box minus the origin
  // box is invariant to scrollTop — the same property the old translate relied on.
  const frameRef = useRef<HTMLDivElement | null>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);
  // The focus prop is rebuilt every render (a fresh object), so the scroll handler
  // and the focus-scroll effect read it through a ref to avoid stale closures and
  // to avoid re-subscribing the listener on every render. Synced in a layout effect
  // (not during render) so the refs are current before any effect or scroll event
  // reads them — layout effects run before passive effects and before paint.
  const focusRef = useRef<ResolvedFocus | null>(focus);
  const onClearRef = useRef(onClear);
  const onFocalAlignRef = useRef(onFocalAlign);
  useIsomorphicLayoutEffect(() => {
    focusRef.current = focus;
    onClearRef.current = onClear;
    onFocalAlignRef.current = onFocalAlign;
  });
  // Deselect-on-scroll disambiguation. programmaticUntil is a self-expiring
  // timestamp set just before every engine scrollTo; while now() is below it, the
  // scroll handler treats scroll events as the engine's own (and its smooth tail)
  // and never deselects. lastTarget is the scrollTop we asked for, used to ignore
  // synthetic no-movement scroll events. scrollRaf coalesces scroll work to one
  // pass per frame.
  const programmaticUntil = useRef(0);
  const lastTarget = useRef(0);
  const scrollRaf = useRef(0);
  if (nodeRefs.current === null) nodeRefs.current = new Map();
  if (refCallbacks.current === null) refCallbacks.current = new Map();
  const nodeRefMap = nodeRefs.current;
  const refCallbackMap = refCallbacks.current;

  const spring = reduceMotion
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 420, damping: 36, mass: 0.9 } as const);

  const motionProps = tileMotionProps(reduceMotion, spring);
  // The terminal prompt node leads; the real steps follow. One sequence feeds
  // placement, the connector measurement, and the aria order.
  const sequence = flowRows(flow);
  const placed = placeRows(sequence);

  const showWindow = windowed && !reduceMotion;

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
      next.push({ id: `${flow.key}:${seq[i].id}->${seq[i + 1].id}`, ...seg });
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
        next.push({ id: `${flow.key}:${step.id}~>${step.loopTo}`, ...seg });
      }
    }
    const sig = `${flow.key}|${origin.width}x${origin.height}|${next.map((s) => s.d).join("|")}`;
    if (sig === lastSig.current) return;
    lastSig.current = sig;
    setSegments(next);
    setSize((prev) =>
      prev.w === origin.width && prev.h === origin.height
        ? prev
        : { w: origin.width, h: origin.height },
    );
  }, [flow, nodeRefMap]);

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

  // The scrollTop that brings the focused steps into the frame. We measure the
  // targeted tiles' union box relative to the canvas top (scroll-invariant, since
  // both the tile and the canvas-origin move together under scroll), then center
  // that box in the frame if it fits, else pin its top just inside the frame so a
  // long span reads from its first step down. Clamped to the scroll range.
  const computeScrollTarget = useCallback(
    (stepIds: string[]): number | null => {
      const win = windowRef.current;
      const canvas = containerRef.current;
      if (!win || !canvas) return null;
      const winH = win.clientHeight;
      const max = Math.max(0, win.scrollHeight - winH);
      if (max === 0) return 0;
      const canvasRect = canvas.getBoundingClientRect();
      let top = Number.POSITIVE_INFINITY;
      let bottom = Number.NEGATIVE_INFINITY;
      for (const id of stepIds) {
        const el = nodeRefMap.get(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        top = Math.min(top, r.top - canvasRect.top);
        bottom = Math.max(bottom, r.bottom - canvasRect.top);
      }
      if (!Number.isFinite(top)) return 0;
      const unionH = bottom - top;
      const desired =
        unionH <= winH ? (top + bottom) / 2 - winH / 2 : top - winH * 0.1;
      return Math.min(Math.max(0, desired), max);
    },
    [nodeRefMap],
  );

  // Toggle the edge fades from the live scroll position (imperative, via dataset,
  // so a scroll never forces a React re-render). The fades live on the frame
  // wrapper, which does not scroll, so they stay pinned to the frame edges.
  const updateClip = useCallback(() => {
    const win = windowRef.current;
    const frame = frameRef.current;
    if (!win || !frame) return;
    const top = win.scrollTop;
    const maxScroll = win.scrollHeight - win.clientHeight;
    if (top > 1) frame.dataset.clipTop = "";
    else delete frame.dataset.clipTop;
    if (top < maxScroll - 1) frame.dataset.clipBottom = "";
    else delete frame.dataset.clipBottom;
  }, []);

  // Report the focal tile's viewport position (and the frame's band) so the blurb
  // can align to it on desktop. null when nothing is focused, so the blurb rests.
  const reportFocalAlign = useCallback(() => {
    const win = windowRef.current;
    const focusNow = focusRef.current;
    if (!win || !focusNow) {
      onFocalAlignRef.current(null);
      return;
    }
    const el = nodeRefMap.get(focusNow.anchorStepId);
    if (!el) {
      onFocalAlignRef.current(null);
      return;
    }
    const frameRect = win.getBoundingClientRect();
    onFocalAlignRef.current({
      focalTop: el.getBoundingClientRect().top,
      frameTop: frameRect.top,
      frameBottom: frameRect.bottom,
    });
  }, [nodeRefMap]);

  // Scroll the frame so the focus reads. Stamp the programmatic latch first so the
  // scroll handler swallows this scroll (and its smooth tail) instead of reading it
  // as a manual scroll and deselecting.
  const applyFocusScroll = useCallback(() => {
    const win = windowRef.current;
    const focusNow = focusRef.current;
    if (!win || !focusNow) return;
    // When the frame has no scroll range (the stacked layout opens it to full
    // height; a short diagram can also fit whole), the page is the scroll
    // container instead. Bring the focal tile to the viewport there — but only
    // when it actually sits outside it, so selecting a visible tile never
    // jolts the page. Page scrolls don't fire the frame's scroll handler, so
    // this path needs no programmatic-scroll latch.
    if (win.scrollHeight - win.clientHeight <= 1) {
      const el = nodeRefMap.get(focusNow.anchorStepId);
      if (!el || typeof window === "undefined") return;
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) {
        el.scrollIntoView({
          block: "center",
          behavior: reduceMotion ? "auto" : "smooth",
        });
      }
      return;
    }
    const target = computeScrollTarget(focusNow.stepIds);
    if (target == null) return;
    lastTarget.current = target;
    programmaticUntil.current =
      performance.now() + (reduceMotion ? 60 : 700);
    win.scrollTo({ top: target, behavior: reduceMotion ? "auto" : "smooth" });
  }, [computeScrollTarget, nodeRefMap, reduceMotion]);

  // A new (or changed) selection scrolls it into the frame. Keyed on focusTick,
  // which bumps ONLY on a fresh selection, never on a reflow or resize, so the
  // engine never yanks a manually-scrolled, deselected diagram back to the top.
  useEffect(() => {
    if (!showWindow || focusTick === 0) return;
    applyFocusScroll();
    reportFocalAlign();
  }, [focusTick, showWindow, applyFocusScroll, reportFocalAlign]);

  // One rAF-throttled scroll handler: refresh the edge fades, keep the blurb
  // aligned, and decide whether a manual scroll should deselect. Deselect only
  // fires for a genuine user scroll (past the programmatic latch, with real
  // movement, and not a focus-into-view auto-scroll while a tile button has focus).
  const handleScroll = useCallback(() => {
    if (scrollRaf.current) return;
    scrollRaf.current = requestAnimationFrame(() => {
      scrollRaf.current = 0;
      const win = windowRef.current;
      if (!win) return;
      updateClip();
      reportFocalAlign();
      if (performance.now() < programmaticUntil.current) return;
      if (!focusRef.current) return;
      if (Math.abs(win.scrollTop - lastTarget.current) <= 4) return;
      const active = typeof document !== "undefined" ? document.activeElement : null;
      if (active && active !== win && win.contains(active)) return;
      onClearRef.current();
    });
  }, [updateClip, reportFocalAlign]);

  // An interrupting wheel/touch during an in-flight programmatic scroll is
  // unambiguously the user; drop the latch so the next scroll tick deselects
  // immediately instead of waiting it out.
  const handleUserIntent = useCallback(() => {
    if (performance.now() < programmaticUntil.current) {
      programmaticUntil.current = 0;
    }
  }, []);

  // Keep the fades and blurb-align correct when the diagram reflows or the frame
  // resizes (container-query column change, fonts settling, viewport resize). This
  // path NEVER scrolls — only a fresh selection (focusTick) scrolls — so a
  // post-deselect reflow can't teleport the user.
  useIsomorphicLayoutEffect(() => {
    if (!showWindow) return;
    updateClip();
    reportFocalAlign();
  }, [showWindow, size, updateClip, reportFocalAlign]);

  useEffect(() => {
    if (!showWindow || typeof ResizeObserver === "undefined") return;
    const win = windowRef.current;
    if (!win) return;
    const ro = new ResizeObserver(() => {
      updateClip();
      reportFocalAlign();
    });
    ro.observe(win);
    return () => ro.disconnect();
  }, [showWindow, updateClip, reportFocalAlign]);

  // A page (window) resize moves the focal tile in viewport space even when the
  // frame itself hasn't reflowed, so the blurb-align must re-read.
  useEffect(() => {
    if (!showWindow || typeof window === "undefined") return;
    const onResize = () => reportFocalAlign();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [showWindow, reportFocalAlign]);

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
          {segments.map((seg, i) => {
            const isReturn = seg.kind === "return";
            const stroke = isReturn ? RETURN_STROKE : "currentColor";
            const width = isReturn ? 1.1 : 1.25;
            return (
              <m.g key={seg.id} {...connectorGroupProps(reduceMotion, i * 0.05)}>
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
                      : { delay: i * 0.05, duration: 0.2 }
                  }
                />
                {/* A return wire carries a static dash pattern, so it fades
                    in whole: Framer's pathLength trick drives
                    stroke-dasharray itself and the two would fight. */}
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
                  animate={
                    isReturn
                      ? { opacity: 1 }
                      : { pathLength: 1, opacity: 1 }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { delay: i * 0.05, duration: 0.45, ease: "easeOut" }
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
                      : { delay: i * 0.05 + 0.32, duration: 0.2 }
                  }
                />
              </m.g>
            );
          })}
        </AnimatePresence>
      </svg>

      <ul aria-label={ariaLabel} className="flow-grid relative z-10 p-0">
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
            return step.shape === "prompt" ? (
              <PromptTile
                key={step.id}
                step={step}
                motionProps={tileMotion}
                gridStyle={gridStyle}
                registerNode={registerNode}
                disableLayout={showWindow}
              />
            ) : step.shape === "fanout" ? (
              <FanoutCluster
                key={step.id}
                step={step}
                reduceMotion={reduceMotion}
                motionProps={tileMotion}
                gridStyle={gridStyle}
                registerNode={registerNode}
                highlightElement={element}
                onSelect={() => onSelectElement(step.id, defaultElementFor(step))}
                selected={pressed}
                disableLayout={showWindow}
                dialPulseTick={pulseTick}
              />
            ) : (
              <StepTile
                key={step.id}
                step={step}
                motionProps={tileMotion}
                gridStyle={gridStyle}
                registerNode={registerNode}
                targeted={targeted}
                highlightElement={element}
                variant={variant}
                onSelect={() => onSelectElement(step.id, defaultElementFor(step))}
                selected={pressed}
                disableLayout={showWindow}
                dialPulseTick={pulseTick}
              />
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );

  // Spotlight and glow (and reduced-motion focus) render the diagram inline,
  // exactly as before. Only the focus variant under motion gets the scroll frame.
  if (!showWindow) return canvas;

  // The frame wrapper holds the edge fades and does NOT scroll; the inner element
  // is the native scroll container (windowRef). Keeping the fades on the
  // non-scrolling wrapper is what pins them to the frame edges instead of letting
  // them scroll away with the content. data-clip-* are written imperatively on the
  // wrapper by the scroll handler.
  return (
    <div ref={frameRef} className="flow-window">
      <div
        ref={windowRef}
        className="flow-window-scroll"
        onScroll={handleScroll}
        onWheel={handleUserIntent}
        onTouchMove={handleUserIntent}
      >
        {canvas}
      </div>
    </div>
  );
}

// ---- Legend -----------------------------------------------------------------

// The legend reads the tiers by what they MEAN, not by a pinned model name, so
// it stays true for any flow added later (a flow that routes a tier to a
// different model isn't contradicted). The specific models live in the tiles as
// illustrative examples; the brightness here teaches the encoding.
function Legend() {
  const items: { label: string; meaning: string; swatch: CSSProperties }[] = [
    {
      label: "strategic",
      meaning: "top model, high effort",
      swatch: {
        background: "color-mix(in oklab, var(--signal) 16%, transparent)",
        boxShadow: "inset 0 0 0 1px var(--signal)",
      },
    },
    {
      label: "balanced",
      meaning: "mid model",
      swatch: {
        background: "color-mix(in oklab, var(--brand-second) 20%, transparent)",
      },
    },
    {
      label: "execution",
      meaning: "fast model, in parallel",
      swatch: {
        boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--foreground) 22%, transparent)",
      },
    },
    {
      label: "deterministic",
      meaning: "no model",
      swatch: { background: "transparent" },
    },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <span className="text-[11px] text-muted-foreground">Model routing</span>
      {items.map((it) => (
        <span
          key={it.label}
          className="inline-flex items-center gap-2 text-[11px] text-muted-foreground"
        >
          <span
            className="h-3 w-5 rounded-full"
            style={it.swatch}
            aria-hidden="true"
          />
          {it.label} · {it.meaning}
        </span>
      ))}
    </div>
  );
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
      const same = prev?.kind === "element" && prev.stepId === stepId;
      applySelection(same ? null : { kind: "element", stepId, element });
    },
    [applySelection],
  );
  const clearSelection = useCallback(
    () => applySelection(null),
    [applySelection],
  );

  // Desktop blurb-align: the blurb translates its Y to sit beside the focused
  // diagram element. We drive a raw motion value from the focal geometry and let a
  // spring smooth it so the text glides as the diagram scrolls into place. Only on
  // lg+ and only under motion; otherwise it stays at 0 (the sticky resting spot).
  const blurbYRaw = useMotionValue(0);
  const blurbY = useSpring(blurbYRaw, {
    stiffness: 260,
    damping: 30,
    mass: 0.7,
  });
  const blurbRef = useRef<HTMLDivElement | null>(null);
  const isLgRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 64rem)");
    const update = () => {
      isLgRef.current = mq.matches;
      if (!mq.matches) blurbYRaw.set(0);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [blurbYRaw]);

  // When nothing is selected the blurb rests at its natural sticky position. This
  // covers every deselect path (toggle off, scroll-to-clear) in one place.
  useEffect(() => {
    if (!selection) blurbYRaw.set(0);
  }, [selection, blurbYRaw]);

  const handleFocalAlign = useCallback(
    (info: { focalTop: number; frameTop: number; frameBottom: number } | null) => {
      if (reduceMotion || !isLgRef.current) {
        blurbYRaw.set(0);
        return;
      }
      const el = blurbRef.current;
      if (!el || !info) {
        blurbYRaw.set(0);
        return;
      }
      const rect = el.getBoundingClientRect();
      // The rect includes the spring's CURRENT rendered transform (blurbY), not the
      // raw target (blurbYRaw) — those differ mid-animation. Subtract the rendered
      // value to recover the blurb's natural (untranslated) top; using the raw
      // target here would compound an error every frame the spring is catching up.
      const naturalTop = rect.top - blurbY.get();
      // Align the blurb top to the focal element, but keep it within the frame band
      // so it never drifts above or below the diagram it describes.
      const maxTop = Math.max(info.frameTop, info.frameBottom - rect.height);
      const desiredTop = Math.min(Math.max(info.focalTop, info.frameTop), maxTop);
      blurbYRaw.set(desiredTop - naturalTop);
    },
    [reduceMotion, blurbYRaw, blurbY],
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
        windowed={variant === "focus"}
        dialPulse={dialPulse}
        onSelectElement={selectElement}
        onClear={clearSelection}
        onFocalAlign={handleFocalAlign}
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

  const legend = (
    <div className="flex flex-col gap-2 border-t border-border/40 pt-4">
      <Legend />
      <p className="max-w-3xl text-[11px] leading-relaxed text-muted-foreground">
        An illustrative composition, drawn to show every control shape in one
        picture; the built-in flows each use a subset. Each step is a
        micro-harness with its own model, effort, tools, and skills. Power is
        one dial over all of them: turn it down and the bulk work goes cheap,
        while the steps that decide direction hold their model.
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
    // blurb -> diagram). The nav and explanation pin (sticky) so switching a
    // feature and seeing what changed never costs a scroll up and back down.
    // Stacks to a single column below lg.
    body = (
      <>
        {header}
        <div className="flow-focus-shell">
          <div className="flow-focus-nav">{tabs}</div>
          <div className="flow-focus-info">
            {/* The inner layer carries the blurb-align translate so the sticky
                column box stays put while the text glides to meet the focal step.
                y rests at 0 (and is forced to 0 below lg / under reduced motion). */}
            <m.div ref={blurbRef} style={{ y: blurbY }}>
              {info}
            </m.div>
          </div>
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
        {legend}
      </div>
    </LazyMotion>
  );
}
