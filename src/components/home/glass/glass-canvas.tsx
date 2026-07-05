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
   so an opaque backdrop plane sits behind the slabs; one shared FBO renders
   the backdrop (and the focal glows) once per frame and feeds every slab's
   material — passing an external buffer makes drei skip its per-material
   scene render, so 11 slabs cost one extra scene draw, not 11.

   Light model: the backdrop plane carries the whole CSS light bed, ported
   stop for stop — the two counter-drifting aurora layers in DIAGRAM space
   (the field scrolls past with the content), the edge mask, and the warm key
   light pinned to the focal line. Per-tile focal glows are additive quads
   between the backdrop and the slabs, so the glass refracts its own halo.
   The wires keep their crisp SVG cores (information, like the text) and the
   GL layer adds what a lit conduit casts: an additive ribbon under each
   measured path and a hot spot at each port, graded by endpoint focus.
   The DOM tiles drop their CSS material, aurora, key light, and focal glow
   under [data-gl] (see globals.css) and keep text, veil, and neon. */

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, useFBO } from "@react-three/drei";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { FOCAL_LINE, focusFromDist } from "./depth-field";
import type { GlassLayerProps } from "./glass-scene";

// More slots than any flow has tiles: during a flow swap the exiting tiles
// (kept mounted by AnimatePresence popLayout) and the entering ones overlap,
// so the pool covers both generations at once. Slots beyond the live tile
// count stay invisible; the pool never reallocates.
const POOL_SIZE = 24;

// The glass volume's depth in world px. Thick enough that the beveled edge
// catches the key light and the refraction reads as a solid slab, thin
// enough that the silhouette stays the tile's rect.
const SLAB_DEPTH = 26;

// How far the tint leans toward the flow color per tile kind, mirroring the
// CSS gradients this replaces: the checkpoint holds the most color (the one
// step where the run waits on a person), the loop keeps a lighter body, the
// prompt is near-neutral terminal glass.
const TINT_STEP = 0.16;
const TINT_CHECKPOINT = 0.3;
const TINT_LOOP = 0.1;
const TINT_PROMPT = 0.06;

// Roughness rides focus: sharp at the plane, frostier as the tile falls out
// of the light — the GL analog of the CSS blur() strength riding --illum.
const ROUGHNESS_FOCUSED = 0.3;
const ROUGHNESS_RECEDED = 0.62;

// The in-material recession grade: the tint multiplies transmitted light, so
// scaling it down moves a receded slab out of the key light's illumination
// instead of just blurring it. Focused slabs transmit at full strength.
const DIM_RECEDED = 0.78;

// The focal glow's strength, folded from the CSS it replaces: the painted
// color is color-mix(flow 17%, white/0.04) — mixed alpha 0.2032 — under
// opacity illum² × 0.8, composited plus-lighter. 0.2032 × 0.8 ≈ 0.163.
const GLOW_GAIN = 0.163;

// The wire light. The SVG keeps the crisp cores — they are information, like
// the text — and the GL layer adds what a lit conduit casts: a soft additive
// ribbon under each path and a hot spot at each port. Gains are the additive
// alpha at full focus; the return edge stays dimmer than the sequential
// wires, same hierarchy the strokes carry ("again" never outshouts "then").
const WIRE_POOL = 20;
const PORT_POOL = 40;
const WIRE_HALF_WIDTH = 5;
const WIRE_GLOW_GAIN = 0.11;
const RETURN_GLOW_GAIN = 0.055;
// The glow floor when a wire's endpoints recede: nearly out, while the SVG
// core keeps its own higher floor so the diagram stays readable.
const WIRE_GLOW_MIN = 0.15;
const PORT_SIZE = 20;
const HEAD_SIZE = 14;
const PORT_GAIN = 0.35;
const HEAD_GAIN = 0.25;
// The SVG wires draw in with a 0.05s-per-wire stagger over ~0.45s; the glow
// arrives on the same schedule so the light never precedes its conduit.
const WIRE_STAGGER = 0.05;
const WIRE_FADE_IN = 0.45;

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

// Backdrop constants stay in raw sRGB (see resolveCssColor): the light bed's
// shader IS the final pixel math, no encode pass after it.
const rawHsl = (h: number, s: number, l: number) =>
  new THREE.Color().setHSL(
    h / 360,
    s / 100,
    l / 100,
    THREE.LinearSRGBColorSpace,
  );

