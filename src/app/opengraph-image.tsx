import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export const alt =
  "Circuit — powerful, repeatable work patterns for coding agents. For Claude Code and Codex.";

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
          background: "#171510",
          color: "#f1eddf",
          fontFamily: "monospace",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", gap: 18 }}>
          {["#00ffd1", "#ff2e87", "#ffd140", "#7c4dff", "#00b8d4"].map(
            (color) => (
              <div
                key={color}
                style={{
                  width: 34,
                  height: 34,
                  background: color,
                }}
              />
            ),
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: 0,
            }}
          >
            Circuit
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 860,
              fontSize: 38,
              lineHeight: 1.25,
              color: "#b2a999",
            }}
          >
            Powerful, repeatable work patterns for coding agents.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 2,
            color: "#b2a999",
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
