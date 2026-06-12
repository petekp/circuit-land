"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type Ref,
} from "react";
import {
  AnimatePresence,
  LazyMotion,
  LayoutGroup,
  domMax,
  m,
  useReducedMotion,
  type MotionProps,
} from "motion/react";
import { FlowGlyph, type MotifCell } from "@/components/flow-glyph";

type BlockId =
  | "frame"
  | "gather-context"
  | "diagnose"
  | "human-decision"
  | "plan"
  | "pursue"
  | "coordinate-pursuits"
  | "batch"
  | "act"
  | "run-verification"
  | "review"
  | "close-with-evidence";

const BLOCK_LABEL: Record<BlockId, string> = {
  frame: "Frame",
  "gather-context": "Gather Context",
  diagnose: "Diagnose",
  "human-decision": "Human Decision",
  plan: "Plan",
  pursue: "Pursue",
  "coordinate-pursuits": "Coordinate Pursuits",
  batch: "Batch",
  act: "Act",
  "run-verification": "Run Verification",
  review: "Review",
  "close-with-evidence": "Close With Evidence",
};

type FlowKey = "build" | "fix" | "pursue" | "explore" | "review" | "prototype" | "custom";

type ComposerFlow = {
  key: FlowKey;
  name: string;
  color: string;
  accent: string;
  motif: readonly MotifCell[];
  blocks: BlockId[];
  // One-line statement of what the flow is for, shown when it is selected.
  summary?: string;
  // Forward-looking entry. Has no fixed composition; shown as a planned state.
  planned?: boolean;
};

// Keep these named by flow so identical-looking icons can still be edited
// independently without patching the wrong repeated array.
const FLOW_MOTIFS = {
  build: ["empty", "empty", "filled", "empty", "filled", "filled", "filled", "filled", "filled"],
  fix: ["empty", "filled", "empty", "filled", "filled", "filled", "empty", "filled", "empty"],
  pursue: ["empty", "empty", "filled", "empty", "filled", "empty", "filled", "empty", "empty"],
  explore: ["filled", "empty", "filled", "empty", "filled", "empty", "filled", "empty", "filled"],
  review: ["empty", "filled", "empty", "filled", "empty", "filled", "empty", "filled", "empty"],
  prototype: ["filled", "filled", "filled", "filled", "empty", "filled", "filled", "filled", "filled"],
  custom: ["empty", "empty", "empty", "filled", "filled", "filled", "empty", "empty", "empty"],
} satisfies Record<FlowKey, readonly MotifCell[]>;

// Sequences are the real flow compositions from circuit/src/flows/*/data.ts.
// Do not add blocks a flow does not actually use. "Custom" is intentionally
// empty — it represents planned flow/block authoring, not a shipped flow.
const FLOWS: ComposerFlow[] = [
  {
    key: "build",
    name: "Build",
    color: "var(--flow-build)",
    accent: "var(--flow-build-accent)",
    motif: FLOW_MOTIFS.build,
    summary: "Turn a clear brief into a reviewed change, backed by evidence.",
    blocks: ["frame", "gather-context", "plan", "act", "run-verification", "review", "close-with-evidence"],
  },
  {
    key: "fix",
    name: "Fix",
    color: "var(--flow-fix)",
    accent: "var(--flow-fix-accent)",
    motif: FLOW_MOTIFS.fix,
    summary: "Find the cause, make the fix, keep the evidence attached.",
    blocks: [
      "frame",
      "gather-context",
      "diagnose",
      "act",
      "run-verification",
      "review",
      "close-with-evidence",
    ],
  },
  {
    key: "pursue",
    name: "Pursue",
    color: "var(--flow-pursue)",
    accent: "var(--flow-pursue-accent)",
    motif: FLOW_MOTIFS.pursue,
    summary:
      "Coordinate several related changes without pretending they run at once.",
    blocks: [
      "pursue",
      "coordinate-pursuits",
      "plan",
      "batch",
      "run-verification",
      "review",
      "close-with-evidence",
    ],
  },
  {
    key: "explore",
    name: "Explore",
    color: "var(--flow-explore)",
    accent: "var(--flow-explore-accent)",
    motif: FLOW_MOTIFS.explore,
    summary:
      "Compare paths before the agent commits to one. With tournament enabled, option cases fan out, then rejoin at the tradeoff checkpoint.",
    blocks: ["frame", "diagnose", "plan", "review", "close-with-evidence"],
  },
  {
    key: "review",
    name: "Review",
    color: "var(--flow-review)",
    accent: "var(--flow-review-accent)",
    motif: FLOW_MOTIFS.review,
    summary: "Judge a scoped change against evidence, not guesswork.",
    blocks: ["frame", "review", "close-with-evidence"],
  },
  {
    key: "prototype",
    name: "Prototype",
    color: "var(--flow-prototype)",
    accent: "var(--flow-prototype-accent)",
    motif: FLOW_MOTIFS.prototype,
    summary: "Build a disposable, local version to learn from before committing.",
    blocks: [
      "frame",
      "plan",
      "act",
      "run-verification",
      "human-decision",
      "close-with-evidence",
    ],
  },
  {
    key: "custom",
    name: "Custom",
    color: "color-mix(in oklab, var(--muted-foreground) 35%, transparent)",
    accent: "color-mix(in oklab, var(--foreground) 13%, transparent)",
    motif: FLOW_MOTIFS.custom,
    blocks: [],
    planned: true,
  },
];

