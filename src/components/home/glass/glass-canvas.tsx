"use client";

/* The WebGL glass scene. Loaded lazily (see glass-scene.tsx) so three.js
   stays out of the main bundle.

   Registration model: the scene owns NO geometry of its own. Every frame it
   re-reads each tile's live getBoundingClientRect() and moves a pooled slab
   to cover it exactly, in an orthographic camera where 1 world unit = 1 CSS
   pixel. Reads only, no DOM writes, so there is no layout thrash — and the
   slabs stay registered through anything the DOM layer does: FLIP morphs,
   scale transforms, exit animations, mid-scroll re-layout. There is no cached
   geometry to go stale.

   Material model: each slab is a rounded glass volume running drei's
   MeshTransmissionMaterial. Transmission refracts the GL scene, not the DOM,
   so a base plane (never drawn to screen) stands in for the page behind the
   slabs; one shared FBO renders it (and the focal glows) once per frame and
   feeds every slab's material — passing an external buffer makes drei skip
   its per-material scene render, so 11 slabs cost one extra scene draw, not
   11.

   Light model: the canvas is TRANSPARENT — no painted background. The GL
   elements composite straight onto the site's own background: additive
   materials write light with zero alpha, so the browser's premultiplied
   compositing adds their glow over the DOM, and only slab pixels are opaque.
   The transmission buffer still needs something for the glass to refract, so
   a flat plane holding the site background color (lifted a touch toward
   white, see baseLift) renders into the FBO pass ONLY and never to screen.
   The lights are a studio rig: a key aimed by angle/elevation params and a
   cool counter-fill, so the slab bevels and clearcoat carry real speculars.
   The wires keep their crisp SVG cores (information, like the text) and the
   GL layer adds what a lit conduit casts: a hot HDR core in a soft halo,
   with energy pulses gliding along the path, graded by endpoint focus. The
   DOM tiles drop their CSS material and focal glow under [data-gl] (see
   globals.css) and keep text, veil, and neon.

   Depth model: recession is real geometry. A slab sinks behind the focal
   plane by depth.zSpread × (1 − focus) — free under the orthographic camera
   (no size or position change) — and a DepthOfFieldEffect reads the depth
   buffer, so the WHOLE slab blurs when it recedes, edges included, not just
   the content its glass transmits. The camera sits far away (CAMERA_DIST)
   because the CoC pass measures radial distance from the camera: at close
   range the focal surface is a visibly curved sphere, at 20k world units it
   is flat to within a few px across the widest canvas.

   Every look-defining number lives in glassParams (glass-params.ts), read
   fresh each frame; the tweakpane panel (glass-tune.tsx, dev or ?tune)
   mutates the same object live. */

import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, useFBO } from "@react-three/drei";
import { EffectComposer } from "@react-three/postprocessing";
import {
  BlendFunction,
  BloomEffect,
  DepthOfFieldEffect,
  NoiseEffect,
} from "postprocessing";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { focusFromDist } from "./depth-field";
import type { GlassLayerProps } from "./glass-scene";
import {
  glassParams,
  glassParamsVersion,
  subscribeGlassParams,
} from "./glass-params";

// The tuning panel rides its own lazy chunk: always available in dev, behind
// ?tune in production, absent from the bundle path otherwise.
const GlassTune = lazy(() => import("./glass-tune"));

// More slots than any flow has tiles: during a flow swap the exiting tiles
// (kept mounted by AnimatePresence popLayout) and the entering ones overlap,
// so the pool covers both generations at once. Slots beyond the live tile
// count stay invisible; the pool never reallocates.
const POOL_SIZE = 24;

// The glass volume's depth in world px. Thick enough that the beveled edge
// catches the key light and the refraction reads as a solid slab, thin
// enough that the silhouette stays the tile's rect.
const SLAB_DEPTH = 26;

// The wire light pools. The SVG keeps the crisp cores — they are
// information, like the text — and the GL layer adds what a lit conduit
// casts: a hot core in a soft halo along each path and a hot spot at each
// port. Gains, sizes, and timings live in glassParams.wires.
const WIRE_POOL = 20;
const PORT_POOL = 40;

// How far behind its focused endpoints a wire's light plane sits, so a
// ribbon never wins the depth test against the slab it plugs into.
const WIRE_Z_SET = 20;

// The orthographic camera's distance from the z=0 focal plane. Ortho framing
// is distance-independent; the number only matters to the depth-of-field
// pass, whose CoC measures RADIAL distance from the camera — far away, the
// focal sphere flattens to a plane (see the header note).
const CAMERA_DIST = 20000;

// Post-chain colorspace note: with the composer on, the scene renders into a
// LINEAR buffer and the final pass gamma-encodes, so the raw-sRGB shaders
// must ship linear on the direct view too (uLinearOut stays 1 in both
// passes) or the frame double-encodes and washes pale. Bloom thresholds are
// therefore LINEAR-space values.

type SlabDebug = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  focus: number;
  // The mesh's top-left corner projected through the live camera back into
  // canvas CSS px. Registration probes assert these equal x/y: that closes
  // the loop on the world→NDC→pixel mapping itself, which a DOM-side rect
  // comparison alone can't see.
  px: number;
  py: number;
};

const PROJECTED = new THREE.Vector3();
const WHITE = new THREE.Color(1, 1, 1);

type WireDebug = {
  id: string;
  alpha: number;
  reveal: number;
};

declare global {
  interface Window {
    // Live slab rects (host-relative CSS px) and wire glow state for
    // registration probes.
    __glassDebug?: { frame: number; rects: SlabDebug[]; wires: WireDebug[] };
  }
}

