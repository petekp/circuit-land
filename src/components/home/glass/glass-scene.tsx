"use client";

/* The light-weight entry to the WebGL glass layer. This module stays cheap to
   import: three.js and the R3F runtime live in glass-canvas, loaded through a
   dynamic import so they land in their own lazy chunk and never render on the
   server (the canvas is pure enhancement — the CSS glass underneath is the
   loading state, the no-WebGL path, and the reduced-motion path). */

import dynamic from "next/dynamic";
import type { RefObject } from "react";

// The wire data the GL layer mirrors: the same measured segments the SVG
// draws, in diagram-canvas coordinates. The GL side adds the LIGHT (an
// additive under-glow and glowing ports); the SVG keeps the crisp core.
export type GlassSegment = {
  id: string;
  d: string;
  head: { x: number; y: number };
  tail: { x: number; y: number };
  kind?: "return";
  from: string;
  to: string;
};

export type GlassLayerProps = {
  // The sticky full-viewport element the canvas fills. Slab positions are
  // computed relative to its live box, so the world/CSS mapping holds while
  // the host rides the viewport.
  host: RefObject<HTMLDivElement | null>;
  // The diagram's live node registry (step id → visual tile element). The GL
  // frame loop reads each element's box every frame; exiting tiles stay in
  // the map until unmount, so their slabs track the exit animation too.
  nodes: RefObject<Map<string, HTMLElement> | null>;
  // The active flow's brand color as a CSS hsl() literal.
  flowColor: string;
  // The measured wire segments (canvas space), refreshed by the same pass
  // that feeds the SVG.
  segments: GlassSegment[];
  // Fired if the WebGL context dies (GPU reset, driver reclaim). The owner
  // unmounts the GL layer and lets the CSS glass return: a dead context
  // under [data-gl] would leave the tiles with no material at all.
  onContextLost?: () => void;
};

const GlassCanvas = dynamic(() => import("./glass-canvas"), { ssr: false });

let webglSupport: boolean | null = null;

// Whether this browser can give us a WebGL context at all. Probed once per
// page; the diagram uses it to decide between the GL layer and the CSS glass.
export function probeWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const probe = document.createElement("canvas");
    webglSupport = Boolean(
      probe.getContext("webgl2") ?? probe.getContext("webgl"),
    );
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

export function GlassLayer(props: GlassLayerProps) {
  return <GlassCanvas {...props} />;
}
