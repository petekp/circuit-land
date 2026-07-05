"use client";

/* The light-weight entry to the WebGL glass layer. This module stays cheap to
   import: three.js and the R3F runtime live in glass-canvas, loaded through a
   dynamic import so they land in their own lazy chunk and never render on the
   server (the canvas is pure enhancement — the CSS glass underneath is the
   loading state, the no-WebGL path, and the reduced-motion path). */

import dynamic from "next/dynamic";
import type { RefObject } from "react";

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
