import type { Metadata } from "next";
import Link from "next/link";
import { MarkLoopStep } from "../marks/lib";

export const metadata: Metadata = {
  title: "Palette riffs — Circuit",
};

// PALETTE SHEET (overnight round)
//
// Ember's structure won; its amber scheme didn't. So: the same condensed
// document — mark, chips, headline, install block, transcript, diagram
// strip — repeated in five palettes. Type is held constant (Hanken
// Grotesk + JetBrains Mono) so the ONLY variable is color.

type Palette = {
  id: string;
  name: string;
  blurb: string;
  bg: string;
  panel: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  second: string;
  error: string;
};

const PALETTES: Palette[] = [
  {
    id: "trace",
    name: "Trace — copper on near-black",
    blurb:
      "Copper is what real circuits are made of: PCB traces on a dark substrate. Warmer and rarer than amber, zero green, and the name is already Circuit vocabulary — the trace is the run's record.",
    bg: "hsl(20 10% 8%)",
    panel: "hsl(20 9% 12%)",
    border: "hsl(22 10% 20%)",
    text: "hsl(34 25% 90%)",
    muted: "hsl(28 8% 58%)",
    accent: "hsl(18 72% 58%)",
    second: "hsl(204 45% 72%)",
    error: "hsl(355 70% 62%)",
  },
  {
    id: "harbor",
    name: "Harbor — coral on blue-slate",
    blurb:
      "Deep blue-slate base, one warm coral signal, chalk-blue secondary. The most approachable of the dark set; coral keeps it human where electric blue would make it corporate.",
    bg: "hsl(220 18% 10%)",
    panel: "hsl(220 16% 14%)",
    border: "hsl(220 14% 22%)",
    text: "hsl(214 30% 90%)",
    muted: "hsl(216 12% 60%)",
    accent: "hsl(8 78% 64%)",
    second: "hsl(206 40% 70%)",
    error: "hsl(352 75% 64%)",
  },
  {
    id: "violet",
    name: "Cinder — violet on neutral graphite",
    blurb:
      "True-neutral graphite with a soft violet signal and apricot secondary. Sits closest to current dev-tool fashion (Linear lives here) — included as the control: distinctive palette or familiar one?",
    bg: "hsl(260 4% 9%)",
    panel: "hsl(260 4% 13%)",
    border: "hsl(260 4% 21%)",
    text: "hsl(255 12% 89%)",
    muted: "hsl(258 4% 60%)",
    accent: "hsl(262 70% 72%)",
    second: "hsl(28 90% 68%)",
    error: "hsl(350 72% 64%)",
  },
  {
    id: "foundry",
    name: "Foundry — persimmon on charcoal",
    blurb:
      "Pure charcoal, one hot persimmon, nothing else. The boldest and most editorial; risks reading stark next to the friendlier options but makes the strongest poster.",
    bg: "hsl(0 0% 8%)",
    panel: "hsl(0 0% 12%)",
    border: "hsl(0 0% 20%)",
    text: "hsl(30 8% 90%)",
    muted: "hsl(20 3% 58%)",
    accent: "hsl(14 88% 58%)",
    second: "hsl(30 8% 72%)",
    error: "hsl(348 80% 60%)",
  },
  {
    id: "ledger",
    name: "Ledger — copper on warm paper (wildcard)",
    blurb:
      "The same document in daylight. Open-source projects live in READMEs, and READMEs are light. A real option for the site even if the product surfaces stay dark — shown to test the genre, not just the mood.",
    bg: "hsl(40 30% 96%)",
    panel: "hsl(40 28% 92%)",
    border: "hsl(36 18% 80%)",
    text: "hsl(24 14% 16%)",
    muted: "hsl(28 10% 42%)",
    accent: "hsl(18 70% 46%)",
    second: "hsl(222 55% 45%)",
    error: "hsl(355 70% 45%)",
  },
];

// A static one-line excerpt of the run-stage diagram, recolored per band:
// rail, five pads, the active pad with its pulse, one error mark.
function DiagramStrip({ p }: { p: Palette }) {
  const pads = [60, 170, 280, 390, 500];
  return (
    <svg viewBox="0 0 560 56" className="w-full" aria-hidden="true">
      <line x1={8} y1={28} x2={552} y2={28} stroke={p.muted} strokeOpacity={0.35} strokeWidth={1.5} />
      {pads.map((cx, i) => (
        <rect
          key={cx}
          x={cx - 10}
          y={18}
          width={20}
          height={20}
          rx={6}
          fill={i === 2 ? p.accent : p.panel}
          stroke={i === 2 ? p.accent : p.muted}
          strokeOpacity={i === 2 ? 1 : 0.6}
          strokeWidth={1.5}
        />
      ))}
      <circle cx={280} cy={28} r={3.5} fill={p.bg} />
      <g stroke={p.error} strokeWidth={2} strokeLinecap="round">
        <line x1={166} y1={6} x2={174} y2={14} />
        <line x1={174} y1={6} x2={166} y2={14} />
      </g>
    </svg>
  );
}

