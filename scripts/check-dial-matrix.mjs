#!/usr/bin/env node
// Dial-matrix gate for circuit-land. Dependency-free; plain node:fs / node:path
// / node:crypto. Mirrors the shape and loud-on-empty discipline of
// check-content.mjs.
//
// What it guards. The homepage dial section (src/components/home/dial-section.tsx)
// vendors the Build flow's model allocation table — the output of
// `circuit preview build --matrix`. It is hand-transcribed: the RELAYS constant
// (one row per relay step, model per low/medium/high dial) plus the non-relay
// footer (each non-relay step and its kind). Nothing detected when that copy
// drifted from the engine; the v1 surface test caught them equal only by a
// one-time manual comparison.
//
// Why a checksum, not a live regen. The landing page pins a specific circuit
// release (CIRCUIT_RELEASE_TAG in src/lib/circuit-release.ts). For a tag-pinned
// consumer the engine's matrix for that tag is immutable, so the only real
// drift is (a) an accidental hand-edit to the vendored table, or (b) a release
// pin bumped without re-vendoring against the new engine. A committed lock of
// the normalized matrix + its sha256 + the tag it came from catches both, at
// zero install cost and with no coupling of this marketing repo's CI to the
// engine's. (The alternative — `npx github:petekp/circuit#<tag> preview
// --matrix --json` in CI — inverts the dependency and adds install flakiness.)
//
// The lock (scripts/dial-matrix.lock.json) is seeded from a real
// `circuit preview build --matrix --json`, so the vendored copy was verified
// against the engine at seed time; the gate then keeps it from drifting.
//
// Refresh (a legitimate change — a model reassignment, or a tag bump):
//   node scripts/check-dial-matrix.mjs --write
// then review the lock diff and the dial-section change together.
//
// Output: one violation per line as `file — expected vs found`; exit 1 on any
// violation; a one-line summary on success.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIAL_SECTION_FILE = path.join("src", "components", "home", "dial-section.tsx");
const RELEASE_CONSTANT_FILE = path.join("src", "lib", "circuit-release.ts");
const LOCK_FILE = path.join("scripts", "dial-matrix.lock.json");

// Loud-on-empty floors: today the Build matrix has exactly 3 relay rows and 6
// non-relay steps. Fewer means the extraction broke (moved file, changed
// syntax), not a real shrink — fail rather than checksum nothing. A legitimate
// shrink updates the floor in the same change.
const RELAYS_FLOOR = 3;
const NON_RELAY_FLOOR = 6;
const RELAY_TIERS = ["low", "medium", "high"];

function read(relativeFile) {
  return fs.readFileSync(path.join(repoRoot, relativeFile), "utf8");
}

// Deterministic serialization: sort object keys, preserve array order (row and
// step order carry meaning in the table). The checksum is over this string.
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonicalize(value[key]);
    return out;
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// Extract the vendored matrix from the dial section. Regex-based, matching the
// check-content.mjs idiom (no eval of source). Returns { matrix, violations }:
// a null matrix means extraction failed loud.
function extractVendoredMatrix() {
  const violations = [];
  if (!fs.existsSync(path.join(repoRoot, DIAL_SECTION_FILE))) {
    return {
      matrix: null,
      violations: [`${DIAL_SECTION_FILE} — expected the dial section to exist, found nothing`],
    };
  }
  const src = read(DIAL_SECTION_FILE);

  // (1) The RELAYS array literal: from `const RELAYS ... = [` to the line `];`.
  const blockMatch = src.match(/const RELAYS[^=]*=\s*(\[[\s\S]*?\n\];)/);
  if (!blockMatch) {
    violations.push(
      `${DIAL_SECTION_FILE} — expected a parseable \`const RELAYS = [ ... ];\` block, found none`,
    );
    return { matrix: null, violations };
  }
  const relays = [];
  for (const rowMatch of blockMatch[1].matchAll(/\{([\s\S]*?)\}/g)) {
    const body = rowMatch[1];
    const field = (name) => {
      const m = body.match(new RegExp(`${name}:\\s*["']([^"']+)["']`));
      return m ? m[1] : null;
    };
    const row = {
      step: field("step"),
      role: field("role"),
      low: field("low"),
      medium: field("medium"),
      high: field("high"),
    };
    const missing = Object.entries(row)
      .filter(([, v]) => v === null)
      .map(([k]) => k);
    if (missing.length > 0) {
      violations.push(
        `${DIAL_SECTION_FILE} — RELAYS row "${row.step ?? "?"}" is missing field(s) ${missing.join(", ")}; the row shape changed or the parse broke`,
      );
      continue;
    }
    relays.push(row);
  }
  if (relays.length < RELAYS_FLOOR) {
    violations.push(
      `${DIAL_SECTION_FILE} — expected at least ${RELAYS_FLOOR} RELAYS rows, extracted ${relays.length}; the RELAYS parse is broken`,
    );
  }

  // (2) The non-relay footer: `non-relay steps: name (kind), ...` inside a <p>.
  const footerMatch = src.match(/non-relay steps:([\s\S]*?)<\/p>/);
  const nonRelaySteps = [];
  if (!footerMatch) {
    violations.push(
      `${DIAL_SECTION_FILE} — expected a "non-relay steps: ..." footer, found none`,
    );
  } else {
    for (const stepMatch of footerMatch[1].matchAll(/([\w-]+)\s*\(([\w]+)\)/g)) {
      nonRelaySteps.push({ stepId: stepMatch[1], kind: stepMatch[2] });
    }
  }
  if (nonRelaySteps.length < NON_RELAY_FLOOR) {
    violations.push(
      `${DIAL_SECTION_FILE} — expected at least ${NON_RELAY_FLOOR} non-relay steps, extracted ${nonRelaySteps.length}; the footer parse is broken`,
    );
  }

  if (violations.length > 0) return { matrix: null, violations };
  return { matrix: { relays, nonRelaySteps }, violations: [] };
}