const AURORA_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The light bed, ported stop for stop from the CSS it replaces (see "The
// light bed" in globals.css): six elliptical gradient blobs across two
// layers that drift in counter-phase (90s / 120s, ease-in-out alternate —
// cosine stands in, indistinguishable at these speeds), the whole bed
// masked toward the canvas edges, plus the warm key light pinned to the
// focal line. The aurora lives in DIAGRAM space — the CSS layers were
// inset to the canvas element — so the field scrolls past with the
// content while the key light holds still in the viewport.
const AURORA_FRAG = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uFlow;
  uniform vec3 uViolet;
  uniform vec3 uSignal;
  uniform vec3 uCyan;
  uniform vec3 uMagenta;
  uniform vec3 uKeyA;
  uniform vec3 uKeyB;
  uniform float uTime;
  uniform vec2 uHostSize;
  uniform vec4 uCanvas;
  uniform float uFocalY;
  uniform float uLinearOut;
  varying vec2 vUv;

  // One CSS radial-gradient(color, transparent STOP): a linear alpha ramp
  // from the center to the stop, in the ellipse's normalized distance.
  float blobRamp(vec2 uv, vec2 center, vec2 radii, float stop) {
    float d = length((uv - center) / radii);
    return clamp((stop - d) / stop, 0.0, 1.0);
  }

  void main() {
    // Fragment position in host CSS px, y down like the DOM. The host is
    // viewport-sized and viewport-pinned once its sticky range engages.
    vec2 vp = vec2(vUv.x, 1.0 - vUv.y) * uHostSize;

    // Diagram-space uv: uCanvas is the diagram canvas rect, host-relative.
    vec2 dUv = (vp - uCanvas.xy) / max(uCanvas.zw, vec2(1.0));

    // Each aurora layer is the canvas inset -18%, transformed by the drift
    // keyframes: translate(-2.5%, -1.5%) scale(1) -> translate(2.5%, 2%)
    // scale(1.08). Sampling inverts the transform.
    float sA = 0.5 - 0.5 * cos(6.2831853 * uTime / 180.0);
    float sB = 0.5 + 0.5 * cos(6.2831853 * uTime / 240.0);
    vec2 layer = (dUv + 0.18) / 1.36;
    vec2 tA = mix(vec2(-0.025, -0.015), vec2(0.025, 0.02), sA);
    vec2 tB = mix(vec2(-0.025, -0.015), vec2(0.025, 0.02), sB);
    vec2 a = (layer - 0.5 - tA) / mix(1.0, 1.08, sA) + 0.5;
    vec2 b = (layer - 0.5 - tB) / mix(1.0, 1.08, sB) + 0.5;

    // The six blobs, alpha-over in CSS paint order: within a background
    // list the first gradient paints on top, and layer B sits over layer A.
    vec3 col = uBase;
    col = mix(col, uSignal,  0.18 * blobRamp(a, vec2(0.30, 0.76), vec2(0.44, 0.24), 0.72));
    col = mix(col, uViolet,  0.22 * blobRamp(a, vec2(0.78, 0.42), vec2(0.38, 0.22), 0.70));
    col = mix(col, uFlow,    0.30 * blobRamp(a, vec2(0.24, 0.12), vec2(0.42, 0.26), 0.70));
    col = mix(col, uMagenta, 0.14 * blobRamp(b, vec2(0.72, 0.84), vec2(0.40, 0.24), 0.70));
    col = mix(col, uFlow,    0.24 * blobRamp(b, vec2(0.26, 0.48), vec2(0.46, 0.26), 0.72));
    col = mix(col, uCyan,    0.16 * blobRamp(b, vec2(0.70, 0.16), vec2(0.36, 0.22), 0.70));

    // The bed fades toward the canvas edges (the CSS mask-image: black to
    // 55%, gone by 98%), so it reads as atmosphere, not a poster.
    float m = length((dUv - 0.5) / vec2(1.2, 0.9));
    col = mix(uBase, col, clamp((0.98 - m) / 0.43, 0.0, 1.0));

    // The key light: a wide warm ellipse at the focal line. plus-lighter in
    // CSS, straight addition here — the framebuffer is sRGB after the
    // colorspace include, same space CSS blends in.
    vec2 kd2 = (vp - vec2(0.5 * uHostSize.x, uFocalY)) /
      vec2(0.7 * uHostSize.x, 260.0);
    float kd = length(kd2);
    float ka = kd < 0.45
      ? mix(0.13, 0.05, kd / 0.45)
      : mix(0.05, 0.0, clamp((kd - 0.45) / 0.27, 0.0, 1.0));
    col += mix(uKeyA, uKeyB, clamp(kd / 0.45, 0.0, 1.0)) * ka;

    // The uniforms are raw sRGB and the mixing above IS the CSS compositing
    // math, so on the direct view the value ships unencoded. The
    // transmission buffer is the one consumer that wants linear (the glass
    // material shades in linear and encodes on output — feeding it sRGB
    // would double-encode and wash the slabs), so the FBO pass flips
    // uLinearOut and decodes.
    if (uLinearOut > 0.5) col = pow(col, vec3(2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;

// The focal glow: the wide anamorphic ellipse the DOM drew behind whichever
// tile holds the plane (radial 50% × 42%, transparent at 72%), additive so
// it adds over the aurora exactly like plus-lighter did. One quad per slab,
// between the backdrop and the glass, so the slab refracts its own halo.
// uRadii picks the ellipse: (0.5, 0.42) for the anamorphic focal glow,
// (0.5, 0.5) for the round port sprites that share this shader.
const GLOW_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  uniform vec2 uRadii;
  uniform float uLinearOut;
  varying vec2 vUv;

  void main() {
    float d = length((vUv - 0.5) / uRadii);
    float a = uAlpha * clamp((0.72 - d) / 0.72, 0.0, 1.0);
    // Raw sRGB on the direct view: additive over the backdrop's raw values,
    // the same space CSS plus-lighter adds in. Encoding here would lift a
    // 0.05 halo to 0.24 — the wash that motivated the raw scheme. The FBO
    // pass flips uLinearOut like the backdrop does.
    vec3 col = uColor * a;
    if (uLinearOut > 0.5) col = pow(col, vec3(2.2));
    gl_FragColor = vec4(col, 1.0);
  }
`;

// The wire glow ribbon: a triangle strip along the sampled path, aT running
// -1..1 across it and aL 0..1 along it. Quadratic falloff across, a short
// fade at each end so the ports own the terminals.
const RIBBON_VERT = /* glsl */ `
  attribute float aT;
  attribute float aL;
  varying float vT;
  varying float vL;
  void main() {
    vT = aT;
    vL = aL;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RIBBON_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  uniform float uReveal;
  uniform float uLinearOut;
  varying float vT;
  varying float vL;

  void main() {
    float across = 1.0 - abs(vT);
    float ends = smoothstep(0.0, 0.08, vL) * (1.0 - smoothstep(0.92, 1.0, vL));
    // The light sweeps tail-to-head as uReveal runs 0..1, tracking the SVG
    // core's pathLength draw-in so the glow never precedes its conduit. The
    // 1.08 overshoot lets the soft edge clear the far end.
    float reveal = clamp((uReveal * 1.08 - vL) / 0.08, 0.0, 1.0);
    vec3 col = uColor * (uAlpha * across * across * ends * reveal);
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
function buildRibbon(pts: Array<{ x: number; y: number }>): THREE.BufferGeometry {
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
    const nx = (-ty / tl) * WIRE_HALF_WIDTH;
    const ny = (tx / tl) * WIRE_HALF_WIDTH;
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
  return geo;
}

function SlabField({ host, nodes, flowColor, segments }: GlassLayerProps) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const glowRefs = useRef<(THREE.Mesh | null)[]>([]);
  const wireRefs = useRef<(THREE.Mesh | null)[]>([]);
  const portRefs = useRef<(THREE.Mesh | null)[]>([]);
  const wireGroupRef = useRef<THREE.Group | null>(null);
  const backdropRef = useRef<THREE.Mesh | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const canvasElRef = useRef<HTMLElement | null>(null);
  // Focus per node id, refilled by the slab loop each frame; the wire pass
  // grades each glow by its endpoints' focus, same rule the SVG opacity runs.
  const focusById = useRef(new Map<string, number>());
  const size = useThree((state) => state.size);
  // One transmission source for every slab: the backdrop and glows rendered
  // without the slabs themselves. Slabs don't refract each other, which is
  // fine — they never overlap on screen.
  const buffer = useFBO(1024, 1024);

  // Tint resolution happens in the frame loop (the host element is reliably
  // mounted there), and only when the flow's color reference changes.
  const tintKey = useRef<string | null>(null);
  const tints = useRef({
    step: new THREE.Color(1, 1, 1),
    checkpoint: new THREE.Color(1, 1, 1),
    loop: new THREE.Color(1, 1, 1),
    prompt: new THREE.Color(1, 1, 1),
    glow: new THREE.Color(1, 1, 1),
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
    const hostEl = host.current;
    const nodeMap = nodes.current;
    const pool = meshRefs.current;
    const glows = glowRefs.current;
    const backdrop = backdropRef.current;
    if (!hostEl || !nodeMap || !backdrop) return;

    if (tintKey.current !== flowColor) {
      tintKey.current = flowColor;
      const flow = resolveCssColor(hostEl, flowColor);
      const t = tints.current;
      t.flow.copy(flow);
      t.step.copy(WHITE).lerp(flow, TINT_STEP);
      t.checkpoint.copy(WHITE).lerp(flow, TINT_CHECKPOINT);
      t.loop.copy(WHITE).lerp(flow, TINT_LOOP);
      // The prompt is a terminal: its glass stays dark. The material color
      // multiplies the transmitted light, so scaling it down dims the slab.
      t.prompt.copy(WHITE).lerp(flow, TINT_PROMPT).multiplyScalar(0.55);
      // The light bed's colors live in raw sRGB (see resolveCssColor): the
      // glow paint is color-mix(flow 17%, white), pale and flow-leaning.
      const rawFlow = resolveCssColor(hostEl, flowColor, true);
      t.glow.copy(rawFlow).lerp(WHITE, 0.83);
      // The wire light is the flow color straight: it reads as the energy
      // the tinted glass and pale glows are downstream of.
      t.wire.copy(rawFlow);
      const backdropMat = backdrop.material as THREE.ShaderMaterial;
      (backdropMat.uniforms.uFlow.value as THREE.Color).copy(rawFlow);
      (backdropMat.uniforms.uBase.value as THREE.Color).copy(
        resolveCssColor(hostEl, "var(--background)", true),
      );
      (backdropMat.uniforms.uSignal.value as THREE.Color).copy(
        resolveCssColor(hostEl, "var(--signal)", true),
      );
    }

    // One host read per frame; every slab derives from it, so subpixel error
    // between slabs is zero by construction. The diagram canvas rect places
    // the aurora field (diagram space); the focal line places the key light
    // (host space).
    const hostRect = hostEl.getBoundingClientRect();
    const canvasEl = (canvasElRef.current ??=
      hostEl.closest<HTMLElement>(".flow-diagram-canvas"));
    const canvasRect = canvasEl?.getBoundingClientRect() ?? hostRect;
    const focalY = window.innerHeight * FOCAL_LINE;
    const focalHostY = focalY - hostRect.top;

    backdrop.position.set(0, 0, -120);
    backdrop.scale.set(size.width, size.height, 1);
    const backdropMat = backdrop.material as THREE.ShaderMaterial;
    backdropMat.uniforms.uTime.value = state.clock.elapsedTime;
    (backdropMat.uniforms.uHostSize.value as THREE.Vector2).set(
      size.width,
      size.height,
    );
    (backdropMat.uniforms.uCanvas.value as THREE.Vector4).set(
      canvasRect.left - hostRect.left,
      canvasRect.top - hostRect.top,
      canvasRect.width,
      canvasRect.height,
    );
    backdropMat.uniforms.uFocalY.value = focalHostY;

    // The in-scene key light tracks the same focal line, so the slab bevels
    // catch their sheen where the light bed says the light is.
    keyLightRef.current?.position.set(
      -0.3 * size.width,
      size.height / 2 - focalHostY,
      520,
    );

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
      const glow = glows[slot];
      if (!mesh || !glow) break;
      slot += 1;

      // Host-relative CSS px → world units. The camera frustum spans the
      // canvas size centered on the origin, with +y up, so re-center and
      // flip y.
      const cx = r.left - hostRect.left + r.width / 2;
      const cy = r.top - hostRect.top + r.height / 2;
      const wx = cx - size.width / 2;
      const wy = size.height / 2 - cy;
      mesh.visible = true;
      mesh.position.set(wx, wy, 0);

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
      // than the measured-centers cache — fresher, and free.
      const focus = focusFromDist(r.top + r.height / 2 - focalY);
      focusMap.set(id, focus);
      const material = mesh.material as THREE.MeshPhysicalMaterial;
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
        .multiplyScalar(DIM_RECEDED + (1 - DIM_RECEDED) * focus);
      material.roughness =
        ROUGHNESS_FOCUSED + (1 - focus) * (ROUGHNESS_RECEDED - ROUGHNESS_FOCUSED);

      // The focal glow rides the slab: same DOM box the ::before had
      // (min(120%, 64rem) × 130%, centered), gain quadratic in focus so it
      // exists only AT the plane and never reads as a permanent halo.
      glow.visible = true;
      glow.position.set(wx, wy, -60);
      glow.scale.set(Math.min(1.2 * r.width, 1024), 1.3 * r.height, 1);
      const glowMat = glow.material as THREE.ShaderMaterial;
      (glowMat.uniforms.uColor.value as THREE.Color).copy(t.glow);
      glowMat.uniforms.uAlpha.value = focus * focus * GLOW_GAIN;

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
      const glow = glows[i];
      if (glow) glow.visible = false;
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
        -40,
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
        const cache = mesh.userData as {
          id?: string;
          d?: string;
          swapT?: number;
        };
        if (cache.id !== seg.id) {
          cache.id = seg.id;
          cache.swapT = now;
        }
        if (cache.d !== seg.d) {
          cache.d = seg.d;
          mesh.geometry.dispose();
          mesh.geometry = buildRibbon(samplePath(seg.d));
        }

        mesh.visible = true;
        const env = Math.min(
          Math.max(
            (now - (cache.swapT ?? 0) - i * WIRE_STAGGER) / WIRE_FADE_IN,
            0,
          ),
          1,
        );
        const fFrom = focusMap.get(seg.from) ?? 0.5;
        const fTo = focusMap.get(seg.to) ?? 0.5;
        const focus =
          WIRE_GLOW_MIN + (1 - WIRE_GLOW_MIN) * ((fFrom + fTo) / 2);
        const isReturn = seg.kind === "return";
        const mat = mesh.material as THREE.ShaderMaterial;
        (mat.uniforms.uColor.value as THREE.Color).copy(tint.wire);
        // Sequential wires sweep in with the SVG core's draw; the return
        // edge fades in whole, like its dashed stroke does.
        mat.uniforms.uReveal.value = isReturn ? 1 : env;
        mat.uniforms.uAlpha.value =
          (isReturn ? RETURN_GLOW_GAIN : WIRE_GLOW_GAIN) *
          focus *
          (isReturn ? env : 1);
        wireDebug.push({
          id: seg.id,
          alpha: mat.uniforms.uAlpha.value as number,
          reveal: mat.uniforms.uReveal.value as number,
        });

        if (tailPort) {
          tailPort.visible = true;
          tailPort.position.set(seg.tail.x, -seg.tail.y, 0);
          tailPort.scale.set(PORT_SIZE, PORT_SIZE, 1);
          const pm = tailPort.material as THREE.ShaderMaterial;
          (pm.uniforms.uColor.value as THREE.Color).copy(tint.wire);
          pm.uniforms.uAlpha.value =
            PORT_GAIN *
            (WIRE_GLOW_MIN + (1 - WIRE_GLOW_MIN) * fFrom) *
            Math.min(env * 3, 1) *
            (isReturn ? 0.5 : 1);
        }
        if (headPort) {
          headPort.visible = true;
          headPort.position.set(seg.head.x, -seg.head.y, 0);
          headPort.scale.set(HEAD_SIZE, HEAD_SIZE, 1);
          const pm = headPort.material as THREE.ShaderMaterial;
          (pm.uniforms.uColor.value as THREE.Color).copy(tint.wire);
          // The head lights when the sweep arrives, like the chevron's
          // delayed fade in the SVG.
          pm.uniforms.uAlpha.value =
            HEAD_GAIN *
            (WIRE_GLOW_MIN + (1 - WIRE_GLOW_MIN) * fTo) *
            (isReturn ? env : Math.max((env - 0.7) / 0.3, 0)) *
            (isReturn ? 0.5 : 1);
        }
      }
    }

    // The shared transmission pass: everything except the slabs, from the
    // same camera, so the material's screen-space buffer sampling lines up.
    // The glows and wire light stay in — the glass refracts its own halo
    // and the conduit light passing beneath it. The light-bed shaders
    // switch to linear output for this pass only (see uLinearOut).
    const setLinearOut = (value: number) => {
      backdropMat.uniforms.uLinearOut.value = value;
      for (const list of [glows, wires, ports]) {
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
    setLinearOut(1);
    state.gl.setRenderTarget(buffer);
    state.gl.render(state.scene, state.camera);
    state.gl.setRenderTarget(null);
    setLinearOut(0);
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
      {/* Broad, diffuse light: a soft ambient bed plus one wide key whose
          height tracks the focal line each frame, so the slab bevels carry
          a sheen where the light bed is and never a glint. */}
      <ambientLight intensity={0.55} />
      <directionalLight
        ref={keyLightRef}
        position={[-0.3 * size.width, 0.4 * size.height, 520]}
        intensity={1.1}
      />
      <mesh ref={backdropRef} renderOrder={-2}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          vertexShader={AURORA_VERT}
          fragmentShader={AURORA_FRAG}
          uniforms={{
            uBase: { value: new THREE.Color(0x161718) },
            uFlow: { value: new THREE.Color(0x8b8b96) },
            uViolet: { value: rawHsl(254, 90, 60) },
            uSignal: { value: rawHsl(163, 95, 47) },
            uCyan: { value: rawHsl(198, 90, 55) },
            uMagenta: { value: rawHsl(322, 85, 58) },
            uKeyA: { value: rawHsl(40, 60, 88) },
            uKeyB: { value: rawHsl(40, 50, 80) },
            uTime: { value: 0 },
            uHostSize: { value: new THREE.Vector2(1, 1) },
            uCanvas: { value: new THREE.Vector4(0, 0, 1, 1) },
            uFocalY: { value: 0 },
            uLinearOut: { value: 0 },
          }}
        />
      </mesh>
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <mesh key={`glow-${i}`} ref={(mesh: THREE.Mesh | null) => {
          glowRefs.current[i] = mesh;
        }} visible={false} renderOrder={-1}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            vertexShader={AURORA_VERT}
            fragmentShader={GLOW_FRAG}
            uniforms={{
              uColor: { value: new THREE.Color(1, 1, 1) },
              uAlpha: { value: 0 },
              uRadii: { value: new THREE.Vector2(0.5, 0.42) },
              uLinearOut: { value: 0 },
            }}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      {/* The wire light: additive ribbons under the SVG cores plus a hot
          spot at each port, grouped so one canvas-anchored transform moves
          them all. Between the focal glows (-60) and the slabs (0), so the
          glass refracts the conduit light like everything else in the bed. */}
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
                uAlpha: { value: 0 },
                uReveal: { value: 0 },
                uLinearOut: { value: 0 },
              }}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
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
              vertexShader={AURORA_VERT}
              fragmentShader={GLOW_FRAG}
              uniforms={{
                uColor: { value: new THREE.Color(1, 1, 1) },
                uAlpha: { value: 0 },
                uRadii: { value: new THREE.Vector2(0.5, 0.5) },
                uLinearOut: { value: 0 },
              }}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
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
          <MeshTransmissionMaterial
            buffer={buffer.texture}
            transmission={1}
            thickness={22}
            ior={1.22}
            roughness={ROUGHNESS_FOCUSED}
            chromaticAberration={0.04}
            anisotropicBlur={0.32}
            distortion={0.14}
            distortionScale={0.6}
            temporalDistortion={0.02}
            samples={4}
          />
        </mesh>
      ))}
    </>
  );
}

export default function GlassCanvas(props: GlassLayerProps) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 600], near: 0.1, far: 2000, zoom: 1 }}
      dpr={[1, 2]}
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
      <SlabField {...props} />
    </Canvas>
  );
}
