import type { Metadata } from "next";
import Link from "next/link";
import { GapChapter } from "@/components/run-stage/gap-chapter";

export const metadata: Metadata = {
  title: "Sodium — Circuit",
};

// SODIUM (round five)
//
// The round-four verdict made this the theme to deep-riff: Fragment
// Mono and the acid yellow look, on the Ember document bones. Named
// for the sodium-vapor lamp — the one yellow light every street
// trusts. Near-neutral graphite with a breath of blue, one signal
// color, mono reserved for evidence. The header mark is the Dash
// stadium riff in motion: the lit stretch laps the track.
//
// Open question carried on the page itself: the prose face. The page
// defaults to Bricolage Grotesque, but the type-studies section sets
// the same headline in three candidates side by side.

const BG = "hsl(220 3% 9%)";
const PANEL = "hsl(220 3% 13%)";
const BORDER = "hsl(220 3% 22%)";
const TEXT = "hsl(60 10% 92%)";
const MUTED = "hsl(220 3% 60%)";
const ACCENT = "hsl(57 95% 55%)";
const SECOND = "hsl(220 15% 72%)";
const ERROR = "hsl(0 75% 62%)";

const PAPER = "hsl(220 20% 97%)";
const PAPER_INK = "hsl(220 10% 15%)";
const PAPER_MUTED = "hsl(220 5% 48%)";
const HIGHLIGHT = "hsl(57 95% 60%)";

const STADIUM_D = "M 22 14 H 42 A 18 18 0 0 1 42 50 H 22 A 18 18 0 0 1 22 14 Z";

const css = `
body { background: ${BG}; }
.tx-sodium {
  --background: ${BG};
  background: ${BG};
  color: ${TEXT};
  font-family: "Bricolage Grotesque", system-ui, sans-serif;
}
.tx-sodium .evidence {
  font-family: "Fragment Mono", ui-monospace, monospace;
}
.tx-sodium svg rect { rx: 5px; }
.tx-sodium .rs-gap2-without { color: hsl(220 3% 46%); }
.tx-sodium .rs-gap2-with { color: ${ACCENT}; }
.tx-sodium .rs-gap2-pulse-ink { color: hsl(60 15% 94%); }
.tx-sodium .rs-gap2-error { color: ${ERROR}; }
.tx-sodium figcaption span { color: ${MUTED}; }
.tx-sodium ::selection { background: ${ACCENT}; color: ${BG}; }
@keyframes sodium-lap {
  from { stroke-dashoffset: 98.5; }
  to { stroke-dashoffset: -1.5; }
}
@media (prefers-reduced-motion: no-preference) {
  .sodium-lap {
    animation: sodium-lap 5.5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
  }
}
`;

// The Dash stadium riff, animated: the lit stretch laps the track,
// easing through the start line once per lap. Static (dash parked on
// the top straight) when the reader prefers reduced motion.
function LapMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path d={STADIUM_D} fill="none" stroke={TEXT} strokeWidth={6} strokeLinejoin="round" />
      <path
        className="sodium-lap"
        d={STADIUM_D}
        fill="none"
        stroke={ACCENT}
        strokeWidth={6}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="10 90"
        strokeDashoffset={98.5}
      />
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

const TYPE_STUDIES = [
  {
    id: "bricolage",
    label: "bricolage grotesque",
    family: '"Bricolage Grotesque", system-ui, sans-serif',
    note: "Warm in the joints, a little opinionated. The most personality of the three — approachable without going soft.",
  },
  {
    id: "schibsted",
    label: "schibsted grotesk",
    family: '"Schibsted Grotesk", system-ui, sans-serif',
    note: "Newsroom grotesk: even color, confident weight. The most professional read; personality lives in the details.",
  },
  {
    id: "archivo",
    label: "archivo",
    family: '"Archivo", system-ui, sans-serif',
    note: "Neutral workhorse with a slightly technical squareness. Disappears behind the words — the safest, and knows it.",
  },
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

export default function SodiumTreatment() {
  return (
    <div className="tx-sodium min-h-screen">
      <style>{css}</style>

      <nav
        className="evidence mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4 text-[11px] uppercase tracking-[0.16em]"
        style={{ color: MUTED }}
      >
        <Link href="/explore">Explorations</Link>
        <div className="flex gap-4">
          <Link href="/explore/stadium">Stadium riffs</Link>
          <span aria-current="page" className="underline" style={{ color: TEXT }}>
            Sodium
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

        {/* Type studies: the prose face is the open question */}
        <section className="mt-24 flex flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            The prose face, three ways
          </h2>
          <p className="max-w-2xl text-[15px] leading-relaxed" style={{ color: MUTED }}>
            Fragment Mono is settled — it carries every real artifact on the
            page. The face for human prose is the open seat. Same headline,
            three candidates; this page is set in the first.
          </p>
          <ul className="flex flex-col gap-4">
            {TYPE_STUDIES.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-2 rounded-xl border p-5"
                style={{ borderColor: BORDER, backgroundColor: PANEL }}
              >
                <span className="evidence text-[11px] uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
                  {t.label}
                </span>
                <span
                  className="text-balance text-2xl font-semibold leading-snug tracking-tight"
                  style={{ fontFamily: t.family }}
                >
                  The process your coding agent follows.
                </span>
                <p className="text-[14px] leading-relaxed" style={{ color: MUTED }}>
                  {t.note}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Yellow's two registers: ink on dark, marker on light */}
        <section className="mt-24 flex flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Yellow&apos;s two registers
          </h2>
          <p className="max-w-2xl text-[15px] leading-relaxed" style={{ color: MUTED }}>
            On dark, the yellow is ink: the active step, the lit stretch of
            track, the one signal on the page. On light it stops being ink
            and becomes a marker — a highlighter pass over paper. Yellow
            text on white is never allowed; yellow behind text always works.
          </p>
          <div
            className="flex flex-col gap-3 rounded-xl border p-6"
            style={{ backgroundColor: PAPER, borderColor: "hsl(220 12% 86%)", color: PAPER_INK }}
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
            Sodium
          </span>
          <p className="max-w-2xl" style={{ color: MUTED }}>
            Named for the sodium-vapor lamp — the one yellow light every
            street trusts. Near-neutral graphite with a breath of blue,
            acid yellow as the only signal, Fragment Mono reserved for
            evidence. Prose face under study above. The mark is the Dash
            stadium riff; in motion, the lit stretch laps the track.
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
        href="https://fonts.googleapis.com/css2?family=Archivo:wght@400..700&family=Bricolage+Grotesque:opsz,wght@12..96,300..700&family=Fragment+Mono:ital@0;1&family=Schibsted+Grotesk:wght@400..700&display=swap"
      />
    </div>
  );
}
