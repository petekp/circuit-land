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
   so an opaque backdrop plane (the aurora bed) sits behind the slabs; one
   shared FBO renders that backdrop once per frame and feeds every slab's
   material — passing an external buffer makes drei skip its per-material
   scene render, so 11 slabs cost one extra plane draw, not 11 scene passes.
   The DOM tiles drop their CSS material under [data-gl] (see globals.css)
   and keep text, veil, and neon. */

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

declare global {
  interface Window {
    // Live slab rects (host-relative CSS px) for registration probes.
    __glassDebug?: { frame: number; rects: SlabDebug[] };
  }
}

// The flow's color arrives as a var(--flow-*) reference; the literal lives in
// the stylesheet. Custom properties inherit and keep their authored text, so
// resolving the reference against the host element hands back the modern
// space-separated hsl() literal — which THREE.Color.set() cannot parse (it
// only understands the legacy comma form). Parse the components ourselves and
// hand them to setHSL as sRGB so the GL tint matches the CSS one.
function resolveCssColor(el: HTMLElement, css: string): THREE.Color {
  const varMatch = css.match(/var\((--[\w-]+)/);
  const literal = varMatch
    ? getComputedStyle(el).getPropertyValue(varMatch[1]).trim()
    : css;
  const color = new THREE.Color();
  const m = literal.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)/);
  if (m) {
    color.setHSL(
      Number(m[1]) / 360,
      Number(m[2]) / 100,
      Number(m[3]) / 100,
      THREE.SRGBColorSpace,
    );
  } else {
    color.set("#8b8b96");
  }
  return color;
}

// The aurora bed the glass refracts: the page's near-black base with three
// slow-drifting hue blobs — the flow's color plus the two fixed brand
// complements the CSS aurora used. Opaque on purpose: the transmission
// buffer needs defined light everywhere, and matching the page background
// keeps the canvas edge invisible. Phase 3 replaces this stub with the
// faithful aurora port and the focal key light.
const AURORA_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const AURORA_FRAG = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uFlow;
  uniform vec3 uViolet;
  uniform vec3 uTeal;
  uniform float uTime;
  uniform float uAspect;
  varying vec2 vUv;

  float blob(vec2 uv, vec2 center, float r) {
    vec2 d = uv - center;
    return exp(-dot(d, d) / (r * r));
  }

  void main() {
    vec2 uv = vec2(vUv.x * uAspect, vUv.y);
    vec3 col = uBase;
    float t = uTime * 0.04;
    col += uFlow * 0.14 *
      blob(uv, vec2((0.3 + 0.05 * sin(t)) * uAspect, 0.68 + 0.04 * cos(t * 0.7)), 0.5);
    col += uViolet * 0.1 *
      blob(uv, vec2((0.74 + 0.04 * cos(t * 0.9)) * uAspect, 0.34 + 0.05 * sin(t * 0.6)), 0.55);
    col += uTeal * 0.07 *
      blob(uv, vec2((0.18 + 0.03 * sin(t * 1.1)) * uAspect, 0.16 + 0.03 * cos(t)), 0.4);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function SlabField({ host, nodes, flowColor }: GlassLayerProps) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const backdropRef = useRef<THREE.Mesh | null>(null);
  const size = useThree((state) => state.size);
  // One transmission source for every slab: the backdrop rendered without
  // the slabs themselves. Slabs don't refract each other, which is fine —
  // they never overlap on screen.
  const buffer = useFBO(1024, 1024);

  // Tint resolution happens in the frame loop (the host element is reliably
  // mounted there), and only when the flow's color reference changes.
  const tintKey = useRef<string | null>(null);
  const tints = useRef({
    step: new THREE.Color(1, 1, 1),
    checkpoint: new THREE.Color(1, 1, 1),
    loop: new THREE.Color(1, 1, 1),
    prompt: new THREE.Color(1, 1, 1),
    flow: new THREE.Color("#8b8b96"),
  });

  // Pool geometries are rebuilt imperatively as tiles resize; drop them all
  // when the scene unmounts.
  useEffect(() => {
    const pool = meshRefs.current;
    return () => {
      for (const mesh of pool) mesh?.geometry?.dispose();
    };
  }, []);

  useFrame((state) => {
    const hostEl = host.current;
    const nodeMap = nodes.current;
    const pool = meshRefs.current;
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
    }

    // The backdrop plane tracks the frustum and its shader clock.
    backdrop.position.set(0, 0, -120);
    backdrop.scale.set(size.width, size.height, 1);
    const backdropMat = backdrop.material as THREE.ShaderMaterial;
    backdropMat.uniforms.uTime.value = state.clock.elapsedTime;
    backdropMat.uniforms.uAspect.value = size.width / Math.max(1, size.height);
    (backdropMat.uniforms.uFlow.value as THREE.Color).copy(tints.current.flow);

    // One host read per frame; every slab derives from it, so subpixel error
    // between slabs is zero by construction.
    const hostRect = hostEl.getBoundingClientRect();
    const focalY = window.innerHeight * FOCAL_LINE;
    const rects: SlabDebug[] = [];

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
      mesh.visible = true;
      mesh.position.set(cx - size.width / 2, size.height / 2 - cy, 0);

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
      const material = mesh.material as THREE.MeshPhysicalMaterial;
      const shape = el.dataset.shape;
      const t = tints.current;
      material.color.copy(
        el.classList.contains("flow-prompt-node")
          ? t.prompt
          : shape === "checkpoint"
            ? t.checkpoint
            : shape === "loop"
              ? t.loop
              : t.step,
      );
      material.roughness =
        ROUGHNESS_FOCUSED + (1 - focus) * (ROUGHNESS_RECEDED - ROUGHNESS_FOCUSED);

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

    // The shared transmission pass: everything except the slabs, from the
    // same camera, so the material's screen-space buffer sampling lines up.
    for (let i = 0; i < slot; i += 1) {
      const mesh = pool[i];
      if (mesh) mesh.visible = false;
    }
    state.gl.setRenderTarget(buffer);
    state.gl.render(state.scene, state.camera);
    state.gl.setRenderTarget(null);
    for (let i = 0; i < slot; i += 1) {
      const mesh = pool[i];
      if (mesh) mesh.visible = true;
    }

    window.__glassDebug = {
      frame: (window.__glassDebug?.frame ?? 0) + 1,
      rects,
    };
  });

  return (
    <>
      {/* Broad, diffuse light: a soft ambient bed plus one wide key from the
          upper left, so the slab bevels carry a sheen and never a glint. */}
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[-0.3 * size.width, 0.4 * size.height, 520]}
        intensity={1.1}
      />
      <mesh ref={backdropRef} renderOrder={-1}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          vertexShader={AURORA_VERT}
          fragmentShader={AURORA_FRAG}
          uniforms={{
            uBase: { value: new THREE.Color("#161718") },
            uFlow: { value: new THREE.Color("#8b8b96") },
            uViolet: { value: new THREE.Color("#7c5cff") },
            uTeal: { value: new THREE.Color("#00b3cc") },
            uTime: { value: 0 },
            uAspect: { value: 1 },
          }}
        />
      </mesh>
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
