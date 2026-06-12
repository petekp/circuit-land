import type { Metadata } from "next";
import Link from "next/link";
import { MARKS } from "./lib";

export const metadata: Metadata = {
  title: "Logomark exploration — Circuit",
};

// LOGOMARK SHEET (overnight round)
//
// Brief: simple geometric mark, overlapping shapes, negative/positive
// space, evokes a process or closed loop. Each candidate is shown the
// three ways a mark actually lives: big, in the wordmark lockup, and
// at favicon size. Judge them small first — that is where marks die.

const BG = "hsl(24 6% 9%)";
const PANEL = "hsl(26 6% 13%)";
const BORDER = "hsl(28 6% 21%)";
const TEXT = "hsl(35 18% 88%)";
const MUTED = "hsl(30 5% 58%)";
const ACCENT = "hsl(18 72% 58%)";

const css = `
body { background: ${BG}; }
.tx-marks {
  background: ${BG};
  color: ${TEXT};
  font-family: "Hanken Grotesk", system-ui, sans-serif;
}
.tx-marks .evidence {
  font-family: "JetBrains Mono", ui-monospace, monospace;
}
.tx-marks ::selection { background: ${ACCENT}; color: ${BG}; }
`;

export default function MarksSheet() {
  return (
    <div className="tx-marks min-h-screen">
      <style>{css}</style>

      <nav
        className="evidence mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4 text-[11px] uppercase tracking-[0.16em]"
        style={{ color: MUTED }}
      >
        <Link href="/explore">Explorations</Link>
        <div className="flex gap-4">
          <span aria-current="page" className="underline" style={{ color: TEXT }}>
            Marks
          </span>
          <Link href="/explore/palettes">Palettes</Link>
          <Link href="/explore/trace">Synthesis</Link>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-5xl flex-col px-6 pb-24">
        <header className="mt-14 flex max-w-2xl flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Logomark candidates
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: MUTED }}>
            Eight takes on the brief: a simple geometric mark, overlapping
            shapes cutting real negative space, each one a way of saying
            &ldquo;a process — a closed loop.&rdquo; Every hole is genuine
            (even-odd fills, no fakery), so the marks work on any background.
            Judge them at the small sizes first; that&apos;s where marks die.
          </p>
        </header>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {MARKS.map(({ id, name, Mark, concept }, i) => (
            <li
              key={id}
              className="flex flex-col gap-5 rounded-2xl border p-6"
              style={{ borderColor: BORDER, backgroundColor: PANEL }}
            >
              <div className="flex items-baseline justify-between">
                <span className="evidence text-[11px] uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
                  {String(i + 1).padStart(2, "0")} · {name}
                </span>
              </div>

              {/* Big */}
              <div className="flex items-center justify-center py-4">
                <Mark size={120} ink={TEXT} accent={ACCENT} />
              </div>

              {/* Lockup + favicon row */}
              <div className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3" style={{ borderColor: BORDER }}>
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
            All eight share one vocabulary — rings, rounded squares, a pulse
            dot — the same parts the run-stage diagrams already use, so
            whichever wins, the mark and the figures speak the same language.
            Accent shown in copper here; the color is decided on the{" "}
            <Link href="/explore/palettes" className="underline underline-offset-4" style={{ color: ACCENT }}>
              palettes sheet
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