// The flow's color arrives as a var(--flow-*) reference; the literal lives
// in the stylesheet. Computed custom-property values substitute nested
// var()s but their serialization is the engine's choice — Chrome hands back
// hex, others may keep rgb() or the authored space-separated hsl(), and
// THREE.Color.set() only understands hex and the legacy comma forms. Accept
// all three shapes so the GL tint can never silently fall back to grey (it
// did: the hex form slipped past an hsl-only parse here and washed the
// whole light bed).
//
// Color space matters as much as the parse. The slab tints feed a physical
// material, so they convert sRGB → the linear working space like any texture
// would. The LIGHT BED does not: CSS composites its gradients in gamma-space
// sRGB, so the backdrop shader mixes raw sRGB components and writes them out
// unencoded — running that math in linear and gamma-encoding the result
// reads 2–5× brighter than the CSS it's porting (worst at the additive low
// end, where linear 0.05 encodes to 0.24). `raw` picks the storage.
function resolveCssColor(
  el: HTMLElement,
  css: string,
  raw = false,
): THREE.Color {
  const space = raw ? THREE.LinearSRGBColorSpace : THREE.SRGBColorSpace;
  const varMatch = css.match(/var\((--[\w-]+)/);
  const literal = varMatch
    ? getComputedStyle(el).getPropertyValue(varMatch[1]).trim()
    : css;
  const color = new THREE.Color();
  const hexM = literal.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexM) {
    const hex =
      hexM[1].length === 3
        ? [...hexM[1]].map((c) => c + c).join("")
        : hexM[1];
    const n = parseInt(hex, 16);
    color.setRGB(
      ((n >> 16) & 255) / 255,
      ((n >> 8) & 255) / 255,
      (n & 255) / 255,
      space,
    );
    return color;
  }
  const hslM = literal.match(/hsla?\(\s*([\d.]+)[\s,]+([\d.]+)%[\s,]+([\d.]+)%/);
  if (hslM) {
    color.setHSL(
      Number(hslM[1]) / 360,
      Number(hslM[2]) / 100,
      Number(hslM[3]) / 100,
      space,
    );
    return color;
  }
  const rgbM = literal.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (rgbM) {
    color.setRGB(
      Number(rgbM[1]) / 255,
      Number(rgbM[2]) / 255,
      Number(rgbM[3]) / 255,
      space,
    );
    return color;
  }
  color.set("#8b8b96");
  return color;
}

// The studio rig's fixed colors (hand-tuned, from the Ever effect's palette):
// a warm-white key, a cool blue fill. Angles and intensities live in
// glassParams.light.
const KEY_COLOR = new THREE.Color(1.0, 0.98, 0.92);
const FILL_COLOR = new THREE.Color(0.66, 0.8, 1.0);

const QUAD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The transmission base: what the glass refracts, never drawn to screen.
// The canvas itself is transparent (the site background shows through), but
// MeshTransmissionMaterial samples a rendered buffer, so this plane paints
// the site background color into the FBO — lifted a touch toward white so
// the slabs read as glass catching ambient light instead of vanishing into
// the page.
const BASE_FRAG = /* glsl */ `
  uniform vec3 uBase;
  uniform float uLift;
  uniform float uLinearOut;

  void main() {
    // Raw sRGB mixing, like the CSS this stands in for; the FBO consumer
    // wants linear, so the pass flips uLinearOut and decodes.
    vec3 col = mix(uBase, vec3(1.0), uLift);
    if (uLinearOut > 0.5) col = pow(col, vec3(2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;

// The port hot spot: the same profile family as the wire — a gaussian core
// inside an exponential skirt, eased to zero before the quad's edge. Raw
// sRGB on the direct view (see the colorspace note); the FBO pass flips
// uLinearOut. Dim pixels discard so the depth write (which keeps the DoF
// pass from far-blurring the light) never stamps invisible fragments.
const PORT_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uGain;
  uniform float uCore;
  uniform float uLinearOut;
  varying vec2 vUv;

  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float core = exp(-(d * d) / (2.0 * uCore * uCore));
    float halo = exp(-d * 4.0) * 0.5;
    float a = (core + halo) * uGain * (1.0 - smoothstep(0.8, 1.0, d));
    if (a < 0.004) discard;
    vec3 col = uColor * a;
    if (uLinearOut > 0.5) col = pow(col, vec3(2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;

// The wire light ribbon: a triangle strip along the sampled path, aT running
// -1..1 across it (edge = haloWidth px) and aL 0..1 along it. The vertex
// stage rides the endpoints' DEPTH: z interpolates tail-to-head, so the
// depth-of-field pass blurs a wire's receded end and leaves its focused end
// crisp, exactly like the slabs it connects.
const RIBBON_VERT = /* glsl */ `
  attribute float aT;
  attribute float aL;
  uniform float uZFrom;
  uniform float uZTo;
  varying float vT;
  varying float vL;
  void main() {
    vT = aT;
    vL = aL;
    vec3 p = position;
    p.z = mix(uZFrom, uZTo, aL);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

// The conduit profile: a hot gaussian core (HDR — uCoreGain above 1 excites
// bloom) inside an exponential halo skirt, plus a train of comet pulses
// gliding tail-to-head: sharp nose, exponential wake, riding the core so
// they read as current in the conduit. Dim pixels discard so the depth
// write never stamps invisible fragments.
const RIBBON_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uEnergy;
  uniform float uReveal;
  uniform float uCoreGain;
  uniform float uCore;
  uniform float uHaloGain;
  uniform float uPulseGain;
  uniform float uPulseSpeed;
  uniform float uPulseSpacing;
  uniform float uPulseLength;
  uniform float uLen;
  uniform float uTime;
  uniform float uLinearOut;
  varying float vT;
  varying float vL;

  void main() {
    float d = abs(vT);
    // Core sigma is coreWidth/haloWidth, so the core reads in px no matter
    // how wide the ribbon geometry runs.
    float sigma = max(uCore, 0.02);
    float core = exp(-(d * d) / (2.0 * sigma * sigma));
    float halo = exp(-d * 3.0) * (1.0 - d);
    float ends = smoothstep(0.0, 0.06, vL) * (1.0 - smoothstep(0.94, 1.0, vL));
    // The light sweeps tail-to-head as uReveal runs 0..1, tracking the SVG
    // core's pathLength draw-in so the glow never precedes its conduit. The
    // 1.08 overshoot lets the soft edge clear the far end.
    float reveal = clamp((uReveal * 1.08 - vL) / 0.08, 0.0, 1.0);
    float s = vL * uLen;
    float behind = mod(uTime * uPulseSpeed - s, max(uPulseSpacing, 1.0));
    float comet = exp(-behind / max(uPulseLength, 1.0));
    float glow = (core * uCoreGain + halo * uHaloGain
      + core * comet * uPulseGain) * ends * reveal * uEnergy;
    if (glow < 0.004) discard;
    vec3 col = uColor * glow;
    if (uLinearOut > 0.5) col = pow(col, vec3(2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;

// Sample an absolute-command SVG path (the connector engine only emits
// M/L/C/Q) into a polyline in canvas coordinates.
function samplePath(d: string): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  const tokens = d.match(/[MLCQ]|-?[\d.]+/g);
  if (!tokens) return pts;
  let i = 0;
  let cx = 0;
  let cy = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === "M" || cmd === "L") {
      cx = num();
      cy = num();
      pts.push({ x: cx, y: cy });
    } else if (cmd === "C") {
      const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
      for (let s = 1; s <= 16; s += 1) {
        const t = s / 16;
        const u = 1 - t;
        pts.push({
          x: u * u * u * cx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x,
          y: u * u * u * cy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y,
        });
      }
      cx = x;
      cy = y;
    } else if (cmd === "Q") {
      const x1 = num(), y1 = num(), x = num(), y = num();
      for (let s = 1; s <= 10; s += 1) {
        const t = s / 10;
        const u = 1 - t;
        pts.push({
          x: u * u * cx + 2 * u * t * x1 + t * t * x,
          y: u * u * cy + 2 * u * t * y1 + t * t * y,
        });
      }
      cx = x;
      cy = y;
    }
  }
  return pts;
}

// Build the ribbon strip for a polyline: each point becomes two vertices
// offset along the averaged perpendicular, y negated (canvas y-down →
// world y-up; the ribbon lives in a group anchored at the canvas origin).
function buildRibbon(
  pts: Array<{ x: number; y: number }>,
  halfWidth: number,
): THREE.BufferGeometry {
  const n = pts.length;
  const geo = new THREE.BufferGeometry();
  if (n < 2) return geo;
  const pos = new Float32Array(n * 2 * 3);
  const aT = new Float32Array(n * 2);
  const aL = new Float32Array(n * 2);
  const idx: number[] = [];
  let length = 0;
  const lens = new Float32Array(n);
  for (let k = 1; k < n; k += 1) {
    length += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
    lens[k] = length;
  }
  for (let k = 0; k < n; k += 1) {
    const prev = pts[Math.max(0, k - 1)];
    const next = pts[Math.min(n - 1, k + 1)];
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const tl = Math.hypot(tx, ty) || 1;
    const nx = (-ty / tl) * halfWidth;
    const ny = (tx / tl) * halfWidth;
    const l = length > 0 ? lens[k] / length : 0;
    const p = pts[k];
    pos.set([p.x + nx, -(p.y + ny), 0], k * 6);
    pos.set([p.x - nx, -(p.y - ny), 0], k * 6 + 3);
    aT[k * 2] = 1;
    aT[k * 2 + 1] = -1;
    aL[k * 2] = l;
    aL[k * 2 + 1] = l;
    if (k > 0) {
      const a = (k - 1) * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
  geo.setAttribute("aL", new THREE.BufferAttribute(aL, 1));
  geo.setIndex(idx);
  // The pulse train needs real px along the path (aL is normalized).
  geo.userData.length = length;
  return geo;
}

// The drei material's tunable scalars are live properties on the instance
// (each custom uniform gets an accessor). The one quirk: the real
// transmission knob is `_transmission` — the `transmission` property must
// stay 0 or three schedules its own extra transmission render pass.
type TransmissionMaterial = THREE.MeshPhysicalMaterial & {
  _transmission: number;
  chromaticAberration: number;
  anisotropicBlur: number;
  distortion: number;
  distortionScale: number;
  temporalDistortion: number;
};

function SlabField({ hostRef, nodes, flowColor, segments }: GlassLayerProps) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const wireRefs = useRef<(THREE.Mesh | null)[]>([]);
  const portRefs = useRef<(THREE.Mesh | null)[]>([]);
  const wireGroupRef = useRef<THREE.Group | null>(null);
  const backdropRef = useRef<THREE.Mesh | null>(null);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const camera = useThree((state) => state.camera);
  // The post effects, built as raw postprocessing instances instead of the
  // library's <Bloom>/<Noise> components. wrapEffect keys an internal
  // useMemo on JSON.stringify(props), and React 19 passes ref inside props:
  // stringifying a populated ref walks the live effect into a scene-graph
  // cycle and throws, unwinding the GL tree. Raw instances feed <primitive>
  // children, which nothing ever serializes. State, not memo, so Fast
  // Refresh preserves the pair (a memo reset would remount the composer
  // mid-edit); the frame loop writes through the ref mirror below, keeping
  // the state value out of render-time mutation.
  const [postFx] = useState(() => ({
    // DoF first (defocus happens in the lens, before bloom), grain last so
    // it stays crisp over the blur.
    dof: new DepthOfFieldEffect(camera, {
      focusDistance: CAMERA_DIST,
      focusRange: glassParams.depth.focusRange,
      bokehScale: glassParams.depth.bokehScale,
      resolutionScale: glassParams.depth.bokehResolution,
    }),
    bloom: new BloomEffect({
      mipmapBlur: true,
      intensity: glassParams.post.bloomIntensity,
      luminanceThreshold: glassParams.post.bloomThreshold,
      luminanceSmoothing: glassParams.post.bloomSmoothing,
    }),
    noise: new NoiseEffect({
      premultiply: true,
      blendFunction: BlendFunction.OVERLAY,
    }),
  }));
  const postFxRef = useRef(postFx);
  const canvasElRef = useRef<HTMLElement | null>(null);
  // Structural param changes (post.enabled) re-render through this; scalar
  // tweaks skip React entirely — the frame loop reads them live.
  useSyncExternalStore(subscribeGlassParams, glassParamsVersion, () => 0);
  // Focus per node id, refilled by the slab loop each frame; the wire pass
  // grades each glow by its endpoints' focus, same rule the SVG opacity runs.
  const focusById = useRef(new Map<string, number>());
  const size = useThree((state) => state.size);
  // One transmission source for every slab: the base plane, glows, and wire
  // light rendered without the slabs themselves. Slabs don't refract each
  // other, which is fine — they never overlap on screen.
  const buffer = useFBO(1024, 1024);

  // Base color resolution happens in the frame loop (the host element is
  // reliably mounted there), and only when the flow's color reference
  // changes. The per-kind tints derive from these each frame, so the tint
  // sliders apply live.
  const tintKey = useRef<string | null>(null);
  const tints = useRef({
    step: new THREE.Color(1, 1, 1),
    checkpoint: new THREE.Color(1, 1, 1),
    loop: new THREE.Color(1, 1, 1),
    prompt: new THREE.Color(1, 1, 1),
    flow: new THREE.Color("#8b8b96"),
    wire: new THREE.Color("#8b8b96"),
  });

  // Pool geometries are rebuilt imperatively as tiles resize and wires
  // re-route; drop them all when the scene unmounts.
  useEffect(() => {
    const pool = meshRefs.current;
    const wires = wireRefs.current;
    return () => {
      for (const mesh of pool) mesh?.geometry?.dispose();
      for (const mesh of wires) mesh?.geometry?.dispose();
    };
  }, []);

  useFrame((state) => {
    const hostEl = hostRef.current;
    const nodeMap = nodes.current;
    const pool = meshRefs.current;
    const backdrop = backdropRef.current;
    if (!hostEl || !nodeMap || !backdrop) return;

    const p = glassParams;
    // A slab's recession in depth: 0 at the focal plane, zSpread px behind
    // it when fully receded. Ortho keeps the screen position exact; only
    // the depth-of-field pass sees the move.
    const zFor = (f: number) => -p.depth.zSpread * (1 - f);
    if (tintKey.current !== flowColor) {
      tintKey.current = flowColor;
      const t = tints.current;
      t.flow.copy(resolveCssColor(hostEl, flowColor));
      // The wire light lives in raw sRGB (see resolveCssColor): the flow
      // color straight — the energy the tinted glass is downstream of.
      const rawFlow = resolveCssColor(hostEl, flowColor, true);
      t.wire.copy(rawFlow);
      const backdropMat = backdrop.material as THREE.ShaderMaterial;
      (backdropMat.uniforms.uBase.value as THREE.Color).copy(
        resolveCssColor(hostEl, "var(--background)", true),
      );
    }
    {
      // Per-kind tints re-derive every frame so the tint sliders bite
      // without a flow swap. The prompt is a terminal: its glass stays
      // dark — the material color multiplies the transmitted light.
      const t = tints.current;
      t.step.copy(WHITE).lerp(t.flow, p.tints.step);
      t.checkpoint.copy(WHITE).lerp(t.flow, p.tints.checkpoint);
      t.loop.copy(WHITE).lerp(t.flow, p.tints.loop);
      t.prompt
        .copy(WHITE)
        .lerp(t.flow, p.tints.prompt)
        .multiplyScalar(p.tints.promptDarken);
    }

    // One host read per frame; every slab derives from it, so subpixel error
    // between slabs is zero by construction. The diagram canvas rect places
    // the aurora field (diagram space); the focal line places the key light
    // (host space).
    const hostRect = hostEl.getBoundingClientRect();
    const canvasEl = (canvasElRef.current ??=
      hostEl.closest<HTMLElement>(".flow-diagram-canvas"));
    const canvasRect = canvasEl?.getBoundingClientRect() ?? hostRect;
    const focalY = window.innerHeight * p.depth.focalLine;

    backdrop.position.set(0, 0, -720);
    backdrop.scale.set(size.width, size.height, 1);
    const backdropMat = backdrop.material as THREE.ShaderMaterial;
    backdropMat.uniforms.uLift.value = p.glass.baseLift;

    // The studio rig reads its knobs live: the key aimed by angle/elevation
    // (directional — only the direction matters), the cool fill mirrored
    // opposite it, slightly lower.
    if (ambientRef.current) ambientRef.current.intensity = p.light.ambient;
    const keyLight = keyLightRef.current;
    const fillLight = fillLightRef.current;
    if (keyLight && fillLight) {
      const a = (p.light.keyAngle * Math.PI) / 180;
      const e = (p.light.keyElevation * Math.PI) / 180;
      const r = Math.max(size.width, size.height);
      keyLight.intensity = p.light.keyIntensity;
      keyLight.position.set(
        Math.cos(a) * Math.cos(e) * r,
        Math.sin(a) * Math.cos(e) * r,
        Math.sin(e) * r,
      );
      fillLight.intensity = p.light.fillIntensity;
      fillLight.position.set(
        -Math.cos(a) * Math.cos(e) * r,
        -Math.sin(a) * Math.cos(e) * r,
        Math.sin(e) * r * 0.8,
      );
    }

    const rects: SlabDebug[] = [];
    const focusMap = focusById.current;
    focusMap.clear();

    let slot = 0;
    for (const [id, el] of nodeMap) {
      if (slot >= POOL_SIZE) break;
      if (!el.isConnected) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const mesh = pool[slot];
      if (!mesh) break;
      slot += 1;

      // Host-relative CSS px → world units. The camera frustum spans the
      // canvas size centered on the origin, with +y up, so re-center and
      // flip y.
      const cx = r.left - hostRect.left + r.width / 2;
      const cy = r.top - hostRect.top + r.height / 2;
      const wx = cx - size.width / 2;
      const wy = size.height / 2 - cy;
      mesh.visible = true;

      // The slab is a real rounded volume sized to the tile, not a scaled
      // unit quad: non-uniform scale would distort the corner radius. Sizes
      // change rarely (resize, dial re-tier), so rebuilds are cheap; the
      // radius comes from the tile's own computed style at rebuild time.
      const cache = mesh.userData as { w?: number; h?: number; r?: number };
      const radius = Math.min(
        parseFloat(getComputedStyle(el).borderTopLeftRadius) || 14,
        Math.min(r.width, r.height) / 2 - 1,
      );
      if (
        Math.abs((cache.w ?? 0) - r.width) > 0.5 ||
        Math.abs((cache.h ?? 0) - r.height) > 0.5 ||
        Math.abs((cache.r ?? 0) - radius) > 0.5
      ) {
        mesh.geometry.dispose();
        mesh.geometry = new RoundedBoxGeometry(
          r.width,
          r.height,
          SLAB_DEPTH,
          4,
          radius,
        );
        cache.w = r.width;
        cache.h = r.height;
        cache.r = radius;
      }

      // The same grade the DOM tiles run, computed from the live box rather
      // than the measured-centers cache — fresher, and free. The slab SINKS
      // by it: recession is depth now, and the DoF pass turns that depth
      // into whole-slab blur.
      const focus = focusFromDist(r.top + r.height / 2 - focalY);
      focusMap.set(id, focus);
      mesh.position.set(wx, wy, zFor(focus));
      // The material scalars re-apply every frame straight off glassParams:
      // drei exposes each custom uniform as a live accessor on the instance,
      // so this is uniform writes, not shader rebuilds.
      const material = mesh.material as TransmissionMaterial;
      const g = p.glass;
      material._transmission = g.transmission;
      material.thickness = g.thickness;
      material.ior = g.ior;
      material.chromaticAberration = g.chromaticAberration;
      material.anisotropicBlur = g.frostBlur;
      material.distortion = g.distortion;
      material.distortionScale = g.distortionScale;
      material.temporalDistortion = g.temporalDistortion;
      material.roughness = g.frost;
      // The clamp keeps the compiled program's clearcoat branch alive: three
      // keys the shader on clearcoat > 0, so a true 0 here would need a
      // rebuild to ever come back.
      material.clearcoat = Math.max(g.clearcoat, 0.001);
      material.clearcoatRoughness = g.clearcoatRoughness;
      const shape = el.dataset.shape;
      const t = tints.current;
      material.color
        .copy(
          el.classList.contains("flow-prompt-node")
            ? t.prompt
            : shape === "checkpoint"
              ? t.checkpoint
              : shape === "loop"
                ? t.loop
                : t.step,
        )
        .multiplyScalar(g.dimReceded + (1 - g.dimReceded) * focus);
      // Self-glow tinted by the flow color, graded by focus: the step at
      // the plane carries the light, and bloom picks it up.
      material.emissive.copy(t.flow);
      material.emissiveIntensity = g.emissive * (0.25 + 0.75 * focus);

      PROJECTED.set(
        mesh.position.x - r.width / 2,
        mesh.position.y + r.height / 2,
        0,
      ).project(state.camera);
      rects.push({
        id,
        x: r.left - hostRect.left,
        y: r.top - hostRect.top,
        w: r.width,
        h: r.height,
        focus,
        px: (PROJECTED.x * 0.5 + 0.5) * size.width,
        py: (1 - (PROJECTED.y * 0.5 + 0.5)) * size.height,
      });
    }
    for (let i = slot; i < POOL_SIZE; i += 1) {
      const mesh = pool[i];
      if (mesh) mesh.visible = false;
    }

    // The wire light rides the same measured segments the SVG draws, in the
    // same canvas-relative coordinates: the group re-anchors to the canvas's
    // top-left every frame and the ribbon geometry stays canvas-local, so
    // the glow tracks the scroll for free, exactly like the slabs do.
    const wires = wireRefs.current;
    const ports = portRefs.current;
    const wireGroup = wireGroupRef.current;
    const wireDebug: WireDebug[] = [];
    if (wireGroup) {
      wireGroup.position.set(
        canvasRect.left - hostRect.left - size.width / 2,
        size.height / 2 - (canvasRect.top - hostRect.top),
        0,
      );
      const now = state.clock.elapsedTime;
      const tint = tints.current;
      for (let i = 0; i < WIRE_POOL; i += 1) {
        const mesh = wires[i];
        if (!mesh) continue;
        const seg = segments[i];
        const tailPort = ports[i * 2];
        const headPort = ports[i * 2 + 1];
        if (!seg) {
          mesh.visible = false;
          if (tailPort) tailPort.visible = false;
          if (headPort) headPort.visible = false;
          continue;
        }

        // Segment ids embed the flow key, so a flow swap restarts every
        // envelope (the SVG redraws too) while a resize only changes `d`
        // and rebuilds geometry without re-fading the light.
        const w = p.wires;
        const cache = mesh.userData as {
          id?: string;
          d?: string;
          hw?: number;
          swapT?: number;
        };
        if (cache.id !== seg.id) {
          cache.id = seg.id;
          cache.swapT = now;
        }
        if (cache.d !== seg.d || cache.hw !== w.haloWidth) {
          cache.d = seg.d;
          cache.hw = w.haloWidth;
          mesh.geometry.dispose();
          mesh.geometry = buildRibbon(samplePath(seg.d), w.haloWidth);
        }

        mesh.visible = true;
        const env = Math.min(
          Math.max((now - (cache.swapT ?? 0) - i * w.stagger) / w.fadeIn, 0),
          1,
        );
        const fFrom = focusMap.get(seg.from) ?? 0.5;
        const fTo = focusMap.get(seg.to) ?? 0.5;
        const grade = w.floor + (1 - w.floor) * ((fFrom + fTo) / 2);
        const isReturn = seg.kind === "return";
        const u = (mesh.material as THREE.ShaderMaterial).uniforms;
        (u.uColor.value as THREE.Color).copy(tint.wire);
        // Sequential wires sweep in with the SVG core's draw; the return
        // edge fades in whole, like its dashed stroke does, and runs dim.
        u.uReveal.value = isReturn ? 1 : env;
        u.uEnergy.value = grade * (isReturn ? w.returnDim * env : 1);
        u.uCoreGain.value = w.coreGain;
        u.uCore.value = Math.min(w.coreWidth / Math.max(w.haloWidth, 0.5), 1);
        u.uHaloGain.value = w.haloGain;
        u.uPulseGain.value = w.pulseGain;
        u.uPulseSpeed.value = w.pulseSpeed;
        u.uPulseSpacing.value = w.pulseSpacing;
        u.uPulseLength.value = w.pulseLength;
        u.uLen.value =
          (mesh.geometry.userData as { length?: number }).length ?? 1;
        u.uTime.value = now;
        // The ribbon rides its endpoints' depth (see RIBBON_VERT), set a
        // step behind them so it never wins the depth test against the
        // slabs it plugs into.
        u.uZFrom.value = zFor(fFrom) - WIRE_Z_SET;
        u.uZTo.value = zFor(fTo) - WIRE_Z_SET;
        wireDebug.push({
          id: seg.id,
          alpha: u.uEnergy.value as number,
          reveal: u.uReveal.value as number,
        });

        if (tailPort) {
          tailPort.visible = true;
          tailPort.position.set(
            seg.tail.x,
            -seg.tail.y,
            zFor(fFrom) - WIRE_Z_SET,
          );
          tailPort.scale.set(w.portSize, w.portSize, 1);
          const pm = (tailPort.material as THREE.ShaderMaterial).uniforms;
          (pm.uColor.value as THREE.Color).copy(tint.wire);
          pm.uGain.value =
            w.portGain *
            (w.floor + (1 - w.floor) * fFrom) *
            Math.min(env * 3, 1) *
            (isReturn ? 0.5 : 1);
        }
        if (headPort) {
          headPort.visible = true;
          headPort.position.set(
            seg.head.x,
            -seg.head.y,
            zFor(fTo) - WIRE_Z_SET,
          );
          headPort.scale.set(w.headSize, w.headSize, 1);
          const pm = (headPort.material as THREE.ShaderMaterial).uniforms;
          (pm.uColor.value as THREE.Color).copy(tint.wire);
          // The head lights when the sweep arrives, like the chevron's
          // delayed fade in the SVG.
          pm.uGain.value =
            w.headGain *
            (w.floor + (1 - w.floor) * fTo) *
            (isReturn ? env : Math.max((env - 0.7) / 0.3, 0)) *
            (isReturn ? 0.5 : 1);
        }
      }
    }

    // The post chain reads its knobs live off the effect instances. The
    // instances outlive the composer, so these writes stay valid (and
    // harmless) while post.enabled is off.
    const fx = postFxRef.current;
    fx.dof.cocMaterial.focusDistance = CAMERA_DIST;
    fx.dof.cocMaterial.focusRange = p.depth.focusRange;
    fx.dof.bokehScale = p.depth.bokehScale;
    // Guarded: the resolution setter rebuilds the pass's render targets on
    // change, so it must not run as an every-frame write like the rest.
    if (fx.dof.resolution.scale !== p.depth.bokehResolution) {
      fx.dof.resolution.scale = p.depth.bokehResolution;
    }
    fx.bloom.intensity = p.post.bloomIntensity;
    fx.bloom.luminanceMaterial.threshold = p.post.bloomThreshold;
    fx.bloom.luminanceMaterial.smoothing = p.post.bloomSmoothing;
    fx.noise.blendMode.opacity.value = p.post.grainOpacity;

    // The shared transmission pass: the base plane and wire light from the
    // same camera, so the material's screen-space buffer sampling lines up.
    // The base plane shows HERE ONLY — on screen the canvas stays
    // transparent and the real page plays the part the plane plays inside
    // the buffer. The light shaders switch to linear output for this pass
    // (see uLinearOut).
    const setLinearOut = (value: number) => {
      backdropMat.uniforms.uLinearOut.value = value;
      for (const list of [wires, ports]) {
        for (const m of list) {
          if (m) {
            (m.material as THREE.ShaderMaterial).uniforms.uLinearOut.value =
              value;
          }
        }
      }
    };
    for (let i = 0; i < slot; i += 1) {
      const mesh = pool[i];
      if (mesh) mesh.visible = false;
    }
    backdrop.visible = true;
    setLinearOut(1);
    state.gl.setRenderTarget(buffer);
    state.gl.render(state.scene, state.camera);
    state.gl.setRenderTarget(null);
    backdrop.visible = false;
    // Under the composer the direct view is ALSO a linear buffer (the final
    // pass encodes); only the composer-less fallback writes display sRGB.
    setLinearOut(p.post.enabled ? 1 : 0);
    for (let i = 0; i < slot; i += 1) {
      const mesh = pool[i];
      if (mesh) mesh.visible = true;
    }

    window.__glassDebug = {
      frame: (window.__glassDebug?.frame ?? 0) + 1,
      rects,
      wires: wireDebug,
    };
  });

  return (
    <>
      {/* The studio rig: a soft ambient bed, a warm key aimed by the
          light.keyAngle/keyElevation params, and a cool counter-fill
          mirrored opposite it — so the bevels and clearcoat carry real
          speculars from a direction Pete points, not a hardcoded one. */}
      <ambientLight ref={ambientRef} intensity={0.55} />
      <directionalLight
        ref={keyLightRef}
        color={KEY_COLOR}
        position={[-0.5 * size.width, 0.5 * size.height, 600]}
        intensity={1.2}
      />
      <directionalLight
        ref={fillLightRef}
        color={FILL_COLOR}
        position={[0.5 * size.width, -0.5 * size.height, 480]}
        intensity={0.45}
      />
      {/* The transmission base: visible during the FBO pass only (the frame
          loop toggles it). The screen never shows this plane — there the
          canvas is transparent and the page itself is the background the
          glass appears to transmit. */}
      <mesh ref={backdropRef} visible={false} renderOrder={-2}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          vertexShader={QUAD_VERT}
          fragmentShader={BASE_FRAG}
          uniforms={{
            uBase: { value: new THREE.Color(0x161718) },
            uLift: { value: 0.08 },
            uLinearOut: { value: 0 },
          }}
        />
      </mesh>
      {/* Additive light on a transparent canvas needs custom blending: the
          color factors add (ONE, ONE) while the alpha factors keep the
          destination's (ZERO, ONE). Stock AdditiveBlending also ADDS alpha,
          and a light quad that lands alpha 1 composites as an opaque black
          box over the page below.

          The wire light: additive ribbons under the SVG cores plus a hot
          spot at each port, grouped so one canvas-anchored transform moves
          them all. Unlike the old flat quads these WRITE DEPTH (with a
          discard guard for dim pixels), riding their endpoints' recession
          so the DoF pass grades them with the slabs instead of far-blurring
          them into mush. */}
      <group ref={wireGroupRef}>
        {Array.from({ length: WIRE_POOL }, (_, i) => (
          <mesh
            key={`wire-${i}`}
            ref={(mesh: THREE.Mesh | null) => {
              wireRefs.current[i] = mesh;
            }}
            visible={false}
            renderOrder={-1}
          >
            <shaderMaterial
              vertexShader={RIBBON_VERT}
              fragmentShader={RIBBON_FRAG}
              uniforms={{
                uColor: { value: new THREE.Color(1, 1, 1) },
                uEnergy: { value: 0 },
                uReveal: { value: 0 },
                uCoreGain: { value: 0 },
                uCore: { value: 0.12 },
                uHaloGain: { value: 0 },
                uPulseGain: { value: 0 },
                uPulseSpeed: { value: 0 },
                uPulseSpacing: { value: 320 },
                uPulseLength: { value: 90 },
                uLen: { value: 1 },
                uTime: { value: 0 },
                uZFrom: { value: -WIRE_Z_SET },
                uZTo: { value: -WIRE_Z_SET },
                uLinearOut: { value: 0 },
              }}
              transparent
              blending={THREE.CustomBlending}
              blendSrc={THREE.OneFactor}
              blendDst={THREE.OneFactor}
              blendSrcAlpha={THREE.ZeroFactor}
              blendDstAlpha={THREE.OneFactor}
            />
          </mesh>
        ))}
        {Array.from({ length: PORT_POOL }, (_, i) => (
          <mesh
            key={`port-${i}`}
            ref={(mesh: THREE.Mesh | null) => {
              portRefs.current[i] = mesh;
            }}
            visible={false}
            renderOrder={-1}
          >
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
              vertexShader={QUAD_VERT}
              fragmentShader={PORT_FRAG}
              uniforms={{
                uColor: { value: new THREE.Color(1, 1, 1) },
                uGain: { value: 0 },
                uCore: { value: 0.32 },
                uLinearOut: { value: 0 },
              }}
              transparent
              blending={THREE.CustomBlending}
              blendSrc={THREE.OneFactor}
              blendDst={THREE.OneFactor}
              blendSrcAlpha={THREE.ZeroFactor}
              blendDstAlpha={THREE.OneFactor}
            />
          </mesh>
        ))}
      </group>
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <mesh
          key={i}
          ref={(mesh: THREE.Mesh | null) => {
            meshRefs.current[i] = mesh;
          }}
          visible={false}
        >
          {/* clearcoat clamps to ≥0.001: three compiles the clearcoat
              program branch only when the value is nonzero, so a true 0
              here would dead-end the panel slider after first compile. */}
          <MeshTransmissionMaterial
            buffer={buffer.texture}
            transmission={glassParams.glass.transmission}
            thickness={glassParams.glass.thickness}
            ior={glassParams.glass.ior}
            roughness={glassParams.glass.frost}
            chromaticAberration={glassParams.glass.chromaticAberration}
            anisotropicBlur={glassParams.glass.frostBlur}
            distortion={glassParams.glass.distortion}
            distortionScale={glassParams.glass.distortionScale}
            temporalDistortion={glassParams.glass.temporalDistortion}
            clearcoat={Math.max(glassParams.glass.clearcoat, 0.001)}
            clearcoatRoughness={glassParams.glass.clearcoatRoughness}
            samples={4}
          />
        </mesh>
      ))}
      {glassParams.post.enabled && (
        <EffectComposer multisampling={4}>
          {/* Defocus happens in the lens before light hits film: DoF first,
              then bloom spreads what survives, grain last stays crisp. */}
          <primitive object={postFx.dof} />
          <primitive object={postFx.bloom} />
          <primitive object={postFx.noise} />
        </EffectComposer>
      )}
    </>
  );
}

