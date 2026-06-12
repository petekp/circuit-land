import type { Metadata } from "next";
import Link from "next/link";
import { GapChapter } from "@/components/run-stage/gap-chapter";

export const metadata: Metadata = {
  title: "Direction 3 — Course / Racing Line",
};

// DIRECTION 3 — COURSE / RACING LINE
//
// Frame: Circuit as a course the agent runs. Asphalt dark, one hot
// signal color, condensed slanted display type, route lines and laps.
// The compounding story maps directly: each lap, the racing line
// tightens and the time drops.

const ASPHALT = "hsl(216 14% 7%)";
const CHALK = "hsl(40 18% 92%)";
const SIGNAL = "hsl(22 100% 55%)";
const GRAVEL = "hsl(216 8% 52%)";

const css = `
body { background: ${ASPHALT}; }
.tx-course {
  --background: ${ASPHALT};
  background: ${ASPHALT};
  color: ${CHALK};
  font-family: "Saira", system-ui, sans-serif;
}
.tx-course .display {
  font-family: "Saira Condensed", system-ui, sans-serif;
  text-transform: uppercase;
}
.tx-course .rs-gap2-without { color: ${GRAVEL}; }
.tx-course .rs-gap2-with { color: ${SIGNAL}; }
.tx-course .rs-gap2-pulse-ink { color: ${CHALK}; }
.tx-course figcaption span { color: ${GRAVEL}; }
.tx-course ::selection { background: ${SIGNAL}; color: ${ASPHALT}; }
`;

// The course: a wide track with a dashed centerline, and the racing
// line cutting the tighter path through it in signal orange.
function CourseGraphic() {
  return (
    <svg
      viewBox="0 0 1200 280"
      className="w-full"
      role="img"
      aria-label="A racing course drawn as a wide gray track. A thin bright racing line cuts the tighter path through its curves, with a lap marker reading lap 4."
    >
      <path
        d="M 40 210 C 220 60, 420 60, 580 150 S 920 260, 1160 110"
        fill="none"
        stroke="hsl(216 10% 16%)"
        strokeWidth={34}
        strokeLinecap="round"
      />
      <path
        d="M 40 210 C 220 60, 420 60, 580 150 S 920 260, 1160 110"
        fill="none"
        stroke={CHALK}
        strokeOpacity={0.35}
        strokeWidth={2}
        strokeDasharray="10 16"
      />
      <path
        d="M 40 216 C 230 84, 430 84, 588 158 S 910 244, 1160 104"
        fill="none"
        stroke={SIGNAL}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <g aria-hidden="true">
        <rect x={52} y={176} width={9} height={9} fill={CHALK} />
        <rect x={61} y={185} width={9} height={9} fill={CHALK} />
        <rect x={61} y={176} width={9} height={9} fill={ASPHALT} stroke={CHALK} strokeWidth={1} />
        <rect x={52} y={185} width={9} height={9} fill={ASPHALT} stroke={CHALK} strokeWidth={1} />
      </g>
      <rect x={596} y={146} width={15} height={15} fill={SIGNAL} />
      <text
        x={1020}
        y={210}
        fill={SIGNAL}
        fontSize={26}
        fontFamily="'Saira Condensed', sans-serif"
        fontWeight={700}
        letterSpacing={2}
      >
        LAP 4 · 5.8s
      </text>
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

export default function CourseTreatment() {
  return (
    <div className="tx-course min-h-screen">
      <style>{css}</style>

      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 font-mono text-[11px] uppercase tracking-[0.18em] opacity-70">
        <Link href="/explore">Explorations</Link>
        <div className="flex gap-5">
          <Link href="/explore/notation">1 Notation</Link>
          <Link href="/explore/archival">2 Archival</Link>
          <span aria-current="page" className="underline">
            3 Course
          </span>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-24">
        {/* Masthead */}
        <header className="mt-14 flex flex-col gap-8">
          <div className="flex items-baseline gap-3">
            <span className="display text-3xl font-bold tracking-wide" style={{ color: SIGNAL }}>
              Circuit
            </span>
            <span aria-hidden="true" className="display text-3xl font-bold" style={{ color: GRAVEL }}>
              {"///"}
            </span>
            <span className="text-[13px]" style={{ color: GRAVEL }}>
              a plugin for Claude Code and Codex
            </span>
          </div>

          <div style={{ transform: "skewX(-6deg)" }}>
            <h1 className="display max-w-4xl text-balance text-6xl font-bold leading-[0.95] sm:text-7xl">
              Coding agents aren&apos;t unreliable.{" "}
              <span style={{ color: SIGNAL }}>Your process is.</span>
            </h1>
          </div>

          <p className="max-w-xl text-lg leading-relaxed" style={{ color: GRAVEL }}>
            Agents learned to work from us, and like us, they do their best
            work inside a real process. Circuit is that process.
          </p>

          <div className="flex flex-wrap items-center gap-4" style={{ transform: "skewX(-6deg)" }}>
            <Link
              href="/#install"
              className="display inline-flex min-h-11 items-center px-7 py-2 text-[17px] font-bold"
              style={{ backgroundColor: SIGNAL, color: ASPHALT }}
            >
              Install
            </Link>
            <Link
              href="/docs"
              className="display inline-flex min-h-11 items-center border px-7 py-2 text-[17px] font-bold"
              style={{ borderColor: CHALK }}
            >
              View Docs
            </Link>
          </div>
        </header>

        <div className="mt-16">
          <CourseGraphic />
        </div>

        {/* Gap section */}
        <section className="mt-28 flex flex-col gap-8">
          <h2 className="display max-w-2xl text-4xl font-bold">
            What your agent works without
          </h2>
          <div className="flex max-w-2xl flex-col gap-5 text-[16px] leading-relaxed" style={{ color: GRAVEL }}>
            <p>
              Watch your agent work. It reads the codebase and the AGENTS.md,
              checks what CI will catch, and improvises a process on the spot.
              It survives on notes to itself: plan files, scratchpads, a
              compressed summary of what it had to forget. When the notes run
              out, you become the working memory.
            </p>
            <p className="font-medium" style={{ color: CHALK }}>
              Your agent learned this work from engineers who had a real
              process. Every one of these gaps can be filled.
            </p>
          </div>
          <GapChapter />
        </section>

        {/* Ingredients */}
        <footer
          className="mt-28 flex flex-col gap-3 border-t pt-6 text-[14px]"
          style={{ borderColor: "hsl(216 10% 20%)" }}
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-70">
            Direction 3 — Course / Racing Line
          </span>
          <p className="max-w-2xl" style={{ color: GRAVEL }}>
            Circuit is a course the agent runs. Display: Saira Condensed,
            slanted. Body: Saira. Asphalt dark, chalk text, one signal
            orange. Route lines, laps, tightening racing line.
          </p>
          <div className="flex items-center gap-2">
            <Swatch color={ASPHALT} />
            <Swatch color={CHALK} />
            <Swatch color={SIGNAL} />
            <Swatch color={GRAVEL} />
          </div>
        </footer>
      </main>

      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@600;700;800&family=Saira:ital,wght@0,400;0,500;1,400&display=swap"
      />
    </div>
  );
}
