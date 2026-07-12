"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

import {
  CIRCUIT_FIELD_TUNE_EVENT,
  circuitFieldParams as RECIPE,
} from "./circuit-field-params";

const CircuitFieldTuneGate = dynamic(() => import("./circuit-field-tune-gate"), {
  ssr: false,
});

/* CircuitField: the masthead visual as a fixed, full-viewport background.
   Many balanced diagrams (trees, diamonds, hourglasses, lattices, fountains)
   hang in a 3D stack, invisible until a vertical band of energy sweeps
   through them; a slow rack focus drifts the sharp plane through the stack.
   The approved recipe lives in circuit-field-params; the lazy DialKit tuner
   mutates those values live in development or when the page has ?tune.

   The canvas is the page ground, not a transparent overlay. Keeping its
   drawing buffer opaque avoids invalid zero-alpha RGB pixels being discarded
   when production browsers promote it to a composited GPU layer. Camera tilt
   is scroll-interpolated from -40° to +40°. */

// Must match the playground's *enabled* species pool in order — the seeded
// species pick indexes into this list, so order changes the composition.
const SPECIES = ["tree", "diamond", "hourglass", "lattice", "fountain"] as const;

type Pt = [number, number];

type Layer = {
  seed: number;
  kind: (typeof SPECIES)[number];
  b: number;
  depth: number;
  style: "curve" | "diag";
  inverted: boolean;
  rungs: number;
  cols: number;
  rows: number;
  nEnd: number;
  Wd: number;
  Ht: number;
  z: number;
  bph: number;
  bphs: number;
  dir: number;
  T: number;
  gap: number;
  phase: number;
  born: number;
  ttl: number;
  warmth: number;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Vertical-tangent cubic between two points — the rounded dendrogram link.
   Adaptive flattening (~5px facets) so long links never read as polylines. */
function sCurve(x0: number, y0: number, x1: number, y1: number, pull = 0.5): Pt[] {
  const c0 = y0 + (y1 - y0) * pull;
  const c1 = y1 - (y1 - y0) * pull;
  const pts: Pt[] = [];
  const n = Math.min(120, Math.max(14, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 5)));
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const v = 1 - u;
    pts.push([
      v * v * v * x0 + 3 * v * v * u * x0 + 3 * v * u * u * x1 + u * u * u * x1,
      v * v * v * y0 + 3 * v * v * u * c0 + 3 * v * u * u * c1 + u * u * u * y1,
    ]);
  }
  return pts;
}

/* Resample a polyline to n+1 points spaced uniformly by arc length — lets
   two differently-shaped paths be blended point-by-point. */
function resample(pts: Pt[], n: number): Pt[] {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = cum[cum.length - 1] || 1;
  const out: Pt[] = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const d = (i / n) * total;
    while (j < pts.length - 2 && cum[j + 1] < d) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const u = Math.max(0, Math.min(1, (d - cum[j]) / seg));
    out.push([
      pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u,
      pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u,
    ]);
  }
  return out;
}

/* Orthogonal diagram elbow: vertical run, rounded corner, horizontal
   shoulder at elbowMid, rounded corner, vertical run into the child. */
function elbowPts(x0: number, y0: number, x1: number, y1: number): Pt[] {
  const ym = y0 + (y1 - y0) * RECIPE.elbowMid;
  const dy = Math.sign(y1 - y0) || 1;
  const dx = Math.sign(x1 - x0) || 1;
  const r = Math.max(
    0.01,
    Math.min(RECIPE.elbowRound, Math.abs(x1 - x0) / 2, Math.abs(ym - y0), Math.abs(y1 - ym)),
  );
  const pts: Pt[] = [[x0, y0], [x0, ym - dy * r]];
  for (let i = 1; i <= 6; i++) {
    // quarter bend, control point on the corner
    const u = i / 6;
    const v = 1 - u;
    pts.push([
      (v * v + 2 * v * u) * x0 + u * u * (x0 + dx * r),
      v * v * (ym - dy * r) + (2 * v * u + u * u) * ym,
    ]);
  }
  pts.push([x1 - dx * r, ym]);
  for (let i = 1; i <= 6; i++) {
    const u = i / 6;
    const v = 1 - u;
    pts.push([
      v * v * (x1 - dx * r) + (2 * v * u + u * u) * x1,
      (v * v + 2 * v * u) * ym + u * u * (ym + dy * r),
    ]);
  }
  pts.push([x1, y1]);
  return pts;
}

