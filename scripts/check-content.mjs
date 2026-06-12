#!/usr/bin/env node
// Content gate for circuit-land. Dependency-free; plain node:fs / node:path.
//
// Three sub-checks, each loud-on-empty (a check that scans nothing FAILS —
// a silent-empty grep gate is how the stale alpha.6 pin shipped, commit
// 77eda30 incident):
//
//   (a) pin single-sourcing — every `circuit--v...` occurrence under src/
//       and content/ must equal CIRCUIT_RELEASE_TAG in
//       src/lib/circuit-release.ts, and at least PIN_FLOOR occurrences must
//       exist outside the constant file.
//   (b) retired-token registry — vocabulary that was renamed away
//       (rigor -> depth/power, lite|standard|deep -> low|medium|high,
//       checkpoint_waiting -> waiting_checkpoint) must not reappear.
//   (c) internal dead-link check — every ](/docs/...) target in
//       content/docs/**/*.mdx must resolve to a real page under
//       content/docs using fumadocs slug rules.
//   (d) flow roster — docs pages registered as enumerating the full flow
//       roster must mention every flow declared in
//       src/lib/circuit-flows.ts. TSX enumerations derive from the
//       constant directly and need no registry entry.
//
// Output: one violation per line as `file:line — expected vs found`;
// exit 1 on any violation; one summary line per sub-check on success.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_ROOTS = ["src", "content"];
const RELEASE_CONSTANT_FILE = path.join("src", "lib", "circuit-release.ts");
const FLOWS_CONSTANT_FILE = path.join("src", "lib", "circuit-flows.ts");
const DOCS_ROOT = path.join("content", "docs");

// Docs pages that enumerate the full flow roster in prose. A page that
// mentions some flows in passing (flows/pursue.mdx) does not belong here;
// a page that presents "the flows" as a set does. New roster-enumerating
// pages must be added by hand — the floor below catches a hollowed-out
// registry, not a missing entry.
const FLOW_ROSTER_SITES = [
  path.join(DOCS_ROOT, "cli", "run.mdx"),
  path.join(DOCS_ROOT, "getting-started", "installation.mdx"),
  path.join(DOCS_ROOT, "getting-started", "quickstart.mdx"),
  path.join(DOCS_ROOT, "flows", "overview.mdx"),
  path.join(DOCS_ROOT, "flows", "modes.mdx"),
];

// Loud-on-empty floors. If a sub-check extracts fewer items than its floor,
// the scan itself is broken (moved directory, changed syntax) and the gate
// fails rather than silently passing on nothing.
const PIN_FLOOR = 2; // tag occurrences outside the constant file (today: homepage + installation.mdx)
const FILES_FLOOR = 50; // text files under src/ + content/ (today: ~65)
const LINKS_FLOOR = 40; // internal /docs links in content/docs (a manual audit counted ~82; today: ~95)
const FLOWS_FLOOR = 4; // flow names parsed from the constant (today: 6) — fewer means the parse broke
const FLOW_SITES_FLOOR = 3; // registered roster sites (today: 5)

const BINARY_EXTENSIONS = new Set([
  ".ico", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg",
  ".woff", ".woff2", ".ttf", ".otf", ".eot", ".mp4", ".webm", ".pdf",
]);

