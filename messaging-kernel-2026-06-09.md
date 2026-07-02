# Circuit messaging kernel — workshop result, 2026-06-09

> **SUPERSEDED (2026-07-02).** The live messaging is the encoded-process framing
> in the circuit repo's `docs/positioning.md` and the current home page
> components under `src/components/home/`. Kept for history only.

Process: six writers worked distinct angles (work-layer, amnesia, instruments,
supported-engineer, environment-as-gift, wildcard). Every candidate passed
through three kill-test critics (universality + skeptic rebuttal,
differentiation + product truth, voice + density), mandatory revision, then a
three-judge panel (generativity, eight-second skeptic read, fidelity to the
agent-empathetic angle). Four of six finalists independently converged on the
same h1; a fifth acquired it by judge graft.

## The kernel (canonical statement)

Your agent improvises the way it works on every task and survives on notes to
itself: plan files, scratchpads, compaction summaries. Everything around it,
the codebase, the AGENTS.md, the CI, constrains the code and carries none of
the work: how a task moves from request to verified done, what was decided,
what was checked rather than claimed. Circuit carries the work, built for the
agent rather than over it: one command picks one of six flows and routes each
typed step, so nothing gets skipped or silently dropped mid-run, with
checkpoints where a flow declares your judgment matters. Every run writes
check results, decisions, and open risks into a durable record: the agent's
own instrument panel first, with goal, next action, and run state restored at
the next session. Your trust falls out of the same record: hand off more,
check in less.

## Masthead scale

