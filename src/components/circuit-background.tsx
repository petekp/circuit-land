"use client";

import { DialStore, type DialConfig, type DialValue } from "dialkit";
import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const DEFAULT_WORD = "G";

type Point = {
  x: number;
  y: number;
};

type Cell = {
  x: number;
  y: number;
};

type TextLayout = {
  fontSize: number;
  glyph: string[];
  left: number;
  text: string;
  textWidth: number;
  top: number;
};

type RouteSegment = {
  layer: number;
  path?: Path2D | null;
  points: Point[];
};

type TerminalKind = "inner" | "outer";
type EdgeSide = "bottom" | "left" | "right" | "top";

type RgbColor = {
  b: number;
  g: number;
  r: number;
};

type RoutePalette = readonly [string, string];

type CircuitTheme = {
  backgroundStops: readonly [string, string, string];
  frameAlpha: number;
  frameColor: string;
  gridAlpha: number;
  gridColor: string;
  id: string;
  name: string;
  padHoleFill: string;
  padSocketFill: string;
  pageBackground: string;
  pearlColors: readonly [RgbColor, RgbColor, RgbColor, RgbColor];
  substrateColor: RgbColor;
  systemBaseColor: RgbColor;
  terminalPalettes: readonly [RoutePalette, ...RoutePalette[]];
};

type TextFontKey =
  | "circuit-mono"
  | "space-grotesk"
  | "orbitron"
  | "ibm-plex-mono"
  | "playfair-display"
  | "roboto-condensed"
  | "bebas-neue";

type TextFontOption = {
  cssVariable?: string;
  fallbackStack: string;
  id: TextFontKey;
  name: string;
  usePixelGlyphs?: boolean;
  weight: number;
};

type CircuitTuning = {
  channelGateInsetCells: number;
  channelGateStepCells: number;
  channelLaneBaseOffsetCells: number;
  channelLaneCount: number;
  channelLanePitchCells: number;
  edgeFanoutInsetCells: number;
  innerRouteSidePattern: EdgeSide[];
  innerTerminalShare: number;
  isoDepth: number;
  isoDepthVariance: number;
  isoLift: number;
  isoPerspective: number;
  isoPitch: number;
  isoScale: number;
  isoShadow: number;
  isoYaw: number;
  maxTerminalPads: number;
  minTerminalPads: number;
  padSpacingCells: number;
  planLongEdge: number;
  pulseCount: number;
  pulseDetail: number;
  pulseIntensity: number;
  pulseLength: number;
  pulseLengthVariance: number;
  pulsePearl: number;
  pulseSpeedVariance: number;
  pulseSpeed: number;
  pulseWidth: number;
  routingCellSize: number;
  sideOriginFractionMax: number;
  sideOriginFractionMin: number;
  systemRippleCount: number;
  systemRippleFeather: number;
  systemRippleIntensity: number;
  systemRippleLength: number;
  systemRipplePearl: number;
  systemPadPulseDecay: number;
  systemPadPulseIntensity: number;
  systemPadPulseSize: number;
  systemRippleSharpness: number;
  systemRippleSpeed: number;
  systemRippleSpread: number;
  systemRippleStart: number;
  systemRippleWidth: number;
  terminalDensityMultiplier: number;
  theme: CircuitTheme;
  textFontKey: TextFontKey;
  textGlyphMaxCols: number;
  textGlyphRows: number;
  textHeightShare: number;
  textWidthShare: number;
  traceWidthInner: [number, number];
  traceWidthOuter: [number, number];
};

type NumericTuningKey =
  | "channelGateInsetCells"
  | "channelGateStepCells"
  | "channelLaneBaseOffsetCells"
  | "channelLaneCount"
  | "channelLanePitchCells"
  | "edgeFanoutInsetCells"
  | "innerTerminalShare"
  | "isoDepth"
  | "isoDepthVariance"
  | "isoLift"
  | "isoPerspective"
  | "isoPitch"
  | "isoScale"
  | "isoShadow"
  | "isoYaw"
  | "maxTerminalPads"
  | "padSpacingCells"
  | "planLongEdge"
  | "pulseCount"
  | "pulseDetail"
  | "pulseIntensity"
  | "pulseLength"
  | "pulseLengthVariance"
  | "pulsePearl"
  | "pulseSpeedVariance"
  | "pulseSpeed"
  | "pulseWidth"
  | "routingCellSize"
  | "systemRippleCount"
  | "systemRippleFeather"
  | "systemRippleIntensity"
  | "systemRippleLength"
  | "systemRipplePearl"
  | "systemPadPulseDecay"
  | "systemPadPulseIntensity"
  | "systemPadPulseSize"
  | "systemRippleSharpness"
  | "systemRippleSpeed"
  | "systemRippleSpread"
  | "systemRippleStart"
  | "systemRippleWidth"
  | "terminalDensityMultiplier"
  | "textGlyphMaxCols"
  | "textGlyphRows"
  | "textHeightShare"
  | "textWidthShare";

type TerminalSpec = {
  cell: Cell;
  edgeSide: EdgeSide;
  kind: TerminalKind;
};

type PadCandidate = TerminalSpec & {
  major: number;
  minor: number;
};

type TerminalPad = TerminalSpec & {
  color: string;
  glow: string;
};

type LetterSideFace = {
  cell: Cell;
  depthScale: number;
  points: [Point, Point, Point, Point];
  side: Extract<EdgeSide, "bottom" | "right">;
};

type Route = {
  color: string;
  glow: string;
  layer: number;
  length: number;
  originPoint: Point;
  phase: number;
  points: Point[];
  segments: RouteSegment[];
  speed: number;
  terminalEdgeSide: EdgeSide;
  terminalKind: TerminalKind;
  terminalPoint: Point;
  viaPoints: Point[];
  width: number;
};

type RoutingGate = {
  cell: Cell;
  side: EdgeSide;
};

type AccessTree = {
  cameFrom: Int32Array;
  gates: RoutingGate[];
  sourceGate: Int32Array;
};

type RoutingField = {
  blocked: Uint8Array;
  cell: number;
  cols: number;
  contour: Cell[];
  height: number;
  nearText: Uint8Array;
  rows: number;
  textDistance: Float32Array;
  textDistanceMax: number;
  textLayout: TextLayout;
  width: number;
};

type BoardPlan = {
  field: RoutingField;
  routes: Route[];
  terminalPads: TerminalPad[];
};

type StaticLayer = {
  canvas: HTMLCanvasElement;
  effectCanvas: HTMLCanvasElement;
  effectPixelRatio: number;
  height: number;
  maskCanvas: HTMLCanvasElement;
  padPulseEntries: PadPulseEntry[];
  pixelRatio: number;
  plan: BoardPlan | null;
  waveCanvas: HTMLCanvasElement;
  waveMaxDistance: number;
  width: number;
};

type LetterOverlayLayer = {
  canvas: HTMLCanvasElement;
  height: number;
  pixelRatio: number;
  plan: BoardPlan | null;
  tuning: CircuitTuning;
  width: number;
};

type PadPulseEntry = {
  distance: number;
  pad: TerminalPad;
  point: Point;
};

type ShaderRippleRenderer = {
  gl: WebGL2RenderingContext;
  maskSource: HTMLCanvasElement | null;
  maskTexture: WebGLTexture;
  padPulseInstanceBuffer: WebGLBuffer;
  padPulseProgram: WebGLProgram;
  padPulseUniforms: {
    layerSize: WebGLUniformLocation | null;
  };
  padPulseVertexArray: WebGLVertexArrayObject;
  padPulseVertexBuffer: WebGLBuffer;
  program: WebGLProgram;
  pulseSource: HTMLCanvasElement | null;
  pulseTexture: WebGLTexture;
  routeBloomInstanceBuffer: WebGLBuffer;
  routeBloomProgram: WebGLProgram;
  routeBloomUniforms: {
    layerSize: WebGLUniformLocation | null;
  };
  routeBloomVertexArray: WebGLVertexArrayObject;
  routeBloomVertexBuffer: WebGLBuffer;
  routeLineInstanceBuffer: WebGLBuffer;
  routeLineProgram: WebGLProgram;
  routeLineUniforms: {
    layerSize: WebGLUniformLocation | null;
  };
  routeLineVertexArray: WebGLVertexArrayObject;
  routeLineVertexBuffer: WebGLBuffer;
  staticSource: HTMLCanvasElement | null;
  staticTexture: WebGLTexture;
  waveFieldSource: HTMLCanvasElement | null;
  waveFieldTexture: WebGLTexture;
  uniforms: {
    bandWidth: WebGLUniformLocation | null;
    center: WebGLUniformLocation | null;
    feather: WebGLUniformLocation | null;
    intensity: WebGLUniformLocation | null;
    layerSize: WebGLUniformLocation | null;
    mask: WebGLUniformLocation | null;
    pearl: WebGLUniformLocation | null;
    pearl0: WebGLUniformLocation | null;
    pearl1: WebGLUniformLocation | null;
    pearl2: WebGLUniformLocation | null;
    pearl3: WebGLUniformLocation | null;
    pulse: WebGLUniformLocation | null;
    sharpness: WebGLUniformLocation | null;
    speed: WebGLUniformLocation | null;
    staticLayer: WebGLUniformLocation | null;
    spread: WebGLUniformLocation | null;
    startShare: WebGLUniformLocation | null;
    systemBase: WebGLUniformLocation | null;
    tailLength: WebGLUniformLocation | null;
    tailSteps: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    travelRadius: WebGLUniformLocation | null;
    waveField: WebGLUniformLocation | null;
    waveCount: WebGLUniformLocation | null;
  };
  vertexArray: WebGLVertexArrayObject | null;
  vertexBuffer: WebGLBuffer | null;
};

type DrawState = {
  letterOverlayLayer: LetterOverlayLayer | null;
  plan: BoardPlan | null;
  planKey: string | null;
  reducedMotion: boolean;
  renderedLetterOverlayHeight: number;
  renderedLetterOverlayLayer: LetterOverlayLayer | null;
  renderedLetterOverlayWidth: number;
  renderedStaticHeight: number;
  renderedStaticLayer: StaticLayer | null;
  renderedStaticWidth: number;
  staticLayer: StaticLayer | null;
  tuning: CircuitTuning;
};

type SystemRippleMetrics = {
  bandWidth: number;
  center: Point;
  feather: number;
  maxRadius: number;
  sharpness: number;
  speed: number;
  spread: number;
  startRadiusShare: number;
  tailLength: number;
  tailSteps: number;
  travelRadius: number;
  waveCount: number;
};

type CircuitPerfSample = {
  frameIntervalMs: number;
  height: number;
  padCount: number;
  pixelRatio: number;
  renderMs: number;
  routeCount: number;
  timestamp: number;
  width: number;
};

type CircuitPerfState = {
  lastUpdated: number;
  samples: CircuitPerfSample[];
  targetMs: number;
  updateCount: number;
};

type CircuitPerfWindow = Window & {
  __circuitPerf?: CircuitPerfState;
  __circuitPerfLastFrameTime?: number;
};

const DIRECTIONS = [
  { x: 1, y: 0, cost: 1 },
  { x: -1, y: 0, cost: 1 },
  { x: 0, y: 1, cost: 1 },
  { x: 0, y: -1, cost: 1 },
  { x: 1, y: 1, cost: Math.SQRT2 },
  { x: -1, y: 1, cost: Math.SQRT2 },
  { x: 1, y: -1, cost: Math.SQRT2 },
  { x: -1, y: -1, cost: Math.SQRT2 },
] as const;

const LAYER_COUNT = 2;
const FRAME_INTERVAL = 1000 / 60;
const PLAN_ASPECT_STEP = 0.16;
const PLAN_LONG_EDGE = 720;
const PLAN_MAX_ASPECT = 2.2;
const PLAN_MIN_ASPECT = 0.45;
const RENDER_PIXEL_RATIO_LIMIT = 1.5;
const CANVAS_EFFECT_PIXEL_RATIO_SCALE = 0.2;
const CANVAS_FALLBACK_PIXEL_RATIO_SCALE = CANVAS_EFFECT_PIXEL_RATIO_SCALE;
const DYNAMIC_GLYPH_ROWS = 17;
const DYNAMIC_GLYPH_MAX_COLS = 180;
const PAD_PULSE_INSTANCE_FLOATS = 12;
const PULSE_BLOOM_BUDGET = 720;
const PULSE_SHIMMER_ROUTE_BUDGET = 560;
const PULSE_TERMINAL_FADE_POWER = 1.18;
const PULSE_TERMINAL_FADE_SHARE = 0.11;
const PULSE_TAIL_TAPER_POWER = 1.35;
const PULSE_TAIL_TAPER_SEGMENTS = 9;
const ROUTE_BLOOM_INSTANCE_FLOATS = 12;
const ROUTE_LINE_INSTANCE_FLOATS = 12;
const RIPPLE_VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;
const RIPPLE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uMask;
uniform sampler2D uPulse;
uniform sampler2D uStatic;
uniform sampler2D uWaveField;
uniform vec2 uLayerSize;
uniform vec2 uCenter;
uniform float uTime;
uniform float uBandWidth;
uniform float uFeather;
uniform float uIntensity;
uniform float uPearl;
uniform vec3 uPearl0;
uniform vec3 uPearl1;
uniform vec3 uPearl2;
uniform vec3 uPearl3;
uniform float uSharpness;
uniform float uSpeed;
uniform float uSpread;
uniform float uStartShare;
uniform vec3 uSystemBase;
uniform float uTailLength;
uniform float uTailSteps;
uniform float uTravelRadius;
uniform int uWaveCount;

vec3 pearlAt(int index) {
  if (index == 0) {
    return uPearl0;
  }

  if (index == 1) {
    return uPearl1;
  }

  if (index == 2) {
    return uPearl2;
  }

  return uPearl3;
}

vec3 mixPearl(float phase, float pearl) {
  float wrapped = mod(phase, 4.0);
  int firstIndex = int(floor(wrapped));
  int secondIndex = int(mod(float(firstIndex + 1), 4.0));
  return mix(
    uSystemBase,
    mix(pearlAt(firstIndex), pearlAt(secondIndex), fract(wrapped)),
    pearl
  );
}

float rippleFade(float progress) {
  return min(1.0, min(progress / 0.1, (1.0 - progress) / 0.16));
}

void main() {
  vec4 staticColor = texture(uStatic, vUv);
  vec4 pulseColor = texture(uPulse, vUv);
  float mask = texture(uMask, vUv).a;
  vec3 composed = staticColor.rgb;

  if (mask <= 0.01 || uIntensity <= 0.0) {
    fragColor = vec4(
      clamp(composed + pulseColor.rgb * pulseColor.a, 0.0, 1.0),
      1.0
    );
    return;
  }

  float distanceFromText = texture(uWaveField, vUv).r * (uStartShare + uTravelRadius);
  vec3 color = vec3(0.0);
  float alpha = 0.0;

  for (int wave = 0; wave < 6; wave += 1) {
    if (wave >= uWaveCount) {
      continue;
    }

    float waveOffset = uWaveCount <= 1
      ? 0.0
      : (float(wave) / float(uWaveCount)) * uSpread;
    float progress = mod(uTime * 0.00012 * uSpeed + waveOffset, 1.0);
    float fade = rippleFade(progress);

    if (fade <= 0.0) {
      continue;
    }

    float radius = max(
      0.1,
      uLayerSize.x * 0.0 + uStartShare + progress * uTravelRadius
    );
    float frontReach = uBandWidth * (0.75 + uFeather * 0.24);
    float frontDistance = abs(distanceFromText - radius);
    float frontStrength = frontDistance < frontReach
      ? 1.0 - frontDistance / frontReach
      : 0.0;
    float trailDistance = radius - distanceFromText;
    float trailStrength = trailDistance >= 0.0 && trailDistance < uTailLength
      ? pow(1.0 - trailDistance / uTailLength, uSharpness * 1.15) * 0.6
      : 0.0;
    float strength = fade * max(frontStrength, trailStrength);

    if (strength <= 0.0) {
      continue;
    }

    vec3 waveColor = mixPearl(float(wave) * 0.54 + uTime * 0.00032, uPearl);
    vec3 highlight = mix(waveColor, vec3(1.0), 0.48);
    float frontHighlight = smoothstep(frontReach, 0.0, frontDistance);
    color += mix(waveColor, highlight, frontHighlight * 0.72) * strength;
    alpha += strength;
  }

  alpha = clamp(alpha * uIntensity * mask, 0.0, 0.9);
  vec3 rippleColor = color * uIntensity * mask * alpha;
  fragColor = vec4(
    clamp(composed + rippleColor + pulseColor.rgb * pulseColor.a, 0.0, 1.0),
    1.0
  );
}
`;
const PAD_PULSE_VERTEX_SHADER = `#version 300 es
in vec2 aCorner;
in vec4 aCenterAndGlow;
in vec4 aCoreAndColorR;
in vec4 aColorAndFlags;

uniform vec2 uLayerSize;

out vec2 vLocal;
out vec2 vCoreHalf;
out vec2 vGlowHalf;
out float vCorner;
out vec3 vColor;
out float vStrength;

void main() {
  vec2 local = aCorner * aCenterAndGlow.zw;
  vec2 point = aColorAndFlags.w > 0.5
    ? aCenterAndGlow.xy + vec2(-local.y, local.x)
    : aCenterAndGlow.xy + local;

  vec2 clip = vec2(
    point.x / uLayerSize.x * 2.0 - 1.0,
    1.0 - point.y / uLayerSize.y * 2.0
  );

  vLocal = local;
  vCoreHalf = aCoreAndColorR.xy;
  vGlowHalf = aCenterAndGlow.zw;
  vCorner = aCoreAndColorR.z;
  vColor = vec3(aCoreAndColorR.w, aColorAndFlags.x, aColorAndFlags.y);
  vStrength = aColorAndFlags.z;
  gl_Position = vec4(clip, 0.0, 1.0);
}
`;
const PAD_PULSE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vLocal;
in vec2 vCoreHalf;
in vec2 vGlowHalf;
in float vCorner;
in vec3 vColor;
in float vStrength;

out vec4 fragColor;

float roundedBoxSdf(vec2 point, vec2 halfSize, float radius) {
  vec2 q = abs(point) - halfSize + vec2(radius);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

void main() {
  float outerDistance = roundedBoxSdf(vLocal, vGlowHalf, vCorner + 3.0);
  if (outerDistance > 1.5) {
    discard;
  }

  float coreDistance = roundedBoxSdf(vLocal, vCoreHalf, vCorner);
  float spread = max(1.0, max(vGlowHalf.x - vCoreHalf.x, vGlowHalf.y - vCoreHalf.y));
  float outerMask = 1.0 - smoothstep(-0.5, 1.5, outerDistance);
  float glow = outerMask * (1.0 - smoothstep(-spread, spread, coreDistance));
  glow = pow(max(glow, 0.0), 1.45) * vStrength * 0.34;

  float core = (1.0 - smoothstep(-0.35, 0.95, coreDistance)) * vStrength * 0.5;
  float stroke = (1.0 - smoothstep(0.0, 1.15, abs(coreDistance) - 0.7)) *
    vStrength * 0.72;
  vec3 highlight = mix(vColor, vec3(1.0), 0.55);
  vec3 premultiplied = vColor * glow + highlight * (core + stroke);

  fragColor = vec4(premultiplied, 0.0);
}
`;
const ROUTE_LINE_VERTEX_SHADER = `#version 300 es
in vec2 aCorner;
in vec4 aStartEnd;
in vec4 aColor;
in vec4 aParams;

uniform vec2 uLayerSize;

out vec2 vLocal;
out vec4 vColor;
out float vHalfWidth;
out float vLength;

void main() {
  vec2 start = aStartEnd.xy;
  vec2 end = aStartEnd.zw;
  vec2 axis = end - start;
  float segmentLength = max(length(axis), 0.001);
  vec2 direction = axis / segmentLength;
  vec2 normal = vec2(-direction.y, direction.x);
  float halfWidth = max(aParams.x, 0.1);
  float extend = max(aParams.y, 0.0);
  float along = mix(-extend, segmentLength + extend, aCorner.y);
  vec2 local = vec2(aCorner.x * halfWidth, along);
  vec2 point = start + direction * along + normal * local.x;

  vec2 clip = vec2(
    point.x / uLayerSize.x * 2.0 - 1.0,
    1.0 - point.y / uLayerSize.y * 2.0
  );

  vLocal = local;
  vColor = aColor;
  vHalfWidth = halfWidth;
  vLength = segmentLength;
  gl_Position = vec4(clip, 0.0, 1.0);
}
`;
const ROUTE_LINE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vLocal;
in vec4 vColor;
in float vHalfWidth;
in float vLength;

out vec4 fragColor;

void main() {
  float cappedY = clamp(vLocal.y, 0.0, vLength);
  float distanceFromStroke = length(vec2(vLocal.x, vLocal.y - cappedY));
  float edge = 1.0 - smoothstep(
    vHalfWidth - 0.9,
    vHalfWidth + 0.9,
    distanceFromStroke
  );

  if (edge <= 0.001) {
    discard;
  }

  fragColor = vec4(vColor.rgb * vColor.a * edge, 0.0);
}
`;
const ROUTE_BLOOM_VERTEX_SHADER = `#version 300 es
in vec2 aCorner;
in vec4 aCenterRadius;
in vec4 aBloomColor;
in vec4 aBaseColor;

uniform vec2 uLayerSize;

out vec2 vLocal;
out vec4 vBloomColor;
out vec4 vBaseColor;
out float vCoreShare;

void main() {
  float radius = max(aCenterRadius.z, 0.1);
  vec2 local = aCorner * radius;
  vec2 point = aCenterRadius.xy + local;
  vec2 clip = vec2(
    point.x / uLayerSize.x * 2.0 - 1.0,
    1.0 - point.y / uLayerSize.y * 2.0
  );

  vLocal = aCorner;
  vBloomColor = aBloomColor;
  vBaseColor = aBaseColor;
  vCoreShare = clamp(aCenterRadius.w / radius, 0.02, 0.9);
  gl_Position = vec4(clip, 0.0, 1.0);
}
`;
const ROUTE_BLOOM_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vLocal;
in vec4 vBloomColor;
in vec4 vBaseColor;
in float vCoreShare;

out vec4 fragColor;

void main() {
  float distanceFromCenter = length(vLocal);

  if (distanceFromCenter > 1.0) {
    discard;
  }

  float innerMix = 1.0 - smoothstep(0.0, 0.34, distanceFromCenter);
  float outerFade = 1.0 - smoothstep(0.34, 1.0, distanceFromCenter);
  float glowAlpha = mix(vBaseColor.a, vBloomColor.a, innerMix) * outerFade;
  float coreMask = 1.0 - smoothstep(vCoreShare * 0.62, vCoreShare, distanceFromCenter);
  float coreAlpha = coreMask * vBloomColor.a * 0.92;
  vec3 color = mix(vBaseColor.rgb, vBloomColor.rgb, innerMix);
  float alpha = max(glowAlpha, coreAlpha);

  fragColor = vec4(color * alpha, 0.0);
}
`;
const AURORA_THEME = {
  backgroundStops: ["#081015", "#030711", "#010208"],
  frameAlpha: 0.24,
  frameColor: "#4af7d8",
  gridAlpha: 0.18,
  gridColor: "#1a2930",
  id: "aurora",
  name: "Aurora Trace",
  padHoleFill: "#02040a",
  padSocketFill: "rgba(2, 4, 10, 0.96)",
  pageBackground: "#02040a",
  pearlColors: [
    { r: 255, g: 245, b: 198 },
    { r: 118, g: 255, b: 230 },
    { r: 150, g: 180, b: 255 },
    { r: 255, g: 130, b: 222 },
  ],
  substrateColor: { r: 2, g: 8, b: 12 },
  systemBaseColor: { r: 74, g: 247, b: 216 },
  terminalPalettes: [
    ["#38f6d2", "rgba(56, 246, 210, 0.26)"],
    ["#83a8ff", "rgba(131, 168, 255, 0.22)"],
    ["#f3d47a", "rgba(243, 212, 122, 0.34)"],
  ],
} as const satisfies CircuitTheme;

const EMBER_THEME = {
  backgroundStops: ["#180906", "#100605", "#040101"],
  frameAlpha: 0.3,
  frameColor: "#ff9b55",
  gridAlpha: 0.2,
  gridColor: "#3a1c14",
  id: "ember",
  name: "Ember Ceramic",
  padHoleFill: "#090201",
  padSocketFill: "rgba(11, 3, 2, 0.97)",
  pageBackground: "#090201",
  pearlColors: [
    { r: 255, g: 230, b: 150 },
    { r: 255, g: 126, b: 72 },
    { r: 255, g: 74, b: 58 },
    { r: 176, g: 76, b: 255 },
  ],
  substrateColor: { r: 24, g: 8, b: 4 },
  systemBaseColor: { r: 255, g: 129, b: 72 },
  terminalPalettes: [
    ["#ffb45d", "rgba(255, 180, 93, 0.34)"],
    ["#ff615d", "rgba(255, 97, 93, 0.26)"],
    ["#ffd68a", "rgba(255, 214, 138, 0.3)"],
    ["#d48cff", "rgba(212, 140, 255, 0.22)"],
  ],
} as const satisfies CircuitTheme;

const VIOLET_THEME = {
  backgroundStops: ["#130a20", "#070612", "#020106"],
  frameAlpha: 0.28,
  frameColor: "#cf8cff",
  gridAlpha: 0.18,
  gridColor: "#2c1b46",
  id: "violet",
  name: "Violet Glass",
  padHoleFill: "#05020a",
  padSocketFill: "rgba(6, 3, 14, 0.96)",
  pageBackground: "#05020a",
  pearlColors: [
    { r: 240, g: 210, b: 255 },
    { r: 160, g: 116, b: 255 },
    { r: 92, g: 255, b: 236 },
    { r: 255, g: 105, b: 188 },
  ],
  substrateColor: { r: 14, g: 6, b: 24 },
  systemBaseColor: { r: 194, g: 126, b: 255 },
  terminalPalettes: [
    ["#d38cff", "rgba(211, 140, 255, 0.28)"],
    ["#7dffef", "rgba(125, 255, 239, 0.22)"],
    ["#ff77c8", "rgba(255, 119, 200, 0.24)"],
    ["#a7a5ff", "rgba(167, 165, 255, 0.24)"],
  ],
} as const satisfies CircuitTheme;

const BLUEPRINT_THEME = {
  backgroundStops: ["#071b28", "#04101b", "#01050b"],
  frameAlpha: 0.32,
  frameColor: "#72d8ff",
  gridAlpha: 0.24,
  gridColor: "#16415a",
  id: "blueprint",
  name: "Blueprint Copper",
  padHoleFill: "#020812",
  padSocketFill: "rgba(2, 8, 18, 0.96)",
  pageBackground: "#020812",
  pearlColors: [
    { r: 180, g: 238, b: 255 },
    { r: 83, g: 205, b: 255 },
    { r: 255, g: 187, b: 105 },
    { r: 255, g: 228, b: 156 },
  ],
  substrateColor: { r: 3, g: 14, b: 24 },
  systemBaseColor: { r: 98, g: 211, b: 255 },
  terminalPalettes: [
    ["#77dfff", "rgba(119, 223, 255, 0.24)"],
    ["#f3a85c", "rgba(243, 168, 92, 0.28)"],
    ["#d8f4ff", "rgba(216, 244, 255, 0.18)"],
  ],
} as const satisfies CircuitTheme;

const GHOST_THEME = {
  backgroundStops: ["#111416", "#07090b", "#020304"],
  frameAlpha: 0.2,
  frameColor: "#cbd9d9",
  gridAlpha: 0.16,
  gridColor: "#293133",
  id: "ghost",
  name: "Ghost Mono",
  padHoleFill: "#030405",
  padSocketFill: "rgba(3, 4, 5, 0.97)",
  pageBackground: "#030405",
  pearlColors: [
    { r: 235, g: 245, b: 240 },
    { r: 166, g: 188, b: 190 },
    { r: 116, g: 142, b: 148 },
    { r: 255, g: 255, b: 236 },
  ],
  substrateColor: { r: 8, g: 10, b: 11 },
  systemBaseColor: { r: 202, g: 222, b: 220 },
  terminalPalettes: [
    ["#d5e2df", "rgba(213, 226, 223, 0.2)"],
    ["#94a9aa", "rgba(148, 169, 170, 0.18)"],
    ["#fff1c9", "rgba(255, 241, 201, 0.18)"],
  ],
} as const satisfies CircuitTheme;

