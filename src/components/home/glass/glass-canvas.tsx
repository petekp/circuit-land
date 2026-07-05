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
   Per-tile focal glows are additive quads behind the slabs, so the glass
   refracts its own halo. The wires keep their crisp SVG cores (information,
   like the text) and the GL layer adds what a lit conduit casts: an additive
   ribbon under each measured path and a hot spot at each port, graded by
   endpoint focus. The DOM tiles drop their CSS material and focal glow under
   [data-gl] (see globals.css) and keep text, veil, and neon.

   Every look-defining number lives in glassParams (glass-params.ts), read
   fresh each frame; the tweakpane panel (glass-tune.tsx, dev or ?tune)
   mutates the same object live. */

import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, useFBO } from "@react-three/drei";
import { EffectComposer, Bloom, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import type { BloomEffect, NoiseEffect } from "postprocessing";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { FOCAL_LINE, focusFromDist } from "./depth-field";
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
// casts: a soft additive ribbon under each path and a hot spot at each port.
// Gains, sizes, and timings live in glassParams.wires.
const WIRE_POOL = 20;
const PORT_POOL = 40;

// The warm pool at the focal line (glassParams.light.poolGain, default off),
// in raw sRGB like every light-bed color.
//
// Post-chain colorspace note: with the composer on, the scene renders into a
// LINEAR buffer and the final pass gamma-encodes, so the raw-sRGB shaders
// must ship linear on the direct view too (uLinearOut stays 1 in both
// passes) or the frame double-encodes and washes pale. Bloom thresholds are
// therefore LINEAR-space values. No bokeh pass: the camera is orthographic
// and every slab sits at z 0, so depth of field has nothing to read.

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

// Light colors stay in raw sRGB (see resolveCssColor): the additive shaders
// ARE the final pixel math, no encode pass after them.
const rawHsl = (h: number, s: number, l: number) =>
  new THREE.Color().setHSL(
    h / 360,
    s / 100,
    l / 100,
    THREE.LinearSRGBColorSpace,
  );

// The focal pool's warmth, split from the old key-light pair it replaces.
const POOL_WARM = rawHsl(40, 55, 84);

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

function SlabField({ host, nodes, flowColor, segments }: GlassLayerProps) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const glowRefs = useRef<(THREE.Mesh | null)[]>([]);
  const wireRefs = useRef<(THREE.Mesh | null)[]>([]);
  const portRefs = useRef<(THREE.Mesh | null)[]>([]);
  const wireGroupRef = useRef<THREE.Group | null>(null);
  const backdropRef = useRef<THREE.Mesh | null>(null);
  const poolRef = useRef<THREE.Mesh | null>(null);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const bloomRef = useRef<BloomEffect | null>(null);
  const noiseRef = useRef<NoiseEffect | null>(null);
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

    const p = glassParams;
    if (tintKey.current !== flowColor) {
      tintKey.current = flowColor;
      const t = tints.current;
      t.flow.copy(resolveCssColor(hostEl, flowColor));
      // The light colors live in raw sRGB (see resolveCssColor): the glow
      // paint is pale and flow-leaning; the wire light is the flow color
      // straight — the energy the tinted glass and glows are downstream of.
      const rawFlow = resolveCssColor(hostEl, flowColor, true);
      t.glow.copy(rawFlow).lerp(WHITE, 0.83);
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
    const focalY = window.innerHeight * FOCAL_LINE;
    const focalHostY = focalY - hostRect.top;

    backdrop.position.set(0, 0, -120);
    backdrop.scale.set(size.width, size.height, 1);
    const backdropMat = backdrop.material as THREE.ShaderMaterial;
    backdropMat.uniforms.uLift.value = p.glass.baseLift;

    // The warm pool at the focal line (off until dialed up): a wide additive
    // ellipse of POOL_WARM riding the plane of focus.
    const poolMesh = poolRef.current;
    if (poolMesh) {
      poolMesh.visible = p.light.poolGain > 0.0005;
      poolMesh.position.set(0, size.height / 2 - focalHostY, -110);
      poolMesh.scale.set(size.width * 1.5, p.light.poolHeight, 1);
      const poolMat = poolMesh.material as THREE.ShaderMaterial;
      (poolMat.uniforms.uColor.value as THREE.Color).copy(POOL_WARM);
      poolMat.uniforms.uAlpha.value = p.light.poolGain;
    }

    // The lights read their knobs live; the key tracks the focal line, so
    // the slab bevels catch their sheen at the plane of focus.
    if (ambientRef.current) ambientRef.current.intensity = p.light.ambient;
    const keyLight = keyLightRef.current;
    if (keyLight) {
      keyLight.intensity = p.light.key;
      keyLight.position.set(
        -0.3 * size.width,
        size.height / 2 - focalHostY,
        520,
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
      // The material scalars re-apply every frame straight off glassParams:
      // drei exposes each custom uniform as a live accessor on the instance,
      // so this is uniform writes, not shader rebuilds.
      const material = mesh.material as TransmissionMaterial;
      const g = p.glass;
      material._transmission = g.transmission;
      material.thickness = g.thickness;
      material.ior = g.ior;
      material.chromaticAberration = g.chromaticAberration;
      material.anisotropicBlur = g.anisotropicBlur;
      material.distortion = g.distortion;
      material.distortionScale = g.distortionScale;
      material.temporalDistortion = g.temporalDistortion;
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
      material.roughness =
        g.roughnessFocused +
        (1 - focus) * (g.roughnessReceded - g.roughnessFocused);

      // The focal glow rides the slab: same DOM box the ::before had
      // (min(120%, 64rem) × 130%, centered), gain quadratic in focus so it
      // exists only AT the plane and never reads as a permanent halo.
      glow.visible = true;
      glow.position.set(wx, wy, -60);
      glow.scale.set(Math.min(1.2 * r.width, 1024), 1.3 * r.height, 1);
      const glowMat = glow.material as THREE.ShaderMaterial;
      (glowMat.uniforms.uColor.value as THREE.Color).copy(t.glow);
      glowMat.uniforms.uAlpha.value = focus * focus * p.light.glowGain;

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
        if (cache.d !== seg.d || cache.hw !== w.halfWidth) {
          cache.d = seg.d;
          cache.hw = w.halfWidth;
          mesh.geometry.dispose();
          mesh.geometry = buildRibbon(samplePath(seg.d), w.halfWidth);
        }

        mesh.visible = true;
        const env = Math.min(
          Math.max((now - (cache.swapT ?? 0) - i * w.stagger) / w.fadeIn, 0),
          1,
        );
        const fFrom = focusMap.get(seg.from) ?? 0.5;
        const fTo = focusMap.get(seg.to) ?? 0.5;
        const focus = w.floor + (1 - w.floor) * ((fFrom + fTo) / 2);
        const isReturn = seg.kind === "return";
        const mat = mesh.material as THREE.ShaderMaterial;
        (mat.uniforms.uColor.value as THREE.Color).copy(tint.wire);
        // Sequential wires sweep in with the SVG core's draw; the return
        // edge fades in whole, like its dashed stroke does.
        mat.uniforms.uReveal.value = isReturn ? 1 : env;
        mat.uniforms.uAlpha.value =
          (isReturn ? w.returnGain : w.gain) * focus * (isReturn ? env : 1);
        wireDebug.push({
          id: seg.id,
          alpha: mat.uniforms.uAlpha.value as number,
          reveal: mat.uniforms.uReveal.value as number,
        });

        if (tailPort) {
          tailPort.visible = true;
          tailPort.position.set(seg.tail.x, -seg.tail.y, 0);
          tailPort.scale.set(w.portSize, w.portSize, 1);
          const pm = tailPort.material as THREE.ShaderMaterial;
          (pm.uniforms.uColor.value as THREE.Color).copy(tint.wire);
          pm.uniforms.uAlpha.value =
            w.portGain *
            (w.floor + (1 - w.floor) * fFrom) *
            Math.min(env * 3, 1) *
            (isReturn ? 0.5 : 1);
        }
        if (headPort) {
          headPort.visible = true;
          headPort.position.set(seg.head.x, -seg.head.y, 0);
          headPort.scale.set(w.headSize, w.headSize, 1);
          const pm = headPort.material as THREE.ShaderMaterial;
          (pm.uniforms.uColor.value as THREE.Color).copy(tint.wire);
          // The head lights when the sweep arrives, like the chevron's
          // delayed fade in the SVG.
          pm.uniforms.uAlpha.value =
            w.headGain *
            (w.floor + (1 - w.floor) * fTo) *
            (isReturn ? env : Math.max((env - 0.7) / 0.3, 0)) *
            (isReturn ? 0.5 : 1);
        }
      }
    }

    // The post chain reads its knobs live off the effect instances.
    const bloom = bloomRef.current;
    if (bloom) {
      bloom.intensity = p.post.bloomIntensity;
      bloom.luminanceMaterial.threshold = p.post.bloomThreshold;
      bloom.luminanceMaterial.smoothing = p.post.bloomSmoothing;
    }
    if (noiseRef.current) {
      noiseRef.current.blendMode.opacity.value = p.post.grainOpacity;
    }

    // The shared transmission pass: the base plane, glows, and wire light
    // from the same camera, so the material's screen-space buffer sampling
    // lines up. The base plane shows HERE ONLY — on screen the canvas stays
    // transparent and the real page plays the part the plane plays inside
    // the buffer. The light shaders switch to linear output for this pass
    // (see uLinearOut).
    const setLinearOut = (value: number) => {
      backdropMat.uniforms.uLinearOut.value = value;
      if (poolMesh) {
        (poolMesh.material as THREE.ShaderMaterial).uniforms.uLinearOut.value =
          value;
      }
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

  // Built once: @react-three/postprocessing's wrapEffect keys an internal
  // useMemo on JSON.stringify(props), and React 19 passes ref inside props.
  // On any re-render after mount ref.current is the live effect, so that
  // stringify walks render targets into a scene-graph cycle and throws,
  // unwinding the whole GL tree. Handing React the identical element lets it
  // bail out before the effects re-render; the frame loop drives the live
  // values through the refs, so these props are only the mount state.
  const composer = useMemo(
    () => (
      <EffectComposer multisampling={4}>
        <Bloom
          ref={bloomRef}
          mipmapBlur
          intensity={glassParams.post.bloomIntensity}
          luminanceThreshold={glassParams.post.bloomThreshold}
          luminanceSmoothing={glassParams.post.bloomSmoothing}
        />
        <Noise
          ref={noiseRef}
          premultiply
          blendFunction={BlendFunction.OVERLAY}
          opacity={glassParams.post.grainOpacity}
        />
      </EffectComposer>
    ),
    [],
  );

  return (
    <>
      {/* Broad, diffuse light: a soft ambient bed plus one wide key whose
          height tracks the focal line each frame, so the slab bevels carry
          a sheen at the plane of focus and never a glint. */}
      <ambientLight ref={ambientRef} intensity={0.55} />
      <directionalLight
        ref={keyLightRef}
        position={[-0.3 * size.width, 0.4 * size.height, 520]}
        intensity={1.1}
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
          box over the page below. */}
      {/* The focal warm pool (glassParams.light.poolGain, default 0): the
          one piece of scene atmosphere kept from the old light bed, off
          until dialed up. */}
      <mesh ref={poolRef} visible={false} renderOrder={-2}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          vertexShader={QUAD_VERT}
          fragmentShader={GLOW_FRAG}
          uniforms={{
            uColor: { value: POOL_WARM.clone() },
            uAlpha: { value: 0 },
            uRadii: { value: new THREE.Vector2(0.5, 0.5) },
            uLinearOut: { value: 0 },
          }}
          transparent
          depthWrite={false}
          blending={THREE.CustomBlending}
          blendSrc={THREE.OneFactor}
          blendDst={THREE.OneFactor}
          blendSrcAlpha={THREE.ZeroFactor}
          blendDstAlpha={THREE.OneFactor}
        />
      </mesh>
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <mesh
          key={`glow-${i}`}
          ref={(mesh: THREE.Mesh | null) => {
            glowRefs.current[i] = mesh;
          }}
          visible={false}
          renderOrder={-1}
        >
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            vertexShader={QUAD_VERT}
            fragmentShader={GLOW_FRAG}
            uniforms={{
              uColor: { value: new THREE.Color(1, 1, 1) },
              uAlpha: { value: 0 },
              uRadii: { value: new THREE.Vector2(0.5, 0.42) },
              uLinearOut: { value: 0 },
            }}
            transparent
            depthWrite={false}
            blending={THREE.CustomBlending}
            blendSrc={THREE.OneFactor}
            blendDst={THREE.OneFactor}
            blendSrcAlpha={THREE.ZeroFactor}
            blendDstAlpha={THREE.OneFactor}
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
              fragmentShader={GLOW_FRAG}
              uniforms={{
                uColor: { value: new THREE.Color(1, 1, 1) },
                uAlpha: { value: 0 },
                uRadii: { value: new THREE.Vector2(0.5, 0.5) },
                uLinearOut: { value: 0 },
              }}
              transparent
              depthWrite={false}
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
          <MeshTransmissionMaterial
            buffer={buffer.texture}
            transmission={glassParams.glass.transmission}
            thickness={glassParams.glass.thickness}
            ior={glassParams.glass.ior}
            roughness={glassParams.glass.roughnessFocused}
            chromaticAberration={glassParams.glass.chromaticAberration}
            anisotropicBlur={glassParams.glass.anisotropicBlur}
            distortion={glassParams.glass.distortion}
            distortionScale={glassParams.glass.distortionScale}
            temporalDistortion={glassParams.glass.temporalDistortion}
            samples={4}
          />
        </mesh>
      ))}
      {glassParams.post.enabled && composer}
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
    const el = props.host.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFrameloop(entry.isIntersecting ? "always" : "never"),
      { rootMargin: "50% 0% 50% 0%" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [props.host]);

  // The tuning panel: every dev build, production behind ?tune. Lazy, so
  // tweakpane's chunk never loads for a visitor.
  const [tune] = useState(
    () =>
      process.env.NODE_ENV === "development" ||
      window.location.search.includes("tune"),
  );

  return (
    <>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 600], near: 0.1, far: 2000, zoom: 1 }}
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
