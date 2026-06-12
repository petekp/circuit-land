// Logomark candidates for Circuit. Brief (Pete, 2026-06-10): a simple
// geometric mark, overlapping shapes creating a negative/positive space
// effect, evoking a process or closed loop. Professional, not childish.
//
// Every mark is pure SVG with precomputed geometry. Knockouts use
// fillRule="evenodd" on compound paths (no masks, no ids), so marks can
// repeat on a page and sit on any background — the holes are real.

export type MarkProps = {
  size?: number;
  ink: string;
  accent: string;
};

// Rounded-rectangle subpath, clockwise. Composable into compound paths.
function rrect(x: number, y: number, w: number, h: number, r: number) {
  return [
    `M ${x + r} ${y}`,
    `h ${w - 2 * r}`,
    `a ${r} ${r} 0 0 1 ${r} ${r}`,
    `v ${h - 2 * r}`,
    `a ${r} ${r} 0 0 1 ${-r} ${r}`,
    `h ${-(w - 2 * r)}`,
    `a ${r} ${r} 0 0 1 ${-r} ${-r}`,
    `v ${-(h - 2 * r)}`,
    `a ${r} ${r} 0 0 1 ${r} ${-r}`,
    "Z",
  ].join(" ");
}

// Circle subpath (two arcs), composable like rrect.
function circ(cx: number, cy: number, r: number) {
  return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
}

// 1 — LOOP & STEP. A ring with a gap; a rounded square seats in the gap
// and closes the loop. Reads as a schematic: a component wired in line.
// The step IS what completes the circuit.
export function MarkLoopStep({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d="M 51.75 28.87 A 20 20 0 1 1 35.13 12.25"
        fill="none"
        stroke={ink}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <path d={rrect(37.6, 9.3, 17, 17, 5.5)} fill={accent} />
    </svg>
  );
}

// 2 — VENN. Circle (the loop) and rounded square (the step) overlap;
// the shared lens is knocked out, and the pulse sits inside the
// negative space — the work living where process meets step.
export function MarkVenn({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d={`${circ(26, 36, 17)} ${rrect(24, 10, 28, 28, 9)}`}
        fill={ink}
        fillRule="evenodd"
      />
      <circle cx={32} cy={28.5} r={3.2} fill={accent} />
    </svg>
  );
}

// 3 — INTERLOCK. Two identical rounded squares (two runs) overlap; the
// shared region is negative space — the record both runs touch.
export function MarkInterlock({ size = 96, ink }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d={`${rrect(11, 11, 28, 28, 9)} ${rrect(25, 25, 28, 28, 9)}`}
        fill={ink}
        fillRule="evenodd"
      />
    </svg>
  );
}

// 4 — ORBIT. The loop drawn as eight steps (dashes); one is lit. A flow
// is a cycle of discrete steps, one active at a time.
export function MarkOrbit({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <circle
        cx={32}
        cy={32}
        r={20}
        fill="none"
        stroke={ink}
        strokeWidth={7}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="6.5 6"
      />
      <path
        d="M 27.5 12.51 A 20 20 0 0 1 36.5 12.51"
        fill="none"
        stroke={accent}
        strokeWidth={7}
        strokeLinecap="round"
      />
    </svg>
  );
}

// 5 — TWIN ARCS. The loop drawn in two strokes, two voices: the agent
// does the work (ink), Circuit closes the loop (accent).
export function MarkTwinArcs({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d="M 12.3 28.53 A 20 20 0 0 1 51.7 28.53"
        fill="none"
        stroke={ink}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <path
        d="M 51.7 35.47 A 20 20 0 0 1 12.3 35.47"
        fill="none"
        stroke={accent}
        strokeWidth={7}
        strokeLinecap="round"
      />
    </svg>
  );
}

// 6 — TRACK. The run-stage pad blown up to a course: a rounded-square
// ring with one gap, the pulse sitting in it, about to close the lap.
export function MarkTrack({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <rect
        x={12}
        y={12}
        width={40}
        height={40}
        rx={12}
        fill="none"
        stroke={ink}
        strokeWidth={7}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="87 13"
        strokeDashoffset={62.8}
      />
      <circle cx={52} cy={32} r={4.5} fill={accent} />
    </svg>
  );
}

// 7 — STACK. Runs accrue: two outlined records behind, the latest one
// solid. The only non-loop mark — it argues memory instead.
export function MarkStack({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path d={rrect(13, 13, 30, 30, 9)} fill="none" stroke={ink} strokeWidth={3.2} />
      <path d={rrect(18, 18, 30, 30, 9)} fill="none" stroke={ink} strokeWidth={3.2} />
      <path d={rrect(23, 23, 30, 30, 9)} fill={accent} />
    </svg>
  );
}

// 8 — GATE. A solid step with a circular bite taken out of its edge;
// the pulse rests in the notch. The step receives the work.
export function MarkGate({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d={`${rrect(12, 12, 40, 40, 12)} ${circ(52, 32, 11)}`}
        fill={ink}
        fillRule="evenodd"
      />
      <circle cx={52} cy={32} r={4.5} fill={accent} />
    </svg>
  );
}

export const MARKS = [
  {
    id: "loop-step",
    name: "Loop & Step",
    Mark: MarkLoopStep,
    concept:
      "A ring with a gap; a rounded step seats in the gap and closes the loop. Reads as a schematic component wired in line — the step is what completes the circuit.",
  },
  {
    id: "venn",
    name: "Venn",
    Mark: MarkVenn,
    concept:
      "The loop (circle) and the step (square) overlap; their shared lens is cut out, and the pulse lives in the negative space.",
  },
  {
    id: "interlock",
    name: "Interlock",
    Mark: MarkInterlock,
    concept:
      "Two identical runs overlap; what they share is negative space — the record both touch. The quietest of the set.",
  },
  {
    id: "orbit",
    name: "Orbit",
    Mark: MarkOrbit,
    concept:
      "The loop drawn as eight discrete steps, one lit. A flow is a cycle of steps with one active at a time.",
  },
  {
    id: "twin-arcs",
    name: "Twin Arcs",
    Mark: MarkTwinArcs,
    concept:
      "The loop in two strokes, two voices: the agent does the work, Circuit closes the loop.",
  },
  {
    id: "track",
    name: "Track",
    Mark: MarkTrack,
    concept:
      "The run-stage pad blown up to a course: a rounded-square ring with one gap, the pulse about to close the lap.",
  },
  {
    id: "stack",
    name: "Stack",
    Mark: MarkStack,
    concept:
      "Runs accrue: two outlined records behind, the latest solid. The one non-loop mark — it argues memory instead.",
  },
  {
    id: "gate",
    name: "Gate",
    Mark: MarkGate,
    concept:
      "A solid step with a circular bite out of its edge; the pulse rests in the notch. The strongest positive/negative play.",
  },
] as const;