// Explore renders a tournament fanout between Plan and Human Decision: the
// fanned-out cases are stressed and rejoin at the tradeoff checkpoint, with no
// separate review block on that path. The "fanout" pseudo-node is one wide
// cluster (a single list item); the aria-label in FlowDiagram derives the
// announced order from this sequence, including "fan out option cases".
const EXPLORE_SEQUENCE = [
  "frame",
  "diagnose",
  "plan",
  "fanout",
  "human-decision",
  "close-with-evidence",
] as const;

// Theming recipes reused verbatim from the previous diagram so the new layout
// reads as the same family. Everything tints off the inline --flow-color.
const TILE_FILL = "color-mix(in oklab, var(--flow-color) 18%, var(--muted))";
const CONNECTOR_STROKE = "color-mix(in oklab, var(--flow-color) 60%, var(--border))";

// Geometry constants for the measured connector overlay.
// Tolerance for "same row" — tiles in a flex row share a top (align-items:start).
// Kept well below the row lane (gap-y-12/16, i.e. 48–64px) so two rows never
// collapse into one band.
const ROW_EPSILON = 18;
const EDGE_INSET = 6; // px the connector stops short of a tile, leaving room for the chevron

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
  head: { x: number; y: number; dir: "right" | "down" };
};

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// AnimatePresence mode="popLayout" wraps every child in a PopChild that clones it
// with an injected ref and, on exit, writes a `position: absolute` style block —
// but ONLY if that ref resolves to the real DOM node. Our tiles already own a ref
// (registerNode, used by the connector overlay), so we merge PopChild's ref into
// it. Without this, exiting tiles stay in flow, hold their slot for the exit, and
// the surviving tiles snap into the vacated gap instead of gliding cleanly.
function assignRef(ref: Ref<HTMLElement> | undefined, el: HTMLElement | null) {
  if (typeof ref === "function") ref(el);
  else if (ref) (ref as { current: HTMLElement | null }).current = el;
}

// Stable no-op subscription: the "are we hydrated yet" value never changes once
// the client takes over, so useSyncExternalStore only needs distinct server
// (false) and client (true) snapshots — no real store to subscribe to.
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

// One connector between consecutive nodes. Same-row links curve flat from the
// right of A to the left of B; wrapped links use a single cubic with vertical
// tangents — a smooth serpentine that drops from the bottom of the last tile in
// a row and rises into the top of the first tile on the next row, no elbow. The
// mobile one-per-row case collapses this to a clean vertical curve for free.
// Tight rounded elbow radius for orthogonal cross-row routing.
const ELBOW_R = 9;

