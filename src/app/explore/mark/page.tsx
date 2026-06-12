import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The mark, refined — Circuit",
};

// THE MARK, REFINED (round six)
//
// Round-five verdict: Gap is the mark. Three asks: thicker, single
// color (it has to survive any format), and an element in the negative
// space that can lap the track in special circumstances — animation as
// a state, not decoration.
//
// Everything on this sheet is ONE ink. Color is styling applied later;
// if a variant needs a second color to read, it's out.
//
// Geometry: the track is inset to caps r17 so a stroke of 8 still
// clears the 64-unit viewBox:
//   M 23 15 H 41 A 17 17 0 0 1 41 49 H 23 A 17 17 0 0 1 23 15 Z
// Perimeter ≈142.8, normalized via pathLength=100. s=0 at the
// top-left corner, clockwise; right-cap middle (the gate) at s≈31.3.

const BG = "hsl(220 3% 9%)";
const PANEL = "hsl(220 3% 13%)";
const BORDER = "hsl(220 3% 22%)";
const TEXT = "hsl(60 10% 92%)";
const MUTED = "hsl(220 3% 60%)";
const ACCENT = "hsl(163 95% 47%)";
const LIGHT = "hsl(160 15% 96%)";
const DARK_INK = "hsl(220 5% 12%)";

const css = `
body { background: ${BG}; }
.tx-mark {
  background: ${BG};
  color: ${TEXT};
  font-family: "Schibsted Grotesk", system-ui, sans-serif;
}
.tx-mark .evidence {
  font-family: "Fragment Mono", ui-monospace, monospace;
}
.tx-mark ::selection { background: ${ACCENT}; color: ${BG}; }
@keyframes mark-lap {
  from { stroke-dashoffset: 68.7; }
  to { stroke-dashoffset: -31.3; }
}
@media (prefers-reduced-motion: no-preference) {
  .mark-lap {
    animation: mark-lap 4.5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
  }
}
`;

const STADIUM_D = "M 23 15 H 41 A 17 17 0 0 1 41 49 H 23 A 17 17 0 0 1 23 15 Z";

type MarkProps = { size?: number; ink: string };