const ACID_THEME = {
  backgroundStops: ["#10180a", "#071005", "#010401"],
  frameAlpha: 0.34,
  frameColor: "#d7ff43",
  gridAlpha: 0.2,
  gridColor: "#2d4315",
  id: "acid",
  name: "Acid Bloom",
  padHoleFill: "#020602",
  padSocketFill: "rgba(2, 7, 2, 0.96)",
  pageBackground: "#020602",
  pearlColors: [
    { r: 245, g: 255, b: 91 },
    { r: 92, g: 255, b: 110 },
    { r: 69, g: 255, b: 224 },
    { r: 255, g: 88, b: 160 },
  ],
  substrateColor: { r: 7, g: 14, b: 4 },
  systemBaseColor: { r: 198, g: 255, b: 64 },
  terminalPalettes: [
    ["#dcff45", "rgba(220, 255, 69, 0.33)"],
    ["#5dff73", "rgba(93, 255, 115, 0.24)"],
    ["#45ffe0", "rgba(69, 255, 224, 0.2)"],
    ["#ff5ea4", "rgba(255, 94, 164, 0.24)"],
  ],
} as const satisfies CircuitTheme;

const TEXT_FONT_LOAD_EVENT = "circuit-text-font-ready";
const SYSTEM_MONO_STACK =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
const TEXT_FONT_OPTIONS = [
  {
    fallbackStack: SYSTEM_MONO_STACK,
    id: "circuit-mono",
    name: "Circuit Mono",
    usePixelGlyphs: true,
    weight: 800,
  },
  {
    cssVariable: "--font-circuit-space-grotesk",
    fallbackStack: "Arial, Helvetica, sans-serif",
    id: "space-grotesk",
    name: "Space Grotesk",
    weight: 700,
  },
  {
    cssVariable: "--font-circuit-orbitron",
    fallbackStack: "Arial, Helvetica, sans-serif",
    id: "orbitron",
    name: "Orbitron",
    weight: 800,
  },
  {
    cssVariable: "--font-circuit-ibm-plex-mono",
    fallbackStack: SYSTEM_MONO_STACK,
    id: "ibm-plex-mono",
    name: "IBM Plex Mono",
    weight: 700,
  },
  {
    cssVariable: "--font-circuit-playfair",
    fallbackStack: "Georgia, Times, serif",
    id: "playfair-display",
    name: "Playfair Display",
    weight: 800,
  },
  {
    cssVariable: "--font-circuit-roboto-condensed",
    fallbackStack: "Arial Narrow, Arial, Helvetica, sans-serif",
    id: "roboto-condensed",
    name: "Roboto Condensed",
    weight: 800,
  },
  {
    cssVariable: "--font-circuit-bebas-neue",
    fallbackStack: "Arial Narrow, Arial, Helvetica, sans-serif",
    id: "bebas-neue",
    name: "Bebas Neue",
    weight: 400,
  },
] as const satisfies readonly TextFontOption[];

const DEFAULT_CIRCUIT_TUNING: CircuitTuning = {
  channelGateInsetCells: 6,
  channelGateStepCells: 2,
  channelLaneBaseOffsetCells: 7,
  channelLaneCount: 20,
  channelLanePitchCells: 4,
  edgeFanoutInsetCells: 16,
  innerRouteSidePattern: [
    "right",
    "top",
    "bottom",
    "left",
    "top",
    "right",
    "bottom",
    "left",
  ],
  innerTerminalShare: 1,
  isoDepth: 1.05,
  isoDepthVariance: 0.62,
  isoLift: -18,
  isoPerspective: 1250,
  isoPitch: 58,
  isoScale: 0.82,
  isoShadow: 0.9,
  isoYaw: -42,
  maxTerminalPads: 1800,
  minTerminalPads: 300,
  padSpacingCells: 2,
  planLongEdge: 1200,
  pulseCount: 10,
  pulseDetail: 2,
  pulseIntensity: 0.75,
  pulseLength: 1.2,
  pulseLengthVariance: 0.55,
  pulsePearl: 1,
  pulseSpeedVariance: 0.35,
  pulseSpeed: 1,
  pulseWidth: 0.9,
  routingCellSize: 3,
  sideOriginFractionMax: 0.975,
  sideOriginFractionMin: 0.025,
  systemRippleCount: 4,
  systemRippleFeather: 2.5,
  systemRippleIntensity: 0.1,
  systemRippleLength: 2.5,
  systemRipplePearl: 0.85,
  systemPadPulseDecay: 0.45,
  systemPadPulseIntensity: 1.8,
  systemPadPulseSize: 0.35,
  systemRippleSharpness: 0.45,
  systemRippleSpeed: 0.65,
  systemRippleSpread: 1.85,
  systemRippleStart: 0,
  systemRippleWidth: 2.2,
  terminalDensityMultiplier: 4,
  theme: AURORA_THEME,
  textFontKey: "circuit-mono",
  textGlyphMaxCols: 420,
  textGlyphRows: 48,
  textHeightShare: 0.68,
  textWidthShare: 0.46,
  traceWidthInner: [0.19, 0.29],
  traceWidthOuter: [0.15, 0.25],
};

const PRESET_BASE_CIRCUIT_TUNING: CircuitTuning = {
  ...DEFAULT_CIRCUIT_TUNING,
  innerTerminalShare: 0.6,
  padSpacingCells: 1,
  planLongEdge: PLAN_LONG_EDGE,
  pulseCount: 2,
  pulseDetail: 1,
  pulseIntensity: 1.5,
  pulseLength: 1.2,
  pulseLengthVariance: 0.55,
  pulsePearl: 0.7,
  pulseSpeedVariance: 0.35,
  pulseSpeed: 1,
  pulseWidth: 1.15,
  routingCellSize: 7,
  textGlyphMaxCols: DYNAMIC_GLYPH_MAX_COLS,
  textGlyphRows: DYNAMIC_GLYPH_ROWS,
  traceWidthInner: [0.31, 0.41],
  traceWidthOuter: [0.27, 0.37],
};

function applySharedPresetDefaults(tuning: CircuitTuning): CircuitTuning {
  return {
    ...tuning,
    innerTerminalShare: DEFAULT_CIRCUIT_TUNING.innerTerminalShare,
    padSpacingCells: DEFAULT_CIRCUIT_TUNING.padSpacingCells,
    planLongEdge: DEFAULT_CIRCUIT_TUNING.planLongEdge,
    pulseCount: DEFAULT_CIRCUIT_TUNING.pulseCount,
    pulseDetail: DEFAULT_CIRCUIT_TUNING.pulseDetail,
    pulseIntensity: DEFAULT_CIRCUIT_TUNING.pulseIntensity,
    pulseLength: DEFAULT_CIRCUIT_TUNING.pulseLength,
    pulseLengthVariance: DEFAULT_CIRCUIT_TUNING.pulseLengthVariance,
    pulsePearl: DEFAULT_CIRCUIT_TUNING.pulsePearl,
    pulseSpeedVariance: DEFAULT_CIRCUIT_TUNING.pulseSpeedVariance,
    pulseSpeed: DEFAULT_CIRCUIT_TUNING.pulseSpeed,
    pulseWidth: DEFAULT_CIRCUIT_TUNING.pulseWidth,
    routingCellSize: DEFAULT_CIRCUIT_TUNING.routingCellSize,
    terminalDensityMultiplier: DEFAULT_CIRCUIT_TUNING.terminalDensityMultiplier,
    textFontKey: DEFAULT_CIRCUIT_TUNING.textFontKey,
    textGlyphMaxCols: DEFAULT_CIRCUIT_TUNING.textGlyphMaxCols,
    textGlyphRows: DEFAULT_CIRCUIT_TUNING.textGlyphRows,
    traceWidthInner: [...DEFAULT_CIRCUIT_TUNING.traceWidthInner],
    traceWidthOuter: [...DEFAULT_CIRCUIT_TUNING.traceWidthOuter],
  };
}

const INSANE_CIRCUIT_TUNING: CircuitTuning = {
  ...PRESET_BASE_CIRCUIT_TUNING,
  channelGateStepCells: 1,
  channelLaneCount: 16,
  innerTerminalShare: 1,
  padSpacingCells: 1,
  pulseCount: 3,
  pulseDetail: 1.25,
  pulseIntensity: 1,
  pulsePearl: 0.92,
  pulseSpeed: 1.28,
  pulseWidth: 1.25,
  systemRippleCount: 3,
  systemRippleFeather: 1.18,
  systemRippleIntensity: 0.96,
  systemRippleLength: 1.28,
  systemRipplePearl: 0.94,
  systemPadPulseDecay: 0.44,
  systemPadPulseIntensity: 1.08,
  systemPadPulseSize: 1.12,
  systemRippleSharpness: 0.86,
  systemRippleSpeed: 1.16,
  systemRippleSpread: 0.86,
  systemRippleStart: 0,
  systemRippleWidth: 1.08,
  terminalDensityMultiplier: 4,
  traceWidthInner: [0.21, 0.31],
  traceWidthOuter: [0.17, 0.27],
};

type CircuitPreset = {
  id: string;
  name: string;
  tuning: CircuitTuning;
};

const CIRCUIT_PRESETS: [CircuitPreset, ...CircuitPreset[]] = [
  {
    id: AURORA_THEME.id,
    name: AURORA_THEME.name,
    tuning: applySharedPresetDefaults(DEFAULT_CIRCUIT_TUNING),
  },
  {
    id: EMBER_THEME.id,
    name: EMBER_THEME.name,
    tuning: applySharedPresetDefaults({
      ...PRESET_BASE_CIRCUIT_TUNING,
      channelGateInsetCells: 7,
      channelLaneBaseOffsetCells: 6,
      channelLaneCount: 10,
      channelLanePitchCells: 3,
      innerTerminalShare: 0.4,
      padSpacingCells: 2,
      pulseCount: 2,
      pulseDetail: 0.7,
      pulseIntensity: 1.15,
      pulsePearl: 0.55,
      pulseSpeed: 0.62,
      pulseWidth: 1.65,
      systemRippleCount: 2,
      systemRippleFeather: 1.9,
      systemRippleIntensity: 0.92,
      systemRippleLength: 1.72,
      systemRipplePearl: 0.72,
      systemPadPulseDecay: 0.58,
      systemPadPulseIntensity: 1.36,
      systemPadPulseSize: 1.42,
      systemRippleSharpness: 0.68,
      systemRippleSpeed: 0.7,
      systemRippleSpread: 1.35,
      systemRippleWidth: 1.45,
      terminalDensityMultiplier: 2.2,
      theme: EMBER_THEME,
      traceWidthInner: [0.34, 0.44],
      traceWidthOuter: [0.28, 0.38],
    }),
  },
  {
    id: VIOLET_THEME.id,
    name: VIOLET_THEME.name,
    tuning: applySharedPresetDefaults({
      ...INSANE_CIRCUIT_TUNING,
      channelGateInsetCells: 4,
      channelLaneCount: 20,
      channelLanePitchCells: 1,
      pulseCount: 5,
      pulseDetail: 1.75,
      pulseIntensity: 1.42,
      pulsePearl: 1,
      pulseSpeed: 1.72,
      pulseWidth: 1.18,
      systemRippleCount: 4,
      systemRippleFeather: 1.25,
      systemRippleIntensity: 1.28,
      systemRippleLength: 1.08,
      systemRipplePearl: 1,
      systemPadPulseDecay: 0.36,
      systemPadPulseIntensity: 1.72,
      systemPadPulseSize: 1.08,
      systemRippleSharpness: 1.2,
      systemRippleSpeed: 1.72,
      systemRippleSpread: 0.68,
      systemRippleWidth: 0.82,
      terminalDensityMultiplier: 4,
      theme: VIOLET_THEME,
      traceWidthInner: [0.17, 0.25],
      traceWidthOuter: [0.13, 0.21],
    }),
  },
  {
    id: BLUEPRINT_THEME.id,
    name: BLUEPRINT_THEME.name,
    tuning: applySharedPresetDefaults({
      ...PRESET_BASE_CIRCUIT_TUNING,
      channelGateInsetCells: 8,
      channelGateStepCells: 2,
      channelLaneBaseOffsetCells: 3,
      channelLaneCount: 14,
      channelLanePitchCells: 4,
      innerRouteSidePattern: ["left", "right", "top", "bottom"],
      innerTerminalShare: 0.55,
      maxTerminalPads: 1300,
      padSpacingCells: 2,
      pulseCount: 1,
      pulseDetail: 0.55,
      pulseIntensity: 0.72,
      pulsePearl: 0.38,
      pulseSpeed: 0.48,
      pulseWidth: 0.78,
      systemRippleCount: 1,
      systemRippleFeather: 0.75,
      systemRippleIntensity: 0.62,
      systemRippleLength: 0.55,
      systemRipplePearl: 0.42,
      systemPadPulseDecay: 0.22,
      systemPadPulseIntensity: 0.68,
      systemPadPulseSize: 0.72,
      systemRippleSharpness: 1.82,
      systemRippleSpeed: 0.55,
      systemRippleSpread: 1,
      systemRippleWidth: 0.58,
      terminalDensityMultiplier: 2.7,
      theme: BLUEPRINT_THEME,
      traceWidthInner: [0.24, 0.32],
      traceWidthOuter: [0.19, 0.27],
    }),
  },
  {
    id: GHOST_THEME.id,
    name: GHOST_THEME.name,
    tuning: applySharedPresetDefaults({
      ...PRESET_BASE_CIRCUIT_TUNING,
      channelGateInsetCells: 6,
      channelLaneBaseOffsetCells: 5,
      channelLaneCount: 8,
      channelLanePitchCells: 4,
      innerTerminalShare: 0.28,
      maxTerminalPads: 900,
      padSpacingCells: 3,
      pulseCount: 1,
      pulseDetail: 0.45,
      pulseIntensity: 0.36,
      pulsePearl: 0.18,
      pulseSpeed: 0.42,
      pulseWidth: 0.56,
      systemRippleCount: 1,
      systemRippleFeather: 2.2,
      systemRippleIntensity: 0.34,
      systemRippleLength: 2.05,
      systemRipplePearl: 0.18,
      systemPadPulseDecay: 0.76,
      systemPadPulseIntensity: 0.38,
      systemPadPulseSize: 0.58,
      systemRippleSharpness: 0.52,
      systemRippleSpeed: 0.36,
      systemRippleSpread: 1.65,
      systemRippleWidth: 1.72,
      terminalDensityMultiplier: 1.45,
      theme: GHOST_THEME,
      traceWidthInner: [0.16, 0.22],
      traceWidthOuter: [0.12, 0.18],
    }),
  },
  {
    id: ACID_THEME.id,
    name: ACID_THEME.name,
    tuning: applySharedPresetDefaults({
      ...PRESET_BASE_CIRCUIT_TUNING,
      channelGateInsetCells: 3,
      channelLaneBaseOffsetCells: 2,
      channelLaneCount: 18,
      channelLanePitchCells: 2,
      innerRouteSidePattern: ["bottom", "right", "top", "left", "bottom"],
      innerTerminalShare: 0.92,
      maxTerminalPads: 1800,
      padSpacingCells: 1,
      pulseCount: 4,
      pulseDetail: 1.5,
      pulseIntensity: 1.5,
      pulsePearl: 0.98,
      pulseSpeed: 2.15,
      pulseWidth: 2.05,
      systemRippleCount: 4,
      systemRippleFeather: 2.35,
      systemRippleIntensity: 1.18,
      systemRippleLength: 1.85,
      systemRipplePearl: 0.96,
      systemPadPulseDecay: 0.66,
      systemPadPulseIntensity: 1.8,
      systemPadPulseSize: 1.78,
      systemRippleSharpness: 0.58,
      systemRippleSpeed: 2.2,
      systemRippleSpread: 1.7,
      systemRippleStart: 0.12,
      systemRippleWidth: 1.85,
      terminalDensityMultiplier: 3.7,
      theme: ACID_THEME,
      traceWidthInner: [0.25, 0.37],
      traceWidthOuter: [0.21, 0.31],
    }),
  },
];
function getCircuitPreset(id: string) {
  return (
    CIRCUIT_PRESETS.find((preset) => preset.id === id) ?? CIRCUIT_PRESETS[0]
  );
}

const PIXEL_GLYPHS: Record<string, string[]> = {
  C: [
    "001111110",
    "011111110",
    "111000000",
    "110000000",
    "110000000",
    "110000000",
    "110000000",
    "110000000",
    "110000000",
    "110000000",
    "111000000",
    "011111110",
    "001111110",
  ],
  G: [
    "001111100",
    "011111110",
    "111000000",
    "110000000",
    "110000000",
    "110011111",
    "110011111",
    "110000011",
    "110000011",
    "110000011",
    "111000111",
    "011111110",
    "001111100",
  ],
  X: [
    "110000011",
    "111000111",
    "011101110",
    "001111100",
    "000111000",
    "000111000",
    "000010000",
    "000111000",
    "000111000",
    "001111100",
    "011101110",
    "111000111",
    "110000011",
  ],
};
const DYNAMIC_GLYPH_CACHE = new Map<string, string[]>();

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function makeRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function getRenderableText(text: string) {
  const trimmed = text.trim();

  return trimmed.length > 0 ? trimmed : DEFAULT_WORD;
}

const RESOLVED_TEXT_FONT_FAMILIES = new Map<TextFontKey, string>();
const REQUESTED_TEXT_FONT_LOADS = new Set<string>();

function getTextFontOption(id: TextFontKey): TextFontOption {
  return (
    TEXT_FONT_OPTIONS.find((option) => option.id === id) ?? TEXT_FONT_OPTIONS[0]
  );
}

function resolveTextFontFamily(option: TextFontOption) {
  if (!option.cssVariable || typeof document === "undefined") {
    return option.fallbackStack;
  }

  const cached = RESOLVED_TEXT_FONT_FAMILIES.get(option.id);

  if (cached) {
    return cached;
  }

  const probe = document.createElement("span");
  probe.style.fontFamily = `var(${option.cssVariable}), ${option.fallbackStack}`;
  probe.style.fontSize = "12px";
  probe.style.left = "-9999px";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.textContent = "Circuitous";
  document.body.appendChild(probe);
  const resolved = window.getComputedStyle(probe).fontFamily;
  probe.remove();
  const family = resolved || option.fallbackStack;
  RESOLVED_TEXT_FONT_FAMILIES.set(option.id, family);

  return family;
}

function getCanvasTextFont(option: TextFontOption, fontSize: number) {
  return `${option.weight} ${fontSize}px ${resolveTextFontFamily(option)}`;
}

function requestCanvasTextFont(option: TextFontOption, font: string) {
  if (!option.cssVariable || typeof document === "undefined" || !document.fonts) {
    return true;
  }

  const isLoaded = document.fonts.check(font);

  if (!isLoaded && !REQUESTED_TEXT_FONT_LOADS.has(font)) {
    REQUESTED_TEXT_FONT_LOADS.add(font);
    void document.fonts
      .load(font)
      .then(() => {
        DYNAMIC_GLYPH_CACHE.clear();
        window.dispatchEvent(new Event(TEXT_FONT_LOAD_EVENT));
      })
      .catch(() => {
        REQUESTED_TEXT_FONT_LOADS.delete(font);
      });
  }

  return isLoaded;
}

function trimGlyph(glyph: string[]) {
  let top = glyph.length;
  let bottom = -1;
  let left = Number.POSITIVE_INFINITY;
  let right = -1;

  for (let row = 0; row < glyph.length; row += 1) {
    const line = glyph[row];

    for (let col = 0; col < line.length; col += 1) {
      if (line[col] !== "1") {
        continue;
      }

      top = Math.min(top, row);
      bottom = Math.max(bottom, row);
      left = Math.min(left, col);
      right = Math.max(right, col);
    }
  }

  if (bottom < top || right < left) {
    return PIXEL_GLYPHS[DEFAULT_WORD];
  }

  return glyph
    .slice(top, bottom + 1)
    .map((line) => line.slice(left, right + 1));
}

function makeDynamicGlyph(text: string, tuning: CircuitTuning) {
  const renderText = getRenderableText(text);
  const glyphRows = Math.round(clamp(tuning.textGlyphRows, 8, 64));
  const glyphMaxCols = Math.round(clamp(tuning.textGlyphMaxCols, 40, 520));
  const fontOption = getTextFontOption(tuning.textFontKey);
  const cacheKey = `${renderText}:${glyphRows}:${glyphMaxCols}:${fontOption.id}`;
  const cached = DYNAMIC_GLYPH_CACHE.get(cacheKey);

  if (cached) {
    return cached;
  }

  if (typeof document === "undefined") {
    return PIXEL_GLYPHS[DEFAULT_WORD];
  }

  const measuringCanvas = document.createElement("canvas");
  const measuringContext = measuringCanvas.getContext("2d");

  if (!measuringContext) {
    return PIXEL_GLYPHS[DEFAULT_WORD];
  }

  const fontSize = 96;
  const font = getCanvasTextFont(fontOption, fontSize);
  const fontLoaded = requestCanvasTextFont(fontOption, font);
  measuringContext.font = font;
  measuringContext.textBaseline = "alphabetic";
  const metrics = measuringContext.measureText(renderText);
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.78;
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.22;
  const leftBearing = metrics.actualBoundingBoxLeft || 0;
  const rightBearing = metrics.actualBoundingBoxRight || metrics.width;
  const padding = 10;
  const canvasWidth = Math.max(
    1,
    Math.ceil(leftBearing + rightBearing + padding * 2),
  );
  const canvasHeight = Math.max(1, Math.ceil(ascent + descent + padding * 2));
  measuringCanvas.width = canvasWidth;
  measuringCanvas.height = canvasHeight;

  const context = measuringCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context) {
    return PIXEL_GLYPHS[DEFAULT_WORD];
  }

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = "white";
  context.font = font;
  context.textBaseline = "alphabetic";
  context.fillText(renderText, padding + leftBearing, padding + ascent);

  const image = context.getImageData(0, 0, canvasWidth, canvasHeight).data;
  const targetRows = glyphRows;
  const targetCols = Math.round(clamp(
    Math.ceil((canvasWidth / canvasHeight) * targetRows),
    5,
    glyphMaxCols,
  ));
  const rows: string[] = [];

  for (let row = 0; row < targetRows; row += 1) {
    let line = "";
    const yStart = Math.floor((row / targetRows) * canvasHeight);
    const yEnd = Math.max(
      yStart + 1,
      Math.ceil(((row + 1) / targetRows) * canvasHeight),
    );

    for (let col = 0; col < targetCols; col += 1) {
      const xStart = Math.floor((col / targetCols) * canvasWidth);
      const xEnd = Math.max(
        xStart + 1,
        Math.ceil(((col + 1) / targetCols) * canvasWidth),
      );
      let alphaTotal = 0;
      let maxAlpha = 0;
      let samples = 0;

      for (let y = yStart; y < yEnd; y += 1) {
        for (let x = xStart; x < xEnd; x += 1) {
          const alpha = image[(y * canvasWidth + x) * 4 + 3] ?? 0;
          alphaTotal += alpha;
          maxAlpha = Math.max(maxAlpha, alpha);
          samples += 1;
        }
      }

      const coverage = alphaTotal / Math.max(1, samples * 255);
      line += coverage > 0.055 || maxAlpha > 190 ? "1" : "0";
    }

    rows.push(line);
  }

  const glyph = trimGlyph(rows);

  if (fontLoaded || fontOption.usePixelGlyphs) {
    DYNAMIC_GLYPH_CACHE.set(cacheKey, glyph);
  }

  return glyph;
}

function getGlyph(text: string, tuning: CircuitTuning) {
  const renderText = getRenderableText(text);
  const fontOption = getTextFontOption(tuning.textFontKey);
  const predefined = PIXEL_GLYPHS[renderText.toUpperCase()];

  if (fontOption.usePixelGlyphs && predefined && renderText.length === 1) {
    return predefined;
  }

  return makeDynamicGlyph(renderText, tuning);
}

function getRenderPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, RENDER_PIXEL_RATIO_LIMIT);
}

function getTuningKey(tuning: CircuitTuning) {
  return [
    tuning.theme.id,
    tuning.terminalDensityMultiplier.toFixed(2),
    tuning.innerTerminalShare.toFixed(2),
    tuning.channelLaneCount,
    tuning.channelLaneBaseOffsetCells,
    tuning.channelLanePitchCells,
    tuning.channelGateStepCells,
    tuning.channelGateInsetCells,
    tuning.edgeFanoutInsetCells,
    tuning.padSpacingCells,
    tuning.maxTerminalPads,
    tuning.planLongEdge,
    tuning.sideOriginFractionMin.toFixed(3),
    tuning.sideOriginFractionMax.toFixed(3),
    tuning.routingCellSize,
    tuning.textFontKey,
    tuning.textGlyphRows,
    tuning.textGlyphMaxCols,
    tuning.textWidthShare.toFixed(2),
    tuning.textHeightShare.toFixed(2),
    tuning.isoDepth.toFixed(2),
    tuning.isoDepthVariance.toFixed(2),
    tuning.traceWidthOuter[0].toFixed(2),
  ].join(":");
}

function getPlanDimensions(
  width: number,
  height: number,
  text: string,
  tuning: CircuitTuning,
) {
  const renderText = getRenderableText(text);
  const aspect = clamp(width / Math.max(1, height), PLAN_MIN_ASPECT, PLAN_MAX_ASPECT);
  const bucketedAspect = clamp(
    Math.round(aspect / PLAN_ASPECT_STEP) * PLAN_ASPECT_STEP,
    PLAN_MIN_ASPECT,
    PLAN_MAX_ASPECT,
  );
  const planLongEdge = Math.round(clamp(tuning.planLongEdge, 420, 1440));
  const planWidth =
    bucketedAspect >= 1
      ? planLongEdge
      : Math.round(planLongEdge * bucketedAspect);
  const planHeight =
    bucketedAspect >= 1
      ? Math.round(planLongEdge / bucketedAspect)
      : planLongEdge;

  return {
    height: planHeight,
    key: `${renderText}:${planWidth}x${planHeight}:${getTuningKey(tuning)}`,
    width: planWidth,
  };
}

function makeTextDistanceField(
  blocked: Uint8Array,
  cols: number,
  rows: number,
) {
  const distance = new Float32Array(cols * rows);
  const infinity = cols + rows;

  for (let index = 0; index < distance.length; index += 1) {
    distance[index] = blocked[index] ? 0 : infinity;
  }

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const index = y * cols + x;
      let value = distance[index];

      if (x > 0) {
        value = Math.min(value, distance[index - 1] + 1);
      }

      if (y > 0) {
        value = Math.min(value, distance[index - cols] + 1);

        if (x > 0) {
          value = Math.min(value, distance[index - cols - 1] + Math.SQRT2);
        }

        if (x < cols - 1) {
          value = Math.min(value, distance[index - cols + 1] + Math.SQRT2);
        }
      }

      distance[index] = value;
    }
  }

  for (let y = rows - 1; y >= 0; y -= 1) {
    for (let x = cols - 1; x >= 0; x -= 1) {
      const index = y * cols + x;
      let value = distance[index];

      if (x < cols - 1) {
        value = Math.min(value, distance[index + 1] + 1);
      }

      if (y < rows - 1) {
        value = Math.min(value, distance[index + cols] + 1);

        if (x > 0) {
          value = Math.min(value, distance[index + cols - 1] + Math.SQRT2);
        }

        if (x < cols - 1) {
          value = Math.min(value, distance[index + cols + 1] + Math.SQRT2);
        }
      }

      distance[index] = value;
    }
  }

  let maxDistance = 1;

  for (let index = 0; index < distance.length; index += 1) {
    if (distance[index] < infinity) {
      maxDistance = Math.max(maxDistance, distance[index]);
    }
  }

  return { distance, maxDistance };
}