function connectorSegment(a: Anchor, b: Anchor): Omit<Segment, "id"> {
  // Same row: tops align AND b sits to the right of a. A flat link across the
  // column gutter. (The right-of-a check also stops a transient FLIP frame from
  // drawing a folded connector — such pairs fall through to the routed path.)
  const sameRow = Math.abs(a.top - b.top) < ROW_EPSILON && b.left > a.right - 4;
  if (sameRow) {
    const x1 = a.right + EDGE_INSET;
    const y1 = a.cy;
    const x2 = b.left - EDGE_INSET;
    const y2 = b.cy;
    const k = Math.min(Math.max((x2 - x1) * 0.5, 12), 40);
    return {
      d: `M ${x1} ${y1} C ${x1 + k} ${y1}, ${x2 - k} ${y2}, ${x2} ${y2}`,
      head: { x: x2, y: y2, dir: "right" },
    };
  }
  // Different rows (a wrap-back, the full-width fanout cluster, or the mobile
  // single column). Drop out of the bottom of a, run along the empty lane
  // between the two rows, and drop into the top of b — an orthogonal staple
  // that passes BETWEEN the blocks instead of cutting across them.
  const x1 = a.cx;
  const y1 = a.bottom + EDGE_INSET;
  const x2 = b.cx;
  const y2 = b.top - EDGE_INSET;
  if (Math.abs(x2 - x1) < 6) {
    // Vertically aligned (mobile stack): a clean straight drop.
    return { d: `M ${x1} ${y1} L ${x2} ${y2}`, head: { x: x2, y: y2, dir: "down" } };
  }
  const midY = (a.bottom + b.top) / 2;
  const dir = x2 > x1 ? 1 : -1;
  // Clamp the corner radius to the available segment lengths so tight gaps or
  // short horizontal runs never produce a kinked/overshooting elbow.
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
  return { d, head: { x: x2, y: y2, dir: "down" } };
}

// Vertical-tangent cubic, used for the fanout cluster's internal fan/merge wires.
function verticalCubic(x1: number, y1: number, x2: number, y2: number): string {
  const k = Math.max(Math.abs(y2 - y1) * 0.5, 12);
  return `M ${x1} ${y1} C ${x1} ${y1 + k}, ${x2} ${y2 - k}, ${x2} ${y2}`;
}

function chevron(head: Segment["head"]): string {
  const { x, y, dir } = head;
  if (dir === "right") return `M ${x - 5} ${y - 3} L ${x} ${y} L ${x - 5} ${y + 3}`;
  return `M ${x - 3} ${y - 5} L ${x} ${y} L ${x + 3} ${y - 5}`;
}