// The track with a gate. Gap width and stroke are the two dials;
// offsets keep the gate centered on the right cap (s≈31.3).
function Track({
  size = 96,
  ink,
  stroke = 8,
  gap = 12,
}: MarkProps & { stroke?: number; gap?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d={STADIUM_D}
        fill="none"
        stroke={ink}
        strokeWidth={stroke}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${100 - gap} ${gap}`}
        strokeDashoffset={62.7 - (gap - 12) / 2}
      />
    </svg>
  );
}

// 2 — GATE · DOT. The runner waiting at the gate: a dot of the
// track's own weight, seated in a widened gap.
function MarkGateDot({ size = 96, ink }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d={STADIUM_D}
        fill="none"
        stroke={ink}
        strokeWidth={8}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="84 16"
        strokeDashoffset={60.7}
      />
      <circle cx={58} cy={32} r={4} fill={ink} />
    </svg>
  );
}

// 3 — GATE · DASH. The runner as a stretch of track, mid-stride in a
// wider gap. Closest to the round-five Dash, now one ink.
function MarkGateDash({ size = 96, ink }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d={STADIUM_D}
        fill="none"
        stroke={ink}
        strokeWidth={8}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="80 20"
        strokeDashoffset={58.7}
      />
      <path
        d={STADIUM_D}
        fill="none"
        stroke={ink}
        strokeWidth={8}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="5 95"
        strokeDashoffset={71.2}
      />
    </svg>
  );
}

// 4 — GATE · PAD. A component seated in the gap, wired in line — the
// Loop & Step idea finally living inside the track's own break.
function MarkGatePad({ size = 96, ink }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d={STADIUM_D}
        fill="none"
        stroke={ink}
        strokeWidth={8}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="84 16"
        strokeDashoffset={60.7}
      />
      <rect x={53} y={27} width={10} height={10} rx={3} fill={ink} />
    </svg>
  );
}

// 5 — COUNTER. The other reading of "negative space": the element
// rests in the stadium's interior, not the gap, and leaves home to
// lap the track when the work runs.
function MarkCounter({ size = 96, ink }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d={STADIUM_D}
        fill="none"
        stroke={ink}
        strokeWidth={8}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="88 12"
        strokeDashoffset={62.7}
      />
      <circle cx={32} cy={32} r={4} fill={ink} />
    </svg>
  );
}

// 6 — THE LAP. The special circumstance: the element lights up,
// leaves the gate, laps the track, and eases back through. The accent
// is allowed here because the running state is product UI, not a
// logo placement — the RESTING mark stays one ink. (In one ink the
// orbiting element would vanish against the track; it would only
// flicker past the gate.) Reduced motion parks it at the gate.
function MarkLap({ size = 96, ink }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d={STADIUM_D}
        fill="none"
        stroke={ink}
        strokeWidth={8}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="84 16"
        strokeDashoffset={60.7}
      />
      <path
        className="mark-lap"
        d={STADIUM_D}
        fill="none"
        stroke={ACCENT}
        strokeWidth={8}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="0.1 99.9"
        strokeDashoffset={68.7}
      />
    </svg>
  );
}

const ELEMENT_MARKS = [
  {
    id: "gate-dot",
    name: "Gate · dot",
    Mark: MarkGateDot,
    concept:
      "The runner waiting at the gate: a dot of the track's own weight, seated in a widened gap. The quietest element, and the one that animates cleanest.",
  },
  {
    id: "gate-dash",
    name: "Gate · dash",
    Mark: MarkGateDash,
    concept:
      "The runner as a stretch of track, mid-stride in a wider gap. More motion at rest; costs more gap to breathe.",
  },
  {
    id: "gate-pad",
    name: "Gate · pad",
    Mark: MarkGatePad,
    concept:
      "A component seated in the break, wired in line — the round-three Loop & Step idea finally living inside the track's own geometry.",
  },
  {
    id: "counter",
    name: "Counter",
    Mark: MarkCounter,
    concept:
      "The other reading of negative space: the element rests in the interior and leaves home to lap when the work runs. Risks reading as an eye or a zero.",
  },
  {
    id: "lap",
    name: "The lap",
    Mark: MarkLap,
    concept:
      "The special circumstance, live: the element lights up, laps the track, eases back through the gate. Color is allowed here — the running state is UI, not a logo placement; the resting mark stays one ink. Reduced motion parks it at the gate.",
  },
];

const SMALL_SIZES = [32, 24, 16, 12];

function SizeStrip({ Mark }: { Mark: (p: MarkProps) => React.ReactNode }) {
  return (
    <span className="flex items-center gap-3">
      {SMALL_SIZES.map((s) => (
        <Mark key={s} size={s} ink={TEXT} />
      ))}
      <span
        className="flex size-7 items-center justify-center rounded-md"
        style={{ backgroundColor: BG }}
      >
        <Mark size={16} ink={TEXT} />
      </span>
      <span
        className="flex size-7 items-center justify-center rounded-md"
        style={{ backgroundColor: LIGHT }}
      >
        <Mark size={16} ink={DARK_INK} />
      </span>
    </span>
  );
}

export default function MarkSheet() {
  return (
    <div className="tx-mark min-h-screen">
      <style>{css}</style>

      <nav
        className="evidence mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 text-[11px] uppercase tracking-[0.16em]"
        style={{ color: MUTED }}
      >
        <Link href="/explore">Explorations</Link>
        <div className="flex gap-4">
          <Link href="/explore/stadium">Stadium riffs</Link>
          <span aria-current="page" className="underline" style={{ color: TEXT }}>
            The mark
          </span>
          <Link href="/explore/aurora">Aurora</Link>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-5xl flex-col px-6 pb-24">
        <header className="mt-14 flex max-w-2xl flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            The mark, refined
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: MUTED }}>
            Gap won round five. Three refinements from the verdict:
            thicker, one color only (the mark has to survive any format),
            and an element in the negative space that can lap the track
            when something is actually running. Everything below is a
            single ink — if a variant needs a second color to read, it
            doesn&apos;t get to exist.
          </p>
        </header>

        {/* Weight study */}
        <section
          className="mt-12 flex flex-col gap-5 rounded-2xl border p-6"
          style={{ borderColor: BORDER, backgroundColor: PANEL }}
        >
          <span className="evidence text-[11px] uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
            01 · Weight
          </span>
          <div className="flex flex-wrap items-end justify-around gap-6">
            {[6, 7, 8].map((w) => (
              <div key={w} className="flex flex-col items-center gap-3">
                <Track size={110} ink={TEXT} stroke={w} />
                <span className="evidence text-[11px]" style={{ color: MUTED }}>
                  stroke {w}
                </span>
                <span className="flex items-center gap-2">
                  <Track size={16} ink={TEXT} stroke={w} />
                  <Track size={12} ink={TEXT} stroke={w} />
                </span>
              </div>
            ))}
          </div>
          <p className="max-w-2xl text-[14px] leading-relaxed" style={{ color: MUTED }}>
            Round four shipped stroke 6. At 12 px it thins to under a
            pixel and the gap gets lost in the blur; 8 holds its shape
            all the way down and reads more confident at display sizes
            too. Recommendation: 8.
          </p>
        </section>

        {/* Element variants */}
        <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {ELEMENT_MARKS.map(({ id, name, Mark, concept }, i) => (
            <li
              key={id}
              className="flex flex-col gap-5 rounded-2xl border p-6"
              style={{ borderColor: BORDER, backgroundColor: PANEL }}
            >
              <span className="evidence text-[11px] uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
                {String(i + 2).padStart(2, "0")} · {name}
              </span>

              <div className="flex items-center justify-center py-4">
                <Mark size={120} ink={TEXT} />
              </div>

              <div
                className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
                style={{ borderColor: BORDER }}
              >
                <span className="flex items-center gap-2.5">
                  <Mark size={22} ink={TEXT} />
                  <span className="text-[19px] font-semibold tracking-tight">circuit</span>
                </span>
                <SizeStrip Mark={Mark} />
              </div>

              <p className="text-[14px] leading-relaxed" style={{ color: MUTED }}>
                {concept}
              </p>
            </li>
          ))}
        </ul>

        {/* The system rule + format proofs */}
        <footer
          className="mt-16 flex flex-col gap-5 border-t pt-6 text-[14px]"
          style={{ borderColor: BORDER }}
        >
          <span className="evidence text-[11px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
            One mark, three states · format proofs
          </span>
          <p className="max-w-2xl" style={{ color: MUTED }}>
            The proposal is a system, not a picture: below ~20 px the
            mark is the plain gapped track (the element would fuse — the
            favicon is the track alone). At display sizes the element
            waits at the gate. When something is actually running, it
            laps. Same geometry, one ink, three states.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <span
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{ borderColor: BORDER, backgroundColor: PANEL }}
            >
              <MarkGateDot size={40} ink={ACCENT} />
              <span className="evidence text-[11px]" style={{ color: MUTED }}>
                accent on dark
              </span>
            </span>
            <span
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{ borderColor: BORDER, backgroundColor: PANEL }}
            >
              <MarkGateDot size={40} ink={TEXT} />
              <span className="evidence text-[11px]" style={{ color: MUTED }}>
                paper on dark
              </span>
            </span>
            <span
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: LIGHT }}
            >
              <MarkGateDot size={40} ink={DARK_INK} />
              <span className="evidence text-[11px]" style={{ color: "hsl(220 5% 45%)" }}>
                ink on light
              </span>
            </span>
            <span
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{ borderColor: BORDER, backgroundColor: PANEL }}
            >
              <span
                className="flex size-7 items-center justify-center rounded-md"
                style={{ backgroundColor: BG }}
              >
                <Track size={16} ink={TEXT} stroke={8} />
              </span>
              <span
                className="flex size-7 items-center justify-center rounded-md"
                style={{ backgroundColor: LIGHT }}
              >
                <Track size={16} ink={DARK_INK} stroke={8} />
              </span>
              <span className="evidence text-[11px]" style={{ color: MUTED }}>
                favicon = track alone
              </span>
            </span>
          </div>
          <p className="max-w-2xl" style={{ color: MUTED }}>
            The green is the new accent under study — the dial lives on
            the{" "}
            <Link href="/explore/aurora" className="underline underline-offset-4" style={{ color: ACCENT }}>
              Aurora treatment
            </Link>
            .
          </p>
        </footer>
      </main>

      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Fragment+Mono:ital@0;1&family=Schibsted+Grotesk:ital,wght@0,400..700;1,400..700&display=swap"
      />
    </div>
  );
}
