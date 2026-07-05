/* The depth-of-field math for the flow diagram, shared by both renderers.
   The DOM DepthTiles (the CSS fallback and the text layer) and the WebGL
   glass layer must grade a tile identically — same focal line, same curve —
   or the GL slab would disagree with the DOM treatment sitting on top of it.
   This module is pure math with no React and no three.js, so either side can
   import it without dragging in the other's dependencies.

   Every number in the grade lives in glassParams.depth (glass-params.ts) so
   the tune panel can move it live; this module owns only the curve itself.
   Consumers read the per-channel floors (scaleMin, blurMax, opacityMin,
   wireOpacityMin) and the focal line straight off glassParams.depth. */

import { glassParams } from "./glass-params";

// How in-focus something is, given its signed viewport-space distance from
// the focal line: 1 on the plane (and across the plateau), 0 fully receded.
// Focus holds for `plateau` px either side of the plane (roughly half a
// tile, so a step doesn't shimmer while its center rides near the line),
// then decays across `falloff` px more as 1 - x^curve — at the default
// curve of 2, focus lets go gently near the plane and falls faster into
// the distance.
export function focusFromDist(dist: number): number {
  const d = glassParams.depth;
  const x = Math.min(
    1,
    Math.max(0, (Math.abs(dist) - d.plateau) / Math.max(d.falloff, 1)),
  );
  return 1 - x ** d.curve;
}