/* A link is the S-curve morphed toward the orthogonal elbow by RECIPE.elbow. */
function link(x0: number, y0: number, x1: number, y1: number, pull = 0.5): Pt[] {
  const a = sCurve(x0, y0, x1, y1, pull);
  if (RECIPE.elbow <= 0 || x0 === x1) return a;
  const b = resample(elbowPts(x0, y0, x1, y1), a.length - 1);
  const w = RECIPE.elbow;
  return a.map((p, i): Pt => [p[0] + (b[i][0] - p[0]) * w, p[1] + (b[i][1] - p[1]) * w]);
}

const connect = (x0: number, y0: number, x1: number, y1: number, style: string): Pt[] =>
  style === "diag" || x0 === x1 ? [[x0, y0], [x1, y1]] : link(x0, y0, x1, y1);

function genLayer(seed: number, W: number, H: number): Layer {
  const rnd = mulberry32(seed);
  const kind = SPECIES[Math.floor(rnd() * SPECIES.length)];
  const b = rnd() < 0.6 ? 2 : 3;
  const sc = RECIPE.scaleMin + rnd() * Math.max(0, RECIPE.scaleMax - RECIPE.scaleMin);
  return {
    seed,
    kind,
    b,
    depth: b === 2 ? 2 + Math.floor(rnd() * 3) : 2 + Math.floor(rnd() * 2),
    style: rnd() < RECIPE.curviness ? "curve" : "diag",
    inverted: rnd() < 0.5,
    rungs: 3 + Math.floor(rnd() * 4),
    cols: 3 + Math.floor(rnd() * 3),
    rows: 3 + Math.floor(rnd() * 2),
    nEnd: 5 + 2 * Math.floor(rnd() * 3),
    Wd: W * (0.24 + rnd() * 0.3) * sc,
    Ht: H * (0.55 + rnd() * 0.3) * sc,
    z: 0,
    bph: rnd() * 7,
    bphs: (rnd() - 0.5) * 0.25,
    dir: rnd() < 0.5 ? 1 : -1,
    T: 7 + rnd() * 8,
    gap: 1.5 + rnd() * 3.5,
    phase: rnd() * 40,
    born: 0,
    ttl: RECIPE.lifetime * (0.8 + rnd() * 0.5),
    warmth: rnd(),
  };
}

