import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Palette + type riffs, round two — Circuit",
};

// PALETTE SHEET, ROUND TWO
//
// Round one anchored on warm orange territory — which reads as
// Claude's design language. Banned here: every orange, coral, peach,
// copper, amber. Six genuinely different hue territories, and this
// time TYPE varies with the palette: each band carries its own
// prose face + mono face, so a band is a full treatment, not a tint.

type Palette = {
  id: string;
  name: string;
  type: string;
  blurb: string;
  bg: string;
  panel: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  second: string;
  error: string;
  fontText: string;
  fontMono: string;
  fontHref: string;
};

const PALETTES: Palette[] = [
  {
    id: "sodium",
    name: "Sodium — acid yellow on graphite",
    type: "Bricolage Grotesque + Fragment Mono",
    blurb:
      "One loud signal on a cool neutral base. Acid yellow is energetic and a little irreverent — the fun knob turned up without going pastel. Nobody big in dev tools owns yellow.",
    bg: "hsl(220 3% 9%)",
    panel: "hsl(220 3% 13%)",
    border: "hsl(220 3% 22%)",
    text: "hsl(60 10% 92%)",
    muted: "hsl(220 3% 60%)",
    accent: "hsl(57 95% 55%)",
    second: "hsl(220 15% 72%)",
    error: "hsl(0 75% 62%)",
    fontText: '"Bricolage Grotesque", system-ui, sans-serif',
    fontMono: '"Fragment Mono", ui-monospace, monospace',
    fontHref:
      "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..700&family=Fragment+Mono:ital@0;1&display=swap",
  },
  {
    id: "azure",
    name: "Azure — electric blue on ink",
    type: "Familjen Grotesk + Spline Sans Mono",
    blurb:
      "Deep ink-navy base with one electric azure signal and a lavender second voice. Blue is the most trusted color in the space — the question is whether ours is distinct enough at this saturation.",
    bg: "hsl(228 25% 9%)",
    panel: "hsl(228 22% 13%)",
    border: "hsl(228 18% 22%)",
    text: "hsl(220 30% 92%)",
    muted: "hsl(225 12% 62%)",
    accent: "hsl(210 95% 62%)",
    second: "hsl(265 60% 75%)",
    error: "hsl(345 80% 64%)",
    fontText: '"Familjen Grotesk", system-ui, sans-serif',
    fontMono: '"Spline Sans Mono", ui-monospace, monospace',
    fontHref:
      "https://fonts.googleapis.com/css2?family=Familjen+Grotesk:ital,wght@0,400..700;1,400..700&family=Spline+Sans+Mono:ital,wght@0,400..600;1,400&display=swap",
  },
  {
    id: "orchid",
    name: "Orchid — magenta on charcoal",
    type: "Sora + Sometype Mono",
    blurb:
      "Desaturated fuchsia signal with a steel-blue second voice. The furthest hue from every incumbent — distinctive by default; the risk is reading fashion-forward rather than trustworthy.",
    bg: "hsl(270 4% 9%)",
    panel: "hsl(270 4% 13%)",
    border: "hsl(270 4% 21%)",
    text: "hsl(300 8% 90%)",
    muted: "hsl(280 4% 60%)",
    accent: "hsl(315 70% 64%)",
    second: "hsl(200 40% 70%)",
    error: "hsl(0 75% 62%)",
    fontText: '"Sora", system-ui, sans-serif',
    fontMono: '"Sometype Mono", ui-monospace, monospace',
    fontHref:
      "https://fonts.googleapis.com/css2?family=Sora:wght@400..700&family=Sometype+Mono:ital,wght@0,400..600;1,400&display=swap",
  },
  {
    id: "signal",
    name: "Signal — grayscale + one red",
    type: "Inter Tight + Martian Mono",
    blurb:
      "Swiss restraint: a pure grayscale document where the only color is a red reserved for what's live or wrong. Maximum professionalism; the fun has to come from type and motion instead.",
    bg: "hsl(0 0% 8%)",
    panel: "hsl(0 0% 12%)",
    border: "hsl(0 0% 20%)",
    text: "hsl(0 0% 92%)",
    muted: "hsl(0 0% 58%)",
    accent: "hsl(0 85% 56%)",
    second: "hsl(0 0% 75%)",
    error: "hsl(0 85% 56%)",
    fontText: '"Inter Tight", system-ui, sans-serif',
    fontMono: '"Martian Mono", ui-monospace, monospace',
    fontHref:
      "https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,400..700;1,400..700&family=Martian+Mono:wght@400..600&display=swap",
  },
  {
    id: "process",
    name: "Process — CMY on cool white (light)",
    type: "Archivo + IBM Plex Mono",
    blurb:
      "Printer's process inks — cyan, magenta, yellow — used small and semantic on a cool white. 'Process color' is literally the printing term, and the print register fits the document genre. The most fun light option.",
    bg: "hsl(220 20% 97%)",
    panel: "hsl(220 18% 93%)",
    border: "hsl(220 12% 82%)",
    text: "hsl(230 10% 13%)",
    muted: "hsl(228 6% 42%)",
    accent: "hsl(195 90% 40%)",
    second: "hsl(330 80% 50%)",
    error: "hsl(345 85% 47%)",
    fontText: '"Archivo", system-ui, sans-serif',
    fontMono: '"IBM Plex Mono", ui-monospace, monospace',
    fontHref:
      "https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400..700;1,400..700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap",
  },
  {
    id: "klein",
    name: "Klein — ultramarine on cool paper (light, serif)",
    type: "IBM Plex Serif + IBM Plex Mono",
    blurb:
      "Ultramarine ink on cool paper with serif prose — the engineering-report register: RFCs, journals, the written record. The biggest type swing of the set; mono stays for evidence.",
    bg: "hsl(220 30% 97%)",
    panel: "hsl(220 28% 93%)",
    border: "hsl(222 20% 82%)",
    text: "hsl(230 25% 14%)",
    muted: "hsl(228 12% 42%)",
    accent: "hsl(226 80% 48%)",
    second: "hsl(330 70% 48%)",
    error: "hsl(350 75% 48%)",
    fontText: '"IBM Plex Serif", Georgia, serif',
    fontMono: '"IBM Plex Mono", ui-monospace, monospace',
    fontHref:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:ital,wght@0,400..600;1,400&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap",
  },
];

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

