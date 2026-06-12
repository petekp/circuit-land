import type { Metadata } from "next";
import Link from "next/link";
import { GapChapter } from "@/components/run-stage/gap-chapter";

export const metadata: Metadata = {
  title: "Direction 6 — Tokens",
};

// DIRECTION 6 — TOKENS (round two)
//
// Same document genre, but the palette comes from a place every developer
// already loves: a pastel editor theme. Four soft token colors (rose,
// gold, sky, lilac) used the way a syntax highlighter uses them — small,
// semantic, never as a wash. The headline itself gets highlighted like
// code. The most "fun" of the three; still unmistakably a coding tool.

const BG = "hsl(266 9% 11%)";
const PANEL = "hsl(266 9% 15%)";
const BORDER = "hsl(266 8% 22%)";
const TEXT = "hsl(40 18% 90%)";
const MUTED = "hsl(266 5% 62%)";
const ROSE = "hsl(350 70% 75%)";
const GOLD = "hsl(42 80% 70%)";
const SKY = "hsl(200 75% 72%)";
const LILAC = "hsl(270 60% 78%)";

const css = `
body { background: ${BG}; }
.tx-tokens {
  --background: ${BG};
  background: ${BG};
  color: ${TEXT};
  font-family: "Nunito Sans", system-ui, sans-serif;
}
.tx-tokens .evidence {
  font-family: "JetBrains Mono", ui-monospace, monospace;
}
.tx-tokens svg rect { rx: 5px; }
.tx-tokens .rs-gap2-without { color: hsl(264 6% 48%); }
.tx-tokens .rs-gap2-with { color: ${SKY}; }
.tx-tokens .rs-gap2-pulse-ink { color: hsl(40 30% 93%); }
.tx-tokens .rs-gap2-error { color: ${ROSE}; }
.tx-tokens figcaption span { color: ${MUTED}; }
.tx-tokens ::selection { background: ${LILAC}; color: ${BG}; }
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

// Lilac margin note: the human hand over the precise figure.
function Annotation({ label }: { label: string }) {
  return (
    <div className="flex items-end justify-end gap-2 pr-2" aria-hidden="true">
      <span
        className="text-[14px] italic"
        style={{ color: LILAC, transform: "rotate(-2deg)" }}
      >
        {label}
      </span>
      <svg viewBox="0 0 80 36" className="h-8 w-16">
        <path
          d="M 6 6 Q 30 2 50 14 T 72 30"
          fill="none"
          stroke={LILAC}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <path
          d="M 62 28 L 72 30 L 68 21"
          fill="none"
          stroke={LILAC}
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

export default function TokensTreatment() {
  return (
    <div className="tx-tokens min-h-screen">
      <style>{css}</style>

      <nav className="evidence mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4 text-[11px] uppercase tracking-[0.16em]" style={{ color: MUTED }}>
        <Link href="/explore">Explorations</Link>
        <div className="flex gap-4">
          <Link href="/explore/notation">1</Link>
          <Link href="/explore/archival">2</Link>
          <Link href="/explore/course">3</Link>
          <Link href="/explore/ember">4 Ember</Link>
          <Link href="/explore/indigo">5 Indigo</Link>
          <span aria-current="page" className="underline" style={{ color: TEXT }}>
            6 Tokens
          </span>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-3xl flex-col px-6 pb-24">
        {/* Repo-style document head */}
        <header className="mt-14 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: ROSE }} />
              <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: GOLD }} />
              <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: SKY }} />
              <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: LILAC }} />
            </span>
            <span className="text-2xl font-semibold tracking-tight">circuit</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip color={GOLD}>v0.1.0-alpha.7</Chip>
            <Chip color={SKY}>MIT</Chip>
            <Chip>Claude Code</Chip>
            <Chip>Codex</Chip>
            <Chip color={LILAC}>
              <a href="https://github.com/petekp/circuit">GitHub ↗</a>
            </Chip>
          </div>

          {/* The headline, syntax-highlighted like code */}
          <h1 className="mt-2 max-w-2xl text-balance text-3xl font-semibold leading-snug tracking-tight">
            The <span style={{ color: SKY }}>process</span> your coding agent{" "}
            <span style={{ color: GOLD }}>follows</span>.
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
                style={{ borderColor: BORDER, color: GOLD }}
              >
                copy
              </span>
            </div>
            <span>
              <span style={{ color: LILAC }}>/plugin</span> marketplace add{" "}
              <span style={{ color: SKY }}>petekp/circuit</span>
            </span>
            <span>
              <span style={{ color: LILAC }}>/plugin</span> install{" "}
              <span style={{ color: SKY }}>circuit@circuit</span>
            </span>
          </div>

          <p className="text-[15px]" style={{ color: MUTED }}>
            <Link href="/docs" className="underline underline-offset-4" style={{ color: SKY }}>
              Read the docs
            </Link>{" "}
            · or scroll for the long version.
          </p>
        </header>

        {/* Gap section, document-style */}
        <section className="mt-24 flex flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            What your agent works <span style={{ color: ROSE }}>without</span>
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
            One command, a whole <span style={{ color: LILAC }}>process</span>
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
                        ? GOLD
                        : line.kind === "done"
                          ? SKY
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
            Direction 6 — Tokens
          </span>
          <p className="max-w-2xl" style={{ color: MUTED }}>
            A pastel editor theme as the brand palette: rose, gold, sky,
            lilac — used like a syntax highlighter, small and semantic, never
            as a wash. Text: Nunito Sans. Evidence: JetBrains Mono.
          </p>
          <div className="flex items-center gap-2">
            <Swatch color={BG} />
            <Swatch color={PANEL} />
            <Swatch color={TEXT} />
            <Swatch color={ROSE} />
            <Swatch color={GOLD} />
            <Swatch color={SKY} />
            <Swatch color={LILAC} />
          </div>
        </footer>
      </main>

      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,400..700;1,6..12,400..700&family=JetBrains+Mono:ital,wght@0,400..600;1,400&display=swap"
      />
    </div>
  );
}