/* One balanced, mirror-symmetric diagram in plane-local space (centered 0,0). */
function motifPolys(L: Layer): Pt[][] {
  const out: Pt[][] = [];
  const { b, Wd, Ht } = L;
  const rowXs = (n: number, span: number) =>
    Array.from({ length: n }, (_, j) => (n === 1 ? 0 : -span / 2 + (span * j) / (n - 1)));

  if (L.kind === "tree") {
    const ys = (lv: number) => -Ht / 2 + (Ht * lv) / L.depth;
    for (let lv = 0; lv < L.depth; lv++) {
      const ps = rowXs(Math.pow(b, lv), Wd * (lv / L.depth));
      const csn = rowXs(Math.pow(b, lv + 1), Wd * ((lv + 1) / L.depth));
      ps.forEach((px, i) => {
        for (let c = 0; c < b; c++) out.push(connect(px, ys(lv), csn[i * b + c], ys(lv + 1), L.style));
      });
    }
  } else if (L.kind === "diamond" || L.kind === "hourglass") {
    const half = Math.min(L.depth, b === 2 ? 3 : 2);
    const total = half * 2;
    const nAt =
      L.kind === "diamond"
        ? (l: number) => Math.pow(b, Math.min(l, total - l))
        : (l: number) => Math.pow(b, half - Math.min(l, total - l));
    const maxN = Math.pow(b, half);
    const span = (l: number) => (maxN === 1 ? 0 : (Wd * (nAt(l) - 1)) / (maxN - 1));
    const ys = (l: number) => -Ht / 2 + (Ht * l) / total;
    for (let l = 0; l < total; l++) {
      const a = rowXs(nAt(l), span(l));
      const c = rowXs(nAt(l + 1), span(l + 1));
      if (nAt(l + 1) > nAt(l)) {
        a.forEach((px, i) => {
          for (let q = 0; q < b; q++) out.push(connect(px, ys(l), c[i * b + q], ys(l + 1), L.style));
        });
      } else {
        a.forEach((px, i) => out.push(connect(px, ys(l), c[Math.floor(i / b)], ys(l + 1), L.style)));
      }
    }
  } else if (L.kind === "lattice") {
    // braid: vertical rails with sparse, balanced crossovers per row gap —
    // reads as exchange stages in a network diagram, not a block grid
    const ys = (r: number) => -Ht / 2 + (Ht * r) / (L.rows - 1);
    const xs = rowXs(L.cols, Wd);
    const rnd = mulberry32((L.seed ^ 0x9e37) >>> 0);
    for (let r = 0; r < L.rows - 1; r++) {
      const cross = new Array(L.cols - 1).fill(false);
      for (let j = 0; j <= Math.floor((L.cols - 2) / 2); j++) {
        const jm = L.cols - 2 - j;
        if (rnd() >= 0.5) continue;
        // a rail can join only one crossing per row gap
        if (j > 0 && cross[j - 1]) continue;
        if (jm === j + 1) {
          // mirrored gaps share a rail: alternate sides by row instead
          cross[r % 2 === 0 ? j : jm] = true;
        } else {
          cross[j] = true;
          cross[jm] = true; // jm === j at the center gap is a no-op repeat
        }
      }
      const used = new Array(L.cols).fill(false);
      for (let j = 0; j < L.cols - 1; j++) {
        if (!cross[j]) continue;
        out.push(connect(xs[j], ys(r), xs[j + 1], ys(r + 1), L.style));
        out.push(connect(xs[j + 1], ys(r), xs[j], ys(r + 1), L.style));
        used[j] = used[j + 1] = true;
      }
      for (let c = 0; c < L.cols; c++) {
        if (!used[c]) out.push([[xs[c], ys(r)], [xs[c], ys(r + 1)]]);
      }
    }
  } else {
    // fountain: one root fanning to many terminals
    const tops = rowXs(L.nEnd, Wd);
    for (const tx of tops) out.push(link(0, Ht / 2, tx, -Ht / 2, 0.6));
  }
  return out;
}

/* Plane-space sample points, subdivided ~10px for smooth projection. */
function samples(L: Layer, t: number): Pt[][] {
  const s = 1 + RECIPE.breathe * Math.sin(t * L.bphs + L.bph);
  const flip = L.inverted ? -1 : 1;
  const polys = motifPolys(L);
  const out: Pt[][] = [];
  for (const poly of polys) {
    const tp: Pt[] = [];
    for (let i = 0; i < poly.length; i++) {
      const X = poly[i][0] * s;
      const Y = poly[i][1] * s * flip;
      if (i > 0) {
        const prev = tp[tp.length - 1];
        const n = Math.max(2, Math.ceil(Math.hypot(X - prev[0], Y - prev[1]) / 10));
        for (let q = 1; q <= n; q++) {
          tp.push([prev[0] + (X - prev[0]) * (q / n), prev[1] + (Y - prev[1]) * (q / n)]);
        }
      } else tp.push([X, Y]);
    }
    out.push(tp);
  }
  return out;
}

const QUAD_V = `attribute vec2 aPos; varying vec2 vUV;
void main(){ vUV = aPos*0.5+0.5; gl_Position = vec4(aPos,0.,1.); }`;

/* aU is the signed position across the sweep band (-1 trailing … +1 leading);
   the fragment maps it through a 3-stop gradient whose middle stop sits at
   uMid. */
const LINE_V = `attribute vec2 aPos; attribute float aA; attribute float aU;
uniform vec2 uRes; varying float vA; varying float vU;
void main(){ vA = aA; vU = aU; vec2 c = aPos/uRes*2.0-1.0; gl_Position = vec4(c.x, -c.y, 0.0, 1.0); }`;

