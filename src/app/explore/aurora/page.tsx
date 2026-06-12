import type { Metadata } from "next";
import Link from "next/link";
import { GapChapter } from "@/components/run-stage/gap-chapter";

export const metadata: Metadata = {
  title: "Aurora — Circuit",
};

// AURORA (round six)
//
// Sodium's bones with the round-five verdict applied: Schibsted
// Grotesk for prose (chosen), Fragment Mono for evidence (settled),
// and the accent steered out of acid yellow into the green-turquoise-
// lime band. Named for the other trusted night light — the green that
// hangs in a dark sky.
//
// The accent is a dial, not a single point: the strip below the type
// section runs lime → turquoise. The page default deliberately sits on
// the turquoise side of the band, keeping distance from terminal/
// Matrix green (~120) and Spotify (~141).
//
// The header mark is the round-six system mark: the gapped track with
// the element waiting at the gate, lapping the track on a slow cycle —
// all one ink, per the single-color rule.

const BG = "hsl(220 3% 9%)";
const PANEL = "hsl(220 3% 13%)";
const BORDER = "hsl(220 3% 22%)";
const TEXT = "hsl(60 10% 92%)";
const MUTED = "hsl(220 3% 60%)";
const ACCENT = "hsl(163 95% 47%)";
const SECOND = "hsl(220 15% 72%)";
const ERROR = "hsl(0 75% 62%)";

const PAPER = "hsl(180 20% 97%)";
const PAPER_INK = "hsl(220 10% 15%)";
const PAPER_MUTED = "hsl(220 5% 48%)";
const HIGHLIGHT = "hsl(160 85% 62%)";

const STADIUM_D = "M 23 15 H 41 A 17 17 0 0 1 41 49 H 23 A 17 17 0 0 1 23 15 Z";

const ACCENT_DIAL = [
  { id: "lime", label: "lime", hsl: "hsl(90 85% 52%)" },
  { id: "green", label: "green", hsl: "hsl(135 80% 48%)" },
  { id: "spring", label: "spring", hsl: "hsl(150 90% 47%)" },
  { id: "aurora", label: "aurora — page default", hsl: "hsl(163 95% 47%)" },
  { id: "turquoise", label: "turquoise", hsl: "hsl(175 90% 44%)" },
];

const css = `
body { background: ${BG}; }
.tx-aurora {
  --background: ${BG};
  background: ${BG};
  color: ${TEXT};
  font-family: "Schibsted Grotesk", system-ui, sans-serif;
}
.tx-aurora .evidence {
  font-family: "Fragment Mono", ui-monospace, monospace;
}
.tx-aurora svg rect { rx: 5px; }
.tx-aurora .rs-gap2-without { color: hsl(220 3% 46%); }
.tx-aurora .rs-gap2-with { color: ${ACCENT}; }
.tx-aurora .rs-gap2-pulse-ink { color: hsl(160 15% 94%); }
.tx-aurora .rs-gap2-error { color: ${ERROR}; }
.tx-aurora figcaption span { color: ${MUTED}; }
.tx-aurora ::selection { background: ${ACCENT}; color: ${BG}; }
@keyframes aurora-lap {
  from { stroke-dashoffset: 68.7; }
  to { stroke-dashoffset: -31.3; }
}
@media (prefers-reduced-motion: no-preference) {
  .aurora-lap {
    animation: aurora-lap 5.5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
  }
}
`;

