# Circuit docs — build report

Status as of the overnight run. Branch: `feat/docs-site`. Commit: `d2b576d`
(docs) + this report.

## Result

- **30 pages** written across 6 sections, covering Circuit's full user-facing
  surface area, each drafted from the canonical source and adversarially
  re-verified against it by a separate agent.
- **`npm run build`: green.** All 30 doc routes prerender. (One unrelated
  pre-existing warning: `metadataBase` not set for OG images.)
- **`npm run check`: green.** `tsc --noEmit && eslint` clean.
- **Internal links: all 27 resolve.** Banned words / AI-tells / meta-copy /
  emoji: none.

## How it was built

1. Inventory — 6 parallel readers mapped CLI, plugin commands, config/schemas,
   concepts/flows, install, and existing docs from `/Users/petepetrash/Code/circuit`
   (working tree), capturing live `--help`. The README was treated as stale and
   not used.
2. Fill + verify — one agent per page drafted full MDX against `docs-style.md`;
   a fresh agent then re-checked every flag/command/term against source and
   fixed issues in place (25 of 30 pages had at least one fix; 0 unresolved).
3. Integration — build, type/lint check, link integrity, banned-word sweep.

## Information architecture

```
Getting Started   installation · quickstart
Concepts          how-it-works · checkpoints · evidence-and-runs · memory-and-history · continuity
Flows             overview · build · fix · explore · review · prototype · pursue · modes
CLI               overview · run · resume · handoff · history · memory · create · runs · version
Configuration     config-file · connectors · selection · skills
Reference         glossary
```

## What verification caught and fixed (high-value)

- Routing is **agent-driven, not Circuit-driven** — the agent recommends a flow;
  Circuit records and runs it. Corrected on quickstart; index/overview left in
  the looser "Circuit routes" framing (see open item E).
- `Goal` is an **internal** flow (not user-runnable) — removed from the
  autonomous-mode list; the six public flows stand.
- **Invented surface removed:** a non-existent `--query` flag (it's a positional
  arg), a fake `--checkpoint-choice approve` (→ `continue`), a fabricated
  run-folder format (→ `.circuit/runs/<uuid>`), a phantom `npm >= 11.13.0`
  requirement.
- **Accuracy:** acceptance criteria are relay-step-only; checkpoint pausing is
  depth-gated (pauses at deep rigor / tournaments, auto-resolves otherwise);
  only 4 skill hooks actually dispatch; harvest hooks include `PreCompact`;
  custom connectors are `read-only` only.
- **Build-breaker:** the glossary used pandoc definition-list syntax Fumadocs
  doesn't support — would have rendered as broken literal text. Converted to
  bullets; recompiles clean.

## Decisions made (assumed; reversible)

- **Ground truth = the `circuit` working tree** (branch
  `fix/continuity-clear-ambient-resurrection` + uncommitted handoff edits), not
  `main`. `main` is behind on the handoff surface under active development
  (e.g. `handoff done --clear-ambient`). See open item A.
- Documented the **six public flows**; `Goal` covered only as autonomous mode.
- `circuit create` labeled **experimental**.
- Kept terms matched to the **actual tool surface** where canon and surface
  disagree (see item D).

## Open — needs your call

Launch-sensitive (factual):

- **A. Canonical branch.** Confirm docs should reflect the working tree (latest
  handoff surface) vs. `main`. If `main`, the handoff page needs the
  `--clear-ambient` and recent continuity surface trimmed.
- **B. Marketplace path.** `petekp/circuit` is documented as written but
  unverified — confirm it's live.
- **C. npm package name.** Package is `private`/unpublished (v0.0.1); `circuit`
  may be taken on npm. Confirm the public name (possibly `@scope/circuit`); the
  install page hedges with "When published".

Refinements (wording / scope):

- **D. `artifact`.** Deprecated in `UBIQUITOUS_LANGUAGE.md` (→ Report/Evidence)
  but used by the live surface (memory's "citable artifact", Prototype's
  "disposable artifact"). Left matched to the tool. Decide: update canon, tool,
  or docs.
- **E. Routing phrasing.** Align index/flows-overview to the precise "the agent
  recommends a flow, Circuit runs it"? (quickstart already uses it.)
- **F. Intro framing.** index opens "a plugin for coding agents"; Circuit also
  ships as a standalone CLI. Broaden?
- **G. Checkpoints nuance.** Under autonomous, Explore/Prototype variant
  checkpoints resolve via a "highest-score" policy, not the static default.
  Docs say "declared default" (simplification). Surface the distinction?
- **H. Review stage name.** Docs use "Verdict" (live stage title); the draft
  contract says product prose should say "Decision." Pick one.
- **I. Prototype example.** `--tournament` needs `circuits.prototype.variant_models`
  configured or it exits non-zero. Prereq is stated above the example; add an
  inline reminder?
- **J. Inert config.** `detection.disabled_patterns` and strict-mode are parsed
  but not yet wired to behavior. Documented accurately; keep in a canonical
  reference or omit until wired?

## Suggested next steps

1. Answer A/B/C — I can patch the install + handoff pages immediately.
2. Skim the 30 pages; I can batch-apply D–J in one pass.
3. Optional visual pass: `npm start` and review rendering (designer eye).
4. Derive the README from these docs (the stated downstream goal).
