import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Logomark exploration, round two — Circuit",
};

// LOGOMARK SHEET, ROUND TWO
//
// Round one stayed inside ring + rounded square + dot; none landed.
// This round tests different formal FAMILIES: the route (a line you
// travel), the letterform, the signal, the schematic, the rotation.
// Drawn ink-first — form has to win before color is allowed to help.
// The one accent is a neutral azure, deliberately far from any palette
// decision.

const BG = "hsl(240 4% 9%)";
const PANEL = "hsl(240 4% 13%)";
const BORDER = "hsl(240 4% 21%)";
const TEXT = "hsl(40 8% 92%)";
const MUTED = "hsl(240 4% 58%)";
const ACCENT = "hsl(210 90% 65%)";

const css = `
body { background: ${BG}; }
.tx-marks2 {
  background: ${BG};
  color: ${TEXT};
  font-family: "Hanken Grotesk", system-ui, sans-serif;
}
.tx-marks2 .evidence {
  font-family: "JetBrains Mono", ui-monospace, monospace;
}
.tx-marks2 ::selection { background: ${ACCENT}; color: ${BG}; }
`;

type MarkProps = { size?: number; ink: string; accent: string };

// 1 — RETURN. The run-stage rail with a loop tied into it: a straight
// line that loops once and carries on. A true weave — the loop passes
// over the rail on the left and under it on the right.
function MarkReturn({ size = 96, ink }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path d="M 6 40 H 18.5" fill="none" stroke={ink} strokeWidth={5.5} strokeLinecap="round" />
      <path d="M 26 40 H 58" fill="none" stroke={ink} strokeWidth={5.5} strokeLinecap="round" />
      <circle
        cx={32}
        cy={30}
        r={14}
        fill="none"
        stroke={ink}
        strokeWidth={5.5}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="9.7 6 84.3"
      />
    </svg>
  );
}

// 2 — CHICANE. A closed course with one S-bend and a start line.
// "Circuit" in the racing sense: a loop you lap, with a place the
// track makes you slow down and take care.
function MarkChicane({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d="M 22 18 H 46 A 10 10 0 0 1 56 28 V 36 A 10 10 0 0 1 46 46 H 44 A 3 3 0 0 1 41 43 A 3 3 0 0 0 38 40 H 30 A 3 3 0 0 0 27 43 A 3 3 0 0 1 24 46 H 18 A 10 10 0 0 1 8 36 V 28 A 10 10 0 0 1 18 18 Z"
        fill="none"
        stroke={ink}
        strokeWidth={5.5}
        strokeLinejoin="round"
      />
      <path d="M 30 14.5 V 21.5" stroke={accent} strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
}

// 3 — COUNTER-C. A soft tile with a C-shaped track carved out of it.
// The letter is pure negative space; at favicon size it is simply
// "the Circuit key".
function MarkCounterC({ size = 96, ink }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d={[
          "M 24 10 h 16 a 14 14 0 0 1 14 14 v 16 a 14 14 0 0 1 -14 14 h -16 a 14 14 0 0 1 -14 -14 v -16 a 14 14 0 0 1 14 -14 Z",
          "M 42.72 41 A 14 14 0 1 1 42.72 23 L 37.36 27.5 A 7 7 0 1 0 37.36 36.5 Z",
        ].join(" ")}
        fill={ink}
        fillRule="evenodd"
      />
    </svg>
  );
}

// 4 — TRIO. Three identical arcs in rotation: plan, work, check —
// a cycle with no arrowheads, which is what keeps it out of
// recycling-symbol territory.
function MarkTrio({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path d="M 35.3 13.3 A 19 19 0 0 1 49.85 38.5" fill="none" stroke={ink} strokeWidth={6.5} strokeLinecap="round" />
      <path d="M 46.56 44.21 A 19 19 0 0 1 17.45 44.21" fill="none" stroke={ink} strokeWidth={6.5} strokeLinecap="round" />
      <path d="M 14.15 38.5 A 19 19 0 0 1 28.7 13.29" fill="none" stroke={accent} strokeWidth={6.5} strokeLinecap="round" />
    </svg>
  );
}

