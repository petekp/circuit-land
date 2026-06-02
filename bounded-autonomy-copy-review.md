# Circuit Landing Page Copy Review: Bounded Autonomy

Status: recommendation report
Date: 2026-06-01
Scope: `src/app/page.tsx` landing-page copy only. This does not edit the site.

## Bottom line

The page is already close to the bounded-autonomy story. It sells repeatable
process, evidence, checks, and judgment points. That is the right lane.

The best change is not to make "bounded autonomy" the hero phrase. The research
says the term is useful but not yet a standard category. Use the idea instead:
the agent gets room to work inside a declared flow, and the flow keeps the work
visible, checked, and interruptible at meaningful points.

The main copy risk is the hero line's "trusted colleague" image. It asks the
reader to trust the agent. The stronger Circuit claim is different: you can hand
off work because the work stays visible, bounded, and backed by evidence.

## Priority recommendations

### 1. Replace the hero trust image

Current copy, `src/app/page.tsx:414`:

> Circuit gives agents a finely-tuned process to follow, so instead of
> micro-managing, you're handing the work off to a trusted colleague.

Recommended:

> Circuit gives agents a clear flow to follow, so you can hand off work without
> losing sight of the path, the checks, or the moments that need your judgment.

Why: the bounded-autonomy report says Circuit should avoid "full autonomy" style
messaging and own "useful autonomy with boundaries." It also recommends the
current-behavior claim: repeatable flows with checks, traces, reports, and
evidence make autonomous work inspectable. This suggested line keeps the
delegation benefit but grounds trust in visibility and checks, not in the agent
being colleague-like.

Evidence: `bounded-autonomy-ai-agents.md:31`, `bounded-autonomy-ai-agents.md:294`,
`bounded-autonomy-ai-agents.md:309`, `UBIQUITOUS_LANGUAGE.md:20`,
`UBIQUITOUS_LANGUAGE.md:27`, `UBIQUITOUS_LANGUAGE.md:30`,
`UBIQUITOUS_LANGUAGE.md:32`.

Alternate, shorter:

> Circuit gives agents room to work inside a clear flow, with checks, evidence,
> and checkpoints where judgment matters.

This is punchier and closest to the research note's positioning sentence, but it
uses more product vocabulary above the fold.

### 2. Make the example-run outcome auditable

Current copy, `src/app/page.tsx:80`:

> Outcome

Current copy, `src/app/page.tsx:82`:

> A factual, verified result is provided. No gaslighting.

Recommended:

Label:

> Result with evidence

Note:

> You get the short answer, plus the checks and trace that support it. No
> gaslighting.

Why: "verified" is a strong word, but the page can make it more concrete. The
bounded-autonomy report says trace, reports, evidence, and run folders are the
accountability layer, and the Circuit vocabulary defines Trace, Report, and
Evidence as core product terms. The recommendation keeps the emotional punch of
"No gaslighting" while showing what makes the result trustworthy.

Evidence: `bounded-autonomy-ai-agents.md:121`, `bounded-autonomy-ai-agents.md:134`,
`bounded-autonomy-ai-agents.md:325`, `UBIQUITOUS_LANGUAGE.md:30`,
`UBIQUITOUS_LANGUAGE.md:31`, `UBIQUITOUS_LANGUAGE.md:32`.

### 3. Add the missing boundary to "Routed, not chosen"

Current copy, `src/app/page.tsx:543`:

> /circuit:run interprets your intent and routes it to the appropriate flow,
> automatically. Each flow is a specialized set of typed blocks. Each block does
> one job. The flow makes these jobs compound, passing structured handoff
> forward until the agent can deliver a clear outcome with evidence.

Recommended:

> /circuit:run interprets your intent and routes it to the appropriate flow.
> You can see which flow it picked, then watch each block run toward a checked
> outcome. Each flow is a specialized set of typed blocks. Each block does one
> job. The flow makes these jobs compound, passing structured output forward
> until the agent can deliver a clear outcome with evidence.

Why: "automatically" can sound opaque. Bounded autonomy works because the system
can act without hiding the path. The run pane already shows "Chose build" and
streams block progress. This revision turns the current visual proof into a copy
claim.

Evidence: `src/app/page.tsx:53`, `src/app/page.tsx:55`,
`src/app/page.tsx:56`, `src/app/page.tsx:60`,
`bounded-autonomy-ai-agents.md:24`, `bounded-autonomy-ai-agents.md:158`,
`UBIQUITOUS_LANGUAGE.md:20`, `UBIQUITOUS_LANGUAGE.md:22`.

### 4. Sharpen the checkpoint claim