**Status (revised twice, 2026-06-09):** the workshop's consensus h1
("Codebases shape the code. Circuit shapes the work.") died on surface
tautology; its repair ("Everything shapes the code. Nothing carries the
work.") died on a sixth kill-test, discovered by the owner:

**Kill-test 5 — tautology:** a compressed claim must not parse as "X
shapes X" even if the intended reading is sound.

**Kill-test 6 — entry vocabulary:** an h1 may only use distinctions the
visitor already holds. The code/work distinction is conclusion vocabulary:
the page has to teach it before any line can trade on it. To a cold
reader "the code" and "the work" are synonyms, so every aphorism on that
axis reads as a riddle (perplexing, not intriguing).

The kernel paragraph is unaffected: it remains the internal organizing
logic the sections derive from. "Shapes the code / carries the work" can
still earn its place mid-page as a section heading, after the problem
section has taught the distinction.

**SHIPPED masthead (Pete, 2026-06-09, circuit-land PR #6, main
dc353a4; supersedes everything below in this section):**

**h1:** Coding agents aren't unreliable. Your process is.

**Subhead:** Agents learned to work from us, and like us, they do
their best work inside a real process. Circuit is that process.

Structure: diagnosis → warrant → verdict. The masthead steps down in
length and closes on a four-word identity move that compresses the
approved on-page line ("It is the process your agent follows").
"Process" appears three times as a closed loop, not repetition: your
process is unreliable → like us, they need a real one → Circuit is
that process.

**The warrant (Pete's thesis, now load-bearing):** agents are trained
on human work, so they work the way humans work and benefit from the
same supports humans need on complex tasks. It answers the h1's
implicit question ("why would process matter to a language model?")
before the reader forms it. Rendering rule: behavioral, never mental
("learned to work from us", never "think like humans" — the
token-predictor rebuttal must find no surface). The skeptic's reflex
("it just predicts tokens from human work") restates the claim
instead of rebutting it.

**Noun graveyard for the closer slot:** "tools" (vague, slightly
false), "harness" (category Circuit isn't in), "circumstances"
(can't be provided), "environment" (REJECTED at the final step:
implies Circuit is a harness-level solution — to this audience
"environment" means the thing the agent runs inside, and Claude Code
is the harness; ending on it claims the wrong layer), "conditions"
(passive, endured not used), "footing" (mush). The resolution:
"process", the h1's own noun, method-level, exactly the layer
Circuit occupies.

**Kill-test 10 — commercial cadence:** no infomercial rhythm. "so
you don't have to" died here; so did "Circuit builds it." (brand +
hero verb + pronoun is detergent-commercial grammar). The read-aloud
test: if the line could end with an exclamation point in a TV ad,
it's dead. Quiet declaratives survive.

**Gap-frame for sections (APPLIED + SHIPPED, circuit-land PR #7, main
a7cf623, same day):** the full section rework landed: Gap section
replaces Why Process, Record section shows a condensed real Fix run
record (field values verbatim, including outcome partial and the
recorded review-skip reason), Checkpoints/Continuity/Memory each get a
section, Trust grid dissolved, comparison 6→3 cards, metadata + OG
image + docs intro aligned. Original direction statement:
each feature is positioned as a thing Circuit provides to offset bad
process on the user's behalf — humans get a way of working, a paper
trail, continuity, escalation moments; agents get none of it by
default; Circuit fills each gap. The refrain shape: "You'd never ask
an engineer to work without X. Circuit gives your agent X." Tone
guardrail: generous, not corrective — nobody's process was designed
for agents; the gaps are invisible until named.

**History of the day's decisions, kept for the record:**

The emphasis question got settled the same day: the masthead carries
the STANCE, not any single capability. Emphasizing flows, proof, or
memory individually misses the point; each axis-shrinks the product.
The stance: everyone else responds to agent unreliability by
tightening the leash (more rules, more supervision); Circuit equips
the agent like a professional. Internal north star phrasing: "giving
agents the tools they desire to be more effective at their jobs."
Desire-language stays OUT of public copy (attributing wants to a
model invites snark); public-safe rendering is "what it needs to do
the job well."

The h1 is diagnosis + blame-relocation. "Process" was chosen over
"tools" (vague, slightly false) and "harness" (a category Circuit
isn't in). It licenses "process" as entry vocabulary for everything
below it, and pairs with the existing on-page line "Circuit is not
another agent. It is the process your agent follows."

The earlier h1 "Set your agent up to do its best work." is DEMOTED to
approved subhead material (diagnosis on top, prescription below).
Subhead under workshop as of this writing; its job is prescription
after diagnosis, equip-stance, max one concretizing gesture, human
payoff closes never leads.

**Earlier h1 decision (superseded same day):**

**h1:** Set your agent up to do its best work.

**Subhead:** REJECTED twice, rework in progress. The shipped line
("Circuit gives it a process to run, a memory that carries across
sessions, and a record that proves the work. For the agent, not over
it.") died on kill-tests 7 and 8: "For the agent, not over it" defends
against an objection a cold reader hasn't formed, and the
process/memory/record noun inventory has no movement. The replacement
round ("Circuit picks the flow, runs it step by step...") died on a
ninth test, discovered by the owner: "people don't understand what a
flow is or why you'd even want one in the first place."

**Kill-test 7 — no preemptive defense:** never inoculate against an
objection the reader hasn't formed yet.

**Kill-test 8 — movement:** a subhead needs contrast, consequence, or
image; a noun inventory is flat and dies.

**Kill-test 9 — need before mechanism, no product nouns:** the
masthead may not use product vocabulary (flow, typed, routed,
checkpoint, rigor) and may not presuppose the reader wants a process
for their agent. It must create the want in the reader's own
experienced vocabulary; mechanism, if present at all, comes after the
why and in plain words.

Rejected candidates, kept for the record: "Your agent improvises every
task. It doesn't have to." (negative lead) and retaining "Disciplined
autonomy for coding agents." (category label; superseded).

**Subhead:** Your agent improvises its process on every task and survives on
notes to itself. Circuit runs the task as a flow of typed steps the agent
can't skip, records what was checked, decided, and left open, and hands the
next session its goal and next action.

**One-liner (metadata/social, 113 chars):** Codebases shape the code. Circuit
shapes the work: typed steps your agent can't skip, a record it can stand on.

## Supporting moves for section copy

- **Evidence section opener (the instruments move; won the skeptic ballot):**
  "The compiler and the tests give your agent independent readings on the
  code. Circuit adds the same for the work." Anchors the record to the only
  verifiers a skeptic already trusts; the claim is that readings exist, not
  that the agent behaves, so the "it's an LLM" rebuttal never fires. Section
  header candidate: "Instruments your agent runs on."
- **Problem section (the supported-engineer parallel; won the generativity
  ballot):** a human engineer gets more than a codebase: the team supplies
  the way work runs, review at the right moments, a memory of what was
  decided. The agent gets the codebase, the AGENTS.md, the CI, and none of
  the surround. Enumerating AGENTS.md and CI preempts the "I already have
  guardrails" rebuttal by name.
- **Leash inoculation, anywhere enforcement is claimed:** "for the agent,
  not over it." RETIRED from the masthead (kill-test 7: a cold reader
  hasn't formed the leash objection, so the line reads as a riddle).
  Still usable deep in the page where enforcement has actually been
  claimed and the objection is live.
- **Spare line worth keeping (from the last-place candidate):** "In a note,
  'verified' is just another claim." The sharpest single cut at why
  scratchpad continuity isn't a record; usable as a pull-quote or the
  evidence section's second beat.

## What died, and the tests that killed it

- Absolutes died under universality: "Circuit carries the rest" (it doesn't
  carry your review culture or CI), unscoped "context can't drop" (sessions
  compact; the truth is scoped to mid-run, and the scope must be written).
- "Every session it pieces the work back together" died: most sessions are
  single-shot; the true condition is "once work outlives the context window."
- Always-pauses checkpoint phrasing died against product truth (deep rigor
  waits; otherwise safe default, recorded). Surviving form: "checkpoints
  where a flow declares your judgment matters."
- The amnesia angle as a lead died on all three ballots: the deficit story
  reads agent-suspicious unless the gift pivot arrives fast.
- Film references and "deterministic" never made it past drafting.

## Why this kernel generates the page

Hero: the h1 + subhead. Problem: supported-engineer parallel with the
concrete nouns (plan files, scratchpads, compaction summaries). Mechanism:
one command, six flows, typed routed steps, checkpoints. Trust: instruments
framing with the record as the artifact both parties read. Continuity: goal,
next action, run state restored. Closer: hand off more, check in less. Every
section is a clause of the kernel expanded; nothing on the page needs a claim
the kernel doesn't already make.
