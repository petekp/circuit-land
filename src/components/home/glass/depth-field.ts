/* The depth-of-field math for the flow diagram, shared by both renderers.
   The DOM DepthTiles (the CSS fallback and the text layer) and the WebGL
   glass layer must grade a tile identically — same focal line, same curve —
   or the GL slab would disagree with the DOM treatment sitting on top of it.
   This module is pure math with no React and no three.js, so either side can
   import it without dragging in the other's dependencies. */

// The page-space focal plane, as a fraction of the viewport height. A step
// whose center sits on this line reads fully sharp; the depth-of-field layer
// grades everything else by its distance from it, and selecting a feature
// scrolls the page to bring the anchor step here. Above center: the reader's
// eye rests in the upper third, and it leaves room below for the next steps
// to visibly wait out of focus.
export const FOCAL_LINE = 0.38;

// The depth of field. Full focus holds for DOF_PLATEAU px either side of the
// plane (roughly half a tile, so a step doesn't shimmer while its center
// rides near the line), then decays to fully receded across DOF_FALLOFF px
// more. The curve is 1 - x², so focus lets go gently near the plane and
// falls faster into the distance.
export const DOF_PLATEAU = 110;
export const DOF_FALLOFF = 380;

// The receded end of each channel. Scale stays subtle on purpose: wires are
// measured from unscaled boxes, so a scaled tile's edge drifts a few px off
// its wire ends — but a receded tile's wires are also faded to near-nothing
// (see WireSegment), which is what keeps the drift invisible.
export const DOF_SCALE_MIN = 0.945;
export const DOF_BLUR_MAX = 4.5;
// The veil (flow-veil, riding --illum) owns the darkness of a receded tile
// now, so wrapper opacity only assists; a 0.55 floor on top of the veil
// crushed the neon elements that are supposed to survive recession.
export const DOF_OPACITY_MIN = 0.72;
export const DOF_WIRE_OPACITY_MIN = 0.25;

// How in-focus something is, given its signed viewport-space distance from
// the focal line: 1 on the plane (and across the plateau), 0 fully receded.
export function focusFromDist(dist: number): number {
  const x = Math.min(
    1,
    Math.max(0, (Math.abs(dist) - DOF_PLATEAU) / DOF_FALLOFF),
  );
  return 1 - x * x;
}