// Neutral placeholder mark (stadium ring) so no band inherits a mark
// decision; recolored per band.
function BandMark({ p, size = 24 }: { p: Palette; size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <path
        d="M 22 14 H 42 A 18 18 0 0 1 42 50 H 22 A 18 18 0 0 1 22 14 Z"
        fill="none"
        stroke={p.text}
        strokeWidth={6}
      />
      <circle cx={32} cy={14} r={4.5} fill={p.accent} />
    </svg>
  );
}

function Chip({ p, children }: { p: Palette; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px]"
      style={{ borderColor: p.border, color: p.muted, fontFamily: p.fontMono }}
    >
      {children}
    </span>
  );
}

function Band({ p, index }: { p: Palette; index: number }) {
  return (
    <section className="w-full" style={{ backgroundColor: p.bg, color: p.text, fontFamily: p.fontText }}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-14">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span
            className="text-[11px] uppercase tracking-[0.16em]"
            style={{ color: p.accent, fontFamily: p.fontMono }}
          >
            {String(index + 1).padStart(2, "0")} · {p.name}
          </span>
          <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: p.muted, fontFamily: p.fontMono }}>
            {p.type}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2.5">
            <BandMark p={p} />
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
          <div
            className="flex flex-col gap-1 rounded-xl border p-4 text-[12.5px]"
            style={{ borderColor: p.border, backgroundColor: p.panel, fontFamily: p.fontMono }}
          >
            <span className="pb-1 text-[10px] uppercase tracking-[0.16em]" style={{ color: p.muted }}>
              install — claude code
            </span>
            <span>/plugin marketplace add petekp/circuit</span>
            <span>/plugin install circuit@circuit</span>
          </div>

          <div
            className="flex flex-col gap-1 rounded-xl border p-4 text-[12.5px]"
            style={{ borderColor: p.border, backgroundColor: p.panel, fontFamily: p.fontMono }}
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
      <link rel="stylesheet" precedence="default" href={p.fontHref} />
    </section>
  );
}

export default function PalettesSheetTwo() {
  const first = PALETTES[0];
  return (
    <div className="min-h-screen" style={{ backgroundColor: first.bg }}>
      <style>{`body { background: ${first.bg}; }`}</style>

      <nav
        className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4 text-[11px] uppercase tracking-[0.16em]"
        style={{ color: first.muted, fontFamily: first.fontMono }}
      >
        <Link href="/explore">Explorations</Link>
        <div className="flex gap-4">
          <Link href="/explore/marks-2">Marks 2</Link>
          <span aria-current="page" className="underline" style={{ color: first.text }}>
            Palettes 2
          </span>
        </div>
      </nav>

      <header
        className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 pb-10 pt-10"
        style={{ color: first.text, fontFamily: first.fontText }}
      >
        <h1 className="text-3xl font-semibold tracking-tight">
          Palette + type riffs, round two
        </h1>
        <p className="max-w-2xl text-[16px] leading-relaxed" style={{ color: first.muted }}>
          No orange, coral, peach, or copper anywhere — that territory
          reads as Claude&apos;s. Six hue territories, and this time each
          band carries its own typeface pairing, so what you&apos;re
          judging is a full treatment: color and voice together.
        </p>
      </header>

      {PALETTES.map((p, i) => (
        <Band key={p.id} p={p} index={i} />
      ))}
    </div>
  );
}