// The round-six system mark in its running state: paper track, the
// element lit in accent, lapping. The resting mark is one ink; the
// running state is UI, where color exists (in one ink the element
// would vanish against the track). Reduced motion parks it at the gate.
function LapMark({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d={STADIUM_D}
        fill="none"
        stroke={TEXT}
        strokeWidth={8}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="84 16"
        strokeDashoffset={60.7}
      />
      <path
        className="aurora-lap"
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

// The resting mark: track alone, element home at the gate.
function GateMark({ size = 24, ink }: { size?: number; ink: string }) {
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

function Chip({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="evidence inline-flex items-center rounded-full border px-3 py-1 text-[11px]"
      style={{ borderColor: BORDER, color: color ?? MUTED }}
    >
      {children}
    </span>
  );
}

// The human margin note over the precise figure.
function Annotation({ label }: { label: string }) {
  return (
    <div className="flex items-end justify-end gap-2 pr-2" aria-hidden="true">
      <span
        className="text-[14px] italic"
        style={{ color: SECOND, transform: "rotate(-2deg)" }}
      >
        {label}
      </span>
      <svg viewBox="0 0 80 36" className="h-8 w-16">
        <path
          d="M 6 6 Q 30 2 50 14 T 72 30"
          fill="none"
          stroke={SECOND}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <path
          d="M 62 28 L 72 30 L 68 21"
          fill="none"
          stroke={SECOND}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

const runLines: { text: string; kind?: "user" | "mark" | "done" }[] = [
  { text: "/circuit:run build the circuit landing page from the outline", kind: "user" },
  { text: "CIRCUIT", kind: "mark" },
  { text: "⎿ Chose the Build flow." },
  { text: "⎿ Framing the work..." },
  { text: "⎿ Planning the work..." },
  { text: "⎿ Asking the specialist to make the change..." },
  { text: "⎿ Finished the specialist pass." },
  { text: "⎿ Checking the work..." },
  { text: "⎿ Build complete. Verification passed, review accepted.", kind: "done" },
];

function Hi({ children }: { children: React.ReactNode }) {
  return (
    <mark
      style={{
        backgroundColor: HIGHLIGHT,
        color: PAPER_INK,
        padding: "0.05em 0.18em",
        borderRadius: "0.25em",
      }}
    >
      {children}
    </mark>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block size-4 rounded-md"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

export default function AuroraTreatment() {
  return (
    <div className="tx-aurora min-h-screen">
      <style>{css}</style>

      <nav
        className="evidence mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4 text-[11px] uppercase tracking-[0.16em]"
        style={{ color: MUTED }}
      >
        <Link href="/explore">Explorations</Link>
        <div className="flex gap-4">
          <Link href="/explore/mark">The mark</Link>
          <Link href="/explore/sodium">Sodium</Link>
          <span aria-current="page" className="underline" style={{ color: TEXT }}>
            Aurora
          </span>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-3xl flex-col px-6 pb-24">
        {/* Repo-style document head */}
        <header className="mt-14 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <LapMark size={30} />
            <span className="text-2xl font-semibold tracking-tight">circuit</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip>v0.1.0-alpha.7</Chip>
            <Chip>MIT</Chip>
            <Chip>Claude Code</Chip>
            <Chip>Codex</Chip>
            <Chip color={SECOND}>
              <a href="https://github.com/petekp/circuit">GitHub ↗</a>
            </Chip>
          </div>

          <h1 className="mt-2 max-w-2xl text-balance text-3xl font-semibold leading-snug tracking-tight">
            The process your coding agent follows.
          </h1>

          <p className="max-w-2xl text-[17px] leading-relaxed" style={{ color: MUTED }}>
            Coding agents aren&apos;t unreliable — your process is. Agents
            learned to work from us, and like us, they do their best work
            inside a real process. Circuit is that process: it moves the work
            step to step and keeps a written record.
          </p>

          {/* Install as a real artifact, not a CTA button */}
          <div
            className="evidence flex flex-col gap-1 rounded-xl border p-4 text-[13.5px]"
            style={{ borderColor: BORDER, backgroundColor: PANEL }}
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
                install — claude code
              </span>
              <span
                className="rounded-full border px-2.5 py-0.5 text-[11px]"
                style={{ borderColor: BORDER, color: ACCENT }}
              >
                copy
              </span>
            </div>
            <span>/plugin marketplace add petekp/circuit</span>
            <span>/plugin install circuit@circuit</span>
          </div>

          <p className="text-[15px]" style={{ color: MUTED }}>
            <Link href="/docs" className="underline underline-offset-4" style={{ color: SECOND }}>
              Read the docs
            </Link>{" "}
            · or scroll for the long version.
          </p>
        </header>

        {/* Gap section, document-style */}
        <section className="mt-24 flex flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            What your agent works without
          </h2>
          <div className="flex flex-col gap-5 text-[16px] leading-relaxed" style={{ color: MUTED }}>
            <p>
              Watch your agent work. It reads the codebase and the AGENTS.md,
              checks what CI will catch, and improvises a process on the spot.
              It survives on notes to itself. When the notes run out, you
              become the working memory.
            </p>
            <p className="font-medium" style={{ color: TEXT }}>
              Your agent learned this work from engineers who had a real
              process. Every one of these gaps can be filled.
            </p>
          </div>

          <div className="mt-2 flex flex-col gap-1">
            <Annotation label="the record rides with the run" />
            <GapChapter />
            <p className="evidence text-[12px]" style={{ color: MUTED }}>
              Figure 1 · The same work, two worlds. The lower lane files its
              record at the finish; the next run starts already knowing it.
            </p>
          </div>
        </section>

        {/* Evidence: the only other mono on the page is a real transcript */}
        <section className="mt-24 flex flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            One command, a whole process
          </h2>
          <div
            className="evidence flex flex-col gap-1.5 rounded-xl border p-5 text-[13.5px] leading-relaxed"
            style={{ borderColor: BORDER, backgroundColor: PANEL }}
          >
            <div className="pb-2 text-[11px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
              claude › a real run
            </div>
            {runLines.map((line) => (
              <span
                key={line.text}
                style={{
                  color:
                    line.kind === "user"
                      ? TEXT
                      : line.kind === "mark"
                        ? ACCENT
                        : line.kind === "done"
                          ? SECOND
                          : MUTED,
                  fontWeight: line.kind === "user" || line.kind === "done" ? 600 : 400,
                }}
              >
                {line.text}
              </span>
            ))}
          </div>
        </section>

        {/* The accent dial: lime → turquoise */}
        <section className="mt-24 flex flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            The dial, lime to turquoise
          </h2>
          <p className="max-w-2xl text-[15px] leading-relaxed" style={{ color: MUTED }}>
            The verdict said greenish-turquoise-lime, which is a band, not
            a point. Five stops below; the page is set in aurora. The
            middle of the band is where terminal green and Spotify live,
            so the default deliberately leans turquoise — green enough to
            glow, far enough to stay ours.
          </p>
          <ul className="flex flex-col gap-3">
            {ACCENT_DIAL.map((stop) => (
              <li
                key={stop.id}
                className="flex items-center justify-between gap-4 rounded-xl border px-5 py-4"
                style={{
                  borderColor: stop.id === "aurora" ? stop.hsl : BORDER,
                  backgroundColor: PANEL,
                }}
              >
                <span className="flex items-center gap-4">
                  <GateMark size={28} ink={stop.hsl} />
                  <span className="text-[16px] font-medium" style={{ color: stop.hsl }}>
                    The active step, lit in {stop.label.split(" ")[0]}.
                  </span>
                </span>
                <span className="evidence shrink-0 text-[11px]" style={{ color: MUTED }}>
                  {stop.hsl} · {stop.label}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Green's two registers: ink on dark, marker on light */}
        <section className="mt-24 flex flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            The accent&apos;s two registers
          </h2>
          <p className="max-w-2xl text-[15px] leading-relaxed" style={{ color: MUTED }}>
            Same rule Sodium proved with yellow: on dark, the green is
            ink — the active step, the lit track, the one signal. On
            light it becomes a marker behind the words, never colored
            text on white.
          </p>
          <div
            className="flex flex-col gap-3 rounded-xl border p-6"
            style={{ backgroundColor: PAPER, borderColor: "hsl(180 12% 86%)", color: PAPER_INK }}
          >
            <span className="evidence text-[11px] uppercase tracking-[0.16em]" style={{ color: PAPER_MUTED }}>
              light register — docs, readme
            </span>
            <p className="max-w-2xl text-[16px] leading-relaxed">
              Circuit moves the work <Hi>step to step</Hi> and keeps{" "}
              <Hi>a written record</Hi>. The agent stays the capable part;
              the process is the part you can finally <Hi>trust</Hi>.
            </p>
            <p className="evidence text-[13px]" style={{ color: PAPER_MUTED }}>
              /plugin install circuit@circuit
            </p>
          </div>
        </section>

        {/* Ingredients */}
        <footer
          className="mt-24 flex flex-col gap-3 border-t pt-6 text-[14px]"
          style={{ borderColor: BORDER }}
        >
          <span className="evidence text-[11px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
            Aurora
          </span>
          <p className="max-w-2xl" style={{ color: MUTED }}>
            Named for the other trusted night light — the green that hangs
            in a dark sky. Same graphite as Sodium, accent moved into the
            green-turquoise band, Schibsted Grotesk for prose (settled),
            Fragment Mono for evidence (settled). The header mark is the
            round-six system mark in its running state: the element lit
            in accent, lapping the paper track. At rest, and in any logo
            placement, the mark is one ink.
          </p>
          <div className="flex items-center gap-2">
            <Swatch color={BG} />
            <Swatch color={PANEL} />
            <Swatch color={TEXT} />
            <Swatch color={ACCENT} />
            <Swatch color={SECOND} />
            <Swatch color={ERROR} />
          </div>
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
