import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Stadium mark riffs — Circuit",
};

// STADIUM RIFF SHEET (round five)
//
// Round-four verdict: the stadium shape works; the floating dot on top
// dies at small sizes. So every riff here builds the marker INTO the
// track — gaps, dashes, notches, seats, carves — instead of orbiting a
// satellite around it. Judged at 12 and 16 px first; that's where marks
// die. Rendered in the Sodium theme (acid yellow + Fragment Mono),
// which is the other half of the round-four verdict.
//
// Geometry notes: the base stadium is
//   M 22 14 H 42 A 18 18 0 0 1 42 50 H 22 A 18 18 0 0 1 22 14 Z
// (caps r18, perimeter ≈153.1). Normalized via pathLength=100:
// straights ≈13.06 each, caps ≈36.94 each. s=0 at the top-left corner,
// clockwise. Top-straight center s≈6.5; right-cap middle s≈31.5.

const BG = "hsl(220 3% 9%)";
const PANEL = "hsl(220 3% 13%)";
const BORDER = "hsl(220 3% 22%)";
const TEXT = "hsl(60 10% 92%)";
const MUTED = "hsl(220 3% 60%)";
const ACCENT = "hsl(57 95% 55%)";
const LIGHT = "hsl(60 12% 96%)";
const DARK_INK = "hsl(220 5% 12%)";

const css = `
body { background: ${BG}; }
.tx-stadium {
  background: ${BG};
  color: ${TEXT};
  font-family: "Bricolage Grotesque", system-ui, sans-serif;
}
.tx-stadium .evidence {
  font-family: "Fragment Mono", ui-monospace, monospace;
}
.tx-stadium ::selection { background: ${ACCENT}; color: ${BG}; }
`;

const STADIUM_D = "M 22 14 H 42 A 18 18 0 0 1 42 50 H 22 A 18 18 0 0 1 22 14 Z";

type MarkProps = { size?: number; ink: string; accent: string };

// Rounded-rectangle subpath, composable into compound paths (evenodd).
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

// 1 — PURE. The naked track, nothing else. The baseline every riff
// has to beat.
function MarkPure({ size = 96, ink }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path d={STADIUM_D} fill="none" stroke={ink} strokeWidth={6} strokeLinejoin="round" />
    </svg>
  );
}

// 2 — GAP. The track opened at the right cap: a C when you squint, a
// lap one stride from closing. The marker is an absence, so it can
// never be too small to see — it scales with the track.
function MarkGap({ size = 96, ink }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d={STADIUM_D}
        fill="none"
        stroke={ink}
        strokeWidth={6}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="88 12"
        strokeDashoffset={62.5}
      />
    </svg>
  );
}

// 3 — DASH. The runner is a lit stretch of the track itself, not a
// satellite. Accent segment overlaid on the full ink ring, centered
// on the top straight.
function MarkDash({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path d={STADIUM_D} fill="none" stroke={ink} strokeWidth={6} strokeLinejoin="round" />
      <path
        d={STADIUM_D}
        fill="none"
        stroke={accent}
        strokeWidth={6}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="10 90"
        strokeDashoffset={98.5}
      />
    </svg>
  );
}

// 4 — START. A break in the track with the start line crossing it.
// The tick is anchored to the track, twice the dot's mass, and reads
// at 12 px as "the place the lap begins."
function MarkStart({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d={STADIUM_D}
        fill="none"
        stroke={ink}
        strokeWidth={6}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="91 9"
        strokeDashoffset={89}
      />
      <path d="M 32 9.5 V 18.5" fill="none" stroke={accent} strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
}

// 5 — SEAT. A component seated on the right cap, wired in line — the
// Loop & Step idea rebuilt on stadium geometry. The pad overlaps the
// track instead of floating beside it.
function MarkSeat({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d="M 22 16 H 42 A 16 16 0 0 1 42 48 H 22 A 16 16 0 0 1 22 16 Z"
        fill="none"
        stroke={ink}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <rect x={51} y={26} width={12} height={12} rx={4} fill={accent} />
    </svg>
  );
}

// 6 — INSET. The track and the line you take through it: a second,
// thinner stadium nested inside. Two-color but survives mono — the
// nesting is the idea, not the hue.
function MarkInset({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path d={STADIUM_D} fill="none" stroke={ink} strokeWidth={6} strokeLinejoin="round" />
      <path
        d="M 24 21 H 40 A 11 11 0 0 1 40 43 H 24 A 11 11 0 0 1 24 21 Z"
        fill="none"
        stroke={accent}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 7 — TILE. The stadium as pure negative space, carved from a soft
// tile. The app-icon / favicon move: at 16 px it is simply the
// Circuit key.
function MarkTile({ size = 96, ink }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d={`${rrect(10, 10, 44, 44, 14)} M 25 24 H 39 A 8 8 0 0 1 39 40 H 25 A 8 8 0 0 1 25 24 Z`}
        fill={ink}
        fillRule="evenodd"
      />
    </svg>
  );
}

// 8 — SLANT. The Gap variant tilted off the horizontal. Same geometry,
// different temperament — the lap in motion instead of at rest.
function MarkSlant({ size = 96, ink }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <g transform="rotate(-18 32 32)">
        <path
          d={STADIUM_D}
          fill="none"
          stroke={ink}
          strokeWidth={6}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="88 12"
          strokeDashoffset={62.5}
        />
      </g>
    </svg>
  );
}

// The round-four mark, kept only for the footer comparison.
function MarkDotForReference({ size = 96, ink, accent }: MarkProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path d={STADIUM_D} fill="none" stroke={ink} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={32} cy={14} r={4.5} fill={accent} />
    </svg>
  );
}