// Enter/exit choreography for nodes that are NOT shared between the outgoing and
// incoming flow. Shared nodes keep their layoutId and FLIP-morph to the new
// position/theme; genuinely new (or removed) nodes instead fade + scale + deblur
// in, and reverse on the way out. A node can never both morph and enter/exit at
// once — persisted React instances never re-run initial/exit, and an entering
// tile has a brand-new layoutId with no prior box — so the scale here can never
// fight a layout animation. blur is a filter, not a transform, so it is likewise
// independent of the FLIP. Layout stays on the tuned spring; the soft props get
// their own ease. Under reduced motion this collapses to the prior opacity-only,
// instant behavior.
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
    initial: { opacity: 0, scale: 0.9, filter: "blur(8px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: {
      opacity: 0,
      scale: 0.9,
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

// The connector analog of tileMotionProps, applied to each connector <g>. The
// inner paths keep their own draw-in (pathLength on the line, delayed opacity on
// the chevron); this wraps them so a connector deblurs in and fades + reblurs out
// with the same soft focus as the tiles it joins. The group's opacity is left at
// rest on enter so it does not double the inner paths' fade — only exit drives the
// group opacity. Exit requires AnimatePresence. No popLayout here: SVG paths are
// placed by `d`, not by layout flow, so there is no slot to pop. `delay` staggers
// the draw to match the line/chevron timing.
function connectorGroupProps(reduceMotion: boolean, delay: number): MotionProps {
  if (reduceMotion) {
    return {
      initial: false,
      animate: { opacity: 1, filter: "blur(0px)" },
      exit: { opacity: 0, transition: { duration: 0 } },
      transition: { duration: 0 },
    };
  }
  // opacity rests at 1 through enter/animate (so the group never doubles the
  // inner paths' own fade) but is declared so exit has a real value to animate
  // from — without it, Motion warns "animate opacity from undefined to 0".
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

// ---- Flow flexibility data --------------------------------------------------

type Depth = "low" | "medium" | "high";

// What each flow can flex, mirroring each flow's allowed_depths /
// supports_tournament / supports_autonomous in circuit/src/flows/<id>/data.ts.
// Only `tournament` actually reshapes the block diagram (Explore and Prototype
// fan out into parallel option cases, per their real tournament fixtures).
// `depths` and `autonomous` change how a run executes, not which blocks it
// has — verified against the fixtures: there is no high.json or
// autonomous.json, so they are stated, never animated as fake block changes.
type AxisSupport = {
  depths: Depth[];
  tournament: boolean;
  autonomous: boolean;
};

const AXIS_SUPPORT: Record<Exclude<FlowKey, "custom">, AxisSupport> = {
  build: { depths: ["low", "medium", "high"], tournament: false, autonomous: true },
  fix: { depths: ["low", "medium", "high"], tournament: false, autonomous: true },
  pursue: { depths: ["medium"], tournament: false, autonomous: true },
  explore: { depths: ["low", "medium", "high"], tournament: true, autonomous: true },
  review: { depths: ["medium"], tournament: false, autonomous: false },
  prototype: { depths: ["medium", "high"], tournament: true, autonomous: true },
};

function supportFor(key: FlowKey): AxisSupport | null {
  return key === "custom" ? null : AXIS_SUPPORT[key];
}

// A glance-level badge of what the active flow supports, shown opposite the
// flow title. Depth is always present (every flow has a depth range); autonomy
// and tournament appear only when the flow actually supports them, so the badge
// reads as a quick answer to "what can this flow do."
function FlowSupportIndicator({ support }: { support: AxisSupport }) {
  const depthRange =
    support.depths.length > 1
      ? `${support.depths[0]}–${support.depths[support.depths.length - 1]}`
      : support.depths[0];
  const chipClass =
    "soft-chip px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em]";
  return (
    <ul
      aria-label="Supported options"
      className="flex flex-wrap items-center justify-end gap-1.5"
    >
      <li className={`${chipClass} flex items-center gap-1 text-muted-foreground`}>
        Depth <span className="text-foreground">{depthRange}</span>
      </li>
      {support.autonomous ? (
        <li className={`${chipClass} text-foreground`}>Autonomous</li>
      ) : null}
      {support.tournament ? (
        <li className={`${chipClass} text-foreground`}>Tournament</li>
      ) : null}
    </ul>
  );
}

// An illustrative, not-yet-real flow rendered as gray nodes, to show how blocks
// could be composed into a custom flow. Deliberately gray and label-only (not
// the typed BlockTile catalog) so it never reads as a shipped flow.
const HYPOTHETICAL_FLOW = [
  "Grill me",
  "Proposal",
  "Generate HTML preview",
  "Human Decision",
  "Build",
  "Adversarial Review (2)",
  "Fix",
  "Open PR",
] as const;

function HypotheticalFlowPreview() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {HYPOTHETICAL_FLOW.map((node, index) => (
        <span key={node} className="inline-flex items-center gap-2">
          <span className="rounded-xl border border-muted-foreground/20 bg-muted/50 px-3 py-2 text-[12px] font-medium text-muted-foreground">
            {node}
          </span>
          {index < HYPOTHETICAL_FLOW.length - 1 ? (
            <span aria-hidden="true" className="text-muted-foreground/40">
              →
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

// Block sequences. Each flow's `blocks` is its standard shape; the tournament
// variants add the fan-out machinery, matching the real tournament fixtures for
// Explore and Prototype. Toggling `tournament` morphs the diagram between them.
const EXPLORE_STANDARD = [
  "frame",
  "diagnose",
  "plan",
  "review",
  "close-with-evidence",
] as const;

const PROTOTYPE_TOURNAMENT = [
  "frame",
  "plan",
  "fanout",
  "run-verification",
  "review",
  "human-decision",
  "close-with-evidence",
] as const;

function sequenceFor(
  flow: ComposerFlow,
  tournament: boolean,
): readonly string[] {
  if (flow.key === "explore") {
    return tournament ? EXPLORE_SEQUENCE : EXPLORE_STANDARD;
  }
  if (flow.key === "prototype" && tournament) {
    return PROTOTYPE_TOURNAMENT;
  }
  return flow.blocks;
}

function BlockTile({
  block,
  motionProps,
  registerNode,
  ref,
}: {
  block: BlockId;
  motionProps: MotionProps;
  registerNode: (id: string) => (el: HTMLElement | null) => void;
  ref?: Ref<HTMLElement>;
}) {
  const nodeRef = registerNode(block);
  const composedRef = useCallback(
    (el: HTMLElement | null) => {
      nodeRef(el);
      assignRef(ref, el);
    },
    [nodeRef, ref],
  );
  return (
    <m.li
      ref={composedRef}
      layout
      layoutId={block}
      {...motionProps}
      className="flow-block-tile relative z-10 flex w-full list-none flex-col items-center justify-center gap-2 p-4 text-center text-foreground sm:w-auto sm:min-w-[108px]"
      style={{ backgroundColor: TILE_FILL }}
    >
      <span className="text-[15px] font-medium leading-tight tracking-tight">
        {BLOCK_LABEL[block]}
      </span>
    </m.li>
  );
}

function FanoutCluster({
  reduceMotion,
  motionProps,
  registerNode,
  ref,
}: {
  reduceMotion: boolean;
  motionProps: MotionProps;
  registerNode: (id: string) => (el: HTMLElement | null) => void;
  ref?: Ref<HTMLElement>;
}) {
  const clusterRef = useRef<HTMLElement | null>(null);
  const branchRefs = useRef<(HTMLElement | null)[]>([]);
  const [fanSegs, setFanSegs] = useState<{ id: string; d: string }[]>([]);
  const [box, setBox] = useState({ w: 0, h: 0 });

  // Outer: a transparent full-width band whose only jobs are to break the flex
  // row (so the cluster gets its own lane between Plan and Review) and to be the
  // layout/AnimatePresence node — so it carries layoutId and the popLayout ref.
  const setOuterRef = useCallback(
    (el: HTMLElement | null) => {
      assignRef(ref, el);
    },
    [ref],
  );

  // Inner card: the visible, content-width cluster. It is what the parent overlay
  // anchors to ("fanout"), so the plan->fanout and fanout->review connectors meet
  // the real card rather than the full-width band, and it carries clusterRef for
  // the local fan/merge measurement.
  const setCardRef = useCallback(
    (el: HTMLElement | null) => {
      clusterRef.current = el;
      registerNode("fanout")(el);
    },
    [registerNode],
  );

  // Fan/merge geometry is internal to the cluster and moves with it, so it only
  // changes on reflow (resize / font load), never during the cluster's FLIP —
  // no rAF needed here, unlike the main sequence overlay.
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
      // Fan out from the top-center inlet to each branch; rejoin into the
      // bottom-center outlet. Those inlet/outlet points sit on the cluster edge
      // so they meet the plan->fanout and fanout->review connectors exactly.
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
      layout
      layoutId="fanout"
      {...motionProps}
      className="relative z-10 flex w-full list-none origin-left justify-start"
    >
      <div
        ref={setCardRef}
        className="flow-fanout-cluster relative w-fit px-3 pb-3 pt-3 text-foreground"
      >
        <span className="absolute left-3 top-3 z-20 text-[10px] uppercase leading-none tracking-[0.16em] text-muted-foreground">
          Tournament fanout
        </span>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
          viewBox={`0 0 ${box.w} ${box.h}`}
          preserveAspectRatio="none"
          fill="none"
          style={{ color: CONNECTOR_STROKE }}
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
        <div className="relative z-10 mb-7 mt-8 flex flex-wrap justify-center gap-1.5">
          {["Option case 1", "Option case 2", "Option case 3"].map((label, i) => (
            <div
              key={label}
              ref={(el) => {
                branchRefs.current[i] = el;
              }}
              className="flow-fanout-branch px-3 py-2 text-[12px] font-medium leading-tight"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </m.li>
  );
}

function FlowDiagram({
  flow,
  sequence,
  reduceMotion,
}: {
  flow: ComposerFlow;
  sequence: readonly string[];
  reduceMotion: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Map<string, HTMLElement> | null>(null);
  const refCallbacks = useRef<Map<string, (el: HTMLElement | null) => void> | null>(null);
  const lastSig = useRef("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  if (nodeRefs.current === null) nodeRefs.current = new Map();
  if (refCallbacks.current === null) refCallbacks.current = new Map();
  const nodeRefMap = nodeRefs.current;
  const refCallbackMap = refCallbacks.current;

  const spring = reduceMotion
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 420, damping: 36, mass: 0.9 } as const);

  // Shared enter/exit/morph choreography handed to every node in the sequence.
  const motionProps = tileMotionProps(reduceMotion, spring);

  // Stable ref callback per node id so the refs map does not churn each render.
  const registerNode = useCallback((id: string) => {
    let cb = refCallbackMap.get(id);
    if (!cb) {
      cb = (el: HTMLElement | null) => {
        if (el) nodeRefMap.set(id, el);
        else nodeRefMap.delete(id);
      };
      refCallbackMap.set(id, cb);
    }
    return cb;
  }, [nodeRefMap, refCallbackMap]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const origin = container.getBoundingClientRect();
    const next: Segment[] = [];
    for (let i = 0; i < sequence.length - 1; i += 1) {
      const elA = nodeRefMap.get(sequence[i]);
      const elB = nodeRefMap.get(sequence[i + 1]);
      if (!elA || !elB) continue;
      const seg = connectorSegment(toAnchor(elA, origin), toAnchor(elB, origin));
      next.push({ id: `${flow.key}:${sequence[i]}->${sequence[i + 1]}`, ...seg });
    }
    // The bounded rAF loop fires ~40x per switch, but geometry only changes
    // while tiles are gliding. Skip the state writes on no-op frames so we do
    // not force a render (and SVG re-diff) every frame after the spring settles.
    const sig = `${flow.key}|${origin.width}x${origin.height}|${next.map((s) => s.d).join("|")}`;
    if (sig === lastSig.current) return;
    lastSig.current = sig;
    setSegments(next);
    setSize((prev) =>
      prev.w === origin.width && prev.h === origin.height
        ? prev
        : { w: origin.width, h: origin.height },
    );
  }, [flow, sequence, nodeRefMap]);

  // Measure on mount and on every flow switch. With motion off we measure once
  // at rest; otherwise a short, bounded rAF loop re-measures each frame for the
  // duration of the FLIP spring so connectors track the gliding tiles, then a
  // final measure locks the resting geometry.
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

  // Re-wrap on container resize.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    return () => ro.disconnect();
  }, [measure]);

  // Webfont load can change tile widths, shifting the wrap.
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

  const orderedLabels = sequence
    .map((id) =>
      id === "fanout" ? "fan out option cases" : BLOCK_LABEL[id as BlockId],
    )
    .join(", then ");
  const ariaLabel = sequence.includes("fanout")
    ? `${flow.name} flow with a tournament fan-out, in order: ${orderedLabels}`
    : `${flow.name} flow, in order: ${orderedLabels}`;

  const renderSequence = sequence;

  return (
    // The diagram fills its parent; the explorer body container caps the width
    // (see .flow-composer-content), so flows wrap there, not at an inner cap here.
    <div ref={containerRef} className="relative">
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
            <m.g key={seg.id} {...connectorGroupProps(reduceMotion, i * 0.05)}>
              <m.path
                d={seg.d}
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
                    : { delay: i * 0.05, duration: 0.45, ease: "easeOut" }
                }
              />
              <m.path
                d={chevron(seg.head)}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.25}
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
          ))}
        </AnimatePresence>
      </svg>

      <ul
        aria-label={ariaLabel}
        className="relative z-10 flex flex-wrap items-start gap-x-8 gap-y-12 p-0 sm:gap-y-16"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {renderSequence.map((id) =>
            id === "fanout" ? (
              <FanoutCluster
                key="fanout"
                reduceMotion={reduceMotion}
                motionProps={motionProps}
                registerNode={registerNode}
              />
            ) : (
              <BlockTile
                key={id}
                block={id as BlockId}
                motionProps={motionProps}
                registerNode={registerNode}
              />
            ),
          )}
        </AnimatePresence>
      </ul>
    </div>
  );
}

export function FlowComposer() {
  const [active, setActive] = useState<FlowKey>("build");
  // Tournament is the one axis that actually reshapes a flow's blocks: Explore
  // and Prototype fan out into parallel option cases (their real tournament
  // fixtures). Toggling it morphs the diagram. The other flex dimensions are
  // real but not block-shaped, so they are stated under the diagram, not drawn.
  const [tournament, setTournament] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  // useReducedMotion() is null on the server, so deriving animation state from
  // it directly makes the first client render disagree with the SSR markup (a
  // hydration mismatch, and an opacity-0 flash for reduced-motion users). Start
  // in the static state — which the server also renders — then adopt the real
  // preference after hydration. The entry draw-in sits far below the fold and
  // would finish before it scrolls into view anyway; the flow-switch animations
  // users actually trigger happen post-hydration and are unaffected.
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const reduceMotion = !hydrated || prefersReducedMotion === true;

  const flow = FLOWS.find((f) => f.key === active) ?? FLOWS[0];
  const planned = flow.planned === true;
  const support = supportFor(flow.key);
  const canTournament = support?.tournament === true;
  const tournamentOn = canTournament && tournament;
  const sequence = sequenceFor(flow, tournamentOn);

  // Picking a flow resets the toggle, so each flow opens in its standard shape.
  const selectFlow = useCallback((key: FlowKey) => {
    setActive(key);
    setTournament(false);
  }, []);

  return (
    <div
      className="flex w-full flex-col"
      style={{ "--flow-color": flow.color } as CSSProperties}
    >
      <LazyMotion features={domMax}>
        <LayoutGroup>
        {/* One container, split by a hairline: the flows stack down the left as
            a nav under the /circuit:run command they run; the selected flow's
            diagram and prose fill the panel to the right. */}
        <div className="flow-composer-panel">
          <nav className="flow-composer-nav" aria-label="Circuit flows">
            <span className="flow-run-command font-mono">/circuit:run</span>
            <fieldset className="flow-nav-options m-0 min-w-0 border-0 p-0">
              <legend className="sr-only">Choose a flow</legend>
              {FLOWS.map((f) => {
                const selected = f.key === active;
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectFlow(f.key)}
                    className="flow-picker-button inline-flex min-h-11 w-full items-center justify-start gap-2.5 px-4 py-2.5 text-[15px] font-medium transition-colors hover:text-foreground"
                    style={{
                      color: selected
                        ? "var(--foreground)"
                        : "var(--muted-foreground)",
                      backgroundColor: selected
                        ? `color-mix(in oklab, ${f.color} 22%, var(--muted))`
                        : undefined,
                    }}
                  >
                    <FlowGlyph
                      name={f.name}
                      color={f.color}
                      accent={f.accent}
                      motif={f.motif}
                      cellSize={20}
                      className="size-5 shrink-0"
                    />
                    {f.name}
                    {f.planned ? (
                      <span className="soft-chip ml-auto px-1.5 py-1 text-[10px] uppercase leading-none tracking-[0.15em] text-muted-foreground">
                        soon
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </fieldset>
          </nav>

          {/* The selected flow, how it can fan out, and a plain line on how
              else it flexes. */}
          <div className="flow-composer-content min-w-0">
            {planned ? (
              <div className="flex flex-col gap-5 py-2">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Custom · not yet shipped
                </div>
                <p className="max-w-xl text-[15px] leading-relaxed text-foreground">
                  Compose a flow from any block in the catalog, or author new
                  blocks with their own typed contracts.
                </p>
                <div className="flex flex-col gap-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
                    For example, a flow you could compose
                  </div>
                  <HypotheticalFlowPreview />
                </div>
                <p className="max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                  Flow and block authoring is in the works. Today{" "}
                  <span className="font-mono text-foreground/80">
                    /circuit:run
                  </span>{" "}
                  routes to the six built-in flows listed here.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div className="text-[18px] font-medium leading-tight tracking-tight text-foreground">
                    {flow.name}
                  </div>
                  {support ? <FlowSupportIndicator support={support} /> : null}
                </div>
                {flow.summary ? (
                  <p className="mb-5 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
                    {flow.summary}
                  </p>
                ) : null}

                {canTournament ? (
                  <div className="flow-flex mb-7">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={tournamentOn}
                      onClick={() => setTournament((t) => !t)}
                      className={`flow-flex-toggle ${tournamentOn ? "is-on" : ""}`}
                    >
                      <span aria-hidden="true" className="flow-flex-track">
                        <span className="flow-flex-thumb" />
                      </span>
                      Tournament
                    </button>
                  </div>
                ) : null}

                <FlowDiagram
                  flow={flow}
                  sequence={sequence}
                  reduceMotion={reduceMotion}
                />
              </>
            )}
          </div>
        </div>
        </LayoutGroup>
      </LazyMotion>
    </div>
  );
}
