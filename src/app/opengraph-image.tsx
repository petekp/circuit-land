import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export const alt =
  "Circuit — the process your coding agent follows. For Claude Code and Codex.";

// Brand hex values mirror the BRAND THEME block in globals.css
// (ImageResponse can't read CSS vars). Re-theming means updating these.
const BG = "#000000"; // --brand-bg
const TEXT = "#edede9"; // --brand-text
const MUTED = "#9b9da1"; // --brand-muted
const SIGNAL = "#06eaa9"; // --brand-signal

const STADIUM_D = "M 23 15 H 41 A 17 17 0 0 1 41 49 H 23 A 17 17 0 0 1 23 15 Z";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          color: TEXT,
          padding: 72,
        }}
      >
        {/* The resting mark: gapped stadium, runner at the gate. Dash values
            in real path units; the rasterizer doesn't honor pathLength. */}
        <svg viewBox="0 0 64 64" width={96} height={96}>
          <path
            d={STADIUM_D}
            fill="none"
            stroke={SIGNAL}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray="120 22.8"
            strokeDashoffset={86.7}
          />
          <circle cx={58} cy={32} r={4} fill={SIGNAL} />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: -2,
            }}
          >
            circuit
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 860,
              fontSize: 38,
              lineHeight: 1.25,
              color: MUTED,
            }}
          >
            The process your coding agent follows.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 2,
            color: MUTED,
            textTransform: "uppercase",
          }}
        >
          Claude Code and Codex
        </div>
      </div>
    ),
    size,
  );
}
