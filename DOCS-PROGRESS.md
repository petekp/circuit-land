# Circuit docs — build report

Branch: `feat/docs-site`. Final state after the overnight build, the accuracy
audit, and the Mermaid diagram pass.

## Result

- **30 pages** across 6 sections cover Circuit's full user-facing surface,
  drafted from canonical source and adversarially re-verified against it.
- **12 Mermaid diagrams** render the load-bearing mental models (stage pipeline,
  routes/terminals, flow shapes, continuity resolution, acceptance-criteria
  loop, checkpoint resolution) as static, theme-aware SVG.
- **`npm run build`: green** (39 routes). **`npm run check`: green**
  (`tsc --noEmit && eslint`). **Internal links: 82, 0 broken.** No banned
  words / AI-tells / meta-copy / emoji.

## Accuracy audit (post-build)

An 8-agent audit re-checked every flag, subcommand, flow step, config key, and
glossary term against `~/Code/circuit` @ `main`. Each finding was re-verified by
an independent agent before action.

- **2 findings, 1 confirmed, 1 rejected** (false positive).
- **Confirmed (critical):** `installation.mdx` told users to
  `npm install -g @petekp/circuit`, but the package is `private`, named
  `circuit`, and unpublished — that command 404s. Fixed: from-checkout build is
  the working path; `@petekp/circuit` is named as the future published target.
- **Rejected:** "clear" wording in `cli/overview` — the verifier proved it
  matches the handoff page's own language (`done` = "Clear the saved record")
  and the table's effect-verb convention. No change.

## Diagrams

Rendered with [`beautiful-mermaid`](https://github.com/lukilabs/beautiful-mermaid),
a synchronous SVG renderer. `src/components/mermaid.tsx` renders each chart to
SVG at build time in a server component (no client JS, no hydration); colors map
to Fumadocs CSS variables so diagrams follow light/dark automatically. Used via
`<Mermaid chart={...} />`, registered globally in `src/components/mdx.tsx`.

| Page | Diagram |
| --- | --- |
| `concepts/how-it-works` | stage pipeline; step → route → terminal targets |
| `concepts/continuity` | active-record resolution (manual outranks snapshot) |
| `concepts/evidence-and-runs` | acceptance-criteria gate/retry/stop loop |
| `concepts/checkpoints` | resolution by rigor/mode |
| `flows/overview` | agent selects the flow (fan-out) |
| `flows/{build,fix,explore,review,prototype,pursue}` | per-flow stage shape |

## Ground truth

`~/Code/circuit` @ `main` is canonical. PR #47
(`fix/continuity-clear-ambient-resurrection`) merged the full continuity /
`--clear-ambient` surface into `main`, so the docs' branch-tracking decision is
now vindicated and `main` is authoritative. The README is stale and was not
used.

## Editorial pass (D–J)

- **Applied:** E (routing is agent-driven — index/overview), F (intro names the
  CLI alongside the plugins), I (Prototype `--tournament` config prereq inline).
- **Left as residuals (recommended):** D `artifact` term (matches the live
  surface; changing canon/tool is out of docs scope), G checkpoint highest-score
  nuance (autonomous-only edge case; "declared default" is the right
  simplification), H Review "Verdict" stage name (matches the live stage title),
  J inert config surface (`detection.disabled_patterns` / strict-mode documented
  accurately as parsed).

## Next

1. Push `feat/docs-site` and open the PR.
2. Derive the README from these docs (the stated downstream goal).
