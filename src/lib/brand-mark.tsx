import type { ReactElement } from "react";

// Circuit brand mark: a 3x3 grid in the FlowGlyph visual language, using the
// "Build" flow motif (an ascending fill). Shared by icon.tsx and apple-icon.tsx
// so the favicon and apple-touch icon stay identical. Palette matches
// opengraph-image.tsx (#171510 ground, #00ffd1 accent).
const BG = "#171510";
const FILL = "#00ffd1";
const EMPTY = "rgba(241, 237, 223, 0.08)";

// Build motif (same cells as the on-page FlowGlyph): lower-left triangle.
const MOTIF = [
  false, false, true,
  false, true, true,
  true, true, true,
];

export function brandMark(pixel: number): ReactElement {
  const pad = Math.round(pixel * 0.094);
  const gap = Math.round(pixel * 0.06);
  const cell = Math.floor((pixel - pad * 2 - gap * 2) / 3);
  const radius = Math.max(1, Math.round(cell * 0.18));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap,
        background: BG,
      }}
    >
      {[0, 1, 2].map((r) => (
        <div key={r} style={{ display: "flex", gap }}>
          {[0, 1, 2].map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                width: cell,
                height: cell,
                borderRadius: radius,
                background: MOTIF[r * 3 + c] ? FILL : EMPTY,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
