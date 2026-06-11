import type { ReactElement } from "react";

// Circuit brand mark for generated icons: the gapped-stadium track on
// graphite. Shared by icon.tsx and apple-icon.tsx so the favicon and
// apple-touch icon stay identical.
//
// This is one of the two surfaces that restate the brand theme outside
// globals.css (see the BRAND THEME block there): ImageResponse can't read
// CSS vars, so the hex values below mirror --brand-bg and --brand-signal.
// Re-theming the site means updating these two constants too.
const BG = "#161718"; // --brand-bg  hsl(220 3% 9%)
const INK = "#06eaa9"; // --brand-signal  hsl(163 95% 47%)

const STADIUM_D = "M 23 15 H 41 A 17 17 0 0 1 41 49 H 23 A 17 17 0 0 1 23 15 Z";

// Dash values are in real path units (perimeter ≈ 142.8), not the
// pathLength=100 normalization the CircuitMark component uses — the SVG
// rasterizer behind ImageResponse doesn't honor pathLength. The gate is
// centered on the right cap.
const TRACK = { dasharray: "125.7 17.1", dashoffset: 89.5 }; // gap 12

export function brandMark(pixel: number): ReactElement {
  const dash = TRACK;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BG,
      }}
    >
      <svg viewBox="0 0 64 64" width={pixel} height={pixel}>
        <path
          d={STADIUM_D}
          fill="none"
          stroke={INK}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={dash.dasharray}
          strokeDashoffset={dash.dashoffset}
        />
      </svg>
    </div>
  );
}
