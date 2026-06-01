#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW_DIR = path.join(ROOT, "public", "artisan-frames", "raw");
const OUT_DIR = path.join(ROOT, "public", "artisan-frames");
const FRAMES = [
  "woodworker",
  "ceramicist",
  "weaver",
  "machinist",
  "chef",
  "process-designer",
];

const TRANSPARENT_THRESHOLD = 28;
const OPAQUE_THRESHOLD = 172;
const ALPHA_BBOX_THRESHOLD = 10;
const PAD = 0.08;

function colorDistance(r, g, b, key) {
  const dr = r - key.r;
  const dg = g - key.g;
  const db = b - key.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function sampleBorderKey(data, width, height) {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  function addPixel(x, y) {
    const i = (y * width + x) * 4;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count += 1;
  }

  for (let x = 0; x < width; x++) {
    addPixel(x, 0);
    addPixel(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    addPixel(0, y);
    addPixel(width - 1, y);
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
}

function matteAlpha(distance) {
  if (distance <= TRANSPARENT_THRESHOLD) return 0;
  if (distance >= OPAQUE_THRESHOLD) return 255;
  return Math.round(
    ((distance - TRANSPARENT_THRESHOLD) /
      (OPAQUE_THRESHOLD - TRANSPARENT_THRESHOLD)) *
      255,
  );
}

function findBounds(data, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha <= ALPHA_BBOX_THRESHOLD) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < 0) return null;
  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function squarePadding(bounds) {
  const longest = Math.max(bounds.width, bounds.height);
  const target = Math.round(longest / (1 - PAD * 2));
  const left = Math.floor((target - bounds.width) / 2);
  const top = Math.floor((target - bounds.height) / 2);

  return {
    target,
    left,
    top,
    right: target - bounds.width - left,
    bottom: target - bounds.height - top,
  };
}

async function prepareFrame(name) {
  const inputPath = path.join(RAW_DIR, `${name}-chroma.png`);
  const outputPath = path.join(OUT_DIR, `${name}.png`);
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const key = sampleBorderKey(data, info.width, info.height);

  for (let i = 0; i < data.length; i += 4) {
    const alpha = matteAlpha(colorDistance(data[i], data[i + 1], data[i + 2], key));
    if (alpha < 245) {
      const nonGreen = Math.max(data[i], data[i + 2]);
      data[i + 1] = Math.min(data[i + 1], nonGreen + 24);
    }
    data[i + 3] = alpha;
  }

  const bounds = findBounds(data, info.width, info.height);
  if (!bounds) {
    throw new Error(`${name}: no visible pixels after keying`);
  }

  const padding = squarePadding(bounds);
  const keyed = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract(bounds)
    .extend({
      top: padding.top,
      right: padding.right,
      bottom: padding.bottom,
      left: padding.left,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await fs.writeFile(outputPath, keyed);
  console.log(
    `${name}: key rgb(${key.r}, ${key.g}, ${key.b}), crop ${bounds.width}x${bounds.height} -> ${padding.target}x${padding.target}`,
  );
}

await fs.mkdir(OUT_DIR, { recursive: true });
for (const frame of FRAMES) {
  await prepareFrame(frame);
}