// ---------------------------------------------------------------------------
// Retired-token registry. Patterns are deliberately context-restricted so
// legitimate prose never matches: bare "deep"/"standard" are fine words; they
// are violations only in depth/rigor value contexts. Restrict a pattern
// before reaching for an allow list.
const RETIRED_TOKENS = [
  {
    // checkpoint_waiting is a real attempt-outcome literal inside circuit;
    // the run STATE the site documents is waiting_checkpoint. If the site
    // ever documents attempt outcomes, restrict this to run-state contexts.
    pattern: /checkpoint_waiting/i,
    replacement: "waiting_checkpoint",
    note: "the runs-show engine state literal is waiting_checkpoint; checkpoint_waiting is the adjacent reason field",
  },
  // rigor -> depth/power rename (2026-06, circuit PRs #56/#59). The site
  // tracks current terminology by operator decision (2026-06-12), even while
  // the pinned install tag trails the rename.
  {
    pattern: /--rigor\b/i,
    replacement: "--depth",
    note: "the care flag was renamed in the depth/power split",
  },
  {
    // "rigorous" does not match; any bare rigor/rigors does — the axis name
    // itself was retired, so no legitimate site prose should use it.
    pattern: /\brigors?\b/i,
    replacement: "depth",
    note: "the operator-facing care axis is named depth now",
  },
  {
    // The exact value triple, in plain or markdown-table-escaped form.
    pattern: /lite\\?\|standard\\?\|deep/i,
    replacement: "low|medium|high",
    note: "the depth values were renamed",
  },
  {
    // Depth-context value words: bare "lite" anywhere (distinctive enough),
    // "deep depth"/"standard depth"/"lighter depth" compounds, and
    // value-position after depth ("depth: deep", "--depth standard",
    // depths: ["lite", ...]). Bare prose "deep" must never match.
    pattern:
      /\blite\b|\b(?:deep|deeper|lighter|standard)[ -]depth\b|\bdepths?\b["'`\]]?\s*[:=]?\s*\[?\s*["'`]?(?:lite|standard|deep)\b|--depth[ =]["'`]?(?:lite|standard|deep)\b/i,
    replacement: "low / medium / high",
    note: "depth values are low|medium|high",
  },
];

// ---------------------------------------------------------------------------
// Helpers

function listFilesUnder(relativeDir) {
  const absolute = path.join(repoRoot, relativeDir);
  if (!fs.existsSync(absolute)) return [];
  const out = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesUnder(relative));
    else if (entry.isFile()) out.push(relative);
  }
  return out;
}

function textFiles() {
  return SCAN_ROOTS.flatMap(listFilesUnder).filter(
    (file) => !BINARY_EXTENSIONS.has(path.extname(file).toLowerCase()),
  );
}

function readLines(relativeFile) {
  return fs.readFileSync(path.join(repoRoot, relativeFile), "utf8").split("\n");
}

// ---------------------------------------------------------------------------
// (a) Pin single-sourcing

function checkPin(files) {
  const violations = [];
  const TAG_PATTERN = /circuit--v[0-9A-Za-z.+-]+/g;

  if (!fs.existsSync(path.join(repoRoot, RELEASE_CONSTANT_FILE))) {
    return {
      name: "pin",
      violations: [`${RELEASE_CONSTANT_FILE}:1 — expected the release constant file to exist, found nothing`],
      summary: "",
    };
  }
  const constantSource = fs.readFileSync(path.join(repoRoot, RELEASE_CONSTANT_FILE), "utf8");
  const declared = constantSource.match(
    /CIRCUIT_RELEASE_TAG\s*=\s*["'](circuit--v[0-9A-Za-z.+-]+)["']/,
  );
  if (!declared) {
    return {
      name: "pin",
      violations: [
        `${RELEASE_CONSTANT_FILE}:1 — expected CIRCUIT_RELEASE_TAG = "circuit--v..." to be declared, found no parseable declaration`,
      ],
      summary: "",
    };
  }
  const tag = declared[1];

  let occurrencesOutsideConstant = 0;
  for (const file of files) {
    const lines = readLines(file);
    for (let i = 0; i < lines.length; i++) {
      for (const match of lines[i].matchAll(TAG_PATTERN)) {
        if (file !== RELEASE_CONSTANT_FILE) occurrencesOutsideConstant++;
        if (match[0] !== tag) {
          violations.push(`${file}:${i + 1} — expected ${tag}, found ${match[0]}`);
        }
      }
    }
  }

  if (occurrencesOutsideConstant < PIN_FLOOR) {
    violations.push(
      `(loud-on-empty) — expected at least ${PIN_FLOOR} tag occurrences outside ${RELEASE_CONSTANT_FILE}, found ${occurrencesOutsideConstant}; the tag scan is broken or a copy was removed without updating this gate`,
    );
  }

  return {
    name: "pin",
    violations,
    summary: `pin: tag ${tag}; ${occurrencesOutsideConstant} occurrences outside ${RELEASE_CONSTANT_FILE} all match`,
  };
}

// ---------------------------------------------------------------------------
// (b) Retired-token registry

function checkRetiredTokens(files) {
  const violations = [];
  let filesScanned = 0;

  for (const file of files) {
    filesScanned++;
    const lines = readLines(file);
    for (let i = 0; i < lines.length; i++) {
      for (const token of RETIRED_TOKENS) {
        const match = lines[i].match(token.pattern);
        if (match) {
          violations.push(
            `${file}:${i + 1} — expected "${token.replacement}", found retired token "${match[0]}" (${token.note})`,
          );
        }
      }
    }
  }

  if (filesScanned < FILES_FLOOR) {
    violations.push(
      `(loud-on-empty) — expected at least ${FILES_FLOOR} text files under ${SCAN_ROOTS.join(", ")}, scanned ${filesScanned}; the file walk is broken`,
    );
  }

  return {
    name: "retired-tokens",
    violations,
    summary: `retired-tokens: ${filesScanned} files scanned, ${RETIRED_TOKENS.length} patterns, 0 hits`,
  };
}

// ---------------------------------------------------------------------------
// (c) Internal dead-link check

function resolveDocsTarget(target) {
  // fumadocs slug rules: /docs/a/b -> content/docs/a/b.mdx OR
  // content/docs/a/b/index.mdx; /docs -> content/docs/index.mdx.
  const slug = target === "/docs" || target === "/docs/" ? "" : target.slice("/docs/".length).replace(/\/+$/, "");
  return slug === ""
    ? [path.join(DOCS_ROOT, "index.mdx")]
    : [path.join(DOCS_ROOT, `${slug}.mdx`), path.join(DOCS_ROOT, slug, "index.mdx")];
}

function checkInternalLinks() {
  const violations = [];
  const LINK_PATTERN = /\]\(([^()]*)\)/g;
  let linksChecked = 0;

  const mdxFiles = listFilesUnder(DOCS_ROOT).filter((file) => file.endsWith(".mdx"));
  for (const file of mdxFiles) {
    const lines = readLines(file);
    for (let i = 0; i < lines.length; i++) {
      for (const match of lines[i].matchAll(LINK_PATTERN)) {
        // Strip an optional markdown title (`/docs/x "Title"`), then
        // fragments and query strings.
        const raw = match[1].trim().replace(/\s+["'].*["']$/, "");
        const target = raw.split("#")[0].split("?")[0];
        if (target === "") continue; // #fragment-only link
        if (/^(?:https?:|mailto:)/i.test(target)) continue; // external

        let candidates;
        if (target === "/docs" || target.startsWith("/docs/")) {
          candidates = resolveDocsTarget(target);
        } else if (target.startsWith("/")) {
          continue; // non-docs app route; not resolvable against content/
        } else {
          // Relative target: resolve against the doc's directory.
          const base = path.join(path.dirname(file), target);
          candidates = [`${base}.mdx`, path.join(base, "index.mdx")];
        }

        linksChecked++;
        const exists = candidates.some((candidate) => fs.existsSync(path.join(repoRoot, candidate)));
        if (!exists) {
          violations.push(
            `${file}:${i + 1} — dead link "${raw}", expected ${candidates.join(" or ")} to exist`,
          );
        }
      }
    }
  }

  if (linksChecked < LINKS_FLOOR) {
    violations.push(
      `(loud-on-empty) — expected at least ${LINKS_FLOOR} internal links in ${DOCS_ROOT}/**/*.mdx, extracted ${linksChecked}; the link extraction is broken`,
    );
  }

  return {
    name: "links",
    violations,
    summary: `links: ${linksChecked} internal links checked across ${mdxFiles.length} mdx files, all resolve`,
  };
}

// ---------------------------------------------------------------------------
// (d) Flow roster

function checkFlowRoster() {
  const violations = [];

  if (!fs.existsSync(path.join(repoRoot, FLOWS_CONSTANT_FILE))) {
    return {
      name: "flows",
      violations: [`${FLOWS_CONSTANT_FILE}:1 — expected the flow roster constant file to exist, found nothing`],
      summary: "",
    };
  }
  const constantSource = fs.readFileSync(path.join(repoRoot, FLOWS_CONSTANT_FILE), "utf8");
  const names = [...constantSource.matchAll(/name:\s*["']([A-Za-z][A-Za-z ]*)["']/g)].map(
    (match) => match[1],
  );

  if (names.length < FLOWS_FLOOR) {
    violations.push(
      `(loud-on-empty) — expected at least ${FLOWS_FLOOR} flow names parsed from ${FLOWS_CONSTANT_FILE}, parsed ${names.length}; the name extraction is broken`,
    );
  }
  if (FLOW_ROSTER_SITES.length < FLOW_SITES_FLOOR) {
    violations.push(
      `(loud-on-empty) — expected at least ${FLOW_SITES_FLOOR} registered roster sites, found ${FLOW_ROSTER_SITES.length}; the registry was hollowed out`,
    );
  }

  for (const site of FLOW_ROSTER_SITES) {
    if (!fs.existsSync(path.join(repoRoot, site))) {
      violations.push(`${site}:1 — expected this registered roster site to exist, found nothing`);
      continue;
    }
    const text = fs.readFileSync(path.join(repoRoot, site), "utf8");
    for (const name of names) {
      const mention = new RegExp(`\\b${name}\\b`, "i");
      if (!mention.test(text)) {
        violations.push(
          `${site}:1 — expected a mention of flow "${name}" (this page is registered as enumerating the full roster in FLOW_ROSTER_SITES)`,
        );
      }
    }
  }

  return {
    name: "flows",
    violations,
    summary: `flows: roster of ${names.length} (${names.join(", ")}); ${FLOW_ROSTER_SITES.length} registered sites all mention every flow`,
  };
}

// ---------------------------------------------------------------------------

const files = textFiles();
const results = [checkPin(files), checkRetiredTokens(files), checkInternalLinks(), checkFlowRoster()];

let failed = false;
for (const result of results) {
  if (result.violations.length > 0) {
    failed = true;
    console.error(`check:content [${result.name}] FAILED — ${result.violations.length} violation(s):`);
    for (const violation of result.violations) console.error(`  ${violation}`);
  } else {
    console.log(`check:content [${result.name}] OK — ${result.summary}`);
  }
}

process.exit(failed ? 1 : 0);
