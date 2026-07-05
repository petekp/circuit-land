/* The live tuning surface for the GL glass scene. One mutable object, shared
   by the frame loop (reads every field every frame) and the tweakpane panel
   (mutates fields in place as sliders move). Mutation-not-state is the point:
   a slider drag never re-renders React, the next GL frame just reads the new
   number. The single structural exception is `post.enabled`, which mounts or
   unmounts the EffectComposer — the panel bumps the version below and the
   scene re-renders through useSyncExternalStore.

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
    anisotropicBlur: number;
    distortion: number;
    distortionScale: number;
    temporalDistortion: number;
    // Roughness rides focus between these two ends — the GL analog of the
    // CSS blur() riding --illum.
    roughnessFocused: number;
    roughnessReceded: number;
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
    key: number;
    // The focal glow behind whichever tile holds the plane.
    glowGain: number;
    // The warm pool at the focal line. Off by default: with the painted
    // light bed gone, the page background owns the atmosphere and the pool
    // is opt-in warmth.
    poolGain: number;
    poolHeight: number;
  };
  wires: {
    gain: number;
    returnGain: number;
    // The glow floor when a wire's endpoints recede.
    floor: number;
    halfWidth: number;
    portGain: number;
    headGain: number;
    portSize: number;
    headSize: number;
    // The SVG cores draw in staggered; the glow arrives on the same clock.
    stagger: number;
    fadeIn: number;
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
    anisotropicBlur: 0.32,
    distortion: 0.14,
    distortionScale: 0.6,
    temporalDistortion: 0.02,
    roughnessFocused: 0.3,
    roughnessReceded: 0.62,
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
    key: 1.1,
    glowGain: 0.163,
    poolGain: 0,
    poolHeight: 520,
  },
  wires: {
    gain: 0.11,
    returnGain: 0.055,
    floor: 0.15,
    halfWidth: 5,
    portGain: 0.35,
    headGain: 0.25,
    portSize: 20,
    headSize: 14,
    stagger: 0.05,
    fadeIn: 0.45,
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
  Object.assign(glassParams.wires, fresh.wires);
  Object.assign(glassParams.post, fresh.post);
  bumpGlassParams();
}