Current copy, `src/app/page.tsx:154`:

> Human Decision

Current copy, `src/app/page.tsx:158`:

> Pauses only when judgment changes the result: tradeoffs, taste calls, risky
> scope, or missing intent.

Recommended:

> Pauses when judgment changes the result: tradeoffs, taste calls, risky scope,
> or missing intent. The flow stops for you there, then keeps moving once the
> choice is clear.

Why: the page already has the right idea. The bounded-autonomy research makes it
more salient: oversight should sit at strategy points, not every click. This
copy emphasizes the operator's control without turning the page into a safety
framework pitch.

Evidence: `bounded-autonomy-ai-agents.md:101`, `bounded-autonomy-ai-agents.md:113`,
`bounded-autonomy-ai-agents.md:242`, `UBIQUITOUS_LANGUAGE.md:27`.

### 5. Rename or reframe "Why you can trust it"

Current heading, `src/app/page.tsx:625`:

> Why you can trust it

Recommended heading:

> Why delegation stays accountable

Recommended Checkpoints card, replacing `src/app/page.tsx:640`:

> Circuit pauses when your judgment changes the outcome: a risky direction, an
> ambiguous goal, a visual choice. Otherwise it keeps moving and leaves the work
> traceable.

Why: "trust it" is broadly true, but the research points to calibrated trust,
not generic trust. "Accountable" is the better frame because the section is about
evidence, checkpoints, confidence, and memory. "Delegation" keeps the human
benefit without overloading Circuit's more specific Handoff vocabulary. It also
connects cleanly to the report's "accountable agent work" wording.

Evidence: `bounded-autonomy-ai-agents.md:121`, `bounded-autonomy-ai-agents.md:134`,
`bounded-autonomy-ai-agents.md:323`, `bounded-autonomy-ai-agents.md:343`,
`UBIQUITOUS_LANGUAGE.md:30`, `UBIQUITOUS_LANGUAGE.md:31`,
`UBIQUITOUS_LANGUAGE.md:32`.

### 6. Keep memory advisory and future-tense

Current copy, `src/app/page.tsx:663`:

> Every run generates structured, CLI-queryable records: choices, checks,
> evidence, and what happened next. These form a powerful substrate for
> longitudinal memory.

Recommended:

> Every run generates structured, CLI-queryable records: choices, checks,
> evidence, and what happened next. Memory should use those records to orient
> the next run, not overrule its proof.

Why: the current "soon" chip is good. The suggested second sentence uses the new
research more directly and prevents the common memory overclaim. The bounded
autonomy report is explicit: memory can orient, but it must not satisfy proof,
policy, route, checkpoint, verification, or write authority.

Evidence: `bounded-autonomy-ai-agents.md:166`, `bounded-autonomy-ai-agents.md:172`,
`bounded-autonomy-ai-agents.md:275`, `bounded-autonomy-ai-agents.md:332`.

If this feels too implementation-heavy for the public page, keep the current
copy and add this rule to an internal copy guide instead.

## What to preserve

- Keep the H1: "Powerful, repeatable work patterns for coding agents." It
  matches Circuit's README and avoids overclaiming autonomy.
- Keep "a plugin for Claude Code and Codex." It makes clear Circuit is not the
  agent itself.
- Keep the visible run pane. It proves the "inspectable path" story better than
  another paragraph would.
- Keep the comparison card that says "Circuit is not another agent. It is the
  process your agent follows." That is the cleanest public version of the
  bounded-autonomy frame.
- Keep "OpenCode support coming soon" and the Memory "soon" chip. Both keep
  future claims honest.

## What not to say

- Do not lead with "fully autonomous." The research explicitly recommends
  avoiding that frame.
- Do not call memory a guardrail. Memory is advisory in Circuit's posture.
- Do not imply Circuit is a governance platform unless the enforcement surface
  is the point of the page.
- Do not claim Circuit proves memory improves outcomes today. The safer claim is
  that Circuit is designed to make improvement auditable over time.
- Do not replace "Flow", "Block", "Checkpoint", "Trace", "Report", or
  "Evidence" with generic terms when the copy is explaining Circuit itself.

## Suggested page-level positioning

Use this as the internal message, not necessarily the H1:

> Circuit is bounded autonomy for coding agents: the agent can keep moving
> inside a clear flow, with checks, evidence, and checkpoints where judgment or
> authority matters.

Public version:

> Circuit gives coding agents room to work inside a repeatable process, with the
> path visible and the result backed by evidence.

This is the strongest landing-page synthesis. It uses the research without
turning the page into a research paper.
