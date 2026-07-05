/* The live tuning surface for the GL glass scene. One mutable object, shared
   by the frame loop (reads every field every frame) and the tweakpane panel
   (mutates fields in place as sliders move). Mutation-not-state is the point:
   a slider drag never re-renders React, the next GL frame just reads the new
   number. The single structural exception is `post.enabled`, which mounts or
   unmounts the EffectComposer — the panel bumps the version below and the
   scene re-renders through useSyncExternalStore.

   The vocabulary follows the Ever AI background effect (arc-design-studio):
   physical, named controls — light angle and elevation, polish, frost,
   emissive — each with visible authority, instead of abstract gains.

   The defaults are the values the showpiece shipped with, so a reset always
   lands on a known-good look. When a dialed-in set should become the new
   baseline, update GLASS_DEFAULTS and the look is committed. */

export type GlassParams = {
  glass: {
    // MeshTransmissionMaterial scalars, written to every slab each frame.
    transmission: number;
    thickness: number;
    ior: number;
    chromaticAberration: number;
    // Body roughness: how milky the transmitted page reads. One value for
    // every slab — recession is depth of field's job now, not roughness's.
    frost: number;
    // Directional smearing of the transmission blur (anisotropicBlur).
    frostBlur: number;
    distortion: number;
    distortionScale: number;
    temporalDistortion: number;
    // The polished top layer: a clearcoat catching the key light. Sheen
    // breadth rides clearcoatRoughness — 0 is a pinpoint glint, 1 a broad
    // soft sheen.
    clearcoat: number;
    clearcoatRoughness: number;
    // Self-glow tinted by the flow color, graded by focus so the step at
    // the plane carries the light. Feeds bloom.
    emissive: number;
    // The in-material recession grade: the tint multiplies transmitted
    // light, so scaling it down moves a receded slab out of the light.
    dimReceded: number;
    // What the glass transmits. The canvas is transparent — there is no
    // painted background — so the transmission buffer holds the site
    // background lifted toward white by this much. 0 makes the slabs
    // transmit the bare page and read as body-less outlines.
    baseLift: number;
  };
  tints: {
    // How far each tile kind's tint leans toward the flow color.
    step: number;
    checkpoint: number;
    loop: number;
    prompt: number;
    // The prompt is a terminal: its glass stays dark.
    promptDarken: number;
  };
  light: {
    ambient: number;
    // The key light, aimed like a studio lamp: angle in degrees around the
    // canvas (0 = from the right, 90 = from above), elevation in degrees off
    // the glass plane (low = grazing side-light with dramatic bevels, 90 =
    // flat overhead).
    keyIntensity: number;
    keyAngle: number;
    keyElevation: number;
    // The cool counter-light opposite the key (the classic two-light setup):
    // keeps the shadow-side bevels from going dead.
    fillIntensity: number;
  };
  depth: {
    // How far a fully receded slab sinks behind the focal plane, in world px.
    // The scroll moves slabs through this range; depth of field reads it.
    zSpread: number;
    // The sharp band around the focal plane, world px. Everything inside is
    // crisp; blur ramps in past it.
    focusRange: number;
    // The bokeh kernel scale: how big the blur gets at full recession.
    bokehScale: number;
  };
  wires: {
    // The conduit light: a hot core (HDR — above 1 it excites bloom) inside
    // a soft halo skirt. Widths in px.
    coreGain: number;
    coreWidth: number;
    haloGain: number;
    haloWidth: number;
    // The energy pulses gliding tail-to-head: comet brightness, speed in
    // px/s, spacing between comets in px, tail length in px.
    pulseGain: number;
    pulseSpeed: number;
    pulseSpacing: number;
    pulseLength: number;
    // The glow floor when a wire's endpoints recede.
    floor: number;
    // The SVG cores draw in staggered; the light arrives on the same clock.
    stagger: number;
    fadeIn: number;
    // Port hot spots at wire terminals; the head lights when the sweep
    // arrives.
    portGain: number;
    portSize: number;
    headGain: number;
    headSize: number;
    // The dashed return edge runs dimmer than the forward path.
    returnDim: number;
  };
  post: {
    // Structural: mounts/unmounts the composer. Changing it must bump.
    enabled: boolean;
    bloomIntensity: number;
    // Linear-space values (the composer's buffers are linear).
    bloomThreshold: number;
    bloomSmoothing: number;
    grainOpacity: number;
  };
};

export const GLASS_DEFAULTS: GlassParams = {
  glass: {
    transmission: 1,
    thickness: 22,
    ior: 1.22,
    chromaticAberration: 0.04,
    frost: 0.3,
    frostBlur: 0.32,
    distortion: 0.14,
    distortionScale: 0.6,
    temporalDistortion: 0.02,
    clearcoat: 0.55,
    clearcoatRoughness: 0.22,
    emissive: 0.05,
    dimReceded: 0.78,
    baseLift: 0.08,
  },
  tints: {
    step: 0.16,
    checkpoint: 0.3,
    loop: 0.1,
    prompt: 0.06,
    promptDarken: 0.55,
  },
  light: {
    ambient: 0.55,
    keyIntensity: 1.2,
    keyAngle: 155,
    keyElevation: 38,
    fillIntensity: 0.45,
  },
  depth: {
    zSpread: 170,
    focusRange: 90,
    bokehScale: 2.4,
  },
  wires: {
    coreGain: 1.6,
    coreWidth: 1.6,
    haloGain: 0.16,
    haloWidth: 14,
    pulseGain: 1.2,
    pulseSpeed: 120,
    pulseSpacing: 320,
    pulseLength: 90,
    floor: 0.15,
    stagger: 0.05,
    fadeIn: 0.45,
    portGain: 0.9,
    portSize: 26,
    headGain: 0.8,
    headSize: 20,
    returnDim: 0.45,
  },
  post: {
    enabled: true,
    bloomIntensity: 0.5,
    bloomThreshold: 0.06,
    bloomSmoothing: 0.3,
    grainOpacity: 0.05,
  },
};

export const glassParams: GlassParams = structuredClone(GLASS_DEFAULTS);

let version = 0;
const listeners = new Set<() => void>();

// For structural changes only (post.enabled). Scalar tweaks skip this: the
// frame loop reads them live and a bump would re-render the scene for
// nothing.
export function bumpGlassParams() {
  version += 1;
  for (const listener of listeners) listener();
}

export function subscribeGlassParams(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function glassParamsVersion() {
  return version;
}

export function resetGlassParams() {
  const fresh = structuredClone(GLASS_DEFAULTS);
  Object.assign(glassParams.glass, fresh.glass);
  Object.assign(glassParams.tints, fresh.tints);
  Object.assign(glassParams.light, fresh.light);
  Object.assign(glassParams.depth, fresh.depth);
  Object.assign(glassParams.wires, fresh.wires);
  Object.assign(glassParams.post, fresh.post);
  bumpGlassParams();
}
