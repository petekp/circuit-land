import type { Metadata } from "next";
import Link from "next/link";
import { GapChapter } from "@/components/run-stage/gap-chapter";

export const metadata: Metadata = {
  title: "Direction 1 — Score / Notation",
};

// DIRECTION 1 — SCORE / NOTATION
//
// Frame: Circuit is a score; the agent performs it. The visual language
// of musical scores and dance notation by way of Bauhaus print and
// Kandinsky: points, lines, planes, flat saturated color used sparingly,
// generous space, square corners. Mono is demoted to actual code only.

const INK = "hsl(30 12% 11%)";
const PAPER = "hsl(42 38% 92%)";
const VERMILION = "hsl(10 78% 50%)";
const COBALT = "hsl(224 64% 44%)";
const GOLD = "hsl(42 88% 50%)";

const css = `
body { background: ${PAPER}; }
.tx-notation {
  --background: ${PAPER};
  background: ${PAPER};
  color: ${INK};
  font-family: "Instrument Sans", system-ui, sans-serif;
}
.tx-notation .display {
  font-family: "Bricolage Grotesque", system-ui, sans-serif;
}
.tx-notation .rs-gap2-without { color: hsl(35 10% 52%); }
.tx-notation .rs-gap2-with { color: ${COBALT}; }
.tx-notation .rs-gap2-pulse-ink { color: ${INK}; }
.tx-notation .rs-gap2-error { color: ${VERMILION}; }
.tx-notation figcaption span { color: hsl(32 10% 38%); }
.tx-notation ::selection { background: ${GOLD}; color: ${INK}; }
`;

// A static "score" composition: one staff line, notes, a slur, planes.
function ScoreGraphic() {
  return (
    <svg
      viewBox="0 0 1200 240"
      className="w-full"
      role="img"
      aria-label="An abstract score: circles, a square, and a triangle arranged as notes along a single staff line, joined by a slur."
    >
      <line x1={40} y1={170} x2={1160} y2={170} stroke={INK} strokeWidth={2} />
      <circle cx={220} cy={112} r={54} fill={VERMILION} />
      <circle cx={420} cy={170} r={9} fill={INK} />
      <line x1={429} y1={166} x2={429} y2={92} stroke={INK} strokeWidth={2} />
      <path
        d="M 420 148 Q 530 54 640 148"
        fill="none"
        stroke={INK}
        strokeWidth={1.5}
      />
      <rect x={612} y={142} width={56} height={56} fill={COBALT} />
      <g stroke={INK} strokeWidth={2}>
        <line x1={724} y1={158} x2={724} y2={182} />
        <line x1={748} y1={158} x2={748} y2={182} />
        <line x1={772} y1={158} x2={772} y2={182} />
      </g>
      <polygon points="844,170 896,170 870,116" fill={GOLD} />
      <line
        x1={952}
        y1={56}
        x2={1108}
        y2={206}
        stroke={COBALT}
        strokeWidth={3}
      />
      <circle cx={1020} cy={170} r={9} fill={VERMILION} />
    </svg>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block size-4"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

export default function NotationTreatment() {
  return (
    <div className="tx-notation min-h-screen">
      <style>{css}</style>

      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 font-mono text-[11px] uppercase tracking-[0.18em] opacity-70">
        <Link href="/explore">Explorations</Link>
        <div className="flex gap-5">
          <span aria-current="page" className="underline">
            1 Notation
          </span>
          <Link href="/explore/archival">2 Archival</Link>
          <Link href="/explore/course">3 Course</Link>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-5xl flex-col px-6 pb-24">
        {/* Masthead */}
        <header className="mt-14 flex flex-col gap-8">
          <div className="flex items-baseline gap-4">
            <span className="flex items-center gap-1.5" aria-hidden="true">
              <span
                className="inline-block size-3 rounded-full"
                style={{ backgroundColor: VERMILION }}
              />
              <span
                className="inline-block size-3"
                style={{ backgroundColor: COBALT }}
              />
              <span
                className="inline-block size-3 [clip-path:polygon(50%_0,100%_100%,0_100%)]"
                style={{ backgroundColor: GOLD }}
              />
            </span>
            <span className="display text-2xl font-semibold tracking-tight">
              Circuit
            </span>
            <span className="text-[13px] opacity-70">
              a plugin for Claude Code and Codex
            </span>
          </div>

          <h1 className="display max-w-3xl text-balance text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl">
            Coding agents aren&apos;t unreliable.{" "}
            <span style={{ color: VERMILION }}>Your process is.</span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed">
            Agents learned to work from us, and like us, they do their best
            work inside a real process. Circuit is that process.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/#install"
              className="inline-flex min-h-11 items-center px-6 py-2 text-[15px] font-medium"
              style={{ backgroundColor: INK, color: PAPER }}
            >
              Install
            </Link>
            <Link
              href="/docs"
              className="inline-flex min-h-11 items-center border px-6 py-2 text-[15px] font-medium"
              style={{ borderColor: INK }}
            >
              View Docs
            </Link>
          </div>
        </header>

        <div className="mt-16">
          <ScoreGraphic />
        </div>

        {/* Gap section */}
        <section className="mt-28 flex flex-col gap-8">
          <h2 className="display max-w-2xl text-3xl font-semibold tracking-tight">
            What your agent works without
          </h2>
          <div className="flex max-w-2xl flex-col gap-5 text-[16px] leading-relaxed">
            <p>
              Watch your agent work. It reads the codebase and the AGENTS.md,
              checks what CI will catch, and improvises a process on the spot.
              It survives on notes to itself: plan files, scratchpads, a
              compressed summary of what it had to forget. When the notes run
              out, you become the working memory.
            </p>
            <p className="font-semibold">
              Your agent learned this work from engineers who had a real
              process. Every one of these gaps can be filled.
            </p>
          </div>
          <GapChapter />
        </section>

        {/* Ingredients */}
        <footer className="mt-28 flex flex-col gap-3 border-t pt-6 text-[13px]" style={{ borderColor: INK }}>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-70">
            Direction 1 — Score / Notation
          </span>
          <p className="max-w-2xl opacity-80">
            Circuit is a score; the agent performs it. Display: Bricolage
            Grotesque. Body: Instrument Sans. Mono demoted to code only.
            Square corners, flat planes, one staff line.
          </p>
          <div className="flex items-center gap-2">
            <Swatch color={PAPER} />
            <Swatch color={INK} />
            <Swatch color={VERMILION} />
            <Swatch color={COBALT} />
            <Swatch color={GOLD} />
          </div>
        </footer>
      </main>

      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap"
      />
    </div>
  );
}
