# Circuit landing page: outline proposal

A single-page skeleton with most of the copy written and clear placement markers
for install, features, license, and the GitHub link. Design comes later. This
document has three parts:

1. The exploration: five outline directions we considered.
2. The rubric and scores, and why one direction won.
3. The winning page, section by section, with copy and placement markers.

Everything traces back to `circuit/CONTEXT.md`. Prose follows the Circuit style:
plain sentences, one idea each, no hype, agents described the way you would
describe a skilled practitioner in a good working environment.

---

## Part 1: The five directions we explored

Each direction is a different way to sequence the same story for a stranger who
lands on the page knowing nothing about Circuit.

1. **Problem-first.** Open on the pain: ad-hoc chat forces you to carry the
   process, the state, and every routine nudge by hand. Then reveal Circuit as
   the better working environment, and resolve into install.

2. **Analogy-first.** Open on the human truth: skilled people rarely wing it.
   They follow a process and check the work. Map that onto coding agents, then
   climb the ladder from skill to flow to process.

3. **Show-first.** Open by showing one real run: you describe a task, Circuit
   picks the flow, the agent works the process, a checkpoint appears only when
   judgment matters, and a short outcome lands. Concrete before abstract.

4. **Contrast-first.** Open on the landscape: you already have skills, and Claude
   Code now has dynamic workflows. Position Circuit as the everyday process layer
   between them, fairly, then move to install.

5. **Concept-ladder.** Build understanding one rung at a time: skills exist, but
   a skill is one move; process is the next layer; flows are processes made of
   reusable blocks; Run routes to the right flow; evidence and confidence are the
   payoff.

---

## Part 2: Rubric and scores

The rubric below was applied to all five directions by an independent judge panel
(three judges per outline, scores averaged). Weights sum to 100.

**Rubric**

| Criterion | Weight | What it rewards |
| --- | ---: | --- |
| Philosophy fidelity | 24 | How faithfully the outline carries the CONTEXT.md thesis: skilled humans use tried-and-true processes because judgment works better with structure,... |
| Differentiation and teaching | 20 | How well the outline teaches what Circuit is and, crucially, how it differs from adjacent tools, including raw Claude Code, Codex, and ad-hoc workf... |
| Newcomer clarity | 18 | How quickly a first-time reader who already uses Claude Code or Codex grasps what Circuit is and why it matters. Rewards a strong above-the-fold ho... |
| Narrative flow and attractiveness | 15 | How well the sections sequence into one coherent argument rather than a feature list, and how inviting the page reads. Rewards a logical arc: a pro... |
| Conversion to install and first run | 13 | How naturally the outline moves a convinced reader to install and run their first task with no friction. Rewards a correctly placed install path fo... |
| Restraint and on-brand voice | 10 | How well the outline avoids overclaiming and honors the hard style rules. Rewards framing future capability as future: memory is primarily agent-fa... |

**Scores (averaged across a 3-judge panel, out of 100)**

| Direction | Score | |
| --- | ---: | --- |
| show-first: lead by showing a single /circuit:run in action (operator types a task, Circuit picks a flow, the agent follows process with evidence attached, a checkpoint appears only when judgment matters, then a short done-or-blocked surface), and stay concrete before going abstract. | 89.2 | **winner** |
| Analogy-first. Open with the human truth that skilled people rarely wing it: they follow a process and check the work. Map that one-to-one onto coding agents, then name Circuit as the thing that gives capable agents that same kind of process. Carry the concept ladder throughout: a skill is one move, a flow is the practice that decides when moves are used, how work advances, and what evidence counts. Every later section pays off the opening analogy rather than introducing a new metaphor. | 88.5 |  |
| concept-ladder: build understanding rung by rung (skills exist -> a skill is one move -> process is the next layer -> flows are processes made of reusable blocks -> Run routes to the right flow -> evidence and confidence are the payoff), with install threaded near the top for the impatient. | 87.9 |  |
| problem-first | 87.8 |  |
| contrast-first | 57.7 |  |

_Adversarial review ran 6 round(s); ended on a clean streak of 0. Claude Code dynamic-workflows facts were fetched live: True._

**Why show-first won.** It is the most honest answer to the page's hardest job:
making a stranger understand what Circuit actually *is* before asking them to care
about its philosophy. Telling someone Circuit is a "better working environment"
is abstract. Showing one `/circuit:run` go from a typed task to a finished,
checked result makes the idea concrete in one screen, and every later section
(the thesis, the flows, the evidence story) then has something real to refer back
to. The runner-up directions each contribute one strong move that the winning
page absorbs: the analogy opener ("skilled people rarely wing it"), the explicit
skill to flow to process ladder, and the fair, accurate contrast with skills and
Claude Code's dynamic workflows.

---

## Part 3: The winning page, section by section

