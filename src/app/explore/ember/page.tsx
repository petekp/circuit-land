import type { Metadata } from "next";
import Link from "next/link";
import { GapChapter } from "@/components/run-stage/gap-chapter";

export const metadata: Metadata = {
  title: "Direction 4 — Ember",
};

// DIRECTION 4 — EMBER (round two)
//
// Document genre, not poster: repo-style header with badge chips, the
// install path as a real command block, prose in a text face, monospace
// reserved for evidence (commands, the live run transcript). Closer to
// the terminal end of the spectrum but de-troped: warm graphite instead
// of green-on-black, soft corners everywhere, amber heat for the accent
// (the OTHER terminal heritage), a hand annotation over the figure.

const BG = "hsl(24 8% 9%)";
const PANEL = "hsl(26 8% 13%)";
const BORDER = "hsl(28 8% 21%)";
const TEXT = "hsl(35 20% 88%)";
const MUTED = "hsl(30 7% 58%)";
const AMBER = "hsl(38 92% 58%)";
const CORAL = "hsl(12 75% 60%)";
const SLATE = "hsl(212 30% 64%)";

const css = `
body { background: ${BG}; }
.tx-ember {
  --background: ${BG};
  background: ${BG};
  color: ${TEXT};
  font-family: "Hanken Grotesk", system-ui, sans-serif;
}
.tx-ember .evidence {
  font-family: "JetBrains Mono", ui-monospace, monospace;
}
.tx-ember svg rect { rx: 5px; }
.tx-ember .rs-gap2-without { color: hsl(30 6% 46%); }
.tx-ember .rs-gap2-with { color: ${AMBER}; }
.tx-ember .rs-gap2-pulse-ink { color: hsl(38 30% 93%); }
.tx-ember .rs-gap2-error { color: ${CORAL}; }
.tx-ember figcaption span { color: ${MUTED}; }
.tx-ember ::selection { background: ${AMBER}; color: ${BG}; }
`;

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

// A small hand-drawn arrow: the human margin note over the precise figure.
function Annotation({ label }: { label: string }) {
  return (
    <div className="flex items-end justify-end gap-2 pr-2" aria-hidden="true">
      <span
        className="text-[14px] italic"
        style={{ color: CORAL, transform: "rotate(-2deg)" }}
      >
        {label}
      </span>
      <svg viewBox="0 0 80 36" className="h-8 w-16">
        <path
          d="M 6 6 Q 30 2 50 14 T 72 30"
          fill="none"
          stroke={CORAL}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <path
          d="M 62 28 L 72 30 L 68 21"
          fill="none"
          stroke={CORAL}
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

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block size-4 rounded-md"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

export default function EmberTreatment() {
  return (
    <div className="tx-ember min-h-screen">
      <style>{css}</style>

      <nav className="evidence mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4 text-[11px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
        <Link href="/explore">Explorations</Link>
        <div className="flex gap-4">
          <Link href="/explore/notation">1</Link>
          <Link href="/explore/archival">2</Link>
          <Link href="/explore/course">3</Link>
          <span aria-current="page" className="underline" style={{ color: TEXT }}>
            4 Ember
          </span>
          <Link href="/explore/indigo">5 Indigo</Link>
          <Link href="/explore/tokens">6 Tokens</Link>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-3xl flex-col px-6 pb-24">
        {/* Repo-style document head */}
        <header className="mt-14 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span
              className="inline-block size-5 rounded-lg"
              style={{ backgroundColor: AMBER }}
              aria-hidden="true"
            />
            <span className="text-2xl font-semibold tracking-tight">circuit</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip>v0.1.0-alpha.7</Chip>
            <Chip>MIT</Chip>
            <Chip>Claude Code</Chip>
            <Chip>Codex</Chip>
            <Chip color={SLATE}>
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
                style={{ borderColor: BORDER, color: AMBER }}
              >
                copy
              </span>
            </div>
            <span>/plugin marketplace add petekp/circuit</span>
            <span>/plugin install circuit@circuit</span>
          </div>

          <p className="text-[15px]" style={{ color: MUTED }}>
            <Link href="/docs" className="underline underline-offset-4" style={{ color: SLATE }}>
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
                        ? AMBER
                        : line.kind === "done"
                          ? SLATE
                          : MUTED,
                  fontWeight: line.kind === "user" || line.kind === "done" ? 600 : 400,
                }}
              >
                {line.text}
              </span>
            ))}
          </div>
        </section>

        {/* Ingredients */}
        <footer
          className="mt-24 flex flex-col gap-3 border-t pt-6 text-[14px]"
          style={{ borderColor: BORDER }}
        >
          <span className="evidence text-[11px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
            Direction 4 — Ember
          </span>
          <p className="max-w-2xl" style={{ color: MUTED }}>
            Warm graphite, amber heat, coral marginalia. Text: Hanken
            Grotesk. Evidence: JetBrains Mono, reserved for real artifacts.
            Soft corners throughout, including the diagram.
          </p>
          <div className="flex items-center gap-2">
            <Swatch color={BG} />
            <Swatch color={PANEL} />
            <Swatch color={TEXT} />
            <Swatch color={AMBER} />
            <Swatch color={CORAL} />
            <Swatch color={SLATE} />
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
