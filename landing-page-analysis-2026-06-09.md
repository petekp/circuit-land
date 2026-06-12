# Landing page first-principles analysis — 2026-06-09

Brief: identify issues and opportunities, biased toward paring down and
focusing. Not adding. Analysis only; nothing here has been applied.

Method: four independent review lenses (cold visitor, message architecture,
claims vs. reality, weight accounting) produced 46 findings; the 19
high-impact ones each went through a devil's-advocate round that defended
the current design. All 19 survived, every one in a refined form — the
refinements below are the post-challenge versions, not the raw takes.

The page's core claim, stated once and buried mid-page: **hand off more and
keep your confidence, because the result comes with evidence, not a claim
that it's done.** Almost every recommendation below is some form of "say
that once, well, and delete the other tellings."

---

## A. Factual fixes (wrong today, cheap to fix)

**A1. The Memory "soon" chip is false — memory shipped.** Every run leaves
CLI-queryable records, and runs start by recalling ranked hints from past
runs (the query-rank work merged last week). The page marks its most
defensible differentiator as vaporware. Fix: drop the chip, link the heading
to /docs/concepts/memory-and-history like the other columns, and use the
true claim: "Every run leaves structured, CLI-queryable records. The next
run starts with a few hints recalled from them, ranked against your goal —
hint-only, never overriding the flow's own checks." Cut "powerful substrate
for longitudinal memory."

