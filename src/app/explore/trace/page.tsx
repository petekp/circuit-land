import type { Metadata } from "next";
import Link from "next/link";
import { GapChapter } from "@/components/run-stage/gap-chapter";

export const metadata: Metadata = {
  title: "Synthesis — Trace",
};

// SYNTHESIS — TRACE (overnight round)
//
// Ember's document bones + the Trace palette + the Loop & Step mark.
// Copper because that is what real circuits are made of — PCB traces on
// a dark substrate — and because "trace" is already Circuit vocabulary:
// the trace is the run's record. One identity, two registers: this dark
// page, and the Ledger light variant previewed near the foot.

const BG = "hsl(20 10% 8%)";
const PANEL = "hsl(20 9% 12%)";
const BORDER = "hsl(22 10% 20%)";
const TEXT = "hsl(34 25% 90%)";
const MUTED = "hsl(28 8% 58%)";
const COPPER = "hsl(18 72% 58%)";
const ICE = "hsl(204 45% 72%)";
const ROSE = "hsl(355 70% 62%)";

// Ledger: the same identity in daylight, for the inline preview.
const L_BG = "hsl(40 30% 96%)";
const L_PANEL = "hsl(40 28% 92%)";
const L_BORDER = "hsl(36 18% 80%)";
const L_TEXT = "hsl(24 14% 16%)";
const L_MUTED = "hsl(28 10% 42%)";
const L_COPPER = "hsl(18 70% 46%)";

const css = `
body { background: ${BG}; }
.tx-trace {
  --background: ${BG};
  background: ${BG};
  color: ${TEXT};
  font-family: "Hanken Grotesk", system-ui, sans-serif;
}
.tx-trace .evidence {
  font-family: "JetBrains Mono", ui-monospace, monospace;
}
.tx-trace svg rect { rx: 5px; }
.tx-trace .rs-gap2-without { color: hsl(26 6% 46%); }
.tx-trace .rs-gap2-with { color: ${COPPER}; }
.tx-trace .rs-gap2-pulse-ink { color: hsl(34 30% 93%); }
.tx-trace .rs-gap2-error { color: ${ROSE}; }
.tx-trace figcaption span { color: ${MUTED}; }
.tx-trace ::selection { background: ${COPPER}; color: ${BG}; }
@media (prefers-reduced-motion: no-preference) {
  .tx-trace .mark-sweep {
    animation: trace-sweep 4.5s ease-in-out infinite;
  }
  @keyframes trace-sweep {
    from { stroke-dashoffset: 12; }
    to { stroke-dashoffset: -88; }
  }
}
`;

