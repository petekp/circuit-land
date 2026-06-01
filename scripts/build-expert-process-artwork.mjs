#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WIDTH = 1536;
const HEIGHT = 1056;

const figurePath = path.join(
  ROOT,
  "public",
  "artisan-frames",
  "process-designer.png",
);
const outputPath = path.join(ROOT, "public", "expert-process-illustration.png");

function block(x, y, w, h, color, opacity = 0.82) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="${color}" fill-opacity="${opacity}"/>`;
}

function token(cx, cy, r, color, opacity = 0.9) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" fill-opacity="${opacity}"/>`;
}

function card(x, y, w, h, accent, opacity = 0.8) {
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="#dce6db" fill-opacity="0.12"/>
      <rect x="${x + 22}" y="${y + 22}" width="${w * 0.28}" height="10" rx="5" fill="${accent}" fill-opacity="0.72"/>
      <rect x="${x + 22}" y="${y + 48}" width="${w * 0.56}" height="7" rx="3.5" fill="#dce6db" fill-opacity="0.28"/>
      <rect x="${x + 22}" y="${y + 68}" width="${w * 0.42}" height="7" rx="3.5" fill="#dce6db" fill-opacity="0.2"/>
    </g>`;
}

const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#16231e"/>
      <stop offset="1" stop-color="#0b1210"/>
    </linearGradient>
    <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
      <path d="M 56 0 L 0 0 0 56" fill="none" stroke="#b9d2c4" stroke-opacity="0.055" stroke-width="1"/>
    </pattern>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="22" stdDeviation="28" flood-color="#000000" flood-opacity="0.24"/>
    </filter>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>
  <path d="M186 706 C312 596 412 648 520 556 S720 356 872 414 S1054 604 1250 450"
    fill="none" stroke="#57d1b0" stroke-opacity="0.22" stroke-width="10" stroke-linecap="round"/>
  <path d="M188 706 C314 596 412 648 520 556 S720 356 872 414 S1054 604 1250 450"
    fill="none" stroke="#d6b85d" stroke-opacity="0.48" stroke-width="2" stroke-linecap="round"/>

  <g filter="url(#soft)">
    ${block(112, 144, 294, 160, "#22332f", 0.9)}
    ${block(456, 98, 318, 186, "#243632", 0.86)}
    ${block(828, 134, 284, 156, "#1f302d", 0.86)}
    ${block(1148, 202, 248, 140, "#243630", 0.82)}
    ${block(150, 796, 300, 130, "#21332f", 0.76)}
    ${block(1022, 782, 318, 148, "#24352f", 0.74)}

    ${card(144, 176, 220, 104, "#57d1b0")}
    ${card(494, 138, 236, 118, "#d6b85d")}
    ${card(860, 166, 210, 100, "#72dcc9")}
    ${card(1182, 230, 174, 86, "#d6b85d")}

    <g opacity="0.9">
      ${token(210, 586, 28, "#57d1b0")}
      ${token(338, 528, 16, "#d6b85d")}
      ${token(510, 556, 22, "#dce6db", 0.56)}
      ${token(712, 420, 18, "#57d1b0")}
      ${token(894, 422, 24, "#d6b85d")}
      ${token(1072, 556, 18, "#57d1b0")}
      ${token(1248, 450, 30, "#dce6db", 0.22)}
    </g>

    <g opacity="0.72">
      <rect x="222" y="690" width="180" height="22" rx="11" fill="#57d1b0" fill-opacity="0.25"/>
      <rect x="478" y="636" width="230" height="22" rx="11" fill="#d6b85d" fill-opacity="0.24"/>
      <rect x="836" y="612" width="196" height="22" rx="11" fill="#57d1b0" fill-opacity="0.2"/>
      <rect x="1022" y="728" width="258" height="22" rx="11" fill="#dce6db" fill-opacity="0.13"/>
    </g>

    <g opacity="0.7">
      <circle cx="1200" cy="620" r="84" fill="none" stroke="#dce6db" stroke-opacity="0.13" stroke-width="20"/>
      <circle cx="1200" cy="620" r="84" fill="none" stroke="#57d1b0" stroke-opacity="0.46" stroke-width="20" stroke-dasharray="164 430" stroke-linecap="round"/>
      ${token(1200, 620, 18, "#d6b85d")}
    </g>
  </g>
</svg>`;

const base = await sharp(Buffer.from(svg)).png().toBuffer();
const figure = await sharp(figurePath)
  .resize({ width: 740, height: 740, fit: "contain" })
  .png()
  .toBuffer();

await sharp(base)
  .composite([{ input: figure, left: 420, top: 300 }])
  .png({ compressionLevel: 9, quality: 88 })
  .toFile(outputPath);

console.log(path.relative(ROOT, outputPath));