function Chip({ p, children }: { p: Palette; children: React.ReactNode }) {
  return (
    <span
      className="mono inline-flex items-center rounded-full border px-3 py-1 text-[11px]"
      style={{ borderColor: p.border, color: p.muted }}
    >
      {children}
    </span>
  );
}

function Band({ p, index }: { p: Palette; index: number }) {
  return (
    <section className="w-full" style={{ backgroundColor: p.bg, color: p.text }}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-14">
        <div className="flex items-center justify-between">
          <span className="mono text-[11px] uppercase tracking-[0.16em]" style={{ color: p.accent }}>
            {String(index + 1).padStart(2, "0")} · {p.name}
          </span>
        </div>

        {/* Header row */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2.5">
            <MarkLoopStep size={24} ink={p.text} accent={p.accent} />
            <span className="text-[21px] font-semibold tracking-tight">circuit</span>
          </span>
          <span className="flex items-center gap-2">
            <Chip p={p}>v0.1.0-alpha.7</Chip>
            <Chip p={p}>MIT</Chip>
          </span>
        </div>

        <h2 className="max-w-xl text-balance text-2xl font-semibold leading-snug tracking-tight">
          The process your coding agent follows.
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Install block */}
          <div
            className="mono flex flex-col gap-1 rounded-xl border p-4 text-[12.5px]"
            style={{ borderColor: p.border, backgroundColor: p.panel }}
          >
            <span className="pb-1 text-[10px] uppercase tracking-[0.16em]" style={{ color: p.muted }}>
              install — claude code
            </span>
            <span>/plugin marketplace add petekp/circuit</span>
            <span>/plugin install circuit@circuit</span>
          </div>

          {/* Transcript excerpt */}
          <div
            className="mono flex flex-col gap-1 rounded-xl border p-4 text-[12.5px]"
            style={{ borderColor: p.border, backgroundColor: p.panel }}
          >
            <span style={{ color: p.text, fontWeight: 600 }}>/circuit:run fix the flaky test</span>
            <span style={{ color: p.accent }}>CIRCUIT</span>
            <span style={{ color: p.muted }}>⎿ Checking the work...</span>
            <span style={{ color: p.second, fontWeight: 600 }}>⎿ Done. Verification passed.</span>
          </div>
        </div>

        <DiagramStrip p={p} />

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {[p.bg, p.panel, p.text, p.accent, p.second, p.error].map((c, i) => (
              <span
                key={`${c}-${i}`}
                className="inline-block size-4 rounded-md border"
                style={{ backgroundColor: c, borderColor: p.border }}
                aria-hidden="true"
              />
            ))}
          </div>
          <p className="max-w-2xl text-[14px] leading-relaxed" style={{ color: p.muted }}>
            {p.blurb}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function PalettesSheet() {
  return (
    <div className="tx-palettes min-h-screen" style={{ backgroundColor: PALETTES[0].bg }}>
      <style>{`
body { background: ${PALETTES[0].bg}; }
.tx-palettes { font-family: "Hanken Grotesk", system-ui, sans-serif; }
.tx-palettes .mono { font-family: "JetBrains Mono", ui-monospace, monospace; }
`}</style>

      <nav
        className="mono mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4 text-[11px] uppercase tracking-[0.16em]"
        style={{ color: PALETTES[0].muted }}
      >
        <Link href="/explore">Explorations</Link>
        <div className="flex gap-4">
          <Link href="/explore/marks">Marks</Link>
          <span aria-current="page" className="underline" style={{ color: PALETTES[0].text }}>
            Palettes
          </span>
          <Link href="/explore/trace">Synthesis</Link>
        </div>
      </nav>

      <header
        className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 pb-10 pt-10"
        style={{ color: PALETTES[0].text }}
      >
        <h1 className="text-3xl font-semibold tracking-tight">Palette riffs</h1>
        <p className="max-w-2xl text-[16px] leading-relaxed" style={{ color: PALETTES[0].muted }}>
          Ember&apos;s structure won; its amber didn&apos;t. The same condensed
          document, five times — type held constant so the only variable is
          color. Each band shows the full cast: text, muted, accent,
          secondary, error, panel.
        </p>
      </header>

      {PALETTES.map((p, i) => (
        <Band key={p.id} p={p} index={i} />
      ))}

      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:ital,wght@0,400..600;1,400&display=swap"
      />
    </div>
  );
}
