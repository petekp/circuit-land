# Circuit docs — style spec (authoring contract)

Every docs page must follow this. It is the single source of truth for voice,
shape, and accuracy. Read it before writing or reviewing any page.

## Purpose & reader

These docs are the **canonical reference** for Circuit. The reader is a developer
using Circuit through a coding agent (Claude Code or Codex) or the `circuit` CLI.
Other artifacts (README, etc.) will be derived from these docs.

## Ground truth (non-negotiable)

- Canonical source: a pinned ref of the circuit repo — the latest published
  release tag by default, or a stated commit when intentionally documenting
  pre-release changes.
- **Never** use the README or other top-level prose in that repo — they are stale.
- Authorities: source under `src/cli`, `src/flows`, `src/schemas`, `schemas/`,
  `plugins/`, and `UBIQUITOUS_LANGUAGE.md` (terminology).
- **Invent nothing.** Every command, subcommand, flag, default, config key, flow,
  and concept must exist in source. If you can't verify it, don't write it.
- Prefer verifying CLI flags by reading the command's source in `src/cli/<cmd>.ts`.

## Voice

- Second person, imperative, present tense. Concrete and plain.
- Match the tone of the existing pages (`content/docs/index.mdx`,
  `getting-started.mdx`, `flows.mdx`). Short paragraphs. Short sentences.
- Lead with the thing. No preamble, no throat-clearing, no summary of what the
  page will cover.
- Bias to **too little**. If a sentence isn't load-bearing, cut it. A typical
  page body is under ~40 lines.

### Banned (AI tells & meta copy)

Never use: `comprehensive`, `seamless`, `robust`, `powerful`, `simply`, `easily`,
`leverage`, `delve`, `unleash`, `in this section/guide/page`, `we'll`, `let's`,
`as an AI`, `it's worth noting`, `it's important to note`, `keep in mind`,
`whether you're a … or a …`, `the world of`, `in today's`. No self-reference to
the documentation itself. No emoji. No marketing adjectives stacked on nouns.

## Format

- Frontmatter: `title` (sentence case) and `description` (one sentence, ends with
  a period). Nothing else.
- Internal links use absolute doc paths: `[Flows](/docs/flows/overview)`.
- Headings: `##`/`###` only (H1 comes from `title`). Sentence case.
- Code fences: `bash` for shell, `text` for in-agent slash commands
  (`/circuit:run …`), `yaml` for config. Show real, runnable examples only.
- Flags/options documented as a table: `| Flag | Description |` (add a Default
  column only when defaults exist).

## Page templates

**Concept page** (concepts/*): one-sentence definition → 1–3 short paragraphs on
how it works → optional short list → "Related" links. No fluff.

**Flow page** (flows/{build,fix,…}): one-line purpose → "When to use" (2–4 bullets)
→ "What it does" (the stages, briefly) → "Checkpoints" (only if the flow has them;
otherwise omit) → one example invocation (`/circuit:run` and/or `circuit run`).

**CLI command page** (cli/*): synopsis in a `bash` fence → one-line description →
flags table → 1–3 examples → "Related" links. Subcommands each get their own
synopsis + flags table under an `##` heading.

**Config page** (configuration/*): what it controls → where it lives / how it's
shaped → annotated `yaml` example → key reference. Note `.strict()` parsing
(unknown keys are rejected) where relevant.

## Terminology canon

Use the exact terms and casing from `UBIQUITOUS_LANGUAGE.md`. Key ones:
Flow, Schematic, Block, Stage, Step, Route, Run, Checkpoint, Check, Evidence,
Trace, Report, Run folder, Depth, Mode, Power, Effort, Relay, Connector, Role,
Tournament, Continuity, Skill, Skill slot, Plugin.

- The six public flows: **Build, Fix, Explore, Review, Prototype, Pursue.**
- Builtin connectors: `claude-code`, `codex`, `cursor-agent`.
- Depth levels: `low`, `medium`, `high`. Power: `auto`|`low`|`medium`|`high`
  (default `medium`). Effort: `none`…`max`.
- The CLI binary is `circuit`; the agent command is `/circuit:run`.