// The Loop & Step mark, live: a copper pulse runs the ring, disappears
// into the step, and re-emerges on the far side. The loop, closing.
function LiveMark({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d="M 51.75 28.87 A 20 20 0 1 1 35.13 12.25"
        fill="none"
        stroke={TEXT}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <path
        className="mark-sweep"
        d="M 51.75 28.87 A 20 20 0 1 1 35.13 12.25"
        fill="none"
        stroke={COPPER}
        strokeWidth={7}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="12 88"
        strokeDashoffset={12}
        opacity={0.9}
      />
      <path
        d="M 43.1 9.3 h 6 a 5.5 5.5 0 0 1 5.5 5.5 v 6 a 5.5 5.5 0 0 1 -5.5 5.5 h -6 a 5.5 5.5 0 0 1 -5.5 -5.5 v -6 a 5.5 5.5 0 0 1 5.5 -5.5 Z"
        fill={COPPER}
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

function Annotation({ label }: { label: string }) {
  return (
    <div className="flex items-end justify-end gap-2 pr-2" aria-hidden="true">
      <span
        className="text-[14px] italic"
        style={{ color: ICE, transform: "rotate(-2deg)" }}
      >
        {label}
      </span>
      <svg viewBox="0 0 80 36" className="h-8 w-16">
        <path
          d="M 6 6 Q 30 2 50 14 T 72 30"
          fill="none"
          stroke={ICE}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <path
          d="M 62 28 L 72 30 L 68 21"
          fill="none"
          stroke={ICE}
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

const principles = [
  {
    name: "Document, not poster",
    detail:
      "The page is a repo artifact: badge chips, a command block for install, figures with numbered captions, a real transcript as proof. That's what open source looks like; SaaS looks like everything else.",
  },
  {
    name: "Mono is evidence",
    detail:
      "JetBrains Mono appears only on real artifacts — commands, transcripts, captions. Human prose gets a humanist face (Hanken Grotesk). If it's in mono, you can trust it happened.",
  },
  {
    name: "Copper, two registers",
    detail:
      "Copper on warm near-black for dark; the same copper on warm paper for light. Copper is what actual circuits are made of, and 'trace' is already our word for the run's record. Nobody in dev tools owns it.",
  },
  {
    name: "Soft geometry",
    detail:
      "Rounded pads, rounded panels, rounded chips — down to the diagram. The terminal register without the terminal's sharp edges.",
  },
  {
    name: "One vocabulary everywhere",
    detail:
      "Ring, rounded step, pulse dot. The logomark, the diagrams, and the favicon are built from the same three parts, so the identity scales from 16px to a hero figure.",
  },
  {
    name: "The human hand",
    detail:
      "One ice-blue annotation per figure, slightly rotated, hand-drawn arrow. The warmth that says people work here — used sparingly so it stays a note, not a theme.",
  },
];

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block size-4 rounded-md"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

export default function TraceSynthesis() {
  return (
    <div className="tx-trace min-h-screen">
      <style>{css}</style>

      <nav
        className="evidence mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4 text-[11px] uppercase tracking-[0.16em]"
        style={{ color: MUTED }}
      >
        <Link href="/explore">Explorations</Link>
        <div className="flex gap-4">
          <Link href="/explore/marks">Marks</Link>
          <Link href="/explore/palettes">Palettes</Link>
          <span aria-current="page" className="underline" style={{ color: TEXT }}>
            Synthesis
          </span>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-3xl flex-col px-6 pb-24">
        {/* Repo-style document head */}
        <header className="mt-14 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <LiveMark size={28} />
            <span className="text-2xl font-semibold tracking-tight">circuit</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip>v0.1.0-alpha.7</Chip>
            <Chip>MIT</Chip>
            <Chip>Claude Code</Chip>
            <Chip>Codex</Chip>
            <Chip color={ICE}>
              <a href="https://github.com/petekp/circuit">GitHub ↗</a>
            </Chip>
          </div>

          <h1 className="mt-2 max-w-2xl text-balance text-3xl font-semibold leading-snug tracking-tight">
            The process your coding agent follows.
          </h1>

          <p className="max-w-2xl text-[17px] leading-relaxed" style={{ color: MUTED }}>
            Coding agents aren&apos;t unreliable — your process is. Agents
            learned to work from us, and like us, they do their best work
            inside a real process. Circuit is that process: the practices
            good teams run by, encoded, so you don&apos;t have to keep up
            with them yourself.
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
                style={{ borderColor: BORDER, color: COPPER }}
              >
                copy
              </span>
            </div>
            <span>/plugin marketplace add petekp/circuit</span>
            <span>/plugin install circuit@circuit</span>
          </div>

          <p className="text-[15px]" style={{ color: MUTED }}>
            <Link href="/docs" className="underline underline-offset-4" style={{ color: ICE }}>
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
                        ? COPPER
                        : line.kind === "done"
                          ? ICE
                          : MUTED,
                  fontWeight: line.kind === "user" || line.kind === "done" ? 600 : 400,
                }}
              >
                {line.text}
              </span>
            ))}
          </div>
        </section>

        {/* Two registers: the same identity in daylight */}
        <section className="mt-24 flex flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            One identity, two registers
          </h2>
          <p className="max-w-2xl text-[16px] leading-relaxed" style={{ color: MUTED }}>
            Copper carries across light and dark, so the docs can live in
            daylight while the product surfaces stay dark — same mark, same
            type, same rules.
          </p>
          <div
            className="flex flex-col gap-4 rounded-xl border p-6"
            style={{ backgroundColor: L_BG, borderColor: L_BORDER, color: L_TEXT }}
          >
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-2.5">
                <svg viewBox="0 0 64 64" width={24} height={24} aria-hidden="true">
                  <path
                    d="M 51.75 28.87 A 20 20 0 1 1 35.13 12.25"
                    fill="none"
                    stroke={L_TEXT}
                    strokeWidth={7}
                    strokeLinecap="round"
                  />
                  <path
                    d="M 43.1 9.3 h 6 a 5.5 5.5 0 0 1 5.5 5.5 v 6 a 5.5 5.5 0 0 1 -5.5 5.5 h -6 a 5.5 5.5 0 0 1 -5.5 -5.5 v -6 a 5.5 5.5 0 0 1 5.5 -5.5 Z"
                    fill={L_COPPER}
                  />
                </svg>
                <span className="text-[20px] font-semibold tracking-tight">circuit</span>
              </span>
              <span
                className="evidence inline-flex items-center rounded-full border px-3 py-1 text-[11px]"
                style={{ borderColor: L_BORDER, color: L_MUTED }}
              >
                v0.1.0-alpha.7
              </span>
            </div>
            <div
              className="evidence flex flex-col gap-1 rounded-lg border p-3 text-[12.5px]"
              style={{ borderColor: L_BORDER, backgroundColor: L_PANEL }}
            >
              <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: L_MUTED }}>
                install — claude code
              </span>
              <span>/plugin marketplace add petekp/circuit</span>
              <span>/plugin install circuit@circuit</span>
            </div>
            <p className="text-[13px]" style={{ color: L_MUTED }}>
              Ledger — the same document in daylight. A real option for docs
              and README surfaces.
            </p>
          </div>
        </section>

        {/* North-star principles */}
        <section className="mt-24 flex flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            If this is the north star
          </h2>
          <ul className="flex flex-col gap-5">
            {principles.map((p) => (
              <li key={p.name} className="flex flex-col gap-1">
                <span className="font-semibold" style={{ color: COPPER }}>
                  {p.name}
                </span>
                <span className="max-w-2xl text-[15px] leading-relaxed" style={{ color: MUTED }}>
                  {p.detail}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Ingredients */}
        <footer
          className="mt-24 flex flex-col gap-3 border-t pt-6 text-[14px]"
          style={{ borderColor: BORDER }}
        >
          <span className="evidence text-[11px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
            Synthesis — Trace
          </span>
          <p className="max-w-2xl" style={{ color: MUTED }}>
            Ember&apos;s bones, copper&apos;s clothes, Loop &amp; Step as the
            mark. Text: Hanken Grotesk. Evidence: JetBrains Mono. The pulse
            in the mark runs the loop and passes through the step.
          </p>
          <div className="flex items-center gap-2">
            <Swatch color={BG} />
            <Swatch color={PANEL} />
            <Swatch color={TEXT} />
            <Swatch color={COPPER} />
            <Swatch color={ICE} />
            <Swatch color={ROSE} />
          </div>
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