Eight sections, top to bottom. Placement markers are in `[BRACKETS]`. Copy shown
in quotes is close to final; lightly edit as needed. "Verbatim" copy is lifted
from existing sources and should be reproduced exactly.

### Section 1: Masthead

**Purpose:** orient a stranger in one screen and offer two quiet ways forward.

- Wordmark: **Circuit**
- Subhead (verbatim): "a plugin for Claude Code and Codex"
- H1 (verbatim, keep): **"Powerful, repeatable work patterns for coding agents."**
- One line of subcopy that names the felt problem and the shift:
  > "You hand a task to a coding agent, then spend the next hour steering every
  > step in chat. Circuit gives the agent a real process to follow, so you can
  > hand off the work instead."
- Honest status line: "Alpha, v0.0.1."
- Two calls to action, each with one unambiguous behavior:
  - "See a run" scrolls to Section 2.
  - "Install" jumps to the install block in Section 7. It does not reveal
    commands at the top; on a show-first page, seeing the run comes first.
- `[GITHUB LINK]` in the top corner: `github.com/petekp/circuit`

`[VISUAL: wordmark, headline, one line of subcopy, two quiet CTAs. Design TBD.]`

### Section 2: See one run

**Purpose:** the centerpiece. Make a stranger understand Circuit by watching it
work, not by reading about it. This is the "now I get it" beat.

- One orienting line above the run:
  > "Normally you steer each step in chat. Here you describe the task once, and
  > the agent works a real process, asking only when a choice genuinely needs
  > you."
- The run itself, shown as an annotated sequence (not prose paragraphs):
  - **Step 1.** You type the task (verbatim command to show):
    `/circuit:run add rate limiting to the public API`
  - **Step 2.** Circuit selects the flow and records it. You did not have to pick
    one.
  - **Step 3.** The agent follows the process: plan, gather context, make the
    change, check it, review it.
  - **Step 4.** A checkpoint appears, but only because a real choice is here.
    If nothing needed your judgment, it would keep going.
  - **Step 5.** A short outcome: done or blocked, with the one thing you need to
    know.
- Caption tying it back to the idea:
  > "The screen stays short on purpose. The full record (plan, checks, evidence)
  > is kept for the agent and the next run, not dumped on you."

`[VISUAL: annotated depiction of the five steps, built from a real captured run.
The rich checkpoint UI is forward-looking; if shown, label it as where this is
headed. Design TBD.]`

### Section 3: What Circuit is

**Purpose:** now that they have seen a run, give them the idea behind it.

- The analogy (reuse and sharpen existing copy):
  > "Skilled people rarely wing it. They follow a process, pick the right move at
  > the right moment, and check the work before moving on."
- The problem, named plainly:
  > "Ad-hoc chat makes you carry that process by hand: the state, the next move,
  > the right skill, when to check, and when to pause. That is a tax on you, and
  > it is not a great way for the agent to work either."
- The shift:
  > "Circuit gives that process to the agent. You describe the task; Circuit
  > brings the practice for how to do that kind of work well. You delegate more,
  > and you keep your confidence that the work was done properly."
- The ladder, stated once and clearly:
  > "A skill is one move. A flow is the practice: the right moves, in the right
  > order, with checks along the way. Process is the layer above your skills that
  > decides which to use and when."

### Section 4: Flows and blocks

**Purpose:** show the moving parts without making anyone choose among them.
`[FEATURES]`

- Lead line:
  > "You never have to pick a flow. Run chooses the one that fits the task. But
  > here is what is under the hood."
- `[FEATURES: flows]` Five flows, each with its command and one line (reuse
  existing summaries):
  - **Explore** `/circuit:explore`: compare paths before the agent commits to one.
  - **Build** `/circuit:build`: turn a clear brief into a plan, a change, checks, and review.
  - **Fix** `/circuit:fix`: find the cause, make the fix, and keep evidence attached.
  - **Review** `/circuit:review`: review a scoped change against evidence, not guesswork.
  - **Goal** `/circuit:goal`: keep a bounded objective moving until it is done, blocked, or needs a decision.
- `[FEATURES: blocks]` The reusable moves a flow is built from:
  Clarify, Frame, Gather Context, Diagnose, Plan, Act, Run Verification, Review,
  Human Decision, Close With Evidence.
- One line tying them together:
  > "A flow is just these blocks arranged for a kind of work. Same pieces,
  > different order."

`[VISUAL: the existing flow-assembly diagram (blocks composing into Build, Fix,
Goal). Reuse what is already built.]`

### Section 5: What you can trust

**Purpose:** the philosophy payoff. Why this produces better work, not more
ceremony.

- Evidence:
  > "Circuit keeps checks and results attached to the work. The agent evaluates
  > its own work against that evidence instead of asking you to take it on
  > faith."