const LINE_F = `precision mediump float; varying float vA; varying float vU;
uniform vec3 uC0, uC1, uC2; uniform float uMid, uAtten;
void main(){
  vec3 col = vU >= uMid
    ? mix(uC1, uC0, clamp((vU - uMid) / (1.0 - uMid), 0.0, 1.0))
    : mix(uC1, uC2, clamp((uMid - vU) / (uMid + 1.0), 0.0, 1.0));
  gl_FragColor = vec4(col * uAtten * vA, 1.0);
}`;

const hx = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

function canvasBackground(canvas: HTMLCanvasElement): [number, number, number] {
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const context = probe.getContext("2d");
  if (!context) return [22 / 255, 23 / 255, 24 / 255];
  context.fillStyle = getComputedStyle(canvas).backgroundColor;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

/* Dense 15-tap gaussian — tap spacing stays <= ~1 texel (large radii are
   handled by downsampling first), so the blur smears instead of ghosting. */
const BLUR_F = `precision mediump float; varying vec2 vUV; uniform sampler2D uTex; uniform vec2 uDir;
void main(){
  vec4 c = texture2D(uTex, vUV) * 0.1665;
  c += (texture2D(uTex, vUV + uDir*1.0) + texture2D(uTex, vUV - uDir*1.0)) * 0.1527;
  c += (texture2D(uTex, vUV + uDir*2.0) + texture2D(uTex, vUV - uDir*2.0)) * 0.1177;
  c += (texture2D(uTex, vUV + uDir*3.0) + texture2D(uTex, vUV - uDir*3.0)) * 0.0763;
  c += (texture2D(uTex, vUV + uDir*4.0) + texture2D(uTex, vUV - uDir*4.0)) * 0.0415;
  c += (texture2D(uTex, vUV + uDir*5.0) + texture2D(uTex, vUV - uDir*5.0)) * 0.0190;
  c += (texture2D(uTex, vUV + uDir*6.0) + texture2D(uTex, vUV - uDir*6.0)) * 0.0073;
  c += (texture2D(uTex, vUV + uDir*7.0) + texture2D(uTex, vUV - uDir*7.0)) * 0.0024;
  gl_FragColor = c;
}`;

const COMP_F = `precision mediump float; varying vec2 vUV; uniform sampler2D uTex; uniform float uGain;
void main(){ gl_FragColor = vec4(texture2D(uTex, vUV).rgb * uGain, 1.0); }`;

function startField(canvas: HTMLCanvasElement): (() => void) | undefined {
  const glCtx = canvas.getContext("webgl", {
    antialias: true,
    alpha: false,
  });
  if (!glCtx) return undefined;
  const gl: WebGLRenderingContext = glCtx;
  const background = canvasBackground(canvas);

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = (v: string, f: string) => {
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl.VERTEX_SHADER, v));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, f));
    gl.linkProgram(p);
    return p;
  };
  const lineP = prog(LINE_V, LINE_F);
  const blurP = prog(QUAD_V, BLUR_F);
  const compP = prog(QUAD_V, COMP_F);
  const loc = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);

  const quadB = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadB);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const lineB = gl.createBuffer();
  gl.disable(gl.DEPTH_TEST);
  // MAX blending within a layer: overlapping strokes (a child link hugging its
  // parent's tangent) merge to one intensity instead of doubling into a seam.
  const minmax = gl.getExtension("EXT_blend_minmax");

  const drawQuad = (p: WebGLProgram) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, quadB);
    const a = gl.getAttribLocation(p, "aPos");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  type FBO = { tex: WebGLTexture; fb: WebGLFramebuffer };
  type Level = { w: number; h: number; A: FBO; B: FBO };
  let W = 0,
    H = 0,
    PW = 0,
    PH = 0,
    dpr = 1;
  let levels: Level[] | null = null;

  const makeFBO = (w: number, h: number): FBO => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fb };
  };

  let seedBase = RECIPE.seedBase;
  let layerSignature = "";
  const layerSeed = (i: number) => seedBase + i * 131;
  const currentLayerSignature = () =>
    [
      RECIPE.count,
      RECIPE.scaleMin,
      RECIPE.scaleMax,
      RECIPE.curviness,
      RECIPE.lifetime,
      RECIPE.seedBase,
    ].join(":");
  let layers: Layer[] = [];
  const regenLayers = () => {
    if (!W) return;
    const old = layers;
    layers = [];
    for (let i = 0; i < RECIPE.count; i++) {
      const L = genLayer(layerSeed(i), W, H);
      L.z = RECIPE.count === 1 ? 0.5 : i / (RECIPE.count - 1);
      L.born = old[i] ? old[i].born : -Math.random() * L.ttl * 0.7;
      layers.push(L);
    }
    layerSignature = currentLayerSignature();
  };

  const resize = () => {
    // Explicit render scale: the tuner can supersample thin lines above the
    // device's native pixel ratio when clarity matters more than fill cost.
    dpr = Math.max(0.75, Math.min(3, RECIPE.resolution));
    W = Math.max(320, window.innerWidth);
    H = Math.max(240, window.innerHeight);
    PW = Math.round(W * dpr);
    PH = Math.round(H * dpr);
    canvas.width = PW;
    canvas.height = PH;
    if (levels) {
      for (const lv of levels) {
        for (const f of [lv.A, lv.B]) {
          gl.deleteFramebuffer(f.fb);
          gl.deleteTexture(f.tex);
        }
      }
    }
    // blur pyramid: full, 1/2, 1/4, 1/8 resolution ping-pong pairs
    levels = [1, 2, 4, 8].map((f) => {
      const w = Math.max(2, Math.round(PW / f));
      const h = Math.max(2, Math.round(PH / f));
      return { w, h, A: makeFBO(w, h), B: makeFBO(w, h) };
    });
    regenLayers();
  };

  // scroll → tilt (-40° at the top of the page, +40° at the bottom), plus
  // scrollU driving the recede treatment (blur up, brightness down)
  let tilt = RECIPE.tiltFrom;
  let scrollU = 0;
  const onScroll = () => {
    const doc = document.documentElement;
    const range = Math.max(1, doc.scrollHeight - window.innerHeight);
    scrollU = Math.max(0, Math.min(1, window.scrollY / range));
    tilt = RECIPE.tiltFrom + (RECIPE.tiltTo - RECIPE.tiltFrom) * scrollU;
  };

  function render(t: number) {
    if (!levels) return;
    const focus = 0.5 + 0.5 * Math.sin(t * RECIPE.rackSpeed * Math.PI * 2);

    // camera
    const pitch = (tilt * Math.PI) / 180;
    const f = (H * 0.5) / Math.tan((RECIPE.fov * Math.PI) / 180 / 2);
    const D = RECIPE.dolly * H * 1.2;
    const zRange = Math.max(1, RECIPE.spacing * H);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const project = (x: number, y: number, zi: number): [number, number, number] => {
      const Z = (zi - 0.5) * zRange;
      const Y2 = y * cp - Z * sp;
      const Zt = y * sp + Z * cp;
      const zc = Zt + D;
      const s = f / Math.max(60, zc);
      return [W / 2 + x * s, H / 2 + Y2 * s, zc];
    };

    // Opaque page ground. Every blurred diagram layer is added over this.
    gl.viewport(0, 0, PW, PH);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.colorMask(true, true, true, true);
    gl.clearColor(background[0], background[1], background[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const STOP0 = hx(RECIPE.bandC0);
    const STOP1 = hx(RECIPE.bandC1);
    const STOP2 = hx(RECIPE.bandC2);
    const TINT = hx(RECIPE.tintC);

    for (let li = 0; li < layers.length; li++) {
      let L = layers[li];
      const age = t - L.born;
      if (age > L.ttl) {
        seedBase = (seedBase + 977) | 0;
        L = layers[li] = genLayer(layerSeed(li) + Math.floor(age * 31), W, H);
        L.z = RECIPE.count === 1 ? 0.5 : li / (RECIPE.count - 1);
        L.born = t;
        continue;
      }
      const life = Math.min(1, age / 4) * Math.min(1, (L.ttl - age) / 4);
      if (life <= 0) continue;

      // sweep band in plane space
      const T = L.T / RECIPE.sweepSpeed;
      const cycle = T + L.gap * RECIPE.gapMult;
      const ph = (((t + L.phase) % cycle) + cycle) % cycle;
      const sweeping = ph <= T;
      if (!sweeping && RECIPE.floor <= 0) continue;
      const y0 = -0.75 * H;
      const y1 = 0.75 * H;
      const u = sweeping ? ph / T : 0;
      const yc = L.dir > 0 ? y0 + (y1 - y0) * u : y1 - (y1 - y0) * u;
      const sig = RECIPE.band * H;
      const s2 = 2 * sig * sig;

      // normalized depth of this layer for DoF (post-rotation, at plane center)
      const zc = project(0, 0, L.z)[2];
      const depthN = Math.max(0, Math.min(1, (zc - (D - zRange * 0.75)) / (zRange * 1.5)));

      // terminal taper: fade to 0 toward the diagram's own top/bottom extent
      const hh = (L.Ht * (1 + RECIPE.breathe * Math.sin(t * L.bphs + L.bph))) / 2;
      const tEdge = Math.max(1e-3, hh * RECIPE.taper);
      const alphaAt = (py: number) => {
        const g = sweeping ? Math.exp(-((py - yc) * (py - yc)) / s2) : 0;
        let a = Math.max(RECIPE.floor, g) * life;
        const k = Math.min(1, Math.max(0, (hh - Math.abs(py)) / tEdge));
        a *= k * k * (3 - 2 * k);
        return a;
      };

      // signed band position for the gradient: +1 at the leading edge of the
      // travelling band, -1 at the trailing edge
      const uSpan = sig * 2.5;
      const uAt = (py: number) =>
        !sweeping ? 0 : Math.max(-1, Math.min(1, ((py - yc) / uSpan) * L.dir));

      // build projected line quads
      const polys = samples(L, t);
      const wHalf = RECIPE.stroke / 2;
      const verts: number[] = [];
      for (const poly of polys) {
        let prev = project(poly[0][0], poly[0][1], L.z);
        let ga = alphaAt(poly[0][1]);
        let ua = uAt(poly[0][1]);
        for (let i = 1; i < poly.length; i++) {
          const cur = project(poly[i][0], poly[i][1], L.z);
          const gb = alphaAt(poly[i][1]);
          const ub = uAt(poly[i][1]);
          if (ga > 0.008 || gb > 0.008) {
            const dx = cur[0] - prev[0];
            const dy = cur[1] - prev[1];
            const len = Math.hypot(dx, dy) || 1;
            const nx = (-dy / len) * wHalf;
            const ny = (dx / len) * wHalf;
            verts.push(
              prev[0] + nx, prev[1] + ny, ga, ua, prev[0] - nx, prev[1] - ny, ga, ua,
              cur[0] + nx, cur[1] + ny, gb, ub, prev[0] - nx, prev[1] - ny, ga, ua,
              cur[0] + nx, cur[1] + ny, gb, ub, cur[0] - nx, cur[1] - ny, gb, ub,
            );
          }
          prev = cur;
          ga = gb;
          ua = ub;
        }
      }
      if (!verts.length) continue;

      // pass 1: layer lines → full-res level (opaque black ground; the
      // transparency trick only applies at the final on-screen composite)
      gl.viewport(0, 0, PW, PH);
      gl.bindFramebuffer(gl.FRAMEBUFFER, levels[0].A.fb);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(lineP);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      if (minmax) gl.blendEquation(minmax.MAX_EXT);
      gl.bindBuffer(gl.ARRAY_BUFFER, lineB);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
      const aP = gl.getAttribLocation(lineP, "aPos");
      const aA = gl.getAttribLocation(lineP, "aA");
      const aU = gl.getAttribLocation(lineP, "aU");
      gl.enableVertexAttribArray(aP);
      gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(aA);
      gl.vertexAttribPointer(aA, 1, gl.FLOAT, false, 16, 8);
      gl.enableVertexAttribArray(aU);
      gl.vertexAttribPointer(aU, 1, gl.FLOAT, false, 16, 12);
      gl.uniform2f(loc(lineP, "uRes"), W, H);
      // gradient stops, each pulled toward the layer tint by warmth
      const tintT = L.warmth * RECIPE.tintAmt;
      const stop = (c: number[]) => c.map((v, i) => v + (TINT[i] - v) * tintT);
      gl.uniform3fv(loc(lineP, "uC0"), stop(STOP0));
      gl.uniform3fv(loc(lineP, "uC1"), stop(STOP1));
      gl.uniform3fv(loc(lineP, "uC2"), stop(STOP2));
      gl.uniform1f(loc(lineP, "uMid"), RECIPE.bandMid);
      gl.uniform1f(loc(lineP, "uAtten"), 1 - RECIPE.atmosphere * depthN);
      gl.drawArrays(gl.TRIANGLES, 0, verts.length / 4);
      gl.disableVertexAttribArray(aA);
      gl.disableVertexAttribArray(aU);
      if (minmax) gl.blendEquation(gl.FUNC_ADD);

      // focal-plane DoF with slow rack: blur by distance from the focus
      // plane, plus a flat scroll-driven defocus across every layer
      const d = Math.min(1, Math.abs(depthN - focus) * 1.6);
      const radius =
        (RECIPE.minBlur +
          RECIPE.aperture * Math.pow(d, RECIPE.falloff) +
          RECIPE.scrollBlur * scrollU) *
        dpr;

      // pick the pyramid level where tap spacing stays <= ~1 texel
      let lv = 0;
      while (lv < levels.length - 1 && radius / Math.pow(2, lv) > 7) lv++;
      gl.activeTexture(gl.TEXTURE0);
      gl.disable(gl.BLEND);

      // downsample chain (each halving is smooth via linear filtering)
      gl.useProgram(compP);
      gl.uniform1i(loc(compP, "uTex"), 0);
      gl.uniform1f(loc(compP, "uGain"), 1);
      for (let i = 1; i <= lv; i++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, levels[i].A.fb);
        gl.viewport(0, 0, levels[i].w, levels[i].h);
        gl.bindTexture(gl.TEXTURE_2D, levels[i - 1].A.tex);
        drawQuad(compP);
      }

      // separable gaussian at the chosen level
      const Lv = levels[lv];
      const step = radius / Math.pow(2, lv) / 7;
      gl.useProgram(blurP);
      gl.uniform1i(loc(blurP, "uTex"), 0);
      gl.viewport(0, 0, Lv.w, Lv.h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, Lv.B.fb);
      gl.bindTexture(gl.TEXTURE_2D, Lv.A.tex);
      gl.uniform2f(loc(blurP, "uDir"), step / Lv.w, 0);
      drawQuad(blurP);
      gl.bindFramebuffer(gl.FRAMEBUFFER, Lv.A.fb);
      gl.bindTexture(gl.TEXTURE_2D, Lv.B.tex);
      gl.uniform2f(loc(blurP, "uDir"), 0, step / Lv.h);
      drawQuad(blurP);

      // Add the blurred light over the opaque page ground. Alpha stays 1.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, PW, PH);
      gl.useProgram(compP);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.colorMask(true, true, true, false);
      gl.bindTexture(gl.TEXTURE_2D, Lv.A.tex);
      const dim = 1 - (1 - RECIPE.scrollDimTo) * scrollU;
      gl.uniform1f(loc(compP, "uGain"), RECIPE.exposure * (0.85 + 0.5 * d) * dim);
      drawQuad(compP);
      gl.colorMask(true, true, true, true);
    }
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf = 0;
  let t = 0;
  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt * RECIPE.timeScale;
    render(t);
    raf = requestAnimationFrame(frame);
  };
  const onTune = () => {
    seedBase = RECIPE.seedBase;
    if (dpr !== RECIPE.resolution) resize();
    else if (layerSignature !== currentLayerSignature()) regenLayers();
    onScroll();
    if (reduced) render(4);
  };

  resize();
  onScroll();
  window.addEventListener("resize", resize);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener(CIRCUIT_FIELD_TUNE_EVENT, onTune);
  if (reduced) {
    // static: one frame, re-rendered only when scroll/resize moves the camera
    const still = () => render(4);
    still();
    window.addEventListener("scroll", still, { passive: true });
    window.addEventListener("resize", still);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", still);
      window.removeEventListener("resize", still);
      window.removeEventListener(CIRCUIT_FIELD_TUNE_EVENT, onTune);
    };
  }
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener(CIRCUIT_FIELD_TUNE_EVENT, onTune);
  };
}

export function CircuitField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startField(canvas);
  }, []);

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <canvas ref={ref} className="h-full w-full bg-background" />
      </div>
      <CircuitFieldTuneGate />
    </>
  );
}