function buildTextField(
  width: number,
  height: number,
  text: string,
  tuning: CircuitTuning,
): RoutingField {
  const renderText = getRenderableText(text);
  const cell = Math.round(clamp(tuning.routingCellSize, 3, 10));
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const mask = document.createElement("canvas");
  const sampleScale = 0.5;
  mask.width = Math.max(1, Math.floor(width * sampleScale));
  mask.height = Math.max(1, Math.floor(height * sampleScale));

  const context = mask.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas text mask context is unavailable.");
  }

  const glyph = getGlyph(renderText, tuning);
  const glyphRows = glyph.length;
  const glyphCols = glyph[0].length;
  const pixelSize = Math.max(
    2,
    Math.floor(
      Math.min(
        (width * tuning.textWidthShare) / glyphCols,
        (height * tuning.textHeightShare) / glyphRows,
      ),
    ),
  );
  const glyphWidth = pixelSize * glyphCols;
  const glyphHeight = pixelSize * glyphRows;
  const left = width / 2 - glyphWidth / 2;
  const top = height / 2 - glyphHeight / 2;
  context.clearRect(0, 0, mask.width, mask.height);
  context.fillStyle = "white";

  for (let row = 0; row < glyphRows; row += 1) {
    for (let col = 0; col < glyphCols; col += 1) {
      if (glyph[row][col] !== "1") {
        continue;
      }

      context.fillRect(
        (left + col * pixelSize) * sampleScale,
        (top + row * pixelSize) * sampleScale,
        pixelSize * sampleScale,
        pixelSize * sampleScale,
      );
    }
  }

  const image = context.getImageData(0, 0, mask.width, mask.height).data;
  const textCells = new Uint8Array(cols * rows);
  const blocked = new Uint8Array(cols * rows);
  const nearText = new Uint8Array(cols * rows);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      let hits = 0;

      for (let sy = 0; sy < 3; sy += 1) {
        for (let sx = 0; sx < 3; sx += 1) {
          const px = clamp(
            Math.floor((x + (sx + 0.5) / 3) * cell * sampleScale),
            0,
            mask.width - 1,
          );
          const py = clamp(
            Math.floor((y + (sy + 0.5) / 3) * cell * sampleScale),
            0,
            mask.height - 1,
          );
          const alpha = image[(py * mask.width + px) * 4 + 3];
          if (alpha > 28) {
            hits += 1;
          }
        }
      }

      if (hits > 0) {
        textCells[y * cols + x] = 1;
      }
    }
  }

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const sourceIndex = y * cols + x;

      if (!textCells[sourceIndex]) {
        continue;
      }

      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const nx = x + ox;
          const ny = y + oy;

          if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) {
            blocked[ny * cols + nx] = 1;
          }
        }
      }
    }
  }

  const textDistanceField = makeTextDistanceField(blocked, cols, rows);
  const contour: Cell[] = [];

  for (let y = 1; y < rows - 1; y += 1) {
    for (let x = 1; x < cols - 1; x += 1) {
      const index = y * cols + x;

      if (blocked[index]) {
        continue;
      }

      let nearest = 0;

      for (let radius = 1; radius <= 6; radius += 1) {
        let found = false;

        for (let oy = -radius; oy <= radius; oy += 1) {
          for (let ox = -radius; ox <= radius; ox += 1) {
            if (Math.abs(ox) !== radius && Math.abs(oy) !== radius) {
              continue;
            }

            const nx = x + ox;
            const ny = y + oy;

            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) {
              continue;
            }

            if (blocked[ny * cols + nx]) {
              nearest = 7 - radius;
              found = true;
              break;
            }
          }

          if (found) {
            break;
          }
        }

        if (found) {
          break;
        }
      }

      nearText[index] = nearest;

      if (nearest >= 5) {
        contour.push({ x, y });
      }
    }
  }

  return {
    blocked,
    cell,
    cols,
    contour,
    height,
    nearText,
    rows,
    textDistance: textDistanceField.distance,
    textDistanceMax: textDistanceField.maxDistance,
    textLayout: {
      fontSize: glyphHeight,
      glyph,
      left,
      text: renderText,
      textWidth: glyphWidth,
      top,
    },
    width,
  };
}

function cellToPoint(field: RoutingField, cell: Cell): Point {
  return {
    x: (cell.x + 0.5) * field.cell,
    y: (cell.y + 0.5) * field.cell,
  };
}

function pointDistance(a: Point, b: Point) {
  const x = b.x - a.x;
  const y = b.y - a.y;
  return Math.hypot(x, y);
}

function routeLength(points: Point[]) {
  let length = 0;

  for (let index = 1; index < points.length; index += 1) {
    length += pointDistance(points[index - 1], points[index]);
  }

  return length;
}

function simplifyPath(field: RoutingField, path: Cell[]) {
  if (path.length <= 2) {
    return path.map((cell) => cellToPoint(field, cell));
  }

  const points: Point[] = [];
  let previousDirection = "";

  for (let index = 0; index < path.length; index += 1) {
    const previous = path[index - 1];
    const current = path[index];
    const next = path[index + 1];

    if (!previous || !next) {
      points.push(cellToPoint(field, current));
      continue;
    }

    const direction = `${Math.sign(next.x - current.x)},${Math.sign(
      next.y - current.y,
    )}`;

    if (direction !== previousDirection) {
      points.push(cellToPoint(field, current));
    }

    previousDirection = `${Math.sign(current.x - previous.x)},${Math.sign(
      current.y - previous.y,
    )}`;
  }

  return points;
}

class MinHeap {
  private heap: number[] = [];

  private priorities: number[] = [];

  push(value: number, priority: number) {
    this.heap.push(value);
    this.priorities.push(priority);
    this.bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) {
      return null;
    }

    const value = this.heap[0];
    const endValue = this.heap.pop();
    const endPriority = this.priorities.pop();

    if (
      this.heap.length > 0 &&
      endValue !== undefined &&
      endPriority !== undefined
    ) {
      this.heap[0] = endValue;
      this.priorities[0] = endPriority;
      this.sinkDown(0);
    }

    return value;
  }

  private bubbleUp(index: number) {
    const value = this.heap[index];
    const priority = this.priorities[index];

    while (index > 0) {
      const parentIndex = Math.floor((index + 1) / 2) - 1;
      const parentPriority = this.priorities[parentIndex];

      if (priority >= parentPriority) {
        break;
      }

      this.heap[index] = this.heap[parentIndex];
      this.priorities[index] = parentPriority;
      index = parentIndex;
    }

    this.heap[index] = value;
    this.priorities[index] = priority;
  }

  private sinkDown(index: number) {
    const length = this.heap.length;
    const value = this.heap[index];
    const priority = this.priorities[index];

    while (true) {
      const child2Index = (index + 1) * 2;
      const child1Index = child2Index - 1;
      let swapIndex: number | null = null;
      let child1Priority = 0;

      if (child1Index < length) {
        child1Priority = this.priorities[child1Index];
        if (child1Priority < priority) {
          swapIndex = child1Index;
        }
      }

      if (child2Index < length) {
        const child2Priority = this.priorities[child2Index];
        if (
          child2Priority < (swapIndex === null ? priority : child1Priority)
        ) {
          swapIndex = child2Index;
        }
      }

      if (swapIndex === null) {
        break;
      }

      this.heap[index] = this.heap[swapIndex];
      this.priorities[index] = this.priorities[swapIndex];
      index = swapIndex;
    }

    this.heap[index] = value;
    this.priorities[index] = priority;
  }
}

function boardIndex(field: RoutingField, x: number, y: number) {
  return y * field.cols + x;
}

function getLetterCenter(field: RoutingField) {
  return {
    x: (field.textLayout.left + field.textLayout.textWidth / 2) / field.cell,
    y: (field.textLayout.top + field.textLayout.fontSize / 2) / field.cell,
  };
}

function getLetterBounds(field: RoutingField) {
  return {
    bottom: Math.ceil(
      (field.textLayout.top + field.textLayout.fontSize) / field.cell,
    ),
    left: Math.floor(field.textLayout.left / field.cell),
    right: Math.ceil(
      (field.textLayout.left + field.textLayout.textWidth) / field.cell,
    ),
    top: Math.floor(field.textLayout.top / field.cell),
  };
}

function isInnerLetterEdge(field: RoutingField, cell: Cell) {
  const bounds = getLetterBounds(field);

  return (
    cell.x > bounds.left + 1 &&
    cell.x < bounds.right - 1 &&
    cell.y > bounds.top + 1 &&
    cell.y < bounds.bottom - 1
  );
}

function isGlyphFilled(glyph: string[], row: number, col: number) {
  return glyph[row]?.[col] === "1";
}

function edgeNormal(side: EdgeSide): Cell {
  if (side === "left") {
    return { x: -1, y: 0 };
  }

  if (side === "right") {
    return { x: 1, y: 0 };
  }

  if (side === "top") {
    return { x: 0, y: -1 };
  }

  return { x: 0, y: 1 };
}

function isVerticalEdge(side: EdgeSide) {
  return side === "left" || side === "right";
}

function comparePads(a: PadCandidate, b: PadCandidate) {
  const sideOrder: Record<EdgeSide, number> = {
    top: 0,
    right: 1,
    bottom: 2,
    left: 3,
  };

  return (
    sideOrder[a.edgeSide] - sideOrder[b.edgeSide] ||
    a.minor - b.minor ||
    a.major - b.major ||
    a.cell.y - b.cell.y ||
    a.cell.x - b.cell.x
  );
}

function findPadCellOnEdge(
  field: RoutingField,
  base: Cell,
  normal: Cell,
) {
  for (let step = 1; step <= 8; step += 1) {
    const cell = {
      x: clamp(base.x + normal.x * step, 1, field.cols - 2),
      y: clamp(base.y + normal.y * step, 1, field.rows - 2),
    };
    const index = boardIndex(field, cell.x, cell.y);

    if (!field.blocked[index] && field.nearText[index] > 0) {
      return cell;
    }
  }

  return null;
}

function buildGlyphPadCandidates(
  field: RoutingField,
  padPitchCells: number,
) {
  const glyph = field.textLayout.glyph;
  const glyphRows = glyph.length;
  const glyphCols = glyph[0].length;
  const pixelSize = field.textLayout.textWidth / glyphCols;
  const pitchCells = Math.max(1, Math.round(padPitchCells));
  const candidates: PadCandidate[] = [];
  const used = new Set<string>();

  const addRun = (
    side: EdgeSide,
    edgeX: number,
    edgeY: number,
    runStart: number,
    runEnd: number,
  ) => {
    const normal = edgeNormal(side);
    const vertical = isVerticalEdge(side);
    const startCell = Math.ceil(runStart / field.cell);
    const endCell = Math.floor(runEnd / field.cell);
    const firstSlot = Math.ceil(startCell / pitchCells) * pitchCells;

    for (let major = firstSlot; major <= endCell; major += pitchCells) {
      const base = vertical
        ? { x: Math.round(edgeX / field.cell), y: major }
        : { x: major, y: Math.round(edgeY / field.cell) };
      const cell = findPadCellOnEdge(field, base, normal);

      if (!cell) {
        continue;
      }

      const key = `${cell.x},${cell.y}`;

      if (used.has(key)) {
        continue;
      }

      used.add(key);
      candidates.push({
        cell,
        edgeSide: side,
        kind: isInnerLetterEdge(field, cell) ? "inner" : "outer",
        major,
        minor: vertical ? cell.x : cell.y,
      });
    }
  };

  for (let row = 0; row < glyphRows; row += 1) {
    for (let col = 0; col < glyphCols; col += 1) {
      if (!isGlyphFilled(glyph, row, col)) {
        continue;
      }

      const left = field.textLayout.left + col * pixelSize;
      const right = left + pixelSize;
      const top = field.textLayout.top + row * pixelSize;
      const bottom = top + pixelSize;

      if (!isGlyphFilled(glyph, row, col - 1)) {
        addRun("left", left, top, top, bottom);
      }

      if (!isGlyphFilled(glyph, row, col + 1)) {
        addRun("right", right, top, top, bottom);
      }

      if (!isGlyphFilled(glyph, row - 1, col)) {
        addRun("top", left, top, left, right);
      }

      if (!isGlyphFilled(glyph, row + 1, col)) {
        addRun("bottom", left, bottom, left, right);
      }
    }
  }

  return candidates.sort(comparePads);
}

function chooseOrderedPads(
  candidates: PadCandidate[],
  count: number,
  minDistance: number,
) {
  if (count <= 0 || candidates.length === 0) {
    return [];
  }

  const selected: PadCandidate[] = [];
  const usedIndexes = new Set<number>();

  for (let index = 0; index < count; index += 1) {
    const target = Math.floor((index / count) * candidates.length);
    let chosenIndex = -1;

    for (let offset = 0; offset < candidates.length; offset += 1) {
      const forward = (target + offset) % candidates.length;
      const backward =
        (target - offset + candidates.length) % candidates.length;
      const options = offset === 0 ? [forward] : [forward, backward];

      for (const option of options) {
        if (usedIndexes.has(option)) {
          continue;
        }

        const candidate = candidates[option];
        const tooClose = selected.some(
          (pad) =>
            Math.abs(pad.cell.x - candidate.cell.x) +
              Math.abs(pad.cell.y - candidate.cell.y) <
            minDistance,
        );

        if (!tooClose) {
          chosenIndex = option;
          break;
        }
      }

      if (chosenIndex !== -1) {
        break;
      }
    }

    if (chosenIndex === -1) {
      break;
    }

    usedIndexes.add(chosenIndex);
    selected.push(candidates[chosenIndex]);
  }

  return selected.sort(comparePads);
}

function chooseLetterTerminals(
  field: RoutingField,
  count: number,
  tuning: CircuitTuning,
) {
  const candidates = buildGlyphPadCandidates(field, tuning.padSpacingCells);
  const inner = candidates.filter((candidate) => candidate.kind === "inner");
  const outer = candidates.filter((candidate) => candidate.kind === "outer");
  const targetCount = Math.min(count, candidates.length);
  const innerCoverage = clamp(tuning.innerTerminalShare, 0, 1);
  const innerCount = Math.min(
    inner.length,
    targetCount,
    Math.round(inner.length * innerCoverage),
  );
  const outerCount = Math.min(outer.length, targetCount - innerCount);

  return [
    ...chooseOrderedPads(inner, innerCount, tuning.padSpacingCells),
    ...chooseOrderedPads(outer, outerCount, tuning.padSpacingCells),
  ];
}

function makeTerminalPads(terminals: TerminalSpec[], tuning: CircuitTuning) {
  const palettes = tuning.theme.terminalPalettes;
  return terminals.map((terminal, index) => {
    const palette =
      palettes[
        (index * 5 + (terminal.kind === "inner" ? 1 : 0)) % palettes.length
      ] ?? palettes[0];

    return {
      ...terminal,
      color: palette[0],
      glow: palette[1],
    };
  });
}

function cellOnBoardEdge(
  field: RoutingField,
  side: EdgeSide,
  fraction: number,
) {
  if (side === "left") {
    return {
      x: 1,
      y: clamp(Math.round(fraction * field.rows), 2, field.rows - 3),
    };
  }

  if (side === "right") {
    return {
      x: field.cols - 2,
      y: clamp(Math.round(fraction * field.rows), 2, field.rows - 3),
    };
  }

  if (side === "top") {
    return {
      x: clamp(Math.round(fraction * field.cols), 2, field.cols - 3),
      y: 1,
    };
  }

  return {
    x: clamp(Math.round(fraction * field.cols), 2, field.cols - 3),
    y: field.rows - 2,
  };
}

function sideOrderIndex(side: EdgeSide) {
  const order: Record<EdgeSide, number> = {
    top: 0,
    right: 1,
    bottom: 2,
    left: 3,
  };

  return order[side];
}

function makeSideCounter() {
  return {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  } satisfies Record<EdgeSide, number>;
}

function estimatePadRouteSide(
  pad: TerminalPad,
  index: number,
  tuning: CircuitTuning,
): EdgeSide {
  if (pad.kind === "outer") {
    return pad.edgeSide;
  }

  return tuning.innerRouteSidePattern[
    index % tuning.innerRouteSidePattern.length
  ];
}

function sideFraction(rank: number, total: number, tuning: CircuitTuning) {
  if (total <= 1) {
    return 0.5;
  }

  return lerp(
    tuning.sideOriginFractionMin,
    tuning.sideOriginFractionMax,
    rank / Math.max(1, total - 1),
  );
}

function isOpenRoutingCell(field: RoutingField, x: number, y: number) {
  return (
    x >= 1 &&
    y >= 1 &&
    x < field.cols - 1 &&
    y < field.rows - 1 &&
    !field.blocked[boardIndex(field, x, y)]
  );
}

function canAccessTreeStep(
  field: RoutingField,
  x: number,
  y: number,
  dx: number,
  dy: number,
) {
  const nx = x + dx;
  const ny = y + dy;

  if (!isOpenRoutingCell(field, nx, ny)) {
    return false;
  }

  if (dx === 0 || dy === 0) {
    return true;
  }

  return (
    isOpenRoutingCell(field, x + dx, y) &&
    isOpenRoutingCell(field, x, y + dy)
  );
}

function makeChannelCell(
  field: RoutingField,
  bounds: ReturnType<typeof getLetterBounds>,
  side: EdgeSide,
  lane: number,
  align: Cell,
  tuning: CircuitTuning,
) {
  const offset =
    tuning.channelLaneBaseOffsetCells +
    (lane % tuning.channelLaneCount) * tuning.channelLanePitchCells;

  if (side === "left") {
    return {
      x: clamp(bounds.left - offset, 2, field.cols - 3),
      y: clamp(align.y, 2, field.rows - 3),
    };
  }

  if (side === "right") {
    return {
      x: clamp(bounds.right + offset, 2, field.cols - 3),
      y: clamp(align.y, 2, field.rows - 3),
    };
  }

  if (side === "top") {
    return {
      x: clamp(align.x, 2, field.cols - 3),
      y: clamp(bounds.top - offset, 2, field.rows - 3),
    };
  }

  return {
    x: clamp(align.x, 2, field.cols - 3),
    y: clamp(bounds.bottom + offset, 2, field.rows - 3),
  };
}

function addRoutingGate(
  field: RoutingField,
  gates: RoutingGate[],
  used: Set<string>,
  side: EdgeSide,
  cell: Cell,
) {
  const x = clamp(cell.x, 1, field.cols - 2);
  const y = clamp(cell.y, 1, field.rows - 2);
  const key = `${x},${y}`;

  if (used.has(key) || !isOpenRoutingCell(field, x, y)) {
    return;
  }

  used.add(key);
  gates.push({ cell: { x, y }, side });
}

function staggeredGateInset(baseInset: number, rank: number, side: EdgeSide) {
  return baseInset + ((rank + sideOrderIndex(side) * 2) % 4) * 2;
}

function makeChannelGates(
  field: RoutingField,
  tuning: CircuitTuning,
  onlySide?: EdgeSide,
) {
  const bounds = getLetterBounds(field);
  const gates: RoutingGate[] = [];
  const used = new Set<string>();
  const gateStep = tuning.channelGateStepCells;
  const gateInset = tuning.channelGateInsetCells;
  const yStart = clamp(bounds.top - 6, 1, field.rows - 2);
  const yEnd = clamp(bounds.bottom + 6, 1, field.rows - 2);
  const xStart = clamp(bounds.left - 6, 1, field.cols - 2);
  const xEnd = clamp(bounds.right + 6, 1, field.cols - 2);

  let verticalGateRank = 0;
  for (let y = yStart; y <= yEnd; y += gateStep) {
    if (!onlySide || onlySide === "left") {
      const leftX = clamp(
        bounds.left - staggeredGateInset(gateInset, verticalGateRank, "left"),
        1,
        field.cols - 2,
      );
      addRoutingGate(field, gates, used, "left", { x: leftX, y });
    }

    if (!onlySide || onlySide === "right") {
      const rightX = clamp(
        bounds.right +
          staggeredGateInset(gateInset, verticalGateRank, "right"),
        1,
        field.cols - 2,
      );
      addRoutingGate(field, gates, used, "right", { x: rightX, y });
    }

    verticalGateRank += 1;
  }

  let horizontalGateRank = 0;
  for (let x = xStart; x <= xEnd; x += gateStep) {
    if (!onlySide || onlySide === "top") {
      const topY = clamp(
        bounds.top - staggeredGateInset(gateInset, horizontalGateRank, "top"),
        1,
        field.rows - 2,
      );
      addRoutingGate(field, gates, used, "top", { x, y: topY });
    }

    if (!onlySide || onlySide === "bottom") {
      const bottomY = clamp(
        bounds.bottom +
          staggeredGateInset(gateInset, horizontalGateRank, "bottom"),
        1,
        field.rows - 2,
      );
      addRoutingGate(field, gates, used, "bottom", { x, y: bottomY });
    }

    horizontalGateRank += 1;
  }

  return gates;
}

function buildAccessTree(field: RoutingField, gates: RoutingGate[]) {
  const size = field.cols * field.rows;
  const open = new MinHeap();
  const scores = new Float32Array(size);
  const cameFrom = new Int32Array(size);
  const sourceGate = new Int32Array(size);

  scores.fill(Number.POSITIVE_INFINITY);
  cameFrom.fill(-1);
  sourceGate.fill(-1);

  for (let gateIndex = 0; gateIndex < gates.length; gateIndex += 1) {
    const gate = gates[gateIndex];
    const index = boardIndex(field, gate.cell.x, gate.cell.y);

    scores[index] = 0;
    cameFrom[index] = index;
    sourceGate[index] = gateIndex;
    open.push(index, 0);
  }

  let iterations = 0;

  while (iterations < size * 8) {
    iterations += 1;
    const currentIndex = open.pop();

    if (currentIndex === null) {
      break;
    }

    const x = currentIndex % field.cols;
    const y = Math.floor(currentIndex / field.cols);

    for (const direction of DIRECTIONS) {
      if (
        !canAccessTreeStep(
          field,
          x,
          y,
          direction.x,
          direction.y,
        )
      ) {
        continue;
      }

      const nx = x + direction.x;
      const ny = y + direction.y;
      const nextIndex = boardIndex(field, nx, ny);
      const laneBias = nx % 6 === 0 || ny % 6 === 0 ? -0.05 : 0;
      const keepoutBias = Math.min(0.42, field.nearText[nextIndex] * 0.055);
      const tentativeScore =
        scores[currentIndex] + direction.cost + laneBias + keepoutBias;

      if (tentativeScore >= scores[nextIndex]) {
        continue;
      }

      scores[nextIndex] = tentativeScore;
      cameFrom[nextIndex] = currentIndex;
      sourceGate[nextIndex] = sourceGate[currentIndex];
      open.push(
        nextIndex,
        tentativeScore +
          Math.hypot(field.cols / 2 - nx, field.rows / 2 - ny) * 0.002,
      );
    }
  }

  return { cameFrom, gates, sourceGate };
}

function traceAccessPath(
  field: RoutingField,
  tree: AccessTree,
  start: Cell,
) {
  const startIndex = boardIndex(field, start.x, start.y);
  const gateIndex = tree.sourceGate[startIndex];

  if (gateIndex < 0 || tree.cameFrom[startIndex] < 0) {
    return null;
  }

  const cells: Cell[] = [];
  let cursor = startIndex;

  for (let guard = 0; guard < field.cols * field.rows; guard += 1) {
    cells.push({
      x: cursor % field.cols,
      y: Math.floor(cursor / field.cols),
    });

    const next = tree.cameFrom[cursor];

    if (next === cursor) {
      break;
    }

    if (next < 0) {
      return null;
    }

    cursor = next;
  }

  return {
    cells,
    gate: tree.gates[gateIndex],
  };
}

function findEscapeCell(
  field: RoutingField,
  terminal: Cell,
  side: EdgeSide,
  targetDistance: number,
) {
  const normal = edgeNormal(side);
  let fallback = terminal;

  for (let step = 1; step <= targetDistance + 5; step += 1) {
    const cell = {
      x: clamp(terminal.x + normal.x * step, 1, field.cols - 2),
      y: clamp(terminal.y + normal.y * step, 1, field.rows - 2),
    };

    if (!isOpenRoutingCell(field, cell.x, cell.y)) {
      continue;
    }

    fallback = cell;

    if (step >= targetDistance) {
      return cell;
    }
  }

  return fallback;
}

function compactPoints(points: Point[]) {
  const compacted: Point[] = [];

  for (const point of points) {
    const previous = compacted[compacted.length - 1];

    if (
      previous &&
      Math.abs(previous.x - point.x) < 0.1 &&
      Math.abs(previous.y - point.y) < 0.1
    ) {
      continue;
    }

    compacted.push(point);
  }

  return compacted;
}

function chamferAxisPolyline(points: Point[], amount: number) {
  if (points.length < 3) {
    return compactPoints(points);
  }

  const chamfered: Point[] = [points[0]];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const inX = current.x - previous.x;
    const inY = current.y - previous.y;
    const outX = next.x - current.x;
    const outY = next.y - current.y;
    const inLength = Math.hypot(inX, inY);
    const outLength = Math.hypot(outX, outY);
    const axisIn = Math.abs(inX) < 0.1 || Math.abs(inY) < 0.1;
    const axisOut = Math.abs(outX) < 0.1 || Math.abs(outY) < 0.1;
    const perpendicular =
      axisIn &&
      axisOut &&
      Math.abs(inX * outX + inY * outY) < 0.1 &&
      inLength > amount * 1.8 &&
      outLength > amount * 1.8;

    if (!perpendicular) {
      chamfered.push(current);
      continue;
    }

    const distance = Math.min(amount, inLength * 0.42, outLength * 0.42);

    chamfered.push({
      x: current.x - (inX / inLength) * distance,
      y: current.y - (inY / inLength) * distance,
    });
    chamfered.push({
      x: current.x + (outX / outLength) * distance,
      y: current.y + (outY / outLength) * distance,
    });
  }

  chamfered.push(points[points.length - 1]);
  return compactPoints(chamfered);
}

function edgeFanShift(
  field: RoutingField,
  side: EdgeSide,
  rank: number,
  lane: number,
) {
  const direction = (rank + lane + sideOrderIndex(side)) % 2 === 0 ? -1 : 1;
  const cells = 2 + ((rank * 3 + lane) % 5);

  return direction * cells * field.cell;
}

function makeSideBundlePoints(
  field: RoutingField,
  side: EdgeSide,
  rank: number,
  total: number,
  lane: number,
  target: Cell,
  tuning: CircuitTuning,
) {
  const origin = cellOnBoardEdge(
    field,
    side,
    sideFraction(rank, total, tuning),
  );
  const originPoint = projectOriginToCanvasEdge(
    field,
    origin,
    cellToPoint(field, origin),
  );
  const targetPoint = cellToPoint(field, target);
  const edgeInset = 2 + (lane % 3);
  const edgeFanInset = clamp(
    tuning.edgeFanoutInsetCells + ((rank + lane) % 4),
    edgeInset + 2,
    Math.min(field.cols, field.rows) * 0.34,
  );
  const edgeShift = edgeFanShift(field, side, rank, lane);
  let points: Point[];

  if (side === "left" || side === "right") {
    const fanX =
      side === "left"
        ? field.cell * edgeFanInset
        : field.width - field.cell * edgeFanInset;
    const fanY = clamp(
      originPoint.y + edgeShift,
      field.cell * 1.5,
      field.height - field.cell * 1.5,
    );

    points = [
      originPoint,
      { x: fanX, y: fanY },
      { x: targetPoint.x, y: fanY },
      targetPoint,
    ];
  } else {
    const fanY =
      side === "top"
        ? field.cell * edgeFanInset
        : field.height - field.cell * edgeFanInset;
    const fanX = clamp(
      originPoint.x + edgeShift,
      field.cell * 1.5,
      field.width - field.cell * 1.5,
    );

    points = [
      originPoint,
      { x: fanX, y: fanY },
      { x: fanX, y: targetPoint.y },
      targetPoint,
    ];
  }

  return chamferAxisPolyline(compactPoints(points), field.cell * 1.55);
}

