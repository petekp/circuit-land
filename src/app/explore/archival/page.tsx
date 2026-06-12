import type { Metadata } from "next";
import Link from "next/link";
import { GapChapter } from "@/components/run-stage/gap-chapter";

export const metadata: Metadata = {
  title: "Direction 2 — Archival Print",
};

// DIRECTION 2 — ARCHIVAL PRINT
//
// Frame: the whole site is the record. Paper-and-ink fine press: a title
// page, serif text at book measure, illustrations as numbered plates with
// captions, hairline rules. The record/document fiction the gap chapter
// introduced extends to everything.

const INK = "hsl(30 30% 14%)";
const IVORY = "hsl(40 45% 94%)";
const OXIDE = "hsl(10 60% 38%)";
const FADED = "hsl(34 18% 45%)";

const css = `
body { background: ${IVORY}; }
.tx-archival {
  --background: ${IVORY};
  background: ${IVORY};
  color: ${INK};
  font-family: "Newsreader", Georgia, serif;
}
.tx-archival .display {
  font-family: "Instrument Serif", Georgia, serif;
}
.tx-archival .rs-gap2-without { color: ${FADED}; }
.tx-archival .rs-gap2-with { color: ${OXIDE}; }
.tx-archival .rs-gap2-pulse-ink { color: ${INK}; }
.tx-archival .rs-gap2-error { color: hsl(8 65% 42%); }
.tx-archival figcaption span { color: ${FADED}; font-style: italic; }
.tx-archival .lede::first-letter {
  font-family: "Instrument Serif", Georgia, serif;
  font-size: 3.3em;
  float: left;
  line-height: 0.8;
  padding-right: 0.1em;
  color: ${OXIDE};
}
.tx-archival ::selection { background: ${INK}; color: ${IVORY}; }
`;

function Rule({ double = false }: { double?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={double ? "border-y py-0.5" : "border-t"}
      style={{ borderColor: INK }}
    >
      {double ? <div className="border-t" style={{ borderColor: INK }} /> : null}
    </div>
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

export default function ArchivalTreatment() {
  return (
    <div className="tx-archival min-h-screen">
      <style>{css}</style>

      <nav className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4 font-mono text-[11px] uppercase tracking-[0.18em] opacity-70">
        <Link href="/explore">Explorations</Link>
        <div className="flex gap-5">
          <Link href="/explore/notation">1 Notation</Link>
          <span aria-current="page" className="underline">
            2 Archival
          </span>
          <Link href="/explore/course">3 Course</Link>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-3xl flex-col px-6 pb-24">
        {/* Title page */}
        <header className="mt-16 flex flex-col items-center gap-7 text-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[22px] font-medium uppercase tracking-[0.42em]">
              Circuit
            </span>
            <span className="text-[12px] uppercase tracking-[0.3em]" style={{ color: FADED }}>
              A plugin for Claude Code &amp; Codex
            </span>
          </div>
          <div className="w-24 self-center">
            <Rule double />
          </div>

          <h1 className="display max-w-2xl text-balance text-5xl italic leading-[1.08] sm:text-6xl">
            Coding agents aren&apos;t unreliable. Your process is.
          </h1>

          <p className="max-w-md text-[17px] leading-relaxed" style={{ color: FADED }}>
            Agents learned to work from us, and like us, they do their best
            work inside a real process. Circuit is that process.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[15px]">
            <Link
              href="/#install"
              className="inline-flex min-h-11 items-center border px-7 py-2 uppercase tracking-[0.18em]"
              style={{ borderColor: INK }}
            >
              Install
            </Link>
            <Link
              href="/docs"
              className="inline-flex min-h-11 items-center px-2 py-2 italic underline underline-offset-4"
            >
              View the docs
            </Link>
          </div>
        </header>

        {/* Gap section as a chapter with a numbered plate */}
        <section className="mt-28 flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <span className="text-[12px] uppercase tracking-[0.3em]" style={{ color: OXIDE }}>
              I.
            </span>
            <div className="grow">
              <Rule />
            </div>
          </div>
          <h2 className="display text-3xl italic">
            What your agent works without
          </h2>
          <div className="flex flex-col gap-5 text-[17px] leading-[1.7]">
            <p className="lede">
              Watch your agent work. It reads the codebase and the AGENTS.md,
              checks what CI will catch, and improvises a process on the spot.
              It survives on notes to itself: plan files, scratchpads, a
              compressed summary of what it had to forget. When the notes run
              out, you become the working memory.
            </p>
            <p className="font-medium">
              Your agent learned this work from engineers who had a real
              process. Every one of these gaps can be filled.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <GapChapter />
            <p className="text-center text-[13px] italic" style={{ color: FADED }}>
              Plate I. — The same work, two worlds; the lower run files its
              record as it goes.
            </p>
          </div>
        </section>

        {/* Ingredients */}
        <footer className="mt-28 flex flex-col gap-3 pt-6 text-[14px]">
          <Rule />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-70">
            Direction 2 — Archival Print
          </span>
          <p className="max-w-2xl" style={{ color: FADED }}>
            The whole site is the record. Display: Instrument Serif (italic).
            Body: Newsreader. Hairline rules, numbered plates, a drop cap,
            one oxide-red accent on ivory.
          </p>
          <div className="flex items-center gap-2">
            <Swatch color={IVORY} />
            <Swatch color={INK} />
            <Swatch color={OXIDE} />
            <Swatch color={FADED} />
          </div>
        </footer>
      </main>

      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&display=swap"
      />
    </div>
  );
}