function readReleaseTag() {
  if (!fs.existsSync(path.join(repoRoot, RELEASE_CONSTANT_FILE))) {
    return { tag: null, violation: `${RELEASE_CONSTANT_FILE} — expected the release constant file to exist, found nothing` };
  }
  const declared = read(RELEASE_CONSTANT_FILE).match(
    /CIRCUIT_RELEASE_TAG\s*=\s*["'](circuit--v[0-9A-Za-z.+-]+)["']/,
  );
  if (!declared) {
    return { tag: null, violation: `${RELEASE_CONSTANT_FILE} — expected CIRCUIT_RELEASE_TAG = "circuit--v..." , found no parseable declaration` };
  }
  return { tag: declared[1], violation: null };
}

// A precise, human-readable diff of two matrices so a drift failure names the
// exact cell, not just "checksum mismatch".
function diffMatrices(expected, found) {
  const diffs = [];
  const byStep = (m) => Object.fromEntries(m.relays.map((r) => [r.step, r]));
  const expRelays = byStep(expected);
  const foundRelays = byStep(found);
  for (const step of new Set([...Object.keys(expRelays), ...Object.keys(foundRelays)])) {
    const e = expRelays[step];
    const f = foundRelays[step];
    if (!e) {
      diffs.push(`  relay row "${step}" was added (not in the lock)`);
      continue;
    }
    if (!f) {
      diffs.push(`  relay row "${step}" was removed (present in the lock)`);
      continue;
    }
    for (const key of ["role", ...RELAY_TIERS]) {
      if (e[key] !== f[key]) diffs.push(`  ${step}.${key}: lock has "${e[key]}", vendored has "${f[key]}"`);
    }
  }
  const stepList = (m) => m.nonRelaySteps.map((s) => `${s.stepId} (${s.kind})`).join(", ");
  if (stepList(expected) !== stepList(found)) {
    diffs.push(`  non-relay steps: lock has [${stepList(expected)}], vendored has [${stepList(found)}]`);
  }
  return diffs;
}

// ---------------------------------------------------------------------------

const wantsWrite = process.argv.includes("--write");
const { matrix, violations: extractViolations } = extractVendoredMatrix();
const { tag, violation: tagViolation } = readReleaseTag();

const failures = [...extractViolations];
if (tagViolation) failures.push(tagViolation);

// Extraction or tag must be sound before we can lock or compare against a lock.
if (matrix === null || tag === null) {
  console.error(`check:dial-matrix FAILED — ${failures.length} violation(s):`);
  for (const v of failures) console.error(`  ${v}`);
  process.exit(1);
}

const checksum = sha256(canonicalJson(matrix));

if (wantsWrite) {
  const lock = { tag, sha256: checksum, matrix };
  fs.writeFileSync(
    path.join(repoRoot, LOCK_FILE),
    `${JSON.stringify(lock, null, 2)}\n`,
  );
  console.log(`check:dial-matrix --write — wrote ${LOCK_FILE}`);
  console.log(`  tag ${tag}; sha256 ${checksum}`);
  console.log(`  ${matrix.relays.length} relay rows, ${matrix.nonRelaySteps.length} non-relay steps`);
  process.exit(0);
}

if (!fs.existsSync(path.join(repoRoot, LOCK_FILE))) {
  console.error(`check:dial-matrix FAILED — no lock at ${LOCK_FILE}.`);
  console.error(`  Seed it once from the vendored matrix: node scripts/check-dial-matrix.mjs --write`);
  process.exit(1);
}

let lock;
try {
  lock = JSON.parse(read(LOCK_FILE));
} catch (err) {
  console.error(`check:dial-matrix FAILED — ${LOCK_FILE} is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

const lockFailures = [];
if (lock.tag !== tag) {
  lockFailures.push(
    `release pin moved — the lock was vendored from ${lock.tag} but CIRCUIT_RELEASE_TAG is now ${tag}. Re-vendor the matrix against the new engine (\`circuit preview build --matrix\`), then \`node scripts/check-dial-matrix.mjs --write\`.`,
  );
}
if (lock.sha256 !== checksum) {
  lockFailures.push(
    `vendored dial matrix drifted from the lock (sha256 ${lock.sha256} -> ${checksum}). If this change is intended, refresh with \`node scripts/check-dial-matrix.mjs --write\`; if not, revert ${DIAL_SECTION_FILE}. Cell-level diff:`,
  );
  if (lock.matrix) {
    for (const line of diffMatrices(lock.matrix, matrix)) lockFailures.push(line);
  }
}

if (lockFailures.length > 0) {
  console.error(`check:dial-matrix FAILED — ${lockFailures.length} issue(s):`);
  for (const f of lockFailures) console.error(`  ${f}`);
  process.exit(1);
}

console.log(
  `check:dial-matrix OK — vendored matrix matches the lock (tag ${tag}, ${matrix.relays.length} relays, ${matrix.nonRelaySteps.length} non-relay steps, sha256 ${checksum.slice(0, 12)}…)`,
);
process.exit(0);