// Report a dying WebGL context to the owner. Lives inside the R3F tree so
// the listener detaches during React's child-first cleanup, BEFORE the root's
// own unmount disposes the renderer — a dispose-time loss event must not read
// as a GPU failure. No preventDefault: we don't want restoration, we want the
// CSS glass back (see onContextLost in glass-scene.tsx).
function ContextGuard({ onContextLost }: { onContextLost?: () => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    if (!onContextLost) return;
    const el = gl.domElement;
    el.addEventListener("webglcontextlost", onContextLost);
    return () => el.removeEventListener("webglcontextlost", onContextLost);
  }, [gl, onContextLost]);
  return null;
}

export default function GlassCanvas(props: GlassLayerProps) {
  // The render loop runs only while the diagram's sticky range is anywhere
  // near the viewport. The host is pinned for the section's whole scroll
  // range, so intersection flips exactly at section enter/exit; the 50%
  // margin restarts the loop half a viewport early, so the first visible
  // frame is already current. (Hidden tabs need nothing: rAF stops there.)
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  useEffect(() => {
    const el = props.hostRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFrameloop(entry.isIntersecting ? "always" : "never"),
      { rootMargin: "50% 0% 50% 0%" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [props.hostRef]);

  // Pin the full-bleed host to the viewport's left edge, exactly. The CSS
  // calc on .flow-gl-host centers 100vw on the COLUMN, and the column sits
  // a couple rem off viewport center (asymmetric rails), so measure where
  // the host actually lands with no margin and pull it to zero. Slab
  // registration doesn't care — the frame loop re-reads the canvas rect
  // every frame — this only moves where the PAINT edge falls. Body resize
  // catches breakpoint swaps and settling content, same as the depth
  // engine's own observer.
  useEffect(() => {
    const hostRef = props.hostRef;
    if (!hostRef.current) return;
    const place = () => {
      const el = hostRef.current;
      if (!el) return;
      el.style.marginLeft = "0px";
      const { left } = el.getBoundingClientRect();
      el.style.marginLeft = `${-left}px`;
    };
    place();
    window.addEventListener("resize", place);
    const bodyRo = new ResizeObserver(place);
    bodyRo.observe(document.body);
    return () => {
      window.removeEventListener("resize", place);
      bodyRo.disconnect();
      if (hostRef.current) hostRef.current.style.marginLeft = "";
    };
  }, [props.hostRef]);

  // The tuning panel: every dev build, production behind ?tune. Lazy, so
  // tweakpane's chunk never loads for a visitor.
  const [tune] = useState(
    () =>
      process.env.NODE_ENV === "development" ||
      window.location.search.includes("tune"),
  );

  return (
    <>
      {/* The camera sits CAMERA_DIST away, not 600: ortho framing doesn't
          care, but the DoF pass measures RADIAL distance to the lens, and
          from far away the focal sphere is locally flat — a slab at the
          screen edge reads the same focus as one dead center. */}
      <Canvas
        orthographic
        camera={{
          position: [0, 0, CAMERA_DIST],
          near: 100,
          far: 40000,
          zoom: 1,
        }}
        dpr={[1, 2]}
        frameloop={frameloop}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        style={{ position: "absolute", inset: 0 }}
      >
        <ContextGuard onContextLost={props.onContextLost} />
        <SlabField {...props} />
      </Canvas>
      {tune && (
        <Suspense fallback={null}>
          <GlassTune />
        </Suspense>
      )}
    </>
  );
}