function makeTraceRoute(
  field: RoutingField,
  random: () => number,
  terminalSpec: TerminalPad,
  index: number,
  points: Point[],
  side: EdgeSide,
  tuning: CircuitTuning,
  viaPoints: Point[] = [],
) {
  const routePoints = compactPoints(points);
  const layer = (sideOrderIndex(side) + index) % LAYER_COUNT;
  const length = routeLength(routePoints);
  const terminalKind = terminalSpec.kind;
  const segment = {
    layer,
    path: makePath2D(routePoints),
    points: routePoints,
  };

  return {
    color: terminalSpec.color,
    glow: terminalSpec.glow,
    layer,
    length,
    originPoint: routePoints[0],
    phase: random(),
    points: routePoints,
    segments: [segment],
    speed: lerp(0.008, 0.018, random()),
    terminalEdgeSide: terminalSpec.edgeSide,
    terminalKind,
    terminalPoint: cellToPoint(field, terminalSpec.cell),
    viaPoints,
    width:
      terminalKind === "outer"
        ? lerp(
            tuning.traceWidthOuter[0],
            tuning.traceWidthOuter[1],
            random(),
          )
        : lerp(
            tuning.traceWidthInner[0],
            tuning.traceWidthInner[1],
            random(),
          ),
  };
}

function makeBundledRoute(
  field: RoutingField,
  random: () => number,
  terminalSpec: TerminalPad,
  index: number,
  routeSide: EdgeSide,
  rank: number,
  total: number,
  tuning: CircuitTuning,
  preferredAccessTree: AccessTree,
  accessTree: AccessTree,
) {
  const bounds = getLetterBounds(field);
  const terminalPoint = cellToPoint(field, terminalSpec.cell);
  const lane =
    (rank * 5 + sideOrderIndex(terminalSpec.edgeSide) * 2 + index) %
    tuning.channelLaneCount;
  const escape = findEscapeCell(
    field,
    terminalSpec.cell,
    terminalSpec.edgeSide,
    terminalSpec.kind === "outer" ? 5 : 3,
  );

  if (terminalSpec.kind === "inner") {
    const access =
      traceAccessPath(field, preferredAccessTree, escape) ??
      traceAccessPath(field, accessTree, escape);

    if (access && access.cells.length > 1) {
      const gateCell = access.cells[access.cells.length - 1];
      const side = access.gate.side;
      const bundlePoints = makeSideBundlePoints(
        field,
        side,
        rank,
        total,
        lane,
        gateCell,
        tuning,
      );
      const accessCells = access.cells.slice(0, -1).reverse();
      const accessPoints =
        accessCells.length > 1
          ? simplifyPath(field, accessCells)
          : accessCells.map((cell) => cellToPoint(field, cell));

      return makeTraceRoute(
        field,
        random,
        terminalSpec,
        index,
        [...bundlePoints, ...accessPoints, terminalPoint],
        side,
        tuning,
        [cellToPoint(field, gateCell)],
      );
    }
  }

  const channelCell = makeChannelCell(
    field,
    bounds,
    routeSide,
    lane,
    escape,
    tuning,
  );
  const bundlePoints = makeSideBundlePoints(
    field,
    routeSide,
    rank,
    total,
    lane,
    channelCell,
    tuning,
  );
  const escapePoint = cellToPoint(field, escape);

  return makeTraceRoute(
    field,
    random,
    terminalSpec,
    index,
    [...bundlePoints, escapePoint, terminalPoint],
    routeSide,
    tuning,
  );
}

function projectOriginToCanvasEdge(field: RoutingField, cell: Cell, point: Point) {
  if (cell.x <= 1) {
    return { x: 0, y: point.y };
  }

  if (cell.x >= field.cols - 2) {
    return { x: field.width, y: point.y };
  }

  if (cell.y <= 1) {
    return { x: point.x, y: 0 };
  }

  if (cell.y >= field.rows - 2) {
    return { x: point.x, y: field.height };
  }

  return point;
}

function buildBoardPlan(
  width: number,
  height: number,
  text: string,
  tuning: CircuitTuning,
): BoardPlan {
  const renderText = getRenderableText(text);
  const field = buildTextField(width, height, renderText, tuning);
  const random = makeRandom(
    hashString(`${renderText}:${Math.round(width)}x${Math.round(height)}`),
  );
  const routes: Route[] = [];
  const terminalPadGoal = clamp(
    Math.floor(
      (field.contour.length / 2.05) *
        tuning.terminalDensityMultiplier,
    ),
    tuning.minTerminalPads,
    tuning.maxTerminalPads,
  );
  const candidatePads = makeTerminalPads(
    chooseLetterTerminals(field, terminalPadGoal, tuning),
    tuning,
  );
  const terminalPads: TerminalPad[] = [];
  const sideTotals = makeSideCounter();
  const sideRanks = makeSideCounter();
  const preferredAccessTrees = {
    bottom: buildAccessTree(field, makeChannelGates(field, tuning, "bottom")),
    left: buildAccessTree(field, makeChannelGates(field, tuning, "left")),
    right: buildAccessTree(field, makeChannelGates(field, tuning, "right")),
    top: buildAccessTree(field, makeChannelGates(field, tuning, "top")),
  } satisfies Record<EdgeSide, AccessTree>;
  const accessTree = buildAccessTree(field, makeChannelGates(field, tuning));

  for (let index = 0; index < candidatePads.length; index += 1) {
    const pad = candidatePads[index];

    if (pad) {
      sideTotals[estimatePadRouteSide(pad, index, tuning)] += 1;
    }
  }

  for (let index = 0; index < candidatePads.length; index += 1) {
    const terminalSpec = candidatePads[index];

    if (!terminalSpec) {
      continue;
    }

    const { cell: terminal } = terminalSpec;
    const terminalIndex = terminal.y * field.cols + terminal.x;

    if (field.blocked[terminalIndex]) {
      continue;
    }

    const routeSide = estimatePadRouteSide(terminalSpec, index, tuning);
    const sideRank = sideRanks[routeSide];
    sideRanks[routeSide] += 1;
    const route = makeBundledRoute(
      field,
      random,
      terminalSpec,
      index,
      routeSide,
      sideRank,
      Math.max(1, sideTotals[routeSide]),
      tuning,
      preferredAccessTrees[routeSide],
      accessTree,
    );

    routes.push(route);
    terminalPads.push(terminalSpec);
  }

  return { field, routes, terminalPads };
}

function drawRoundedPath(context: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) {
    return;
  }

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    context.lineTo(current.x, current.y);

    if (Math.abs(next.x - current.x) + Math.abs(next.y - current.y) < 0.1) {
      continue;
    }
  }

  const end = points[points.length - 1];
  context.lineTo(end.x, end.y);
}

function makePath2D(points: Point[]) {
  if (points.length < 2 || typeof Path2D === "undefined") {
    return null;
  }

  const path = new Path2D();
  path.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    path.lineTo(points[index].x, points[index].y);
  }

  return path;
}

function strokeSegmentPath(
  context: CanvasRenderingContext2D,
  segment: RouteSegment,
) {
  if (segment.path) {
    context.stroke(segment.path);
    return;
  }

  drawRoundedPath(context, segment.points);
  context.stroke();
}

function getPointAtLength(points: Point[], target: number) {
  let distance = 0;

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const segmentLength = pointDistance(start, end);

    if (distance + segmentLength >= target) {
      const local = (target - distance) / segmentLength;
      return {
        x: lerp(start.x, end.x, local),
        y: lerp(start.y, end.y, local),
      };
    }

    distance += segmentLength;
  }

  return points[points.length - 1];
}

function forEachLineAtLengthRange(
  points: Point[],
  startTarget: number,
  endTarget: number,
  drawLine: (
    start: Point,
    end: Point,
    startDistance: number,
    endDistance: number,
  ) => void,
  maxLineLength = Number.POSITIVE_INFINITY,
) {
  if (points.length < 2) {
    return false;
  }

  const startDistance = Math.max(0, Math.min(startTarget, endTarget));
  const endDistance = Math.max(startDistance, endTarget);
  let distance = 0;
  let hasLine = false;

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const segmentLength = pointDistance(start, end);

    if (segmentLength <= 0.001) {
      continue;
    }

    const segmentStart = distance;
    const segmentEnd = distance + segmentLength;

    if (segmentEnd <= startDistance) {
      distance = segmentEnd;
      continue;
    }

    if (segmentStart >= endDistance) {
      break;
    }

    const localStartDistance = Math.max(startDistance, segmentStart);
    const localEndDistance = Math.min(endDistance, segmentEnd);

    if (localEndDistance > localStartDistance) {
      const lineLength = localEndDistance - localStartDistance;
      const stepCount =
        Number.isFinite(maxLineLength) && maxLineLength > 0
          ? Math.max(1, Math.ceil(lineLength / maxLineLength))
          : 1;

      for (let step = 0; step < stepCount; step += 1) {
        const stepStartDistance = lerp(
          localStartDistance,
          localEndDistance,
          step / stepCount,
        );
        const stepEndDistance = lerp(
          localStartDistance,
          localEndDistance,
          (step + 1) / stepCount,
        );
        const localStart = (stepStartDistance - segmentStart) / segmentLength;
        const localEnd = (stepEndDistance - segmentStart) / segmentLength;

        drawLine(
          {
            x: lerp(start.x, end.x, localStart),
            y: lerp(start.y, end.y, localStart),
          },
          {
            x: lerp(start.x, end.x, localEnd),
            y: lerp(start.y, end.y, localEnd),
          },
          stepStartDistance,
          stepEndDistance,
        );
      }
      hasLine = true;
    }

    distance = segmentEnd;
  }

  return hasLine;
}

function getPulseTailMaxLineLength(
  tailDistance: number,
  headDistance: number,
) {
  const tailLength = Math.max(1, headDistance - tailDistance);

  return tailLength / PULSE_TAIL_TAPER_SEGMENTS;
}

function getPulseTailAlphaScale(
  lineEndDistance: number,
  tailDistance: number,
  headDistance: number,
) {
  const tailLength = Math.max(0.001, headDistance - tailDistance);
  const progress = clamp((lineEndDistance - tailDistance) / tailLength, 0, 1);

  return Math.pow(progress, PULSE_TAIL_TAPER_POWER);
}