**A2. "ensuring no steps are skipped" contradicts the page's own copy** two
sentences earlier ("Flows have varying levels of rigor… low for quick
changes") and the modes docs. Replacement that keeps the real enforcement
claim: "Every handoff is typed and Circuit does the routing, so the agent
can't skip steps or silently drop context." Lite rigor is *you* choosing a
lighter flow up front; what's foreclosed is the agent improvising mid-run.

**A3. The Checkpoints copy oversells the default.** At default rigor Circuit
never pauses — a skeptic's first run "disproves" the page. True version,
same length: "Flows declare where your judgment matters: a risky direction,
an ambiguous goal, a visual choice. At deep rigor Circuit waits for your
call; otherwise it takes the safe default and records it. The decision point
lives in the flow, not the agent's discretion." Align the "Human Decision"
block card, which repeats the same overclaim.

**A4. The background hue ramp scrubs backwards mid-page.** Render order vs.
`data-site-hue-stop`: 0 → 0.375 → 0.125 → 0.25 → 0.5… The attributes were
never renumbered when sections moved. Verified in source. Renumber to match
render order (or to the new order if B6 happens).

**A5. Dead code: `circuit-background.tsx` is 8,008 lines imported by
nothing.** Verified — zero imports anywhere in src/. Delete (plus its two
public assets if unreferenced).

**A6. The metadata describes a different product than the page.** The title
tag, h1, and meta description are three different positionings, and the
description claims "timely skills" — a feature that appears nowhere on the
page and didn't ship. Align title with the h1; restate the description in
shipped vocabulary.

## B. Structural pare-downs (the big wins)

**B1. Dissolve "Why Process" (~200 words + full-bleed illustration).** Every
claim in it appears elsewhere; it's the longest attention-death zone on the
page. Salvage exactly two sentences: "You become the agent's working memory"
replaces the weaker Example Run lead, and "The agent is the capable part.
Circuit is the path it runs along" moves into the masthead subhead. The
illustration goes with the section (and loses its image-priority flag
regardless).

**B2. "Where It Fits": 6 cards → 3.** At ~545 words it's ~30% of the page's
prose, re-arguing the same point six times on one template. Keep: a merged
"Skills, AGENTS.md, and playbooks" card (context vs. motion, preserving both
existing rebuttals); "Claude Code's Dynamic Workflows" (the only
same-platform confusable); "Spec-driven development" (keep the compatibility
angle — "feed Circuit a spec and Frame turns it into a typed brief" — it's
the page's only concrete picture of Frame, and it's an adoption argument).
Cut Autonomous-agents and Compound-engineering cards, but promote the
best line on the page — "Circuit is not another agent. It is the process
your agent follows." — into the section lead. ~200 words saved.

**B3. Trust grid: four real mechanisms instead of two-and-filler.** Cut
"Confidence" (it's the thesis restated, not a mechanism). Put **Continuity**
in its slot — the most-used shipped capability is currently absent from the
page entirely: "Stop mid-task and close the terminal. Your goal, next
action, and run state are waiting in the next session as a distilled brief."
Fix the Memory column per A1. Result: Evidence, Checkpoints, Continuity,
Memory — all shipped, all linked. (Trust it works / trust it asks / trust
you can leave / trust it remembers.)

**B4. "Inside a Block": cut the "Custom — soon" card unconditionally.** The
composer already has a richer Custom panel; one page doesn't need the same
"soon" twice. The ten real cards are a judgment call (see C4) — they're the
page's only definitions of the block vocabulary, since the composer tiles
render names only. Option worth weighing: move the ten one-liners onto the
composer tiles as hover/selected-tile captions and cut the grid to its lead
sentence + docs link (saves a full viewport).

**B5. Install: one primary surface.** Today there are two complete install
surfaces with the same commands, plus an empty OpenCode tile at the exact
conversion point. Keep the agent-prompt block as primary (host-agnostic, and
on-thesis: the first interaction with a delegation product is a delegation).
Collapse the host cards to a compact "prefer to run the commands yourself?"
disclosure. OpenCode becomes one footnote line. Make sure "then start with
/circuit:run <task>" survives wherever a visitor converts.

**B6. Reorder: concrete before abstract.** Masthead → **Example Run** →
FlowComposer → Trust → Where It Fits → Get Started. The real transcript is
the page's strongest converter and currently sits behind the heaviest
component. If reordered: flip the Example Run default to "Without Circuit"
(its own lead line describes the without-state the current default hides) —
but only together with trimming that transcript from 26 lines to ~10–12 so
the pain beat is fast. The hue-stop bug (A4) is evidence the page has
already been reordered once without cleanup; this finishes the thought.

**B7. Ration the "soon"s.** Four-to-six "soon" surfaces on one page
(composer Custom nav, Custom block card, Memory chip, OpenCode tile) read as
roadmap crowding out product — costly for an alpha asking for trust. A1, B4,
and B5 together get it to one or zero.

## C. Copy sharpening

**C1. The masthead names a category, not a function.** After the h1 +
subhead, a visitor cannot say what installing changes about tomorrow
morning. Keep the category sentence; cut the problem restatement ("Agents
are great at improvisation but require a lot of steering…" — the h1 already
implies it, and the audience lives it). Fuse in one mechanism clause, e.g.:
"Circuit lends agents the process and structure they need to do their best
work: type /circuit:run with a task, and it runs the right flow and hands
back evidence instead of a claim." Net-negative word count.

**C2. Flows-section lead: 4 sentences → 3.** Keep sentence 1 (the best on
the page) and the rigor sentence; cut the "typed with deterministic
handoff" sentence (A2 provides the replacement); keep one self-glossing
tournament line since the composer's default view doesn't show the toggle.

**C3. "Evidence" is asserted ~16–31 times and shown zero times.** The one
place "substitute, don't add" applies: take 3–5 lines of a real run record
(named checks with pass/fail, evidence pointers, decision) and put that
excerpt in the Trust section's Evidence slot — framed as the file the run
leaves behind — replacing the abstract copy. Then delete assertions
page-wide; with one real artifact shown, the word can drop to single
digits.

**C4. FlowComposer trims (keep the signature visual).** Cut the Custom nav
entry + hypothetical-flow preview (default-visible "soon," unshipped). Cut
the FlowSupportIndicator chips ("Rigor lite–deep" means nothing
pre-install). Keep the Tournament toggle — invisible on the default path,
and the only on-screen demonstration of the "flexible" claim.

---

## Net effect

Page sheds roughly a third of its prose; every surviving section advances
the one claim. Nothing is added except a single real run-record excerpt
that replaces abstract copy (C3) and the Continuity cell that replaces
filler (B3) — both substitutions, both word-count flat.

## Residual judgment calls (genuinely yours)

- The ten block cards: definitions-on-page vs. composer-hover vs. docs-only
  (B4). The challenge round split on this — it's a taste call.
- Whether the comparison section's Dynamic Workflows card belongs on the
  landing page or in a docs FAQ (it answers the highest-intent objection,
  but seeds a feature most visitors haven't heard of).
- Reorder (B6) is higher-risk/higher-reward than the pure cuts; everything
  in A–C except B6 works without it.

27 medium/low findings (jargon ledger, transcript trims, metadata details)
are in the full workflow output; none change the shape of the above.