- Checkpoints:
  > "Checkpoints are rare and worth it. Circuit pauses when your judgment
  > changes the outcome: a risky direction, an ambiguous goal, a visual choice.
  > Otherwise it keeps moving."
- Confidence:
  > "The point is confidence while you delegate more: you can trust the agent did
  > its best work, did not cut corners, did not spin its wheels, and is learning
  > from what came before."
- Where it is heading (clearly future, not a current promise):
  > "Circuit also keeps a record across runs so future work can build on what was
  > already learned in your project. Think of it the way a practitioner gets
  > better with experience. This part is in active development."

### Section 6: Circuit and your other tools

**Purpose:** place Circuit honestly next to skills and Claude Code's dynamic
workflows, without strawmanning either. `[CONTRAST]`

- Framing line:
  > "Circuit does not replace your coding agent, your skills, or anything Claude
  > Code or Codex already gives you. It sits above them and decides how the work
  > gets done."
- Skills:
  > "A skill teaches one move. Circuit decides which moves to use, in what order,
  > and what to check before moving on. Your skills still apply, at the right
  > steps."
- Claude Code dynamic workflows (accurate per the current docs):
  > "Claude Code's dynamic workflows orchestrate many subagents from a script for
  > big one-off jobs: a codebase-wide audit, a large migration, deep research.
  > Circuit is for the everyday work in front of you. It picks a repeatable
  > process for this task, keeps evidence attached, and pauses only when your
  > judgment matters. The two stack rather than compete."
- One honest line so nobody feels sold:
  > "If your task is a hand-rolled mega-orchestration, reach for a workflow. If
  > it is build this, fix that, review this change, reach for Circuit."

`[CONTRAST placement: a short three-column or three-row comparison. Skills =
one move. Dynamic workflows = orchestrate many agents for large one-off jobs.
Circuit = a repeatable, evidence-backed process for everyday work, behind one
front door.]`

### Section 7: Install and start

**Purpose:** the moment they want it, make starting trivial. `[INSTALL]`
`[GETTING STARTED]`

- `[INSTALL: Claude Code]` (verbatim):
  ```text
  /plugin marketplace add petekp/circuit
  /plugin install circuit@circuit
  /reload-plugins
  ```
- `[INSTALL: Codex]` Needs your decision, see the note below. Current page shows:
  ```text
  codex plugin marketplace add petekp/circuit
  ```
- `[GETTING STARTED]` The one thing to do next (verbatim shape):
  > "Then start with:"
  ```text
  /circuit:run <your task>
  ```
- `[GETTING STARTED: copy for your agent]` Keep the existing "copy these
  instructions to your coding agent" block. It is a strong, low-friction path and
  already written.
- Requirement, for the CLI path only: "The CLI needs Node.js 22.18.0 or newer."

### Section 8: Footer

- `[GITHUB LINK]` (verbatim): `github.com/petekp/circuit`
- `[LICENSE]` MIT. Short footer line: "MIT licensed." Link the word "MIT" to the
  LICENSE file in the repo. Free to use, modify, and redistribute; keep the
  copyright and license notice.
- Repeat the alpha note: "Alpha, v0.0.1."

---

## Decisions for you

A few things I could not resolve from the sources alone:

1. **Codex install command.** The current page shows
   `codex plugin marketplace add petekp/circuit`, but the repo README's Codex
   section instead documents `npm run sync:codex-plugin-cache` for host use from
   a checkout. These describe different scenarios. Tell me which is the canonical
   public install and I will lock Section 7.

2. **License.** Resolved: MIT (free, attributable). The footer says "MIT
   licensed" and the repo now carries a `LICENSE` file, an SPDX `license` field
   in `package.json`, and an updated README License section.

3. **The hero capture.** Section 2 wants one real captured run to build the
   annotated visual from. I can produce that capture from a live `/circuit:run`
   when you are ready, or we design around a representative mock first.

## What I deliberately kept as future, not promise

- **Memory and the effectiveness ratchet** appear only in Section 5, framed as
  where Circuit is heading and "in active development." CONTEXT.md is explicit
  that this should stay out of the current core promise, so the page does not
  claim Circuit already gets better over time.
- **Flow authoring** is not pitched. Near-term value is the prebuilt flows, not
  asking anyone to design a process first.

## Note for the designer

- Section 2 is the page. Give it the most space and the strongest visual; the
  whole narrative leans on the reader understanding one run at a glance.
- Sections 3 to 6 are reading sections; keep them calm and text-forward so
  Section 2 stays the star.
- Section 4 reuses the existing flow and block components and the assembly
  diagram. Section 7 reuses the existing install and "copy for your agent"
  blocks. Little new component work beyond the Section 2 hero.

<!-- exploration corroborated by a multi-agent run: five outlines drafted, rubric applied by a three-judge panel per outline, winner synthesized and put through repeated adversarial review until two consecutive clean passes. -->