function hexToRgb(color: string) {
  const value = color.replace("#", "");

  return {
    b: Number.parseInt(value.slice(4, 6), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    r: Number.parseInt(value.slice(0, 2), 16),
  };
}

function rgbString(color: { b: number; g: number; r: number }, alpha: number) {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(
    color.b,
  )}, ${alpha})`;
}

function mixRgb(
  a: { b: number; g: number; r: number },
  b: { b: number; g: number; r: number },
  amount: number,
) {
  return {
    b: lerp(a.b, b.b, amount),
    g: lerp(a.g, b.g, amount),
    r: lerp(a.r, b.r, amount),
  };
}

function pearlescentColor(
  route: Route,
  routeIndex: number,
  time: number,
  pearl: number,
  theme: CircuitTheme,
) {
  const pearls = theme.pearlColors;
  const base = hexToRgb(route.color);
  const phase = route.phase * 6 + routeIndex * 0.37 + time * 0.00042;
  const first = pearls[Math.abs(Math.floor(phase)) % pearls.length] ?? pearls[0];
  const second =
    pearls[(Math.abs(Math.floor(phase)) + 1) % pearls.length] ?? pearls[0];
  const pearlColor = mixRgb(first, second, phase - Math.floor(phase));

  return mixRgb(base, pearlColor, pearl);
}

function pearlescentSystemColor(
  time: number,
  index: number,
  pearl: number,
  theme: CircuitTheme,
) {
  const pearls = theme.pearlColors;
  const base = theme.systemBaseColor;
  const phase = index * 0.54 + time * 0.00032;
  const first = pearls[Math.abs(Math.floor(phase)) % pearls.length] ?? pearls[0];
  const second =
    pearls[(Math.abs(Math.floor(phase)) + 1) % pearls.length] ?? pearls[0];
  const pearlColor = mixRgb(first, second, phase - Math.floor(phase));

  return mixRgb(base, pearlColor, pearl);
}

function compileRippleShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("Unable to create ripple shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(info || "Ripple shader compilation failed.");
  }

  return shader;
}

function createRippleProgram(gl: WebGL2RenderingContext) {
  const vertexShader = compileRippleShader(
    gl,
    gl.VERTEX_SHADER,
    RIPPLE_VERTEX_SHADER,
  );
  const fragmentShader = compileRippleShader(
    gl,
    gl.FRAGMENT_SHADER,
    RIPPLE_FRAGMENT_SHADER,
  );
  const program = gl.createProgram();

  if (!program) {
    throw new Error("Unable to create ripple shader program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(info || "Ripple shader link failed.");
  }

  return program;
}

function createPadPulseProgram(gl: WebGL2RenderingContext) {
  const vertexShader = compileRippleShader(
    gl,
    gl.VERTEX_SHADER,
    PAD_PULSE_VERTEX_SHADER,
  );
  const fragmentShader = compileRippleShader(
    gl,
    gl.FRAGMENT_SHADER,
    PAD_PULSE_FRAGMENT_SHADER,
  );
  const program = gl.createProgram();

  if (!program) {
    throw new Error("Unable to create pad pulse shader program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(info || "Pad pulse shader link failed.");
  }

  return program;
}

function createRouteLineProgram(gl: WebGL2RenderingContext) {
  const vertexShader = compileRippleShader(
    gl,
    gl.VERTEX_SHADER,
    ROUTE_LINE_VERTEX_SHADER,
  );
  const fragmentShader = compileRippleShader(
    gl,
    gl.FRAGMENT_SHADER,
    ROUTE_LINE_FRAGMENT_SHADER,
  );
  const program = gl.createProgram();

  if (!program) {
    throw new Error("Unable to create route line shader program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(info || "Route line shader link failed.");
  }

  return program;
}

function createRouteBloomProgram(gl: WebGL2RenderingContext) {
  const vertexShader = compileRippleShader(
    gl,
    gl.VERTEX_SHADER,
    ROUTE_BLOOM_VERTEX_SHADER,
  );
  const fragmentShader = compileRippleShader(
    gl,
    gl.FRAGMENT_SHADER,
    ROUTE_BLOOM_FRAGMENT_SHADER,
  );
  const program = gl.createProgram();

  if (!program) {
    throw new Error("Unable to create route bloom shader program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(info || "Route bloom shader link failed.");
  }

  return program;
}

function createShaderRippleRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    powerPreference: "high-performance",
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    stencil: false,
  });

  if (!gl) {
    return null;
  }

  let program: WebGLProgram | null = null;
  let padPulseProgram: WebGLProgram | null = null;
  let routeBloomProgram: WebGLProgram | null = null;
  let routeLineProgram: WebGLProgram | null = null;

  try {
    program = createRippleProgram(gl);
    padPulseProgram = createPadPulseProgram(gl);
    routeBloomProgram = createRouteBloomProgram(gl);
    routeLineProgram = createRouteLineProgram(gl);
  } catch {
    gl.deleteProgram(routeLineProgram);
    gl.deleteProgram(routeBloomProgram);
    gl.deleteProgram(padPulseProgram);
    gl.deleteProgram(program);
    return null;
  }

  if (!program || !padPulseProgram || !routeBloomProgram || !routeLineProgram) {
    return null;
  }

  const vertexArray = gl.createVertexArray();
  const vertexBuffer = gl.createBuffer();
  const padPulseVertexArray = gl.createVertexArray();
  const padPulseVertexBuffer = gl.createBuffer();
  const padPulseInstanceBuffer = gl.createBuffer();
  const routeBloomVertexArray = gl.createVertexArray();
  const routeBloomVertexBuffer = gl.createBuffer();
  const routeBloomInstanceBuffer = gl.createBuffer();
  const routeLineVertexArray = gl.createVertexArray();
  const routeLineVertexBuffer = gl.createBuffer();
  const routeLineInstanceBuffer = gl.createBuffer();
  const maskTexture = gl.createTexture();
  const pulseTexture = gl.createTexture();
  const staticTexture = gl.createTexture();
  const waveFieldTexture = gl.createTexture();

  const cleanup = () => {
    gl.deleteVertexArray(vertexArray);
    gl.deleteBuffer(vertexBuffer);
    gl.deleteVertexArray(padPulseVertexArray);
    gl.deleteBuffer(padPulseVertexBuffer);
    gl.deleteBuffer(padPulseInstanceBuffer);
    gl.deleteVertexArray(routeBloomVertexArray);
    gl.deleteBuffer(routeBloomVertexBuffer);
    gl.deleteBuffer(routeBloomInstanceBuffer);
    gl.deleteVertexArray(routeLineVertexArray);
    gl.deleteBuffer(routeLineVertexBuffer);
    gl.deleteBuffer(routeLineInstanceBuffer);
    gl.deleteTexture(maskTexture);
    gl.deleteTexture(pulseTexture);
    gl.deleteTexture(staticTexture);
    gl.deleteTexture(waveFieldTexture);
    gl.deleteProgram(routeLineProgram);
    gl.deleteProgram(routeBloomProgram);
    gl.deleteProgram(padPulseProgram);
    gl.deleteProgram(program);
  };

  if (
    !vertexArray ||
    !vertexBuffer ||
    !padPulseVertexArray ||
    !padPulseVertexBuffer ||
    !padPulseInstanceBuffer ||
    !routeBloomVertexArray ||
    !routeBloomVertexBuffer ||
    !routeBloomInstanceBuffer ||
    !routeLineVertexArray ||
    !routeLineVertexBuffer ||
    !routeLineInstanceBuffer ||
    !maskTexture ||
    !pulseTexture ||
    !staticTexture ||
    !waveFieldTexture
  ) {
    cleanup();
    return null;
  }

  const position = gl.getAttribLocation(program, "aPosition");
  if (position < 0) {
    cleanup();
    return null;
  }

  gl.bindVertexArray(vertexArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const padCorner = gl.getAttribLocation(padPulseProgram, "aCorner");
  const padCenterAndGlow = gl.getAttribLocation(
    padPulseProgram,
    "aCenterAndGlow",
  );
  const padCoreAndColorR = gl.getAttribLocation(
    padPulseProgram,
    "aCoreAndColorR",
  );
  const padColorAndFlags = gl.getAttribLocation(
    padPulseProgram,
    "aColorAndFlags",
  );

  if (
    padCorner < 0 ||
    padCenterAndGlow < 0 ||
    padCoreAndColorR < 0 ||
    padColorAndFlags < 0
  ) {
    cleanup();
    return null;
  }

  const instanceStride =
    PAD_PULSE_INSTANCE_FLOATS * Float32Array.BYTES_PER_ELEMENT;
  gl.bindVertexArray(padPulseVertexArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, padPulseVertexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(padCorner);
  gl.vertexAttribPointer(padCorner, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, padPulseInstanceBuffer);
  gl.enableVertexAttribArray(padCenterAndGlow);
  gl.vertexAttribPointer(
    padCenterAndGlow,
    4,
    gl.FLOAT,
    false,
    instanceStride,
    0,
  );
  gl.vertexAttribDivisor(padCenterAndGlow, 1);
  gl.enableVertexAttribArray(padCoreAndColorR);
  gl.vertexAttribPointer(
    padCoreAndColorR,
    4,
    gl.FLOAT,
    false,
    instanceStride,
    4 * Float32Array.BYTES_PER_ELEMENT,
  );
  gl.vertexAttribDivisor(padCoreAndColorR, 1);
  gl.enableVertexAttribArray(padColorAndFlags);
  gl.vertexAttribPointer(
    padColorAndFlags,
    4,
    gl.FLOAT,
    false,
    instanceStride,
    8 * Float32Array.BYTES_PER_ELEMENT,
  );
  gl.vertexAttribDivisor(padColorAndFlags, 1);
  gl.bindVertexArray(null);

  const routeLineCorner = gl.getAttribLocation(routeLineProgram, "aCorner");
  const routeLineStartEnd = gl.getAttribLocation(routeLineProgram, "aStartEnd");
  const routeLineColor = gl.getAttribLocation(routeLineProgram, "aColor");
  const routeLineParams = gl.getAttribLocation(routeLineProgram, "aParams");
  const routeBloomCorner = gl.getAttribLocation(routeBloomProgram, "aCorner");
  const routeBloomCenterRadius = gl.getAttribLocation(
    routeBloomProgram,
    "aCenterRadius",
  );
  const routeBloomColor = gl.getAttribLocation(
    routeBloomProgram,
    "aBloomColor",
  );
  const routeBloomBaseColor = gl.getAttribLocation(
    routeBloomProgram,
    "aBaseColor",
  );

  if (
    routeLineCorner < 0 ||
    routeLineStartEnd < 0 ||
    routeLineColor < 0 ||
    routeLineParams < 0 ||
    routeBloomCorner < 0 ||
    routeBloomCenterRadius < 0 ||
    routeBloomColor < 0 ||
    routeBloomBaseColor < 0
  ) {
    cleanup();
    return null;
  }

  const routeLineStride =
    ROUTE_LINE_INSTANCE_FLOATS * Float32Array.BYTES_PER_ELEMENT;
  gl.bindVertexArray(routeLineVertexArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, routeLineVertexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, 0, 1, 0, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(routeLineCorner);
  gl.vertexAttribPointer(routeLineCorner, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, routeLineInstanceBuffer);
  gl.enableVertexAttribArray(routeLineStartEnd);
  gl.vertexAttribPointer(
    routeLineStartEnd,
    4,
    gl.FLOAT,
    false,
    routeLineStride,
    0,
  );
  gl.vertexAttribDivisor(routeLineStartEnd, 1);
  gl.enableVertexAttribArray(routeLineColor);
  gl.vertexAttribPointer(
    routeLineColor,
    4,
    gl.FLOAT,
    false,
    routeLineStride,
    4 * Float32Array.BYTES_PER_ELEMENT,
  );
  gl.vertexAttribDivisor(routeLineColor, 1);
  gl.enableVertexAttribArray(routeLineParams);
  gl.vertexAttribPointer(
    routeLineParams,
    4,
    gl.FLOAT,
    false,
    routeLineStride,
    8 * Float32Array.BYTES_PER_ELEMENT,
  );
  gl.vertexAttribDivisor(routeLineParams, 1);
  gl.bindVertexArray(null);

  const routeBloomStride =
    ROUTE_BLOOM_INSTANCE_FLOATS * Float32Array.BYTES_PER_ELEMENT;
  gl.bindVertexArray(routeBloomVertexArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, routeBloomVertexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(routeBloomCorner);
  gl.vertexAttribPointer(routeBloomCorner, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, routeBloomInstanceBuffer);
  gl.enableVertexAttribArray(routeBloomCenterRadius);
  gl.vertexAttribPointer(
    routeBloomCenterRadius,
    4,
    gl.FLOAT,
    false,
    routeBloomStride,
    0,
  );
  gl.vertexAttribDivisor(routeBloomCenterRadius, 1);
  gl.enableVertexAttribArray(routeBloomColor);
  gl.vertexAttribPointer(
    routeBloomColor,
    4,
    gl.FLOAT,
    false,
    routeBloomStride,
    4 * Float32Array.BYTES_PER_ELEMENT,
  );
  gl.vertexAttribDivisor(routeBloomColor, 1);
  gl.enableVertexAttribArray(routeBloomBaseColor);
  gl.vertexAttribPointer(
    routeBloomBaseColor,
    4,
    gl.FLOAT,
    false,
    routeBloomStride,
    8 * Float32Array.BYTES_PER_ELEMENT,
  );
  gl.vertexAttribDivisor(routeBloomBaseColor, 1);
  gl.bindVertexArray(null);

  for (const texture of [
    maskTexture,
    pulseTexture,
    staticTexture,
    waveFieldTexture,
  ]) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]),
    );
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.clearColor(0, 0, 0, 0);

  return {
    gl,
    maskSource: null,
    maskTexture,
    padPulseInstanceBuffer,
    padPulseProgram,
    padPulseUniforms: {
      layerSize: gl.getUniformLocation(padPulseProgram, "uLayerSize"),
    },
    padPulseVertexArray,
    padPulseVertexBuffer,
    program,
    pulseSource: null,
    pulseTexture,
    routeBloomInstanceBuffer,
    routeBloomProgram,
    routeBloomUniforms: {
      layerSize: gl.getUniformLocation(routeBloomProgram, "uLayerSize"),
    },
    routeBloomVertexArray,
    routeBloomVertexBuffer,
    routeLineInstanceBuffer,
    routeLineProgram,
    routeLineUniforms: {
      layerSize: gl.getUniformLocation(routeLineProgram, "uLayerSize"),
    },
    routeLineVertexArray,
    routeLineVertexBuffer,
    staticSource: null,
    staticTexture,
    waveFieldSource: null,
    waveFieldTexture,
    uniforms: {
      bandWidth: gl.getUniformLocation(program, "uBandWidth"),
      center: gl.getUniformLocation(program, "uCenter"),
      feather: gl.getUniformLocation(program, "uFeather"),
      intensity: gl.getUniformLocation(program, "uIntensity"),
      layerSize: gl.getUniformLocation(program, "uLayerSize"),
      mask: gl.getUniformLocation(program, "uMask"),
      pearl: gl.getUniformLocation(program, "uPearl"),
      pearl0: gl.getUniformLocation(program, "uPearl0"),
      pearl1: gl.getUniformLocation(program, "uPearl1"),
      pearl2: gl.getUniformLocation(program, "uPearl2"),
      pearl3: gl.getUniformLocation(program, "uPearl3"),
      pulse: gl.getUniformLocation(program, "uPulse"),
      sharpness: gl.getUniformLocation(program, "uSharpness"),
      speed: gl.getUniformLocation(program, "uSpeed"),
      staticLayer: gl.getUniformLocation(program, "uStatic"),
      spread: gl.getUniformLocation(program, "uSpread"),
      startShare: gl.getUniformLocation(program, "uStartShare"),
      systemBase: gl.getUniformLocation(program, "uSystemBase"),
      tailLength: gl.getUniformLocation(program, "uTailLength"),
      tailSteps: gl.getUniformLocation(program, "uTailSteps"),
      time: gl.getUniformLocation(program, "uTime"),
      travelRadius: gl.getUniformLocation(program, "uTravelRadius"),
      waveField: gl.getUniformLocation(program, "uWaveField"),
      waveCount: gl.getUniformLocation(program, "uWaveCount"),
    },
    vertexArray,
    vertexBuffer,
  } satisfies ShaderRippleRenderer;
}

function drawRoundedRectPath(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
) {
  const left = -width / 2;
  const top = -height / 2;
  const right = width / 2;
  const bottom = height / 2;
  const corner = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(left + corner, top);
  context.lineTo(right - corner, top);
  context.quadraticCurveTo(right, top, right, top + corner);
  context.lineTo(right, bottom - corner);
  context.quadraticCurveTo(right, bottom, right - corner, bottom);
  context.lineTo(left + corner, bottom);
  context.quadraticCurveTo(left, bottom, left, bottom - corner);
  context.lineTo(left, top + corner);
  context.quadraticCurveTo(left, top, left + corner, top);
}

function setRgbUniform(
  gl: WebGL2RenderingContext,
  uniform: WebGLUniformLocation | null,
  color: RgbColor,
) {
  if (!uniform) {
    return;
  }

  gl.uniform3f(uniform, color.r / 255, color.g / 255, color.b / 255);
}

function drawTerminalPad(
  context: CanvasRenderingContext2D,
  field: RoutingField,
  point: Point,
  edgeSide: EdgeSide,
  kind: TerminalKind,
  color: string,
  theme: CircuitTheme,
) {
  const isVertical = isVerticalEdge(edgeSide);
  const padLength =
    kind === "outer" ? field.cell * 1.38 : field.cell * 1.18;
  const padThickness =
    kind === "outer" ? field.cell * 0.82 : field.cell * 0.72;
  const corner = Math.min(padThickness * 0.36, 3.2);

  context.save();
  context.translate(point.x, point.y);

  if (isVertical) {
    context.rotate(Math.PI / 2);
  }

  drawRoundedRectPath(
    context,
    padLength + field.cell * 0.44,
    padThickness + field.cell * 0.38,
    corner + 1.5,
  );
  context.fillStyle = theme.padSocketFill;
  context.globalAlpha = 1;
  context.fill();

  drawRoundedRectPath(context, padLength, padThickness, corner);
  context.fillStyle = color;
  context.globalAlpha = kind === "outer" ? 0.9 : 0.82;
  context.fill();
  context.strokeStyle = color;
  context.globalAlpha = 1;
  context.lineWidth = 0.85;
  context.stroke();

  drawRoundedRectPath(
    context,
    padLength * 0.44,
    padThickness * 0.42,
    corner * 0.48,
  );
  context.fillStyle = theme.padHoleFill;
  context.globalAlpha = 0.96;
  context.fill();

  context.restore();
}

function drawTerminalPadMask(
  context: CanvasRenderingContext2D,
  field: RoutingField,
  point: Point,
  edgeSide: EdgeSide,
  kind: TerminalKind,
) {
  const isVertical = isVerticalEdge(edgeSide);
  const padLength =
    kind === "outer" ? field.cell * 1.38 : field.cell * 1.18;
  const padThickness =
    kind === "outer" ? field.cell * 0.82 : field.cell * 0.72;
  const corner = Math.min(padThickness * 0.36, 3.2);

  context.save();
  context.translate(point.x, point.y);

  if (isVertical) {
    context.rotate(Math.PI / 2);
  }

  drawRoundedRectPath(context, padLength, padThickness, corner);
  context.fillStyle = "#fff";
  context.globalAlpha = 1;
  context.fill();
  context.restore();
}

function getGlyphPixelSize(field: RoutingField) {
  const glyph = field.textLayout.glyph;
  const glyphCols = glyph[0].length;

  return field.textLayout.textWidth / glyphCols;
}

function getLetterExtrusionDepth(field: RoutingField, tuning: CircuitTuning) {
  const pixelSize = getGlyphPixelSize(field);
  const depthScale = clamp(tuning.isoDepth, 0.35, 1.8);

  return {
    x: clamp(field.cell * 1.55 * depthScale, 4, pixelSize * 1.2),
    y: clamp(field.cell * 2.35 * depthScale, 6, pixelSize * 1.55),
  };
}

function getLetterBlockDepthNoise(row: number, col: number) {
  const value = Math.sin((row + 1) * 12.9898 + (col + 1) * 78.233) * 43758.5453;

  return value - Math.floor(value);
}

function getLetterBlockExposure(glyph: string[], row: number, col: number) {
  return (
    (isGlyphFilled(glyph, row - 1, col) ? 0 : 1) +
    (isGlyphFilled(glyph, row + 1, col) ? 0 : 1) +
    (isGlyphFilled(glyph, row, col - 1) ? 0 : 1) +
    (isGlyphFilled(glyph, row, col + 1) ? 0 : 1)
  );
}

function getLetterBlockDepthScale(
  glyph: string[],
  row: number,
  col: number,
  tuning: CircuitTuning,
) {
  const variance = clamp(tuning.isoDepthVariance, 0, 1);

  if (variance <= 0) {
    return 1;
  }

  const noise = getLetterBlockDepthNoise(row, col);
  const ridge = (Math.sin((row + 1) * 0.72 + (col + 1) * 0.43) + 1) / 2;
  const exposure = getLetterBlockExposure(glyph, row, col) / 4;

  return clamp(
    1 +
      (noise - 0.5) * 0.7 * variance +
      (ridge - 0.5) * 0.34 * variance +
      exposure * 0.22 * variance,
    0.55,
    1.75,
  );
}

function getLetterBlockDepth(
  field: RoutingField,
  glyph: string[],
  row: number,
  col: number,
  tuning: CircuitTuning,
) {
  const baseDepth = getLetterExtrusionDepth(field, tuning);
  const scale = getLetterBlockDepthScale(glyph, row, col, tuning);

  return {
    scale,
    x: baseDepth.x * scale,
    y: baseDepth.y * scale,
  };
}

function getLetterBlockInset(field: RoutingField, pixelSize: number) {
  return Math.min(pixelSize * 0.13, Math.max(0.55, field.cell * 0.22));
}

function makeLetterSideFaces(field: RoutingField, tuning: CircuitTuning) {
  const glyph = field.textLayout.glyph;
  const glyphRows = glyph.length;
  const glyphCols = glyph[0].length;
  const pixelSize = getGlyphPixelSize(field);
  const faces: LetterSideFace[] = [];

  for (let row = 0; row < glyphRows; row += 1) {
    for (let col = 0; col < glyphCols; col += 1) {
      if (!isGlyphFilled(glyph, row, col)) {
        continue;
      }

      const left = field.textLayout.left + col * pixelSize;
      const right = left + pixelSize;
      const top = field.textLayout.top + row * pixelSize;
      const bottom = top + pixelSize;
      const depth = getLetterBlockDepth(field, glyph, row, col, tuning);

      if (!isGlyphFilled(glyph, row, col + 1)) {
        faces.push({
          cell: { x: col, y: row },
          depthScale: depth.scale,
          points: [
            { x: right, y: top },
            { x: right, y: bottom },
            { x: right + depth.x, y: bottom + depth.y },
            { x: right + depth.x, y: top + depth.y },
          ],
          side: "right",
        });
      }

      if (!isGlyphFilled(glyph, row + 1, col)) {
        faces.push({
          cell: { x: col, y: row },
          depthScale: depth.scale,
          points: [
            { x: left, y: bottom },
            { x: right, y: bottom },
            { x: right + depth.x, y: bottom + depth.y },
            { x: left + depth.x, y: bottom + depth.y },
          ],
          side: "bottom",
        });
      }
    }
  }

  return faces.sort((a, b) => {
    const aDepth = a.cell.x + a.cell.y + (a.side === "bottom" ? 1 : 0);
    const bDepth = b.cell.x + b.cell.y + (b.side === "bottom" ? 1 : 0);

    return aDepth - bDepth || a.cell.y - b.cell.y || a.cell.x - b.cell.x;
  });
}

function drawPolygon(
  context: CanvasRenderingContext2D,
  points: readonly Point[],
) {
  if (points.length === 0) {
    return;
  }

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    context.lineTo(points[index].x, points[index].y);
  }

  context.closePath();
}

function drawLetterSideFaces(
  context: CanvasRenderingContext2D,
  faces: LetterSideFace[],
  theme: CircuitTheme,
) {
  const edgeColor = rgbString(theme.systemBaseColor, 0.92);

  context.save();
  context.globalCompositeOperation = "source-over";
  context.lineJoin = "round";
  context.shadowBlur = 7;
  context.shadowColor = rgbString(theme.systemBaseColor, 0.26);

  for (const face of faces) {
    const depthAmount = clamp((face.depthScale - 0.55) / 1.2, 0, 1);
    const shimmer =
      ((face.cell.x * 17 +
        face.cell.y * 11 +
        (face.side === "bottom" ? 5 : 0)) %
        7) /
      7;
    const alpha =
      face.side === "right"
        ? lerp(0.72, 0.96, shimmer)
        : lerp(0.6, 0.88, shimmer);
    const sideColor =
      face.side === "right"
        ? mixRgb(theme.systemBaseColor, theme.pearlColors[1], depthAmount * 0.22)
        : mixRgb(theme.pearlColors[0], theme.substrateColor, 0.16);

    drawPolygon(context, face.points);
    context.fillStyle = rgbString(
      sideColor,
      Math.min(0.92, alpha * lerp(0.42, 0.76, depthAmount)),
    );
    context.strokeStyle = edgeColor;
    context.lineWidth = lerp(0.8, 1.45, depthAmount);
    context.globalAlpha = 1;
    context.fill();
    context.stroke();
  }

  context.restore();
}

function drawLetterFrontFace(
  context: CanvasRenderingContext2D,
  field: RoutingField,
  tuning: CircuitTuning,
) {
  const theme = tuning.theme;
  const glyph = field.textLayout.glyph;
  const glyphRows = glyph.length;
  const glyphCols = glyph[0].length;
  const pixelSize = getGlyphPixelSize(field);
  const inset = getLetterBlockInset(field, pixelSize);
  const edgeColor = rgbString(theme.systemBaseColor, 0.86);
  const highlightColor = rgbString(theme.pearlColors[1], 0.92);
  const shadowColor = rgbString(theme.substrateColor, 0.58);

  context.save();
  context.globalCompositeOperation = "source-over";
  context.lineJoin = "round";
  context.lineWidth = Math.max(0.75, field.cell * 0.07);
  context.shadowBlur = Math.max(4, field.cell * 0.62);
  context.shadowColor = rgbString(theme.systemBaseColor, 0.2);

  for (let row = 0; row < glyphRows; row += 1) {
    for (let col = 0; col < glyphCols; col += 1) {
      if (!isGlyphFilled(glyph, row, col)) {
        continue;
      }

      const left = field.textLayout.left + col * pixelSize + inset;
      const right = field.textLayout.left + (col + 1) * pixelSize - inset;
      const top = field.textLayout.top + row * pixelSize + inset;
      const bottom = field.textLayout.top + (row + 1) * pixelSize - inset;
      const depth = getLetterBlockDepth(field, glyph, row, col, tuning);
      const depthAmount = clamp((depth.scale - 0.55) / 1.2, 0, 1);

      if (right <= left || bottom <= top) {
        continue;
      }

      drawPolygon(context, [
        { x: left, y: bottom },
        { x: right, y: bottom },
        { x: right + depth.x, y: bottom + depth.y },
        { x: left + depth.x, y: bottom + depth.y },
      ]);
      context.fillStyle = rgbString(
        mixRgb(theme.pearlColors[0], theme.substrateColor, 0.32),
        lerp(0.18, 0.48, depthAmount),
      );
      context.strokeStyle = rgbString(theme.pearlColors[0], 0.28);
      context.lineWidth = Math.max(0.6, field.cell * 0.05);
      context.fill();
      context.stroke();

      drawPolygon(context, [
        { x: right, y: top },
        { x: right, y: bottom },
        { x: right + depth.x, y: bottom + depth.y },
        { x: right + depth.x, y: top + depth.y },
      ]);
      context.fillStyle = rgbString(
        mixRgb(theme.systemBaseColor, theme.pearlColors[1], 0.18),
        lerp(0.24, 0.58, depthAmount),
      );
      context.strokeStyle = rgbString(theme.systemBaseColor, 0.34);
      context.fill();
      context.stroke();
    }
  }

  for (let row = 0; row < glyphRows; row += 1) {
    for (let col = 0; col < glyphCols; col += 1) {
      if (!isGlyphFilled(glyph, row, col)) {
        continue;
      }

      const left = field.textLayout.left + col * pixelSize + inset;
      const right = field.textLayout.left + (col + 1) * pixelSize - inset;
      const top = field.textLayout.top + row * pixelSize + inset;
      const bottom = field.textLayout.top + (row + 1) * pixelSize - inset;
      const depth = getLetterBlockDepth(field, glyph, row, col, tuning);
      const depthAmount = clamp((depth.scale - 0.55) / 1.2, 0, 1);
      const capColor = mixRgb(
        theme.systemBaseColor,
        theme.pearlColors[1],
        0.12 + depthAmount * 0.22,
      );

      if (right <= left || bottom <= top) {
        continue;
      }

      context.fillStyle = rgbString(capColor, lerp(0.66, 0.88, depthAmount));
      context.strokeStyle = edgeColor;
      context.globalAlpha = 1;
      context.lineWidth = Math.max(0.65, field.cell * 0.06);
      context.fillRect(left, top, right - left, bottom - top);

      if (
        !isGlyphFilled(glyph, row - 1, col) ||
        !isGlyphFilled(glyph, row, col - 1)
      ) {
        context.strokeStyle = highlightColor;
        context.globalAlpha = 0.78;
      } else {
        context.strokeStyle = edgeColor;
        context.globalAlpha = 0.45;
      }

      context.strokeRect(left + 0.5, top + 0.5, right - left - 1, bottom - top - 1);

      context.beginPath();
      context.moveTo(left + 1, top + 1);
      context.lineTo(right - 1, top + 1);
      context.moveTo(left + 1, top + 1);
      context.lineTo(left + 1, bottom - 1);
      context.strokeStyle = rgbString(
        mixRgb(capColor, { r: 255, g: 255, b: 255 }, 0.34),
        0.62,
      );
      context.lineWidth = Math.max(0.7, field.cell * 0.07);
      context.stroke();

      context.beginPath();
      context.moveTo(right - 1, top + 1);
      context.lineTo(right - 1, bottom - 1);
      context.lineTo(left + 1, bottom - 1);
      context.strokeStyle = shadowColor;
      context.lineWidth = Math.max(0.55, field.cell * 0.055);
      context.stroke();
    }
  }

  context.restore();
}

function drawSideFaceCircuitLines(
  context: CanvasRenderingContext2D,
  field: RoutingField,
  faces: LetterSideFace[],
  theme: CircuitTheme,
  mask: boolean,
) {
  const lineWidth = mask
    ? Math.max(2.5, field.cell * 0.42)
    : Math.max(1, field.cell * 0.13);

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.globalCompositeOperation = mask ? "source-over" : "lighter";
  context.strokeStyle = mask ? "#fff" : rgbString(theme.pearlColors[1], 0.82);
  context.lineWidth = lineWidth;

  for (const face of faces) {
    const selector =
      (face.cell.x * 13 +
        face.cell.y * 19 +
        (face.side === "bottom" ? 3 : 0)) %
      6;

    if (selector > 1) {
      continue;
    }

    const [a, b, c, d] = face.points;

    context.beginPath();

    if (face.side === "right") {
      context.moveTo(lerp(a.x, b.x, 0.22), lerp(a.y, b.y, 0.22));
      context.lineTo(lerp(d.x, c.x, 0.56), lerp(d.y, c.y, 0.56));
      context.lineTo(lerp(d.x, c.x, 0.82), lerp(d.y, c.y, 0.82));
    } else {
      context.moveTo(lerp(a.x, b.x, 0.2), lerp(a.y, b.y, 0.2));
      context.lineTo(lerp(a.x, b.x, 0.62), lerp(a.y, b.y, 0.62));
      context.lineTo(lerp(d.x, c.x, 0.78), lerp(d.y, c.y, 0.78));
    }

    context.stroke();

    if (!mask) {
      const terminal = face.side === "right" ? c : d;
      context.beginPath();
      context.arc(
        terminal.x,
        terminal.y,
        Math.max(1.2, field.cell * 0.16),
        0,
        Math.PI * 2,
      );
      context.fillStyle = rgbString(theme.pearlColors[1], 0.88);
      context.fill();
    }
  }

  context.restore();
}

function drawPadWrapTrace(
  context: CanvasRenderingContext2D,
  field: RoutingField,
  pad: TerminalPad,
  route: Route | undefined,
  tuning: CircuitTuning,
  mask: boolean,
) {
  if (pad.edgeSide !== "right" && pad.edgeSide !== "bottom") {
    return;
  }

  const point = cellToPoint(field, pad.cell);
  const normal = edgeNormal(pad.edgeSide);
  const depth = getLetterExtrusionDepth(field, tuning);
  const frontPoint = {
    x: point.x - normal.x * field.cell * 0.22,
    y: point.y - normal.y * field.cell * 0.22,
  };
  const edgePoint = {
    x: point.x + normal.x * field.cell * 0.42,
    y: point.y + normal.y * field.cell * 0.42,
  };
  const sidePoint = {
    x: point.x + depth.x * 0.72 + normal.x * field.cell * 0.12,
    y: point.y + depth.y * 0.72 + normal.y * field.cell * 0.12,
  };
  const routeStyle = route ? getRouteRenderStyle(route) : null;

  context.beginPath();
  context.moveTo(frontPoint.x, frontPoint.y);
  context.lineTo(edgePoint.x, edgePoint.y);
  context.lineTo(sidePoint.x, sidePoint.y);
  context.strokeStyle = mask ? "#fff" : pad.color;
  context.lineWidth = mask
    ? Math.max(2.75, field.cell * 0.46)
    : Math.max(routeStyle?.width ?? 1, field.cell * 0.16);
  context.globalAlpha = mask ? 1 : pad.kind === "inner" ? 0.72 : 0.88;
  context.shadowBlur = mask ? 0 : Math.max(4, field.cell * 0.7);
  context.shadowColor = pad.color;
  context.stroke();

  if (!mask) {
    context.beginPath();
    context.arc(
      sidePoint.x,
      sidePoint.y,
      Math.max(1.35, field.cell * 0.17),
      0,
      Math.PI * 2,
    );
    context.fillStyle = pad.color;
    context.globalAlpha = 0.86;
    context.fill();
  }
}

function drawLetterSurfaceTraces(
  context: CanvasRenderingContext2D,
  field: RoutingField,
  terminalPads: TerminalPad[],
  routes: Route[],
  faces: LetterSideFace[],
  tuning: CircuitTuning,
  mask = false,
) {
  const theme = tuning.theme;

  drawSideFaceCircuitLines(context, field, faces, theme, mask);

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.globalCompositeOperation = mask ? "source-over" : "lighter";

  for (let index = 0; index < terminalPads.length; index += 1) {
    if (index % 3 !== 0) {
      continue;
    }

    drawPadWrapTrace(
      context,
      field,
      terminalPads[index],
      routes[index],
      tuning,
      mask,
    );
  }

  context.restore();
}

function drawLetterVolume(
  context: CanvasRenderingContext2D,
  field: RoutingField,
  terminalPads: TerminalPad[],
  routes: Route[],
  tuning: CircuitTuning,
) {
  const faces = makeLetterSideFaces(field, tuning);

  drawLetterSideFaces(context, faces, tuning.theme);
  drawLetterFrontFace(context, field, tuning);
  drawLetterSurfaceTraces(
    context,
    field,
    terminalPads,
    routes,
    faces,
    tuning,
  );
}

function drawTerminalConnections(
  context: CanvasRenderingContext2D,
  field: RoutingField,
  terminalPads: TerminalPad[],
  routes: Route[],
  theme: CircuitTheme,
) {
  for (let index = 0; index < terminalPads.length; index += 1) {
    const pad = terminalPads[index];
    const route = routes[index];

    if (pad && route) {
      drawPadConnectionStub(context, field, pad, route, theme);
    }
  }

  for (const pad of terminalPads) {
    drawTerminalPad(
      context,
      field,
      cellToPoint(field, pad.cell),
      pad.edgeSide,
      pad.kind,
      pad.color,
      theme,
    );
  }
}

function drawPadConnectionStubMask(
  context: CanvasRenderingContext2D,
  field: RoutingField,
  pad: TerminalPad,
  route: Route,
) {
  const point = cellToPoint(field, pad.cell);
  const normal = edgeNormal(pad.edgeSide);
  const end = {
    x: point.x + normal.x * field.cell * 1.8,
    y: point.y + normal.y * field.cell * 1.8,
  };

  context.beginPath();
  context.moveTo(point.x, point.y);
  context.lineTo(end.x, end.y);
  context.strokeStyle = "#fff";
  context.lineWidth = Math.max(
    getRouteRenderStyle(route).maskWidth,
    field.cell * 0.07,
  );
  context.stroke();
}

function drawPadConnectionStub(
  context: CanvasRenderingContext2D,
  field: RoutingField,
  pad: TerminalPad,
  route: Route,
  theme: CircuitTheme,
) {
  const point = cellToPoint(field, pad.cell);
  const normal = edgeNormal(pad.edgeSide);
  const end = {
    x: point.x + normal.x * field.cell * 1.8,
    y: point.y + normal.y * field.cell * 1.8,
  };

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  context.beginPath();
  context.moveTo(point.x, point.y);
  context.lineTo(end.x, end.y);
  const style = getRouteRenderStyle(route);

  context.strokeStyle = rgbString(theme.substrateColor, style.substrateAlpha);
  context.lineWidth = style.substrateWidth;
  context.globalAlpha = 1;
  context.stroke();

  context.beginPath();
  context.moveTo(point.x, point.y);
  context.lineTo(end.x, end.y);
  context.strokeStyle = route.color;
  context.lineWidth = Math.max(style.width, field.cell * 0.035);
  context.globalAlpha = style.padCoreAlpha;
  context.stroke();

  context.restore();
}

function drawStaticBoard(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  plan: BoardPlan | null,
  tuning: CircuitTuning,
) {
  context.clearRect(0, 0, width, height);
  const theme = tuning.theme;

  const gradient = context.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75,
  );
  gradient.addColorStop(0, theme.backgroundStops[0]);
  gradient.addColorStop(0.55, theme.backgroundStops[1]);
  gradient.addColorStop(1, theme.backgroundStops[2]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  if (!plan) {
    return;
  }

  const { field, routes, terminalPads } = plan;

  context.save();
  context.globalAlpha = theme.gridAlpha;
  context.strokeStyle = theme.gridColor;
  context.lineWidth = 1;

  for (let x = field.cell * 2; x < width; x += field.cell * 5) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  for (let y = field.cell * 2; y < height; y += field.cell * 5) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.restore();

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  for (const layer of [1, 0]) {
    for (const route of routes) {
      for (const segment of route.segments) {
        if (segment.layer !== layer) {
          continue;
        }

        const style = getRouteRenderStyle(route);

        context.strokeStyle = rgbString(theme.substrateColor, style.substrateAlpha);
        context.lineWidth = style.substrateWidth;
        strokeSegmentPath(context, segment);

        context.strokeStyle = route.glow;
        context.globalAlpha = style.glowAlpha;
        context.lineWidth = style.glowWidth;
        strokeSegmentPath(context, segment);

        context.strokeStyle = route.color;
        context.globalAlpha = style.coreAlpha;
        context.lineWidth = style.width;
        strokeSegmentPath(context, segment);
        context.globalAlpha = 1;
      }
    }
  }

  for (const route of routes) {
    const style = getRouteRenderStyle(route);
    const originRadius = Math.max(
      0.9,
      field.cell * (route.terminalKind === "inner" ? 0.1 : 0.16),
    );
    context.fillStyle = theme.padHoleFill;
    context.strokeStyle = route.color;
    context.globalAlpha = style.viaAlpha;
    context.lineWidth = 0.65;
    context.beginPath();
    context.arc(
      route.originPoint.x,
      route.originPoint.y,
      originRadius,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.stroke();

    for (const via of route.viaPoints) {
      const radius = field.cell * (route.terminalKind === "inner" ? 0.14 : 0.22);
      context.fillStyle = theme.padHoleFill;
      context.strokeStyle = route.color;
      context.globalAlpha = style.viaAlpha;
      context.lineWidth = 0.9;
      context.beginPath();
      context.arc(via.x, via.y, radius, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    }
  }
  context.globalAlpha = 1;

  drawLetterVolume(context, field, terminalPads, routes, tuning);
  drawTerminalConnections(context, field, terminalPads, routes, theme);

  context.restore();

  context.save();
  context.globalAlpha = theme.frameAlpha;
  context.strokeStyle = theme.frameColor;
  context.lineWidth = 1;
  context.strokeRect(16.5, 16.5, width - 33, height - 33);
  context.restore();
}

function drawCircuitMask(
  context: CanvasRenderingContext2D,
  _width: number,
  _height: number,
  plan: BoardPlan | null,
  tuning: CircuitTuning,
) {
  context.clearRect(0, 0, _width, _height);

  if (!plan) {
    return;
  }

  const { field, routes, terminalPads } = plan;

  context.save();
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  context.fillStyle = "#fff";
  context.strokeStyle = "#fff";
  context.lineCap = "round";
  context.lineJoin = "round";

  for (const layer of [1, 0]) {
    for (const route of routes) {
      for (const segment of route.segments) {
        if (segment.layer !== layer) {
          continue;
        }

        context.lineWidth = getRouteRenderStyle(route).maskWidth;
        strokeSegmentPath(context, segment);
      }
    }
  }

  for (const route of routes) {
    const originRadius = Math.max(
      1,
      field.cell * (route.terminalKind === "inner" ? 0.12 : 0.18),
    );
    context.beginPath();
    context.arc(
      route.originPoint.x,
      route.originPoint.y,
      originRadius,
      0,
      Math.PI * 2,
    );
    context.fill();

    for (const via of route.viaPoints) {
      context.beginPath();
      context.arc(
        via.x,
        via.y,
        field.cell * (route.terminalKind === "inner" ? 0.16 : 0.24),
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  }

  for (let index = 0; index < terminalPads.length; index += 1) {
    const pad = terminalPads[index];
    const route = routes[index];

    if (pad && route) {
      drawPadConnectionStubMask(context, field, pad, route);
    }
  }

  drawLetterSurfaceTraces(
    context,
    field,
    terminalPads,
    routes,
    makeLetterSideFaces(field, tuning),
    tuning,
    true,
  );

  for (const pad of terminalPads) {
    drawTerminalPadMask(
      context,
      field,
      cellToPoint(field, pad.cell),
      pad.edgeSide,
      pad.kind,
    );
  }

  context.restore();
}

function getSystemRippleMetrics(
  field: RoutingField,
  width: number,
  height: number,
  tuning: CircuitTuning,
  waveMaxDistance?: number,
): SystemRippleMetrics {
  const center = cellToPoint(field, getLetterCenter(field));
  const radialMaxRadius =
    Math.hypot(
      Math.max(center.x, width - center.x),
      Math.max(center.y, height - center.y),
    ) * 1.06;
  const maxRadius = Math.max(
    field.cell * 8,
    waveMaxDistance ?? radialMaxRadius,
  );
  const widthScale = tuning.systemRippleWidth;
  const startRadiusShare = clamp(tuning.systemRippleStart, 0, 0.35);

  return {
    bandWidth: Math.max(field.cell * 2.5, maxRadius * 0.045) * widthScale,
    center,
    feather: clamp(tuning.systemRippleFeather, 0.35, 2.5),
    maxRadius,
    sharpness: clamp(tuning.systemRippleSharpness, 0.45, 2.25),
    speed: tuning.systemRippleSpeed,
    spread: clamp(tuning.systemRippleSpread, 0.35, 1.85),
    startRadiusShare,
    tailLength:
      Math.max(field.cell * 4, maxRadius * 0.085) *
      clamp(tuning.systemRippleLength, 0.15, 2.5),
    tailSteps: Math.max(
      3,
      Math.round(4 + clamp(tuning.systemRippleLength, 0.15, 2.5) * 7),
    ),
    travelRadius: maxRadius * (1 - startRadiusShare),
    waveCount: Math.max(1, Math.round(tuning.systemRippleCount)),
  };
}

function getSystemRippleProgress(
  metrics: SystemRippleMetrics,
  time: number,
  wave: number,
) {
  const waveOffset =
    metrics.waveCount <= 1 ? 0 : (wave / metrics.waveCount) * metrics.spread;

  return (time * 0.00012 * metrics.speed + waveOffset) % 1;
}

function getSystemRippleFade(progress: number) {
  return Math.min(1, progress / 0.1, (1 - progress) / 0.16);
}

function getSystemRippleRadius(
  metrics: SystemRippleMetrics,
  progress: number,
) {
  return Math.max(
    0.1,
    metrics.maxRadius * metrics.startRadiusShare +
      progress * metrics.travelRadius,
  );
}

function getRippleTouchStrength(
  distance: number,
  metrics: SystemRippleMetrics,
  time: number,
  decay: number,
) {
  let strength = 0;
  const frontReach = metrics.bandWidth * (0.75 + metrics.feather * 0.24);
  const trailDecay = clamp(decay, 0, 1);

  for (let wave = 0; wave < metrics.waveCount; wave += 1) {
    const progress = getSystemRippleProgress(metrics, time, wave);
    const fade = getSystemRippleFade(progress);

    if (fade <= 0) {
      continue;
    }

    const radius = getSystemRippleRadius(metrics, progress);
    const frontDistance = Math.abs(distance - radius);
    const frontStrength =
      frontDistance < frontReach ? 1 - frontDistance / frontReach : 0;
    const trailDistance = radius - distance;
    const trailStrength =
      trailDistance >= 0 && trailDistance < metrics.tailLength
        ? Math.pow(
            1 - trailDistance / metrics.tailLength,
            metrics.sharpness * 1.25,
          ) *
          trailDecay *
          0.6
        : 0;

    strength = Math.max(strength, fade * Math.max(frontStrength, trailStrength));
  }

  return strength;
}

function drawTerminalPadPulse(
  context: CanvasRenderingContext2D,
  field: RoutingField,
  pad: TerminalPad,
  point: Point,
  color: { b: number; g: number; r: number },
  strength: number,
  size: number,
) {
  const isVertical = isVerticalEdge(pad.edgeSide);
  const padLength =
    pad.kind === "outer" ? field.cell * 1.38 : field.cell * 1.18;
  const padThickness =
    pad.kind === "outer" ? field.cell * 0.82 : field.cell * 0.72;
  const bloomScale = clamp(size, 0.35, 2);
  const corner = Math.min(padThickness * 0.36, 3.2);
  const highlight = mixRgb(color, { r: 255, g: 255, b: 255 }, 0.55);

  context.save();
  context.translate(point.x, point.y);

  if (isVertical) {
    context.rotate(Math.PI / 2);
  }

  context.shadowColor = rgbString(color, strength * 0.75);
  context.shadowBlur = field.cell * bloomScale * (1.2 + strength * 2.4);
  drawRoundedRectPath(
    context,
    padLength + field.cell * bloomScale * (0.34 + strength * 0.58),
    padThickness + field.cell * bloomScale * (0.24 + strength * 0.45),
    corner + field.cell * 0.16,
  );
  context.fillStyle = rgbString(color, strength * 0.28);
  context.fill();

  context.shadowBlur = field.cell * bloomScale * 0.45;
  drawRoundedRectPath(
    context,
    padLength * (1 + strength * bloomScale * 0.12),
    padThickness * (1 + strength * bloomScale * 0.16),
    corner,
  );
  context.fillStyle = rgbString(highlight, strength * 0.5);
  context.fill();
  context.strokeStyle = rgbString(highlight, strength * 0.95);
  context.lineWidth = Math.max(0.65, field.cell * 0.055 * bloomScale);
  context.stroke();
  context.restore();
}

function drawRipplePadPulses(
  context: CanvasRenderingContext2D,
  layer: StaticLayer,
  time: number,
  tuning: CircuitTuning,
) {
  const intensity = tuning.systemPadPulseIntensity;

  if (intensity <= 0) {
    return;
  }

  const field = layer.plan?.field;

  if (!field) {
    return;
  }

  const metrics = getSystemRippleMetrics(
    field,
    layer.width,
    layer.height,
    tuning,
    layer.waveMaxDistance,
  );
  const size = tuning.systemPadPulseSize;

  context.save();
  context.globalCompositeOperation = "lighter";

  for (let index = 0; index < layer.padPulseEntries.length; index += 1) {
    const { distance, pad, point } = layer.padPulseEntries[index];
    const strength =
      getRippleTouchStrength(
        distance,
        metrics,
        time,
        tuning.systemPadPulseDecay,
      ) * intensity;

    if (strength < 0.035) {
      continue;
    }

    const baseColor = hexToRgb(pad.color);
    const rippleColor = pearlescentSystemColor(
      time,
      index,
      tuning.systemRipplePearl,
      tuning.theme,
    );
    const color = mixRgb(baseColor, rippleColor, 0.58);

    drawTerminalPadPulse(
      context,
      field,
      pad,
      point,
      color,
      Math.min(1.4, strength),
      size,
    );
  }

  context.restore();
}

function makePadPulseInstanceData(
  layer: StaticLayer,
  time: number,
  tuning: CircuitTuning,
) {
  const intensity = tuning.systemPadPulseIntensity;
  const field = layer.plan?.field;

  if (intensity <= 0 || !field) {
    return null;
  }

  const metrics = getSystemRippleMetrics(
    field,
    layer.width,
    layer.height,
    tuning,
    layer.waveMaxDistance,
  );
  const data: number[] = [];
  const bloomScale = clamp(tuning.systemPadPulseSize, 0.35, 2);

  for (let index = 0; index < layer.padPulseEntries.length; index += 1) {
    const { distance, pad, point } = layer.padPulseEntries[index];
    const strength =
      getRippleTouchStrength(
        distance,
        metrics,
        time,
        tuning.systemPadPulseDecay,
      ) * intensity;

    if (strength < 0.035) {
      continue;
    }

    const clampedStrength = Math.min(1.4, strength);
    const baseColor = hexToRgb(pad.color);
    const rippleColor = pearlescentSystemColor(
      time,
      index,
      tuning.systemRipplePearl,
      tuning.theme,
    );
    const color = mixRgb(baseColor, rippleColor, 0.58);
    const isVertical = isVerticalEdge(pad.edgeSide);
    const padLength =
      pad.kind === "outer" ? field.cell * 1.38 : field.cell * 1.18;
    const padThickness =
      pad.kind === "outer" ? field.cell * 0.82 : field.cell * 0.72;
    const corner = Math.min(padThickness * 0.36, 3.2);
    const coreHalfWidth =
      (padLength * (1 + clampedStrength * bloomScale * 0.12)) / 2;
    const coreHalfHeight =
      (padThickness * (1 + clampedStrength * bloomScale * 0.16)) / 2;
    const glowWidth =
      padLength + field.cell * bloomScale * (0.34 + clampedStrength * 0.58);
    const glowHeight =
      padThickness + field.cell * bloomScale * (0.24 + clampedStrength * 0.45);
    const glowPad = field.cell * bloomScale * (1.15 + clampedStrength * 2.35);

    data.push(
      point.x,
      point.y,
      glowWidth / 2 + glowPad,
      glowHeight / 2 + glowPad,
      coreHalfWidth,
      coreHalfHeight,
      corner,
      color.r / 255,
      color.g / 255,
      color.b / 255,
      clampedStrength,
      isVertical ? 1 : 0,
    );
  }

  return data.length > 0 ? new Float32Array(data) : null;
}

function drawShaderPadPulses(
  renderer: ShaderRippleRenderer,
  layer: StaticLayer,
  time: number,
  tuning: CircuitTuning,
) {
  const instanceData = makePadPulseInstanceData(layer, time, tuning);

  if (!instanceData) {
    return;
  }

  const gl = renderer.gl;
  const instanceCount = instanceData.length / PAD_PULSE_INSTANCE_FLOATS;

  gl.useProgram(renderer.padPulseProgram);
  gl.bindVertexArray(renderer.padPulseVertexArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.padPulseInstanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, instanceData, gl.DYNAMIC_DRAW);
  if (renderer.padPulseUniforms.layerSize) {
    gl.uniform2f(renderer.padPulseUniforms.layerSize, layer.width, layer.height);
  }
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, instanceCount);
  gl.disable(gl.BLEND);
  gl.bindVertexArray(null);
}

function getPulseSeed(routeIndex: number, pulse: number, salt: number) {
  const value = Math.sin(routeIndex * 12.9898 + pulse * 78.233 + salt * 37.719);

  return value - Math.floor(value);
}

function getRoutePulseMotion(
  route: Route,
  routeIndex: number,
  pulse: number,
  pulseCount: number,
  time: number,
  tuning: CircuitTuning,
) {
  const speedVariance = clamp(tuning.pulseSpeedVariance, 0, 1);
  const speedSeed = getPulseSeed(routeIndex, pulse, 1);
  const speedMultiplier = Math.max(
    0.12,
    1 + (speedSeed * 2 - 1) * speedVariance,
  );
  const progress =
    (route.phase +
      time * route.speed * tuning.pulseSpeed * speedMultiplier * 0.0016 +
      pulse / pulseCount +
      routeIndex * 0.0009) %
    1;

  return {
    progress,
    speedMultiplier,
  };
}

function getRoutePulseTrailLength(
  route: Route,
  routeIndex: number,
  pulse: number,
  style: ReturnType<typeof getRouteRenderStyle>,
  tuning: CircuitTuning,
) {
  const length = clamp(tuning.pulseLength, 0, 3);

  if (length <= 0) {
    return 0;
  }

  const variance = clamp(tuning.pulseLengthVariance, 0, 1);
  const lengthSeed = getPulseSeed(routeIndex, pulse, 2);
  const lengthMultiplier = Math.max(0.22, 1 + (lengthSeed * 2 - 1) * variance);
  const baseLength = Math.max(style.width * 22 + 8, route.length * 0.045);

  return Math.min(route.length * 0.32, baseLength * length * lengthMultiplier);
}

function smoothUnitStep(value: number) {
  const clamped = clamp(value, 0, 1);

  return clamped * clamped * (3 - clamped * 2);
}

function getRoutePulseTerminalState(progress: number) {
  const remainingProgress = 1 - progress;
  const scale =
    remainingProgress >= PULSE_TERMINAL_FADE_SHARE
      ? 1
      : smoothUnitStep(remainingProgress / PULSE_TERMINAL_FADE_SHARE);

  return {
    alphaScale: Math.pow(scale, PULSE_TERMINAL_FADE_POWER),
    scale,
  };
}

function makeRoutePulseInstanceData(
  routes: Route[],
  time: number,
  tuning: CircuitTuning,
) {
  const intensity = tuning.pulseIntensity;
  const pulseCount = Math.max(1, Math.round(tuning.pulseCount));

  if (intensity <= 0 || pulseCount <= 0) {
    return null;
  }

  const speed = tuning.pulseSpeed;
  const widthScale = tuning.pulseWidth;
  const detail = clamp(tuning.pulseDetail, 0.35, 2);
  const shimmerStride = Math.max(
    1,
    Math.ceil(routes.length / (PULSE_SHIMMER_ROUTE_BUDGET * detail)),
  );
  const bloomStride = Math.max(
    1,
    Math.ceil((routes.length * pulseCount) / (PULSE_BLOOM_BUDGET * detail)),
  );
  const lineData: number[] = [];
  const bloomData: number[] = [];

  for (let routeIndex = 0; routeIndex < routes.length; routeIndex += 1) {
    const route = routes[routeIndex];
    const style = getRouteRenderStyle(route);
    const ripplePhase =
      time * 0.0011 * speed +
      route.phase * Math.PI * 2 +
      route.originPoint.x * 0.006 +
      route.originPoint.y * 0.004;
    const ripple = (Math.sin(ripplePhase) + 1) / 2;
    const shimmer = Math.max(0, (ripple - 0.44) / 0.56);
    const color = pearlescentColor(
      route,
      routeIndex,
      time,
      tuning.pulsePearl * (0.35 + shimmer * 0.65),
      tuning.theme,
    );

    if (shimmer > 0.03 && routeIndex % shimmerStride === 0) {
      const broadHalfWidth =
        (style.substrateWidth +
          shimmer * widthScale * style.pulseWidthScale * (style.width + 1.2)) /
        2;
      const thinHalfWidth =
        (style.width + shimmer * widthScale * style.pulseWidthScale * 0.9) / 2;
      const broadAlpha = shimmer * intensity * 0.26 * style.pulseAlpha;
      const thinAlpha = shimmer * intensity * 0.42 * style.pulseAlpha;

      for (const segment of route.segments) {
        for (let index = 1; index < segment.points.length; index += 1) {
          const start = segment.points[index - 1];
          const end = segment.points[index];

          lineData.push(
            start.x,
            start.y,
            end.x,
            end.y,
            color.r / 255,
            color.g / 255,
            color.b / 255,
            broadAlpha,
            broadHalfWidth,
            broadHalfWidth,
            0,
            0,
            start.x,
            start.y,
            end.x,
            end.y,
            color.r / 255,
            color.g / 255,
            color.b / 255,
            thinAlpha,
            thinHalfWidth,
            thinHalfWidth,
            0,
            0,
          );
        }
      }
    }

    for (let pulse = 0; pulse < pulseCount; pulse += 1) {
      if ((routeIndex * pulseCount + pulse) % bloomStride !== 0) {
        continue;
      }

      const { progress, speedMultiplier } = getRoutePulseMotion(
        route,
        routeIndex,
        pulse,
        pulseCount,
        time,
        tuning,
      );
      const headDistance = progress * route.length;
      const point = getPointAtLength(route.points, headDistance);
      const terminalState = getRoutePulseTerminalState(progress);
      const terminalAlphaScale = terminalState.alphaScale;
      const terminalSizeScale = terminalState.scale;

      if (terminalAlphaScale <= 0.01 || terminalSizeScale <= 0.01) {
        continue;
      }

      const trailLength = getRoutePulseTrailLength(
        route,
        routeIndex,
        pulse,
        style,
        tuning,
      ) * terminalSizeScale;
      const pulseWave =
        (Math.sin(
          time * 0.0022 * speed * speedMultiplier +
            pulse * 2.1 +
            routeIndex * 0.13 +
            route.phase,
        ) +
          1) /
        2;
      const radius =
        (style.width * 2.2 + 1.4) *
        widthScale *
        style.pulseWidthScale *
        (0.65 + pulseWave * 0.55) *
        terminalSizeScale;
      const bloomColor = pearlescentColor(
        route,
        routeIndex + pulse,
        time + pulse * 140,
        tuning.pulsePearl,
        tuning.theme,
      );

      if (trailLength > 0.5) {
        const tailDistance = Math.max(0, headDistance - trailLength);
        const trailAlpha = intensity * style.pulseAlpha * terminalAlphaScale;
        const broadHalfWidth =
          ((style.substrateWidth + widthScale * style.pulseWidthScale * 1.2) *
            terminalSizeScale) /
          2;
        const thinHalfWidth =
          ((style.width + widthScale * style.pulseWidthScale * 0.85) *
            terminalSizeScale) /
          2;

        forEachLineAtLengthRange(
          route.points,
          tailDistance,
          headDistance,
          (start, end, _startDistance, endDistance) => {
            const tailAlphaScale = getPulseTailAlphaScale(
              endDistance,
              tailDistance,
              headDistance,
            );

            lineData.push(
              start.x,
              start.y,
              end.x,
              end.y,
              bloomColor.r / 255,
              bloomColor.g / 255,
              bloomColor.b / 255,
              trailAlpha * 0.28 * tailAlphaScale,
              broadHalfWidth,
              broadHalfWidth,
              0,
              0,
              start.x,
              start.y,
              end.x,
              end.y,
              color.r / 255,
              color.g / 255,
              color.b / 255,
              trailAlpha * 0.48 * tailAlphaScale,
              thinHalfWidth,
              thinHalfWidth,
              0,
              0,
            );
          },
          getPulseTailMaxLineLength(tailDistance, headDistance),
        );
      }

      bloomData.push(
        point.x,
        point.y,
        radius * 3.4,
        Math.max(0.75, radius * 0.34),
        bloomColor.r / 255,
        bloomColor.g / 255,
        bloomColor.b / 255,
        intensity * 0.92 * style.pulseAlpha * terminalAlphaScale,
        color.r / 255,
        color.g / 255,
        color.b / 255,
        intensity * 0.3 * style.pulseAlpha * terminalAlphaScale,
      );
    }
  }

  if (lineData.length <= 0 && bloomData.length <= 0) {
    return null;
  }

  return {
    blooms: bloomData.length > 0 ? new Float32Array(bloomData) : null,
    lines: lineData.length > 0 ? new Float32Array(lineData) : null,
  };
}

function drawShaderRoutePulses(
  renderer: ShaderRippleRenderer,
  routes: Route[],
  layer: StaticLayer,
  time: number,
  tuning: CircuitTuning,
) {
  const instanceData = makeRoutePulseInstanceData(routes, time, tuning);

  if (!instanceData) {
    return;
  }

  const gl = renderer.gl;

  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);

  if (instanceData.lines) {
    const instanceCount =
      instanceData.lines.length / ROUTE_LINE_INSTANCE_FLOATS;

    gl.useProgram(renderer.routeLineProgram);
    gl.bindVertexArray(renderer.routeLineVertexArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.routeLineInstanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, instanceData.lines, gl.DYNAMIC_DRAW);
    if (renderer.routeLineUniforms.layerSize) {
      gl.uniform2f(
        renderer.routeLineUniforms.layerSize,
        layer.width,
        layer.height,
      );
    }
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, instanceCount);
  }

  if (instanceData.blooms) {
    const instanceCount =
      instanceData.blooms.length / ROUTE_BLOOM_INSTANCE_FLOATS;

    gl.useProgram(renderer.routeBloomProgram);
    gl.bindVertexArray(renderer.routeBloomVertexArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.routeBloomInstanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, instanceData.blooms, gl.DYNAMIC_DRAW);
    if (renderer.routeBloomUniforms.layerSize) {
      gl.uniform2f(
        renderer.routeBloomUniforms.layerSize,
        layer.width,
        layer.height,
      );
    }
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, instanceCount);
  }

  gl.disable(gl.BLEND);
  gl.bindVertexArray(null);
}

function getTextDistanceAtCell(field: RoutingField, cell: Cell) {
  const x = Math.round(clamp(cell.x, 0, field.cols - 1));
  const y = Math.round(clamp(cell.y, 0, field.rows - 1));

  return field.textDistance[y * field.cols + x] ?? field.textDistanceMax;
}

function makeTextWaveFieldCanvas(
  plan: BoardPlan | null,
  width: number,
  height: number,
) {
  const canvas = document.createElement("canvas");

  if (!plan) {
    canvas.width = 1;
    canvas.height = 1;
    return { canvas, maxDistance: 1 };
  }

  const { field } = plan;
  const scaleX = width / field.width;
  const scaleY = height / field.height;
  const distanceScale = (scaleX + scaleY) / 2;
  const maxDistance = Math.max(
    field.cell * distanceScale,
    field.textDistanceMax * field.cell * distanceScale,
  );
  canvas.width = field.cols;
  canvas.height = field.rows;

  const context = canvas.getContext("2d");

  if (!context) {
    return { canvas, maxDistance };
  }

  const image = context.createImageData(field.cols, field.rows);

  for (let index = 0; index < field.textDistance.length; index += 1) {
    const value = Math.round(
      clamp(field.textDistance[index] / field.textDistanceMax, 0, 1) * 255,
    );
    const offset = index * 4;
    image.data[offset] = value;
    image.data[offset + 1] = value;
    image.data[offset + 2] = value;
    image.data[offset + 3] = 255;
  }

  context.putImageData(image, 0, 0);

  return { canvas, maxDistance };
}

function makePadPulseEntries(
  plan: BoardPlan,
  width: number,
  height: number,
): PadPulseEntry[] {
  const { field, terminalPads } = plan;
  const scaleX = width / field.width;
  const scaleY = height / field.height;
  const distanceScale = (scaleX + scaleY) / 2;

  return terminalPads.map((pad) => {
    const basePoint = cellToPoint(field, pad.cell);
    const point = {
      x: basePoint.x * scaleX,
      y: basePoint.y * scaleY,
    };

    return {
      distance: getTextDistanceAtCell(field, pad.cell) * field.cell * distanceScale,
      pad,
      point,
    };
  });
}

function drawMaskedSystemRipple(
  context: CanvasRenderingContext2D,
  layer: StaticLayer,
  plan: BoardPlan,
  time: number,
  tuning: CircuitTuning,
) {
  const intensity = tuning.systemRippleIntensity;

  if (intensity <= 0) {
    return;
  }

  const effectContext = layer.effectCanvas.getContext("2d");

  if (!effectContext) {
    return;
  }

  const metrics = getSystemRippleMetrics(
    plan.field,
    layer.width,
    layer.height,
    tuning,
  );
  const effectScale = layer.effectPixelRatio / layer.pixelRatio;
  const { x: centerX, y: centerY } = metrics.center;

  effectContext.setTransform(1, 0, 0, 1, 0, 0);
  effectContext.clearRect(
    0,
    0,
    layer.effectCanvas.width,
    layer.effectCanvas.height,
  );
  effectContext.setTransform(
    layer.effectPixelRatio,
    0,
    0,
    layer.effectPixelRatio,
    0,
    0,
  );
  effectContext.globalCompositeOperation = "lighter";
  effectContext.lineCap = "round";
  effectContext.lineJoin = "round";

  for (let wave = 0; wave < metrics.waveCount; wave += 1) {
    const progress = getSystemRippleProgress(metrics, time, wave);
    const fade = getSystemRippleFade(progress);

    if (fade <= 0) {
      continue;
    }

    const alpha = intensity * fade;
    const radius = getSystemRippleRadius(metrics, progress);
    const color = pearlescentSystemColor(
      time,
      wave,
      tuning.systemRipplePearl,
      tuning.theme,
    );
    const highlight = mixRgb(color, { r: 255, g: 255, b: 255 }, 0.48);

    for (let step = 0; step <= metrics.tailSteps; step += 1) {
      const tailProgress = step / metrics.tailSteps;
      const tailRadius = radius - tailProgress * metrics.tailLength;

      if (tailRadius <= 0.1) {
        continue;
      }

      const tailFade = Math.pow(1 - tailProgress, metrics.sharpness * 1.15);
      const tailAlpha = alpha * tailFade;
      const tailWidth =
        metrics.bandWidth *
        (0.72 + metrics.feather * 0.26) *
        (1 - tailProgress * 0.28);

      effectContext.shadowColor = rgbString(color, tailAlpha * 0.42);
      effectContext.shadowBlur =
        metrics.bandWidth *
        metrics.feather *
        (0.42 + (1 - tailProgress) * 0.44) *
        effectScale;
      effectContext.strokeStyle = rgbString(color, tailAlpha * 0.22);
      effectContext.lineWidth = tailWidth;
      effectContext.beginPath();
      effectContext.arc(centerX, centerY, tailRadius, 0, Math.PI * 2);
      effectContext.stroke();
    }

    effectContext.shadowColor = rgbString(color, alpha * 0.48);
    effectContext.shadowBlur =
      metrics.bandWidth * (0.72 + metrics.feather * 0.5) * effectScale;
    effectContext.strokeStyle = rgbString(color, alpha * 0.24);
    effectContext.lineWidth =
      metrics.bandWidth * (1.2 + metrics.feather * 0.42);
    effectContext.beginPath();
    effectContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
    effectContext.stroke();

    effectContext.shadowBlur = 0;
    effectContext.strokeStyle = rgbString(highlight, alpha * 0.72);
    effectContext.lineWidth = Math.max(1, metrics.bandWidth * 0.13);
    effectContext.beginPath();
    effectContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
    effectContext.stroke();
  }

  effectContext.setTransform(1, 0, 0, 1, 0, 0);
  effectContext.shadowBlur = 0;
  effectContext.globalCompositeOperation = "destination-in";
  effectContext.drawImage(
    layer.maskCanvas,
    0,
    0,
    layer.effectCanvas.width,
    layer.effectCanvas.height,
  );
  effectContext.globalCompositeOperation = "source-over";

  context.save();
  context.globalCompositeOperation = "lighter";
  context.drawImage(
    layer.effectCanvas,
    0,
    0,
    context.canvas.width,
    context.canvas.height,
  );
  context.restore();
}

function drawShaderMaskedSystemRipple(
  canvas: HTMLCanvasElement,
  pulseCanvas: HTMLCanvasElement,
  renderer: ShaderRippleRenderer | null,
  state: DrawState,
  time: number,
  hasCanvasPulses: boolean,
) {
  const plan = state.plan;

  if (!renderer || !plan || state.reducedMotion) {
    if (renderer) {
      renderer.gl.clear(renderer.gl.COLOR_BUFFER_BIT);
    }
    return;
  }

  const pixelRatio = getRenderPixelRatio();
  const layer = getStaticLayer(
    state,
    canvas.clientWidth,
    canvas.clientHeight,
    pixelRatio,
  );

  if (!layer) {
    renderer.gl.clear(renderer.gl.COLOR_BUFFER_BIT);
    return;
  }

  const gl = renderer.gl;
  const metrics = getSystemRippleMetrics(
    plan.field,
    layer.width,
    layer.height,
    state.tuning,
    layer.waveMaxDistance,
  );

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(renderer.program);
  gl.bindVertexArray(renderer.vertexArray);

  if (renderer.maskSource !== layer.maskCanvas) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderer.maskTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      layer.maskCanvas,
    );
    renderer.maskSource = layer.maskCanvas;
  } else {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderer.maskTexture);
  }

  if (renderer.staticSource !== layer.canvas) {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, renderer.staticTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      layer.canvas,
    );
    renderer.staticSource = layer.canvas;
  } else {
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, renderer.staticTexture);
  }

  if (renderer.waveFieldSource !== layer.waveCanvas) {
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, renderer.waveFieldTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      layer.waveCanvas,
    );
    renderer.waveFieldSource = layer.waveCanvas;
  } else {
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, renderer.waveFieldTexture);
  }

  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, renderer.pulseTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  if (hasCanvasPulses) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pulseCanvas,
    );
    renderer.pulseSource = pulseCanvas;
  } else if (renderer.pulseSource) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]),
    );
    renderer.pulseSource = null;
  }

  if (renderer.uniforms.mask) {
    gl.uniform1i(renderer.uniforms.mask, 0);
  }
  if (renderer.uniforms.staticLayer) {
    gl.uniform1i(renderer.uniforms.staticLayer, 1);
  }
  if (renderer.uniforms.pulse) {
    gl.uniform1i(renderer.uniforms.pulse, 2);
  }
  if (renderer.uniforms.waveField) {
    gl.uniform1i(renderer.uniforms.waveField, 3);
  }
  if (renderer.uniforms.layerSize) {
    gl.uniform2f(renderer.uniforms.layerSize, layer.width, layer.height);
  }
  if (renderer.uniforms.center) {
    gl.uniform2f(renderer.uniforms.center, metrics.center.x, metrics.center.y);
  }
  if (renderer.uniforms.time) {
    gl.uniform1f(renderer.uniforms.time, time);
  }
  setRgbUniform(gl, renderer.uniforms.systemBase, state.tuning.theme.systemBaseColor);
  setRgbUniform(gl, renderer.uniforms.pearl0, state.tuning.theme.pearlColors[0]);
  setRgbUniform(gl, renderer.uniforms.pearl1, state.tuning.theme.pearlColors[1]);
  setRgbUniform(gl, renderer.uniforms.pearl2, state.tuning.theme.pearlColors[2]);
  setRgbUniform(gl, renderer.uniforms.pearl3, state.tuning.theme.pearlColors[3]);
  if (renderer.uniforms.bandWidth) {
    gl.uniform1f(renderer.uniforms.bandWidth, metrics.bandWidth);
  }
  if (renderer.uniforms.feather) {
    gl.uniform1f(renderer.uniforms.feather, metrics.feather);
  }
  if (renderer.uniforms.intensity) {
    gl.uniform1f(
      renderer.uniforms.intensity,
      state.tuning.systemRippleIntensity,
    );
  }
  if (renderer.uniforms.pearl) {
    gl.uniform1f(renderer.uniforms.pearl, state.tuning.systemRipplePearl);
  }
  if (renderer.uniforms.sharpness) {
    gl.uniform1f(renderer.uniforms.sharpness, metrics.sharpness);
  }
  if (renderer.uniforms.speed) {
    gl.uniform1f(renderer.uniforms.speed, metrics.speed);
  }
  if (renderer.uniforms.spread) {
    gl.uniform1f(renderer.uniforms.spread, metrics.spread);
  }
  if (renderer.uniforms.startShare) {
    gl.uniform1f(
      renderer.uniforms.startShare,
      metrics.maxRadius * metrics.startRadiusShare,
    );
  }
  if (renderer.uniforms.tailLength) {
    gl.uniform1f(renderer.uniforms.tailLength, metrics.tailLength);
  }
  if (renderer.uniforms.tailSteps) {
    gl.uniform1f(renderer.uniforms.tailSteps, metrics.tailSteps);
  }
  if (renderer.uniforms.travelRadius) {
    gl.uniform1f(renderer.uniforms.travelRadius, metrics.travelRadius);
  }
  if (renderer.uniforms.waveCount) {
    gl.uniform1i(renderer.uniforms.waveCount, metrics.waveCount);
  }

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.bindVertexArray(null);
  drawShaderPadPulses(renderer, layer, time, state.tuning);
  drawShaderRoutePulses(renderer, plan.routes, layer, time, state.tuning);
}

function drawPulses(
  context: CanvasRenderingContext2D,
  routes: Route[],
  time: number,
  tuning: CircuitTuning,
) {
  const intensity = tuning.pulseIntensity;
  const pulseCount = Math.max(1, Math.round(tuning.pulseCount));
  const speed = tuning.pulseSpeed;
  const widthScale = tuning.pulseWidth;
  const detail = clamp(tuning.pulseDetail, 0.35, 2);
  const shimmerStride = Math.max(
    1,
    Math.ceil(routes.length / (PULSE_SHIMMER_ROUTE_BUDGET * detail)),
  );
  const bloomStride = Math.max(
    1,
    Math.ceil((routes.length * pulseCount) / (PULSE_BLOOM_BUDGET * detail)),
  );

  if (intensity <= 0 || pulseCount <= 0) {
    return;
  }

  context.save();
  context.globalCompositeOperation = "lighter";
  context.lineCap = "round";
  context.lineJoin = "round";

  for (let routeIndex = 0; routeIndex < routes.length; routeIndex += 1) {
    const route = routes[routeIndex];
    const style = getRouteRenderStyle(route);
    const ripplePhase =
      time * 0.0011 * speed +
      route.phase * Math.PI * 2 +
      route.originPoint.x * 0.006 +
      route.originPoint.y * 0.004;
    const ripple = (Math.sin(ripplePhase) + 1) / 2;
    const shimmer = Math.max(0, (ripple - 0.44) / 0.56);
    const color = pearlescentColor(
      route,
      routeIndex,
      time,
      tuning.pulsePearl * (0.35 + shimmer * 0.65),
      tuning.theme,
    );

    if (shimmer > 0.03 && routeIndex % shimmerStride === 0) {
      for (const segment of route.segments) {
        context.strokeStyle = rgbString(
          color,
          shimmer * intensity * 0.26 * style.pulseAlpha,
        );
        context.lineWidth =
          style.substrateWidth +
          shimmer * widthScale * style.pulseWidthScale * (style.width + 1.2);
        strokeSegmentPath(context, segment);

        context.strokeStyle = rgbString(
          color,
          shimmer * intensity * 0.42 * style.pulseAlpha,
        );
        context.lineWidth =
          style.width + shimmer * widthScale * style.pulseWidthScale * 0.9;
        strokeSegmentPath(context, segment);
      }
    }

    for (let pulse = 0; pulse < pulseCount; pulse += 1) {
      if ((routeIndex * pulseCount + pulse) % bloomStride !== 0) {
        continue;
      }

      const { progress, speedMultiplier } = getRoutePulseMotion(
        route,
        routeIndex,
        pulse,
        pulseCount,
        time,
        tuning,
      );
      const headDistance = progress * route.length;
      const point = getPointAtLength(route.points, headDistance);
      const terminalState = getRoutePulseTerminalState(progress);
      const terminalAlphaScale = terminalState.alphaScale;
      const terminalSizeScale = terminalState.scale;

      if (terminalAlphaScale <= 0.01 || terminalSizeScale <= 0.01) {
        continue;
      }

      const trailLength = getRoutePulseTrailLength(
        route,
        routeIndex,
        pulse,
        style,
        tuning,
      ) * terminalSizeScale;
      const pulseWave =
        (Math.sin(
          time * 0.0022 * speed * speedMultiplier +
            pulse * 2.1 +
            routeIndex * 0.13 +
            route.phase,
        ) +
          1) /
        2;
      const radius =
        (style.width * 2.2 + 1.4) *
        widthScale *
        style.pulseWidthScale *
        (0.65 + pulseWave * 0.55) *
        terminalSizeScale;
      const bloomColor = pearlescentColor(
        route,
        routeIndex + pulse,
        time + pulse * 140,
        tuning.pulsePearl,
        tuning.theme,
      );

      if (trailLength > 0.5) {
        const tailDistance = Math.max(0, headDistance - trailLength);

        forEachLineAtLengthRange(
          route.points,
          tailDistance,
          headDistance,
          (start, end, _startDistance, endDistance) => {
            const tailAlphaScale = getPulseTailAlphaScale(
              endDistance,
              tailDistance,
              headDistance,
            );

            context.strokeStyle = rgbString(
              bloomColor,
              intensity *
                0.28 *
                style.pulseAlpha *
                terminalAlphaScale *
                tailAlphaScale,
            );
            context.lineWidth =
              (style.substrateWidth + widthScale * style.pulseWidthScale * 1.2) *
              terminalSizeScale;
            context.beginPath();
            context.moveTo(start.x, start.y);
            context.lineTo(end.x, end.y);
            context.stroke();

            context.strokeStyle = rgbString(
              color,
              intensity *
                0.48 *
                style.pulseAlpha *
                terminalAlphaScale *
                tailAlphaScale,
            );
            context.lineWidth =
              (style.width + widthScale * style.pulseWidthScale * 0.85) *
              terminalSizeScale;
            context.beginPath();
            context.moveTo(start.x, start.y);
            context.lineTo(end.x, end.y);
            context.stroke();
          },
          getPulseTailMaxLineLength(tailDistance, headDistance),
        );
      }
      const pulseGradient = context.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        radius * 3.4,
      );
      pulseGradient.addColorStop(
        0,
        rgbString(
          bloomColor,
          intensity * 0.92 * style.pulseAlpha * terminalAlphaScale,
        ),
      );
      pulseGradient.addColorStop(
        0.34,
        rgbString(color, intensity * 0.3 * style.pulseAlpha * terminalAlphaScale),
      );
      pulseGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = pulseGradient;
      context.beginPath();
      context.arc(point.x, point.y, radius * 3.4, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = rgbString(
        bloomColor,
        intensity * 0.85 * style.pulseAlpha * terminalAlphaScale,
      );
      context.beginPath();
      context.arc(
        point.x,
        point.y,
        Math.max(0.75, radius * 0.34),
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  }

  context.restore();
}

function getStaticLayer(
  state: DrawState,
  width: number,
  height: number,
  pixelRatio: number,
) {
  const cached = state.staticLayer;
  const layerWidth = state.plan?.field.width ?? width;
  const layerHeight = state.plan?.field.height ?? height;

  if (
    cached &&
    cached.plan === state.plan &&
    cached.width === layerWidth &&
    cached.height === layerHeight &&
    cached.pixelRatio === pixelRatio
  ) {
    return cached;
  }

  const canvas = document.createElement("canvas");
  const effectCanvas = document.createElement("canvas");
  const maskCanvas = document.createElement("canvas");
  const effectPixelRatio = pixelRatio * CANVAS_EFFECT_PIXEL_RATIO_SCALE;
  canvas.width = Math.max(1, Math.floor(layerWidth * pixelRatio));
  canvas.height = Math.max(1, Math.floor(layerHeight * pixelRatio));
  effectCanvas.width = Math.max(1, Math.floor(layerWidth * effectPixelRatio));
  effectCanvas.height = Math.max(1, Math.floor(layerHeight * effectPixelRatio));
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;

  const context = canvas.getContext("2d");
  const maskContext = maskCanvas.getContext("2d");

  if (!context || !maskContext) {
    return null;
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  drawStaticBoard(context, layerWidth, layerHeight, state.plan, state.tuning);
  maskContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  drawCircuitMask(
    maskContext,
    layerWidth,
    layerHeight,
    state.plan,
    state.tuning,
  );
  const waveField = makeTextWaveFieldCanvas(
    state.plan,
    layerWidth,
    layerHeight,
  );
  const padPulseEntries = state.plan
    ? makePadPulseEntries(state.plan, layerWidth, layerHeight)
    : [];

  const layer = {
    canvas,
    effectCanvas,
    effectPixelRatio,
    height: layerHeight,
    maskCanvas,
    padPulseEntries,
    pixelRatio,
    plan: state.plan,
    waveCanvas: waveField.canvas,
    waveMaxDistance: waveField.maxDistance,
    width: layerWidth,
  };

  state.staticLayer = layer;
  return layer;
}

function drawBoard(
  staticCanvas: HTMLCanvasElement,
  dynamicCanvas: HTMLCanvasElement,
  staticContext: CanvasRenderingContext2D,
  context: CanvasRenderingContext2D,
  state: DrawState,
  time: number,
  useCanvasRipple: boolean,
  useCanvasPadPulses: boolean,
  useCanvasRoutePulses: boolean,
) {
  const width = dynamicCanvas.clientWidth;
  const height = dynamicCanvas.clientHeight;
  const pixelRatio = getRenderPixelRatio();
  const dynamicPixelRatio =
    dynamicCanvas.width / Math.max(1, Math.floor(width));
  const staticLayer = getStaticLayer(state, width, height, pixelRatio);

  if (
    staticLayer &&
    useCanvasRipple &&
    (state.renderedStaticLayer !== staticLayer ||
      state.renderedStaticWidth !== staticCanvas.width ||
      state.renderedStaticHeight !== staticCanvas.height)
  ) {
    staticContext.setTransform(1, 0, 0, 1, 0, 0);
    staticContext.clearRect(0, 0, staticCanvas.width, staticCanvas.height);
    staticContext.drawImage(
      staticLayer.canvas,
      0,
      0,
      staticCanvas.width,
      staticCanvas.height,
    );
    state.renderedStaticHeight = staticCanvas.height;
    state.renderedStaticLayer = staticLayer;
    state.renderedStaticWidth = staticCanvas.width;
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, dynamicCanvas.width, dynamicCanvas.height);

  if (!state.plan || state.reducedMotion) {
    return;
  }

  if (useCanvasRipple && staticLayer) {
    drawMaskedSystemRipple(
      context,
      staticLayer,
      state.plan,
      time,
      state.tuning,
    );
  }

  const scaleX = width / state.plan.field.width;
  const scaleY = height / state.plan.field.height;
  context.setTransform(
    dynamicPixelRatio * scaleX,
    0,
    0,
    dynamicPixelRatio * scaleY,
    0,
    0,
  );
  if (staticLayer && useCanvasPadPulses) {
    drawRipplePadPulses(context, staticLayer, time, state.tuning);
  }
  if (useCanvasRoutePulses) {
    drawPulses(context, state.plan.routes, time, state.tuning);
  }
}

function getLetterOverlayLayer(
  state: DrawState,
  layerWidth: number,
  layerHeight: number,
  pixelRatio: number,
) {
  const plan = state.plan;

  if (!plan) {
    state.letterOverlayLayer = null;
    return null;
  }

  const cached = state.letterOverlayLayer;

  if (
    cached &&
    cached.plan === plan &&
    cached.tuning === state.tuning &&
    cached.width === layerWidth &&
    cached.height === layerHeight &&
    cached.pixelRatio === pixelRatio
  ) {
    return cached;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(layerWidth * pixelRatio));
  canvas.height = Math.max(1, Math.floor(layerHeight * pixelRatio));

  const context = canvas.getContext("2d");

  if (!context) {
    state.letterOverlayLayer = null;
    return null;
  }

  const scaleX = layerWidth / plan.field.width;
  const scaleY = layerHeight / plan.field.height;

  context.save();
  context.setTransform(
    pixelRatio * scaleX,
    0,
    0,
    pixelRatio * scaleY,
    0,
    0,
  );
  drawLetterVolume(
    context,
    plan.field,
    plan.terminalPads,
    plan.routes,
    state.tuning,
  );
  drawTerminalConnections(
    context,
    plan.field,
    plan.terminalPads,
    plan.routes,
    state.tuning.theme,
  );
  context.restore();

  const layer: LetterOverlayLayer = {
    canvas,
    height: layerHeight,
    pixelRatio,
    plan,
    tuning: state.tuning,
    width: layerWidth,
  };

  state.letterOverlayLayer = layer;
  return layer;
}

function drawShaderLetterOverlay(
  dynamicCanvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  state: DrawState,
) {
  const width = dynamicCanvas.clientWidth;
  const height = dynamicCanvas.clientHeight;
  const pixelRatio = getRenderPixelRatio();
  const layer = getLetterOverlayLayer(state, width, height, pixelRatio);

  if (
    layer &&
    state.renderedLetterOverlayLayer === layer &&
    state.renderedLetterOverlayWidth === dynamicCanvas.width &&
    state.renderedLetterOverlayHeight === dynamicCanvas.height
  ) {
    return;
  }

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, dynamicCanvas.width, dynamicCanvas.height);

  if (!layer) {
    state.renderedLetterOverlayHeight = dynamicCanvas.height;
    state.renderedLetterOverlayLayer = null;
    state.renderedLetterOverlayWidth = dynamicCanvas.width;
    return;
  }

  context.drawImage(
    layer.canvas,
    0,
    0,
    dynamicCanvas.width,
    dynamicCanvas.height,
  );
  state.renderedLetterOverlayHeight = dynamicCanvas.height;
  state.renderedLetterOverlayLayer = layer;
  state.renderedLetterOverlayWidth = dynamicCanvas.width;
}

function recordCircuitPerf(
  canvas: HTMLCanvasElement,
  state: DrawState,
  time: number,
  renderMs: number,
) {
  const perfWindow = window as CircuitPerfWindow;
  const previousFrameTime = perfWindow.__circuitPerfLastFrameTime ?? time;
  const samples = perfWindow.__circuitPerf?.samples ?? [];
  const updateCount = (perfWindow.__circuitPerf?.updateCount ?? 0) + 1;

  samples.push({
    frameIntervalMs: time - previousFrameTime,
    height: canvas.clientHeight,
    padCount: state.plan?.terminalPads.length ?? 0,
    pixelRatio: canvas.width / Math.max(1, canvas.clientWidth),
    renderMs,
    routeCount: state.plan?.routes.length ?? 0,
    timestamp: time,
    width: canvas.clientWidth,
  });

  if (samples.length > 360) {
    samples.splice(0, samples.length - 240);
  }

  perfWindow.__circuitPerfLastFrameTime = time;
  perfWindow.__circuitPerf = {
    lastUpdated: performance.now(),
    samples,
    targetMs: FRAME_INTERVAL,
    updateCount,
  };

  if (updateCount % 60 === 0) {
    document.documentElement.dataset.circuitPerf = JSON.stringify(
      summarizeCircuitPerf(perfWindow.__circuitPerf),
    );
  }
}

function summarizeCircuitPerf(perf: CircuitPerfState) {
  const samples = perf.samples
    .slice(-180)
    .filter((sample) => sample.frameIntervalMs > 0);
  const renderValues = samples
    .map((sample) => sample.renderMs)
    .sort((a, b) => a - b);
  const frameValues = samples
    .map((sample) => sample.frameIntervalMs)
    .sort((a, b) => a - b);
  const average = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  const percentile = (values: number[], amount: number) =>
    values[Math.min(values.length - 1, Math.floor(values.length * amount))] ?? 0;
  const last = samples[samples.length - 1] ?? null;

  return {
    avgFrameMs: average(frameValues),
    avgRenderMs: average(renderValues),
    height: last?.height ?? 0,
    maxFrameMs: frameValues[frameValues.length - 1] ?? 0,
    maxRenderMs: renderValues[renderValues.length - 1] ?? 0,
    p95FrameMs: percentile(frameValues, 0.95),
    p95RenderMs: percentile(renderValues, 0.95),
    padCount: last?.padCount ?? 0,
    pixelRatio: last?.pixelRatio ?? 0,
    routeCount: last?.routeCount ?? 0,
    sampleCount: samples.length,
    targetMs: perf.targetMs,
    width: last?.width ?? 0,
  };
}

function makeTraceWidthRange(value: number): [number, number] {
  return [Math.max(0.12, value - 0.05), value + 0.05];
}

function getRouteRenderStyle(route: Route) {
  const isInnerRoute = route.terminalKind === "inner";
  const width = isInnerRoute ? route.width * 0.62 : route.width;

  return {
    coreAlpha: isInnerRoute ? 0.72 : 1,
    glowAlpha: isInnerRoute ? 0.42 : 1,
    glowWidth: width + (isInnerRoute ? 0.28 : 0.9),
    maskWidth: width + (isInnerRoute ? 0.72 : 1.35),
    padCoreAlpha: isInnerRoute ? 0.68 : 1,
    pulseAlpha: isInnerRoute ? 0.52 : 1,
    pulseWidthScale: isInnerRoute ? 0.56 : 1,
    substrateAlpha: isInnerRoute ? 0.46 : 0.8,
    substrateWidth: width + (isInnerRoute ? 0.82 : 2.1),
    viaAlpha: isInnerRoute ? 0.58 : 1,
    width,
  };
}

function updateTraceWidth(tuning: CircuitTuning, value: number): CircuitTuning {
  return {
    ...tuning,
    traceWidthInner: makeTraceWidthRange(value + 0.04),
    traceWidthOuter: makeTraceWidthRange(value),
  };
}

function getOriginSpreadValue(tuning: CircuitTuning) {
  return tuning.sideOriginFractionMax - tuning.sideOriginFractionMin;
}

function updateOriginSpread(tuning: CircuitTuning, value: number): CircuitTuning {
  const spread = clamp(value, 0.35, 1);
  const inset = (1 - spread) / 2;

  return {
    ...tuning,
    sideOriginFractionMax: 1 - inset,
    sideOriginFractionMin: inset,
  };
}

function cloneTuning(tuning: CircuitTuning): CircuitTuning {
  return {
    ...tuning,
    innerRouteSidePattern: [...tuning.innerRouteSidePattern],
    traceWidthInner: [...tuning.traceWidthInner],
    traceWidthOuter: [...tuning.traceWidthOuter],
  };
}

function getIsometricSceneValues(tuning: CircuitTuning) {
  return {
    depth: clamp(tuning.isoDepth, 0.35, 1.8),
    depthVariance: clamp(tuning.isoDepthVariance, 0, 1),
    lift: clamp(tuning.isoLift, -160, 120),
    perspective: clamp(tuning.isoPerspective, 700, 1900),
    pitch: clamp(tuning.isoPitch, 35, 68),
    scale: clamp(tuning.isoScale, 0.62, 1.15),
    shadow: clamp(tuning.isoShadow, 0, 1.6),
    yaw: clamp(tuning.isoYaw, -62, -20),
  };
}

function getIsometricSceneStyle(tuning: CircuitTuning): CSSProperties {
  const { perspective } = getIsometricSceneValues(tuning);

  return {
    perspective: `${perspective}px`,
    perspectiveOrigin: "50% 46%",
  };
}

function getIsometricBoardStyle(tuning: CircuitTuning): CSSProperties {
  const { depth, lift, pitch, scale, shadow, yaw } =
    getIsometricSceneValues(tuning);
  const glowColor = tuning.theme.systemBaseColor;
  const ambientShadow = 0.26 + shadow * 0.1;
  const contactShadow = 20 + shadow * 26;
  const sceneGlow = 14 + depth * 12 + shadow * 8;

  return {
    filter: [
      `drop-shadow(0 ${Math.round(contactShadow)}px ${Math.round(
        contactShadow * 0.82,
      )}px rgba(0, 0, 0, ${ambientShadow.toFixed(3)}))`,
      `drop-shadow(0 0 ${Math.round(sceneGlow)}px ${rgbString(
        glowColor,
        0.1 + shadow * 0.045,
      )})`,
    ].join(" "),
    transform: `translate3d(0, ${lift}px, 0) rotateX(${pitch}deg) rotateZ(${yaw}deg) scale(${scale})`,
    transformOrigin: "50% 50%",
    transformStyle: "preserve-3d",
    willChange: "transform",
  };
}

function getIsometricFloorShadowStyle(tuning: CircuitTuning): CSSProperties {
  const { depth, lift, pitch, scale, shadow, yaw } =
    getIsometricSceneValues(tuning);
  const color = tuning.theme.systemBaseColor;
  const opacity = clamp(0.12 + shadow * 0.26, 0, 0.58);
  const width = clamp(76 + depth * 7 + shadow * 4, 70, 92);
  const height = clamp(28 + (68 - pitch) * 0.22 + depth * 4, 22, 45);

  return {
    background: `radial-gradient(ellipse at center, ${rgbString(
      color,
      0.22 + shadow * 0.06,
    )} 0%, rgba(0, 0, 0, ${0.18 + shadow * 0.08}) 42%, rgba(0, 0, 0, 0) 72%)`,
    borderRadius: "999px",
    filter: `blur(${Math.round(18 + shadow * 18)}px)`,
    height: `${height}%`,
    left: `${(100 - width) / 2}%`,
    opacity,
    top: `${46 + lift / 18}%`,
    transform: `rotateZ(${yaw}deg) scale(${scale * (1 + depth * 0.08)}, ${
      scale * 0.72
    })`,
    transformOrigin: "50% 50%",
    width: `${width}%`,
  };
}

const DIAL_TUNING_PANEL_ID = "circuit-tuning";
const DIAL_TUNING_PANEL_NAME = "Circuit Tuning";
const DIAL_SCENE_GROUP_TITLE = "Scene";
const DIAL_PRESET_GROUP_TITLE = "Presets";
const DIAL_TYPEFACE_GROUP_TITLE = "Typefaces";
const DIAL_TEXT_PATH = `${DIAL_SCENE_GROUP_TITLE}.Text`;
const DIAL_RESET_ACTION_PATH = `${DIAL_SCENE_GROUP_TITLE}.Reset`;

function getDialPresetActionPath(id: string) {
  return `${DIAL_SCENE_GROUP_TITLE}.${DIAL_PRESET_GROUP_TITLE}.${id}`;
}

function getDialTypefaceActionPath(id: TextFontKey) {
  return `${DIAL_SCENE_GROUP_TITLE}.${DIAL_TYPEFACE_GROUP_TITLE}.${id}`;
}

type DialNumericControl = {
  displayScale?: number;
  key: NumericTuningKey;
  kind: "numeric";
  label: string;
  max: number;
  min: number;
  step: number;
};

type DialDerivedControl = {
  displayScale?: number;
  kind: "edgeSpread" | "traceWidth";
  label: string;
  max: number;
  min: number;
  step: number;
};

type DialTuningControl = DialNumericControl | DialDerivedControl;

type DialTuningGroup = {
  controls: readonly DialTuningControl[];
  title: string;
};

const DIAL_TUNING_GROUPS = [
  {
    title: "Text Shape",
    controls: [
      {
        displayScale: 100,
        key: "textWidthShare",
        kind: "numeric",
        label: "Text Width",
        max: 90,
        min: 25,
        step: 1,
      },
      {
        displayScale: 100,
        key: "textHeightShare",
        kind: "numeric",
        label: "Text Height",
        max: 90,
        min: 35,
        step: 1,
      },
      {
        key: "textGlyphRows",
        kind: "numeric",
        label: "Text Detail",
        max: 48,
        min: 10,
        step: 1,
      },
      {
        key: "textGlyphMaxCols",
        kind: "numeric",
        label: "Wide Text Detail",
        max: 420,
        min: 60,
        step: 20,
      },
      {
        key: "planLongEdge",
        kind: "numeric",
        label: "Board Resolution",
        max: 1200,
        min: 540,
        step: 60,
      },
      {
        key: "routingCellSize",
        kind: "numeric",
        label: "Circuit Scale",
        max: 9,
        min: 3,
        step: 1,
      },
    ],
  },
  {
    title: "Projection",
    controls: [
      {
        key: "isoYaw",
        kind: "numeric",
        label: "Yaw",
        max: -20,
        min: -62,
        step: 1,
      },
      {
        key: "isoPitch",
        kind: "numeric",
        label: "Pitch",
        max: 68,
        min: 35,
        step: 1,
      },
      {
        key: "isoScale",
        kind: "numeric",
        label: "Scene Scale",
        max: 1.15,
        min: 0.62,
        step: 0.01,
      },
      {
        key: "isoLift",
        kind: "numeric",
        label: "Scene Lift",
        max: 120,
        min: -160,
        step: 5,
      },
      {
        key: "isoPerspective",
        kind: "numeric",
        label: "Perspective",
        max: 1900,
        min: 700,
        step: 50,
      },
      {
        key: "isoDepth",
        kind: "numeric",
        label: "Letter Depth",
        max: 1.8,
        min: 0.35,
        step: 0.05,
      },
      {
        displayScale: 100,
        key: "isoDepthVariance",
        kind: "numeric",
        label: "Depth Variety",
        max: 100,
        min: 0,
        step: 5,
      },
      {
        key: "isoShadow",
        kind: "numeric",
        label: "Ground Shadow",
        max: 1.6,
        min: 0,
        step: 0.05,
      },
    ],
  },
  {
    title: "Pads",
    controls: [
      {
        key: "terminalDensityMultiplier",
        kind: "numeric",
        label: "Pad Density",
        max: 4,
        min: 0.8,
        step: 0.1,
      },
      {
        key: "maxTerminalPads",
        kind: "numeric",
        label: "Max Pads",
        max: 1800,
        min: 300,
        step: 100,
      },
      {
        displayScale: 100,
        key: "innerTerminalShare",
        kind: "numeric",
        label: "Glyph Pad Share",
        max: 100,
        min: 0,
        step: 5,
      },
      {
        key: "padSpacingCells",
        kind: "numeric",
        label: "Pad Spacing",
        max: 4,
        min: 1,
        step: 1,
      },
    ],
  },
  {
    title: "Fanout",
    controls: [
      {
        key: "channelLaneCount",
        kind: "numeric",
        label: "Fanout Lanes",
        max: 20,
        min: 6,
        step: 1,
      },
      {
        key: "channelLanePitchCells",
        kind: "numeric",
        label: "Lane Spacing",
        max: 4,
        min: 1,
        step: 1,
      },
      {
        key: "channelLaneBaseOffsetCells",
        kind: "numeric",
        label: "Fanout Inset",
        max: 8,
        min: 2,
        step: 1,
      },
      {
        key: "channelGateStepCells",
        kind: "numeric",
        label: "Gate Spacing",
        max: 5,
        min: 1,
        step: 1,
      },
      {
        key: "channelGateInsetCells",
        kind: "numeric",
        label: "Gate Ring Offset",
        max: 8,
        min: 2,
        step: 1,
      },
      {
        displayScale: 100,
        kind: "edgeSpread",
        label: "Edge Reach",
        max: 100,
        min: 35,
        step: 5,
      },
    ],
  },
  {
    title: "Trace",
    controls: [
      {
        kind: "traceWidth",
        label: "Trace Thickness",
        max: 0.58,
        min: 0.18,
        step: 0.02,
      },
    ],
  },
  {
    title: "Board Wave",
    controls: [
      {
        key: "systemRippleCount",
        kind: "numeric",
        label: "Wave Count",
        max: 4,
        min: 1,
        step: 1,
      },
      {
        key: "systemRippleIntensity",
        kind: "numeric",
        label: "Wave Glow",
        max: 1.5,
        min: 0,
        step: 0.05,
      },
      {
        key: "systemPadPulseIntensity",
        kind: "numeric",
        label: "Pad Flash",
        max: 1.8,
        min: 0,
        step: 0.05,
      },
      {
        key: "systemPadPulseSize",
        kind: "numeric",
        label: "Pad Flash Size",
        max: 2,
        min: 0.35,
        step: 0.05,
      },
      {
        key: "systemPadPulseDecay",
        kind: "numeric",
        label: "Pad Fade",
        max: 1,
        min: 0,
        step: 0.05,
      },
      {
        key: "systemRippleSpeed",
        kind: "numeric",
        label: "Wave Speed",
        max: 2.5,
        min: 0.2,
        step: 0.05,
      },
      {
        key: "systemRippleWidth",
        kind: "numeric",
        label: "Wave Width",
        max: 2.2,
        min: 0.35,
        step: 0.05,
      },
      {
        key: "systemRippleLength",
        kind: "numeric",
        label: "Wave Length",
        max: 2.5,
        min: 0.15,
        step: 0.05,
      },
      {
        key: "systemRippleSpread",
        kind: "numeric",
        label: "Wave Spread",
        max: 1.85,
        min: 0.35,
        step: 0.05,
      },
      {
        key: "systemRippleFeather",
        kind: "numeric",
        label: "Wave Softness",
        max: 2.5,
        min: 0.35,
        step: 0.05,
      },
      {
        key: "systemRippleSharpness",
        kind: "numeric",
        label: "Wave Contrast",
        max: 2.25,
        min: 0.45,
        step: 0.05,
      },
      {
        displayScale: 100,
        key: "systemRippleStart",
        kind: "numeric",
        label: "Wave Start",
        max: 35,
        min: 0,
        step: 1,
      },
      {
        displayScale: 100,
        key: "systemRipplePearl",
        kind: "numeric",
        label: "Pearl Mix",
        max: 100,
        min: 0,
        step: 5,
      },
    ],
  },
  {
    title: "Trace Pulse",
    controls: [
      {
        key: "pulseCount",
        kind: "numeric",
        label: "Pulse Count",
        max: 10,
        min: 1,
        step: 1,
      },
      {
        key: "pulseIntensity",
        kind: "numeric",
        label: "Trace Glow",
        max: 1.5,
        min: 0,
        step: 0.05,
      },
      {
        key: "pulseSpeed",
        kind: "numeric",
        label: "Pulse Speed",
        max: 2.5,
        min: 0.2,
        step: 0.05,
      },
      {
        key: "pulseSpeedVariance",
        kind: "numeric",
        label: "Speed Variety",
        max: 1,
        min: 0,
        step: 0.05,
      },
      {
        key: "pulseLength",
        kind: "numeric",
        label: "Pulse Length",
        max: 3,
        min: 0,
        step: 0.05,
      },
      {
        key: "pulseLengthVariance",
        kind: "numeric",
        label: "Length Variety",
        max: 1,
        min: 0,
        step: 0.05,
      },
      {
        key: "pulseWidth",
        kind: "numeric",
        label: "Pulse Bloom",
        max: 2.2,
        min: 0.4,
        step: 0.05,
      },
      {
        displayScale: 100,
        key: "pulsePearl",
        kind: "numeric",
        label: "Pearl Mix",
        max: 100,
        min: 0,
        step: 5,
      },
      {
        key: "pulseDetail",
        kind: "numeric",
        label: "Pulse Detail",
        max: 2,
        min: 0.35,
        step: 0.05,
      },
    ],
  },
] as const satisfies readonly DialTuningGroup[];

function getDialControlPath(group: DialTuningGroup, control: DialTuningControl) {
  return `${group.title}.${control.label}`;
}

function getTraceWidthValue(tuning: CircuitTuning) {
  return (tuning.traceWidthOuter[0] + tuning.traceWidthOuter[1]) / 2;
}

function getDialControlValue(tuning: CircuitTuning, control: DialTuningControl) {
  const displayScale = control.displayScale ?? 1;
  let rawValue: number;

  switch (control.kind) {
    case "edgeSpread":
      rawValue = getOriginSpreadValue(tuning);
      break;
    case "traceWidth":
      rawValue = getTraceWidthValue(tuning);
      break;
    case "numeric":
      rawValue = tuning[control.key];
      break;
  }

  return rawValue * displayScale;
}

function stepPrecision(step: number) {
  const decimal = String(step).split(".")[1];

  return decimal ? decimal.length : 0;
}

function snapDialValue(value: number, control: DialTuningControl) {
  const snapped =
    control.min + Math.round((value - control.min) / control.step) * control.step;
  const clamped = clamp(snapped, control.min, control.max);

  return Number(clamped.toFixed(stepPrecision(control.step)));
}

function areDialNumbersEqual(left: number, right: number) {
  return Math.abs(left - right) < 0.0001;
}

function makeDialPanelConfig(tuning: CircuitTuning): DialConfig {
  const config: DialConfig = {};

  config[DIAL_SCENE_GROUP_TITLE] = {
    Text: {
      type: "text",
      default: DEFAULT_WORD,
      placeholder: "Text to route",
    },
    [DIAL_PRESET_GROUP_TITLE]: Object.fromEntries(
      CIRCUIT_PRESETS.map((preset) => [
        preset.id,
        {
          type: "action",
          label: preset.name,
        },
      ]),
    ),
    [DIAL_TYPEFACE_GROUP_TITLE]: Object.fromEntries(
      TEXT_FONT_OPTIONS.map((option) => [
        option.id,
        {
          type: "action",
          label: option.name,
        },
      ]),
    ),
    Reset: {
      type: "action",
      label: "Reset",
    },
  };

  for (const group of DIAL_TUNING_GROUPS) {
    const folder: DialConfig = {};

    for (const control of group.controls) {
      folder[control.label] = [
        getDialControlValue(tuning, control),
        control.min,
        control.max,
        control.step,
      ];
    }

    config[group.title] = folder;
  }

  return config;
}

const DIAL_PANEL_CONFIG = makeDialPanelConfig(DEFAULT_CIRCUIT_TUNING);

function applyDialControlValue(
  tuning: CircuitTuning,
  control: DialTuningControl,
  rawValue: number,
): CircuitTuning {
  if (areDialNumbersEqual(rawValue, getDialControlValue(tuning, control))) {
    return tuning;
  }

  const value = snapDialValue(rawValue, control) / (control.displayScale ?? 1);

  switch (control.kind) {
    case "edgeSpread":
      return areDialNumbersEqual(getOriginSpreadValue(tuning), value)
        ? tuning
        : updateOriginSpread(tuning, value);
    case "traceWidth":
      return areDialNumbersEqual(getTraceWidthValue(tuning), value)
        ? tuning
        : updateTraceWidth(tuning, value);
    case "numeric":
      if (areDialNumbersEqual(tuning[control.key], value)) {
        return tuning;
      }

      return {
        ...tuning,
        [control.key]: value,
      };
  }
}

function applyDialValuesToTuning(
  tuning: CircuitTuning,
  values: Record<string, DialValue>,
) {
  let next = tuning;

  for (const group of DIAL_TUNING_GROUPS) {
    for (const control of group.controls) {
      const value = values[getDialControlPath(group, control)];

      if (typeof value === "number") {
        next = applyDialControlValue(next, control, value);
      }
    }
  }

  return next;
}

function syncTuningToDialStore(tuning: CircuitTuning) {
  for (const group of DIAL_TUNING_GROUPS) {
    for (const control of group.controls) {
      const path = getDialControlPath(group, control);
      const value = getDialControlValue(tuning, control);
      const current = DialStore.getValue(DIAL_TUNING_PANEL_ID, path);

      if (typeof current !== "number" || !areDialNumbersEqual(current, value)) {
        DialStore.updateValue(DIAL_TUNING_PANEL_ID, path, value);
      }
    }
  }
}

function syncDialValue(path: string, value: DialValue) {
  if (DialStore.getValue(DIAL_TUNING_PANEL_ID, path) !== value) {
    DialStore.updateValue(DIAL_TUNING_PANEL_ID, path, value);
  }
}

function syncSceneToDialStore(glyph: string) {
  syncDialValue(DIAL_TEXT_PATH, glyph);
}

type CircuitDialKitControlsOptions = {
  applyPreset: (id: string) => void;
  resetControls: () => void;
  tuning: CircuitTuning;
  updateTypeface: (fontKey: TextFontKey) => void;
};

function useCircuitDialKitControls({
  applyPreset,
  resetControls,
  tuning,
  updateTypeface,
}: CircuitDialKitControlsOptions) {
  useEffect(() => {
    DialStore.registerPanel(
      DIAL_TUNING_PANEL_ID,
      DIAL_TUNING_PANEL_NAME,
      DIAL_PANEL_CONFIG,
    );

    return () => {
      DialStore.unregisterPanel(DIAL_TUNING_PANEL_ID);
    };
  }, []);

  useEffect(() => {
    syncTuningToDialStore(tuning);
  }, [tuning]);

  useEffect(() => {
    syncSceneToDialStore(DEFAULT_WORD);
  }, []);

  useEffect(() => {
    return DialStore.subscribeActions(DIAL_TUNING_PANEL_ID, (action) => {
      const presetAction = CIRCUIT_PRESETS.find(
        (preset) => action === getDialPresetActionPath(preset.id),
      );

      if (presetAction) {
        applyPreset(presetAction.id);
        return;
      }

      const typefaceAction = TEXT_FONT_OPTIONS.find(
        (option) => action === getDialTypefaceActionPath(option.id),
      );

      if (typefaceAction) {
        updateTypeface(typefaceAction.id);
        return;
      }

      if (action === DIAL_RESET_ACTION_PATH) {
        resetControls();
      }
    });
  }, [applyPreset, resetControls, updateTypeface]);
}

const CANVAS_DESCRIPTION =
  "Isometric circuit traces wrap around a beveled circuit letter.";

function clearBoardRenderCaches(state: DrawState) {
  state.letterOverlayLayer = null;
  state.renderedStaticLayer = null;
  state.staticLayer = null;
}

function markBoardPlanStale(state: DrawState) {
  state.planKey = null;
  clearBoardRenderCaches(state);
}

function applyShaderCanvasPresentation(
  staticCanvas: HTMLCanvasElement,
  shaderCanvas: HTMLCanvasElement,
  fallbackCanvas: HTMLCanvasElement,
  shaderReady: boolean,
) {
  staticCanvas.classList.toggle("opacity-0", shaderReady);
  fallbackCanvas.classList.toggle("opacity-0", shaderReady);

  if (shaderReady) {
    staticCanvas.setAttribute("aria-hidden", "true");
    staticCanvas.removeAttribute("aria-label");
    staticCanvas.removeAttribute("role");
    shaderCanvas.removeAttribute("aria-hidden");
    shaderCanvas.setAttribute("aria-label", CANVAS_DESCRIPTION);
    shaderCanvas.setAttribute("role", "img");
    return;
  }

  staticCanvas.removeAttribute("aria-hidden");
  staticCanvas.setAttribute("aria-label", CANVAS_DESCRIPTION);
  staticCanvas.setAttribute("role", "img");
  shaderCanvas.setAttribute("aria-hidden", "true");
  shaderCanvas.removeAttribute("aria-label");
  shaderCanvas.removeAttribute("role");
}

type CircuitBoardSceneProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  letterCanvasRef: RefObject<HTMLCanvasElement | null>;
  shaderCanvasRef: RefObject<HTMLCanvasElement | null>;
  staticCanvasRef: RefObject<HTMLCanvasElement | null>;
  surfaceRef: RefObject<HTMLDivElement | null>;
  tuning: CircuitTuning;
};

type CircuitBoardRefs = Omit<CircuitBoardSceneProps, "tuning">;
type ValueRef<T> = { current: T };
type CanvasSize = { height: number; width: number };

function CircuitBoardScene({
  canvasRef,
  letterCanvasRef,
  shaderCanvasRef,
  staticCanvasRef,
  surfaceRef,
  tuning,
}: CircuitBoardSceneProps) {
  const sceneValues = getIsometricSceneValues(tuning);
  const sceneStyle = getIsometricSceneStyle(tuning);
  const boardStyle = getIsometricBoardStyle(tuning);
  const floorShadowStyle = getIsometricFloorShadowStyle(tuning);

  return (
    <div
      ref={surfaceRef}
      className="relative h-dvh w-dvw overflow-hidden bg-[#02040a]"
      style={{ background: tuning.theme.pageBackground }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={sceneStyle}
      >
        <div
          aria-hidden="true"
          className="absolute"
          data-iso-shadow={sceneValues.shadow.toFixed(2)}
          style={floorShadowStyle}
        />
        <div
          className="absolute inset-0"
          data-iso-depth={sceneValues.depth.toFixed(2)}
          data-iso-depth-variance={sceneValues.depthVariance.toFixed(2)}
          data-iso-pitch={sceneValues.pitch.toFixed(0)}
          data-iso-scale={sceneValues.scale.toFixed(2)}
          data-iso-yaw={sceneValues.yaw.toFixed(0)}
          style={boardStyle}
        >
          <canvas
            ref={staticCanvasRef}
            aria-label={CANVAS_DESCRIPTION}
            className="absolute inset-0 h-full w-full"
            role="img"
            tabIndex={-1}
          />
          <canvas
            ref={shaderCanvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            data-renderer="webgl2-composite"
            tabIndex={-1}
          />
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            tabIndex={-1}
          />
          <canvas
            ref={letterCanvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ background: "transparent" }}
            tabIndex={-1}
          />
        </div>
      </div>
    </div>
  );
}

function useCircuitBoardPlanScheduler({
  canvasSizeRef,
  glyphRef,
  stateRef,
}: {
  canvasSizeRef: ValueRef<CanvasSize>;
  glyphRef: ValueRef<string>;
  stateRef: ValueRef<DrawState>;
}) {
  const planBuildTimeoutRef = useRef<number | null>(null);

  const clearScheduledPlanBuild = useCallback(() => {
    if (planBuildTimeoutRef.current !== null) {
      window.clearTimeout(planBuildTimeoutRef.current);
      planBuildTimeoutRef.current = null;
    }
  }, []);

  const schedulePlanBuild = useCallback(() => {
    clearScheduledPlanBuild();

    const { height, width } = canvasSizeRef.current;

    if (width < 20 || height < 20) {
      return;
    }

    const planDimensions = getPlanDimensions(
      width,
      height,
      glyphRef.current,
      stateRef.current.tuning,
    );

    if (stateRef.current.planKey === planDimensions.key) {
      return;
    }

    planBuildTimeoutRef.current = window.setTimeout(
      () => {
        planBuildTimeoutRef.current = null;

        const latestSize = canvasSizeRef.current;
        const latestTuning = stateRef.current.tuning;
        const latestGlyph = glyphRef.current;

        if (latestSize.width < 20 || latestSize.height < 20) {
          return;
        }

        const latestDimensions = getPlanDimensions(
          latestSize.width,
          latestSize.height,
          latestGlyph,
          latestTuning,
        );

        if (stateRef.current.planKey === latestDimensions.key) {
          return;
        }

        stateRef.current.plan = buildBoardPlan(
          latestDimensions.width,
          latestDimensions.height,
          latestGlyph,
          latestTuning,
        );
        stateRef.current.planKey = latestDimensions.key;
        clearBoardRenderCaches(stateRef.current);
      },
      stateRef.current.plan ? 120 : 12,
    );
  }, [canvasSizeRef, clearScheduledPlanBuild, glyphRef, stateRef]);

  useEffect(
    () => () => {
      clearScheduledPlanBuild();
    },
    [clearScheduledPlanBuild],
  );

  return schedulePlanBuild;
}

function useCircuitBoardTuningControls({
  glyphRef,
  schedulePlanBuild,
  stateRef,
}: {
  glyphRef: ValueRef<string>;
  schedulePlanBuild: () => void;
  stateRef: ValueRef<DrawState>;
}) {
  const pendingGlyphTimeoutRef = useRef<number | null>(null);
  const [tuning, setTuning] = useState<CircuitTuning>(() =>
    cloneTuning(DEFAULT_CIRCUIT_TUNING),
  );

  const clearPendingGlyphUpdate = useCallback(() => {
    if (pendingGlyphTimeoutRef.current !== null) {
      window.clearTimeout(pendingGlyphTimeoutRef.current);
      pendingGlyphTimeoutRef.current = null;
    }
  }, []);

  const setGlyphValue = useCallback(
    (nextGlyph: string) => {
      syncSceneToDialStore(nextGlyph);

      if (glyphRef.current === nextGlyph) {
        return;
      }

      glyphRef.current = nextGlyph;
      markBoardPlanStale(stateRef.current);
      schedulePlanBuild();
    },
    [glyphRef, schedulePlanBuild, stateRef],
  );

  const applyPreset = useCallback((id: string) => {
    const preset = getCircuitPreset(id);

    setTuning((current) =>
      cloneTuning({
        ...preset.tuning,
        textFontKey: current.textFontKey,
      }),
    );
  }, []);

  const updateTypeface = useCallback((fontKey: TextFontKey) => {
    setTuning((current) =>
      current.textFontKey === fontKey
        ? current
        : { ...current, textFontKey: fontKey },
    );
  }, []);

  const resetControls = useCallback(() => {
    clearPendingGlyphUpdate();
    setGlyphValue(DEFAULT_WORD);
    setTuning(cloneTuning(DEFAULT_CIRCUIT_TUNING));
  }, [clearPendingGlyphUpdate, setGlyphValue]);

  useCircuitDialKitControls({
    applyPreset,
    resetControls,
    tuning,
    updateTypeface,
  });

  const applyDialStoreValues = useCallback(() => {
    const dialValues = DialStore.getValues(DIAL_TUNING_PANEL_ID);
    const nextGlyph = dialValues[DIAL_TEXT_PATH];

    if (typeof nextGlyph === "string" && nextGlyph !== glyphRef.current) {
      clearPendingGlyphUpdate();
      pendingGlyphTimeoutRef.current = window.setTimeout(() => {
        setGlyphValue(nextGlyph);
        pendingGlyphTimeoutRef.current = null;
      }, 700);
    } else {
      clearPendingGlyphUpdate();
    }

    setTuning((current) => {
      const next = applyDialValuesToTuning(current, dialValues);

      return next === current ? current : next;
    });
  }, [clearPendingGlyphUpdate, glyphRef, setGlyphValue]);

  const applyDialStoreValuesRef = useRef(applyDialStoreValues);

  useEffect(() => {
    applyDialStoreValuesRef.current = applyDialStoreValues;
  }, [applyDialStoreValues]);

  useEffect(() => {
    const handleDialStoreChange = () => {
      applyDialStoreValuesRef.current();
    };

    return DialStore.subscribe(DIAL_TUNING_PANEL_ID, handleDialStoreChange);
  }, []);

  useEffect(() => {
    stateRef.current.tuning = tuning;
    markBoardPlanStale(stateRef.current);
    schedulePlanBuild();
  }, [schedulePlanBuild, stateRef, tuning]);

  useEffect(() => {
    const rebuildWithLoadedFont = () => {
      markBoardPlanStale(stateRef.current);
      schedulePlanBuild();
    };

    window.addEventListener(TEXT_FONT_LOAD_EVENT, rebuildWithLoadedFont);

    return () => {
      window.removeEventListener(TEXT_FONT_LOAD_EVENT, rebuildWithLoadedFont);
    };
  }, [schedulePlanBuild, stateRef]);

  useEffect(
    () => () => {
      clearPendingGlyphUpdate();
    },
    [clearPendingGlyphUpdate],
  );

  return tuning;
}

function useReducedMotionFlag(stateRef: ValueRef<DrawState>) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      stateRef.current.reducedMotion = media.matches;
    };

    updateMotion();
    media.addEventListener("change", updateMotion);

    return () => {
      media.removeEventListener("change", updateMotion);
    };
  }, [stateRef]);
}

function useCircuitBoardSizing({
  canvasRef,
  canvasSizeRef,
  letterCanvasRef,
  schedulePlanBuild,
  shaderCanvasRef,
  stateRef,
  staticCanvasRef,
  surfaceRef,
}: CircuitBoardRefs & {
  canvasSizeRef: ValueRef<CanvasSize>;
  schedulePlanBuild: () => void;
  stateRef: ValueRef<DrawState>;
}) {
  useEffect(() => {
    const surface = surfaceRef.current;
    const canvas = canvasRef.current;
    const staticCanvas = staticCanvasRef.current;
    const shaderCanvas = shaderCanvasRef.current;
    const letterCanvas = letterCanvasRef.current;

    if (!surface || !canvas || !staticCanvas || !shaderCanvas || !letterCanvas) {
      return;
    }

    const resize = () => {
      const pixelRatio = getRenderPixelRatio();
      const width = Math.max(1, Math.floor(surface.clientWidth));
      const height = Math.max(1, Math.floor(surface.clientHeight));
      const pixelWidth = Math.floor(width * pixelRatio);
      const pixelHeight = Math.floor(height * pixelRatio);
      canvas.width = Math.max(
        1,
        Math.floor(pixelWidth * CANVAS_FALLBACK_PIXEL_RATIO_SCALE),
      );
      canvas.height = Math.max(
        1,
        Math.floor(pixelHeight * CANVAS_FALLBACK_PIXEL_RATIO_SCALE),
      );
      shaderCanvas.width = pixelWidth;
      shaderCanvas.height = pixelHeight;
      staticCanvas.width = pixelWidth;
      staticCanvas.height = pixelHeight;
      letterCanvas.width = pixelWidth;
      letterCanvas.height = pixelHeight;

      if (
        canvasSizeRef.current.width !== width ||
        canvasSizeRef.current.height !== height
      ) {
        canvasSizeRef.current = { height, width };
        markBoardPlanStale(stateRef.current);
        schedulePlanBuild();
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(surface);
    resize();

    return () => {
      observer.disconnect();
    };
  }, [
    canvasRef,
    canvasSizeRef,
    letterCanvasRef,
    schedulePlanBuild,
    shaderCanvasRef,
    stateRef,
    staticCanvasRef,
    surfaceRef,
  ]);
}

function useShaderCanvasPresentation({
  canvasRef,
  shaderCanvasRef,
  shaderRendererRef,
  staticCanvasRef,
}: Pick<CircuitBoardRefs, "canvasRef" | "shaderCanvasRef" | "staticCanvasRef"> & {
  shaderRendererRef: ValueRef<ShaderRippleRenderer | null>;
}) {
  useEffect(() => {
    const staticCanvas = staticCanvasRef.current;
    const shaderCanvas = shaderCanvasRef.current;
    const canvas = canvasRef.current;

    if (!staticCanvas || !shaderCanvas || !canvas) {
      return;
    }

    applyShaderCanvasPresentation(
      staticCanvas,
      shaderCanvas,
      canvas,
      Boolean(shaderRendererRef.current),
    );
  });
}

function useCircuitBoardRenderer({
  canvasRef,
  letterCanvasRef,
  shaderCanvasRef,
  shaderRendererRef,
  stateRef,
  staticCanvasRef,
}: Pick<
  CircuitBoardRefs,
  "canvasRef" | "letterCanvasRef" | "shaderCanvasRef" | "staticCanvasRef"
> & {
  shaderRendererRef: ValueRef<ShaderRippleRenderer | null>;
  stateRef: ValueRef<DrawState>;
}) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const staticCanvas = staticCanvasRef.current;
    const shaderCanvas = shaderCanvasRef.current;
    const letterCanvas = letterCanvasRef.current;
    const context = canvas?.getContext("2d");
    const staticContext = staticCanvas?.getContext("2d");
    const letterContext = letterCanvas?.getContext("2d");

    if (
      !canvas ||
      !staticCanvas ||
      !shaderCanvas ||
      !letterCanvas ||
      !context ||
      !staticContext ||
      !letterContext
    ) {
      return;
    }

    shaderRendererRef.current =
      shaderRendererRef.current ?? createShaderRippleRenderer(shaderCanvas);
    applyShaderCanvasPresentation(
      staticCanvas,
      shaderCanvas,
      canvas,
      Boolean(shaderRendererRef.current),
    );
    let frame = 0;
    const render = (time: number) => {
      const renderStartedAt = performance.now();
      const shaderRenderer = shaderRendererRef.current;
      const useCanvasPulseEffects = !shaderRenderer;
      const hasCanvasPulses =
        useCanvasPulseEffects &&
        stateRef.current.tuning.pulseIntensity > 0 &&
        !stateRef.current.reducedMotion;
      drawBoard(
        staticCanvas,
        canvas,
        staticContext,
        context,
        stateRef.current,
        time,
        !shaderRenderer,
        useCanvasPulseEffects,
        useCanvasPulseEffects,
      );
      drawShaderMaskedSystemRipple(
        shaderCanvas,
        canvas,
        shaderRenderer,
        stateRef.current,
        time,
        hasCanvasPulses,
      );
      drawShaderLetterOverlay(letterCanvas, letterContext, stateRef.current);
      recordCircuitPerf(
        canvas,
        stateRef.current,
        time,
        performance.now() - renderStartedAt,
      );

      frame = window.requestAnimationFrame(render);
    };

    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      const renderer = shaderRendererRef.current;

      if (renderer) {
        renderer.gl.deleteBuffer(renderer.vertexBuffer);
        renderer.gl.deleteVertexArray(renderer.vertexArray);
        renderer.gl.deleteBuffer(renderer.padPulseVertexBuffer);
        renderer.gl.deleteBuffer(renderer.padPulseInstanceBuffer);
        renderer.gl.deleteVertexArray(renderer.padPulseVertexArray);
        renderer.gl.deleteBuffer(renderer.routeBloomVertexBuffer);
        renderer.gl.deleteBuffer(renderer.routeBloomInstanceBuffer);
        renderer.gl.deleteVertexArray(renderer.routeBloomVertexArray);
        renderer.gl.deleteBuffer(renderer.routeLineVertexBuffer);
        renderer.gl.deleteBuffer(renderer.routeLineInstanceBuffer);
        renderer.gl.deleteVertexArray(renderer.routeLineVertexArray);
        renderer.gl.deleteTexture(renderer.maskTexture);
        renderer.gl.deleteTexture(renderer.pulseTexture);
        renderer.gl.deleteTexture(renderer.staticTexture);
        renderer.gl.deleteTexture(renderer.waveFieldTexture);
        renderer.gl.deleteProgram(renderer.routeBloomProgram);
        renderer.gl.deleteProgram(renderer.routeLineProgram);
        renderer.gl.deleteProgram(renderer.padPulseProgram);
        renderer.gl.deleteProgram(renderer.program);
        shaderRendererRef.current = null;
      }
      applyShaderCanvasPresentation(staticCanvas, shaderCanvas, canvas, false);
    };
  }, [
    canvasRef,
    letterCanvasRef,
    shaderCanvasRef,
    shaderRendererRef,
    stateRef,
    staticCanvasRef,
  ]);
}

export function CircuitBoard() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const shaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const letterCanvasRef = useRef<HTMLCanvasElement>(null);
  const shaderRendererRef = useRef<ShaderRippleRenderer | null>(null);
  const canvasSizeRef = useRef({ height: 0, width: 0 });
  const glyphRef = useRef(DEFAULT_WORD);
  const stateRef = useRef<DrawState>({
    letterOverlayLayer: null,
    plan: null,
    planKey: null,
    reducedMotion: false,
    renderedLetterOverlayHeight: 0,
    renderedLetterOverlayLayer: null,
    renderedLetterOverlayWidth: 0,
    renderedStaticHeight: 0,
    renderedStaticLayer: null,
    renderedStaticWidth: 0,
    staticLayer: null,
    tuning: cloneTuning(DEFAULT_CIRCUIT_TUNING),
  });
  const schedulePlanBuild = useCircuitBoardPlanScheduler({
    canvasSizeRef,
    glyphRef,
    stateRef,
  });
  const tuning = useCircuitBoardTuningControls({
    glyphRef,
    schedulePlanBuild,
    stateRef,
  });

  useReducedMotionFlag(stateRef);
  useCircuitBoardSizing({
    canvasRef,
    canvasSizeRef,
    letterCanvasRef,
    schedulePlanBuild,
    shaderCanvasRef,
    stateRef,
    staticCanvasRef,
    surfaceRef,
  });
  useShaderCanvasPresentation({
    canvasRef,
    shaderCanvasRef,
    shaderRendererRef,
    staticCanvasRef,
  });
  useCircuitBoardRenderer({
    canvasRef,
    letterCanvasRef,
    shaderCanvasRef,
    shaderRendererRef,
    stateRef,
    staticCanvasRef,
  });

  return (
    <CircuitBoardScene
      canvasRef={canvasRef}
      letterCanvasRef={letterCanvasRef}
      shaderCanvasRef={shaderCanvasRef}
      staticCanvasRef={staticCanvasRef}
      surfaceRef={surfaceRef}
      tuning={tuning}
    />
  );
}
