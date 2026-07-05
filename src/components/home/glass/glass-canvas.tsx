"use client";

/* The WebGL glass scene. Loaded lazily (see glass-scene.tsx) so three.js
   stays out of the main bundle.

   Registration model: the scene owns NO geometry of its own. Every frame it
   re-reads each tile's live getBoundingClientRect() and moves a pooled quad
   to cover it exactly, in an orthographic camera where 1 world unit = 1 CSS
   pixel. Reads only, no DOM writes, so there is no layout thrash — and the
   slabs stay registered through anything the DOM layer does: FLIP morphs,
   scale transforms, exit animations, mid-scroll re-layout. There is no cached
   geometry to go stale.

   Phase 1 renders flat translucent stand-in slabs (focus-graded so the depth
   of field is visible in GL) purely to prove that registration; the frosted
   transmission material replaces them next. */

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FOCAL_LINE, focusFromDist } from "./depth-field";
import type { GlassLayerProps } from "./glass-scene";

// More slots than any flow has tiles: during a flow swap the exiting tiles
// (kept mounted by AnimatePresence popLayout) and the entering ones overlap,
// so the pool covers both generations at once. Slots beyond the live tile
// count stay invisible; the pool never reallocates.
const POOL_SIZE = 24;

// One shared unit quad; every slab is this geometry scaled to its tile's box.
const UNIT_PLANE = new THREE.PlaneGeometry(1, 1);

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

function SlabField({ host, nodes, flowColor }: GlassLayerProps) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const size = useThree((state) => state.size);
  // Tint resolution happens in the frame loop (the host element is reliably
  // mounted there), and only when the flow's color reference changes.
  const tintKey = useRef<string | null>(null);

  useFrame(({ camera }) => {
    const hostEl = host.current;
    const nodeMap = nodes.current;
    const pool = meshRefs.current;
    if (!hostEl || !nodeMap) return;

    if (tintKey.current !== flowColor) {
      tintKey.current = flowColor;
      const tint = resolveCssColor(hostEl, flowColor);
      for (const mesh of pool) {
        if (mesh) (mesh.material as THREE.MeshBasicMaterial).color.copy(tint);
      }
    }

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
      mesh.scale.set(r.width, r.height, 1);

      // The same grade the DOM tiles run, computed from the live box rather
      // than the measured-centers cache — fresher, and free.
      const focus = focusFromDist(r.top + r.height / 2 - focalY);
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = 0.1 + focus * 0.22;

      PROJECTED.set(
        mesh.position.x - r.width / 2,
        mesh.position.y + r.height / 2,
        0,
      ).project(camera);
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

    window.__glassDebug = {
      frame: (window.__glassDebug?.frame ?? 0) + 1,
      rects,
    };
  });

  return (
    <>
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <mesh
          key={i}
          ref={(mesh: THREE.Mesh | null) => {
            meshRefs.current[i] = mesh;
          }}
          geometry={UNIT_PLANE}
          visible={false}
        >
          <meshBasicMaterial transparent opacity={0.15} depthWrite={false} />
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