// 5 — CLOCK. A square wave bent into a ring: the clock signal that
// drives a real circuit, closed into a loop. The most literal
// "circuit" of the set without drawing a chip.
function crenellatedRing(cx: number, cy: number, R: number, r: number, teeth: number) {
  const seg = (Math.PI * 2) / (teeth * 2);
  const pt = (radius: number, a: number) =>
    `${(cx + radius * Math.cos(a)).toFixed(2)} ${(cy + radius * Math.sin(a)).toFixed(2)}`;
  let d = `M ${pt(R, 0)} `;
  for (let i = 0; i < teeth; i++) {
    const a0 = i * 2 * seg;
    const a1 = a0 + seg;
    const a2 = a1 + seg;
    d += `A ${R} ${R} 0 0 1 ${pt(R, a1)} L ${pt(r, a1)} A ${r} ${r} 0 0 1 ${pt(r, a2)} `;
    d += i === teeth - 1 ? "Z" : `L ${pt(R, a2)} `;
  }
  return d;
}

function MarkClock({ size = 96, ink }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d={crenellatedRing(32, 32, 20, 14, 4)}
        fill="none"
        stroke={ink}
        strokeWidth={5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 6 — SWITCH. An open knife switch, a breath away from closing the
// loop. The schematic family: honest electronics, no chip clichés.
function MarkSwitch({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path d="M 6 40 H 11" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
      <path d="M 53 40 H 58" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
      <circle cx={16.5} cy={40} r={3.8} fill={ink} />
      <circle cx={47.5} cy={40} r={3.8} fill={ink} />
      <path d="M 16.5 40 L 44 24" fill="none" stroke={accent} strokeWidth={5.5} strokeLinecap="round" />
    </svg>
  );
}

// 7 — STADIUM. The closed course at its most reduced: a pill track
// and the one runner on it. Stadium geometry is rarer than the
// circle and still unmistakably a loop.
function MarkStadium({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d="M 22 14 H 42 A 18 18 0 0 1 42 50 H 22 A 18 18 0 0 1 22 14 Z"
        fill="none"
        stroke={ink}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <circle cx={32} cy={14} r={4.5} fill={accent} />
    </svg>
  );
}

// 8 — BRACKETS. Two code brackets curved toward each other until
// they almost close a ring; the pulse sits in the seam. The most
// "this is a coding tool" of the set.
function MarkBrackets({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d="M 26 13 H 19 A 6 6 0 0 0 13 19 V 45 A 6 6 0 0 0 19 51 H 26"
        fill="none"
        stroke={ink}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 38 13 H 45 A 6 6 0 0 1 51 19 V 45 A 6 6 0 0 1 45 51 H 38"
        fill="none"
        stroke={ink}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={32} cy={13} r={4} fill={accent} />
    </svg>
  );
}

const MARKS = [
  {
    id: "return",
    name: "Return",
    Mark: MarkReturn,
    concept:
      "The rail with a loop tied into it: a run that comes back. A true weave — over on the left, under on the right.",
  },
  {
    id: "chicane",
    name: "Chicane",
    Mark: MarkChicane,
    concept:
      "Circuit in the racing sense: a closed course with one S-bend where the track makes you take care, and a start line.",
  },
  {
    id: "counter-c",
    name: "Counter-C",
    Mark: MarkCounterC,
    concept:
      "A soft tile with a C-shaped track carved from it. The letter is pure negative space; at 16px it's simply the Circuit key.",
  },
  {
    id: "trio",
    name: "Trio",
    Mark: MarkTrio,
    concept:
      "Three arcs in rotation — plan, work, check. A cycle with no arrowheads, which keeps it out of recycling-symbol territory.",
  },
  {
    id: "clock",
    name: "Clock",
    Mark: MarkClock,
    concept:
      "A square wave bent into a ring: the clock signal that drives a real circuit, closed into a loop.",
  },
  {
    id: "switch",
    name: "Switch",
    Mark: MarkSwitch,
    concept:
      "An open knife switch, a breath from closing the loop. Honest schematic language, no chip clichés.",
  },
  {
    id: "stadium",
    name: "Stadium",
    Mark: MarkStadium,
    concept:
      "The closed course at its most reduced: a pill track, one runner. Rarer than a circle, still unmistakably a loop.",
  },
  {
    id: "brackets",
    name: "Brackets",
    Mark: MarkBrackets,
    concept:
      "Two code brackets curved until they almost close a ring; the pulse sits in the seam. The most 'coding tool' of the set.",
  },
];

export default function MarksSheetTwo() {
  return (
    <div className="tx-marks2 min-h-screen">
      <style>{css}</style>

      <nav
        className="evidence mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 text-[11px] uppercase tracking-[0.16em]"
        style={{ color: MUTED }}
      >
        <Link href="/explore">Explorations</Link>
        <div className="flex gap-4">
          <Link href="/explore/marks">Marks 1</Link>
          <span aria-current="page" className="underline" style={{ color: TEXT }}>
            Marks 2
          </span>
          <Link href="/explore/palettes-2">Palettes 2</Link>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-5xl flex-col px-6 pb-24">
        <header className="mt-14 flex max-w-2xl flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Logomark candidates, round two
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: MUTED }}>
            Round one stayed inside ring-and-rounded-square; this round
            tests different families entirely — the route you travel, the
            letterform, the clock signal, the schematic, the rotation.
            Drawn ink-first: form has to win before color is allowed to
            help. The blue is a placeholder, not a palette vote.
          </p>
        </header>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {MARKS.map(({ id, name, Mark, concept }, i) => (
            <li
              key={id}
              className="flex flex-col gap-5 rounded-2xl border p-6"
              style={{ borderColor: BORDER, backgroundColor: PANEL }}
            >
              <span className="evidence text-[11px] uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
                {String(i + 1).padStart(2, "0")} · {name}
              </span>

              <div className="flex items-center justify-center py-4">
                <Mark size={120} ink={TEXT} accent={ACCENT} />
              </div>

              <div
                className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
                style={{ borderColor: BORDER }}
              >
                <span className="flex items-center gap-2.5">
                  <Mark size={22} ink={TEXT} accent={ACCENT} />
                  <span className="text-[19px] font-semibold tracking-tight">circuit</span>
                </span>
                <span className="flex items-center gap-3">
                  <Mark size={24} ink={TEXT} accent={ACCENT} />
                  <Mark size={16} ink={TEXT} accent={ACCENT} />
                  <span
                    className="flex size-7 items-center justify-center rounded-md"
                    style={{ backgroundColor: BG }}
                  >
                    <Mark size={16} ink={TEXT} accent={ACCENT} />
                  </span>
                </span>
              </div>

              <p className="text-[14px] leading-relaxed" style={{ color: MUTED }}>
                {concept}
              </p>
            </li>
          ))}
        </ul>

        <footer
          className="mt-16 flex max-w-2xl flex-col gap-3 border-t pt-6 text-[14px]"
          style={{ borderColor: BORDER }}
        >
          <span className="evidence text-[11px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
            Notes
          </span>
          <p style={{ color: MUTED }}>
            Families represented: route (Return, Chicane, Stadium),
            letterform (Counter-C, Brackets), signal (Clock), schematic
            (Switch), rotation (Trio). Color territory is explored
            separately on the{" "}
            <Link href="/explore/palettes-2" className="underline underline-offset-4" style={{ color: ACCENT }}>
              new palette sheet
            </Link>
            .
          </p>
        </footer>
      </main>

      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:ital,wght@0,400..600;1,400&display=swap"
      />
    </div>
  );
}