const MARKS = [
  {
    id: "pure",
    name: "Pure",
    Mark: MarkPure,
    concept:
      "The naked track, nothing else. The baseline every riff has to beat — and a reminder the shape already carries the name.",
  },
  {
    id: "gap",
    name: "Gap",
    Mark: MarkGap,
    concept:
      "The track opened at the right cap: a C when you squint, a lap one stride from closing. An absence can't be too small to see — it scales with the track.",
  },
  {
    id: "dash",
    name: "Dash",
    Mark: MarkDash,
    concept:
      "The runner is a lit stretch of the track itself, not a satellite. This is also the variant that animates: the dash laps the circuit.",
  },
  {
    id: "start",
    name: "Start",
    Mark: MarkStart,
    concept:
      "A break in the track with the start line crossing it. Anchored to the track and twice the dot's mass — at 12 px it reads as 'where the lap begins.'",
  },
  {
    id: "seat",
    name: "Seat",
    Mark: MarkSeat,
    concept:
      "A component seated on the cap, wired in line — the round-three Loop & Step idea rebuilt on stadium geometry. Overlapping, not floating.",
  },
  {
    id: "inset",
    name: "Inset",
    Mark: MarkInset,
    concept:
      "The track and the line you take through it: a thinner stadium nested inside. The nesting is the idea, so it survives mono reproduction.",
  },
  {
    id: "tile",
    name: "Tile",
    Mark: MarkTile,
    concept:
      "The stadium as pure negative space, carved from a soft tile. The app-icon move; at 16 px it is simply the Circuit key.",
  },
  {
    id: "slant",
    name: "Slant",
    Mark: MarkSlant,
    concept:
      "The Gap variant tilted off the horizontal. Same geometry, different temperament — the lap in motion instead of at rest.",
  },
];

const SMALL_SIZES = [32, 24, 16, 12];

export default function StadiumSheet() {
  return (
    <div className="tx-stadium min-h-screen">
      <style>{css}</style>

      <nav
        className="evidence mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 text-[11px] uppercase tracking-[0.16em]"
        style={{ color: MUTED }}
      >
        <Link href="/explore">Explorations</Link>
        <div className="flex gap-4">
          <Link href="/explore/marks-2">Marks 2</Link>
          <span aria-current="page" className="underline" style={{ color: TEXT }}>
            Stadium
          </span>
          <Link href="/explore/sodium">Sodium</Link>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-5xl flex-col px-6 pb-24">
        <header className="mt-14 flex max-w-2xl flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Stadium riffs
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: MUTED }}>
            The round-four note: the stadium shape works, the floating dot
            dies small. So every riff here builds the marker into the
            track — gaps, dashes, start lines, seats, carves. The strip
            under each lockup runs 32 → 12 px, then the favicon chips on
            dark and on light (light renders mono — a mark that needs two
            colors to read isn&apos;t done). Judge the small end first.
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
                  {SMALL_SIZES.map((s) => (
                    <Mark key={s} size={s} ink={TEXT} accent={ACCENT} />
                  ))}
                  <span
                    className="flex size-7 items-center justify-center rounded-md"
                    style={{ backgroundColor: BG }}
                  >
                    <Mark size={16} ink={TEXT} accent={ACCENT} />
                  </span>
                  <span
                    className="flex size-7 items-center justify-center rounded-md"
                    style={{ backgroundColor: LIGHT }}
                  >
                    <Mark size={16} ink={DARK_INK} accent={DARK_INK} />
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
          className="mt-16 flex max-w-2xl flex-col gap-4 border-t pt-6 text-[14px]"
          style={{ borderColor: BORDER }}
        >
          <span className="evidence text-[11px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
            Why the dot died
          </span>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2">
              <MarkDotForReference size={16} ink={TEXT} accent={ACCENT} />
              <span style={{ color: MUTED }}>round four, 16 px</span>
            </span>
            <span className="flex items-center gap-2">
              <MarkGap size={16} ink={TEXT} accent={ACCENT} />
              <span style={{ color: MUTED }}>Gap, 16 px</span>
            </span>
            <span className="flex items-center gap-2">
              <MarkStart size={16} ink={TEXT} accent={ACCENT} />
              <span style={{ color: MUTED }}>Start, 16 px</span>
            </span>
          </div>
          <p style={{ color: MUTED }}>
            At 16 px the dot is barely a pixel of yellow off the track —
            decoration you have to take on faith. A gap or a crossing
            line is structural: it changes the silhouette, so it
            survives any size, any color count, any background. The full
            theme these sit in is on the{" "}
            <Link href="/explore/sodium" className="underline underline-offset-4" style={{ color: ACCENT }}>
              Sodium treatment
            </Link>
            .
          </p>
        </footer>
      </main>

      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..700&family=Fragment+Mono:ital@0;1&display=swap"
      />
    </div>
  );
}
