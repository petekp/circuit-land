# Animated SVG visual system — workshop result, 2026-06-09

Process: four complete systems designed from forced-distinct angles
(circuit-board signal grammar, self-drafting schematic document set,
one-continuous-line minimalism, one-run-told-in-chapters narrative).
Each passed through a design-coherence critic and an honesty+feasibility
critic, was repaired, then a judge ranked all four and grafted the best
ideas from the losers into the winner. This file is the synthesized
result: the winning system with all judge-sanctioned grafts folded in.
The three runner-up systems are preserved in the workflow output if a
direction here ever needs re-litigating.

## The winner: ONE TRACE — the login-test run, told in chapters

**The conceit (what beat everything else):** the page already contains
the real artifact of a specific Fix run — the fix-result.json excerpt in
the record section, honest "partial" outcome and skipped-with-reason
review included. Every illustration is a frame of THAT SAME RUN. The
drawings corroborate the artifact instead of decorating the page.
Illustration-as-evidence is the brand; a viewer who scrolls the page has
watched one complete run happen.

Why it won over the runner-up (TRACEWORK, a formally rigorous PCB
grammar): TRACEWORK's connection is formal — seven node types and an
opacity ladder a visitor must absorb, or they see handsome generic
boards. ONE TRACE's connection is narrative — a casual scroller who
learns zero glyph semantics still feels "this is the same thing,
continuing." And its checkpoints treatment is the most honesty-robust in
the field (see below).

## The stage

One master drawing, many windows. A single geometry module
(`src/components/run-stage/geometry.ts`) defines THE BOARD once:
1440x360 user units, rail at y=180, eight pads at fixed x positions,
ledger row at y=300, port-stub column above the plan pad, archive band
below. Every chapter SVG is a named viewBox crop of this one coordinate
space — a different camera on the same drawing. Eight pads are the run's
spine, an open abridgment of the ~14-step flow, never contradicting a
field the real JSON shows.

Mobile is a designed crop, not a scaled-down afterthought: every
full-board chapter ships a named NARROW crop (5-pad spine, taller
aspect, ~2x mark scale) as a second `<g>`/viewBox pair toggled with CSS
at ~640px.

## Vocabulary (one shape, one meaning, page-wide)

- **RAIL** — 1.5-unit orthogonal stroke: the flow, the route work travels.
- **PAD** — rounded square (~36u, r2) on the rail: a typed step. Seated
  inner square = completed. Hollow = skipped-but-real.
- **DOTTED form of any shape** = that support, absent. A dotted pad is an
  absent step, a dotted ledger row the absent record, a dotted archive
  band absent memory, a dotted port stub the absent channel to the
  human. Absence is always drawn as the dotted form of the shape that
  later fills it.
- **TEETH** — 3-finger box joints at the exact `.block-edge` CSS
  proportions, on pad top edges: the SVGs and the card grid are visibly
  cut from the same material. Ornament and function never share an edge.
- **KEYED PORTS** — recessed slot housings with angular sawtooth notch
  keys (two-notch input, three-notch output); tokens must mate to dock.
  Typed handoff drawn without words. Deliberately unlike the rounded
  decorative fingers. (Taste call below.)
- **PULSE** — 14x14 filled rounded square, the only protagonist: the work
  in motion. Never the agent as a character; the agent's capability
  shows as the pulse always completing its crossing, even before Circuit.
- **TICK** — 24x4 dash on the ledger row: a fact written to the record.
  Dashed tick = a skip, written down. Ticks never move and never
  individually fade. Written facts never un-write.
- **BRIEF GLYPHS** — target square (goal), arrow dash (next action),
  state dot (run state): the distilled brief, derived FROM the board,
  never taken from the ledger; the only marks that ever travel between
  boards.
- **PORT STUB** — the system's single vertical line, rising from a pad
  toward the top edge: the channel to the human, who lives offscreen
  above the board.
- Stroke semantics: SOLID = typed and recorded; DASHED = improvised or
  skipped-but-recorded; DOTTED = absent.

## Color (graft from "One Trace")

Zero hardcoded colors — but NOT raw `currentColor` for strokes: the
critics verified the site's foreground resolves to a near-white
(~93% lightness), which makes the scroll hue-sweep barely perceptible.
Add a derived token next to the existing site vars:

```css
--run-stage-stroke: hsl(var(--site-primary-hue) 50% 64%);
```

and stroke/fill the stage with `var(--run-stage-stroke, currentColor)`,
tints via opacity attributes only (no color-mix). The token still
derives from the animated hue, so the existing scroll controller tints
every chapter automatically: one board, photographed at different hours.
Saturation between 35% and 50% is an in-browser taste call.

## Motion language

One metronome as a STYLE CONTRACT, not a synchronized clock: every
chapter is built on a 2s bar, loops 8/10/12s (whole bars), same easing
token (`cubic-bezier(0.6, 0, 0.2, 1)` per segment), writes land on bar
lines. No cross-section phase coupling; offscreen animation may pause
(content-visibility or a tiny shared IntersectionObserver toggling
`animation-play-state`).

- **Travel:** move/dwell rhythm — depart quick, arrive soft, ~quarter-bar
  dwells. Identical in every chapter including gap: the protagonist's
  competence is a constant; only its environment changes.
- **Writing is an event, not a tween:** ticks, slot fills, seated states
  appear with `steps(1, end)` — a single-frame commit, like a write
  syscall. Facts land; nothing about the record eases in.
- **Written facts never un-write.** Loops reset two honest ways:
  (1) in-fiction, where impermanence IS the story (gap, continuity,
  memory); (2) THE CUT — a whole-frame ~0.3s opacity dip reading as a
  camera blink (masthead, blocks, record, checkpoints).
- **Rest beat:** every loop ends with 1.5–3s of complete stillness on its
  final tableau.
- **Timing is generated, not eyeballed (graft):** a small design-time
  script reads the geometry module's distances and emits the move/dwell
  keyframe percentages, so "identical rhythm in every chapter" is
  enforced, not intended.
- **Banned pattern (graft):** never animate dashoffset on a visually
  dashed path (the dash pattern consumes the dasharray). Dashed/dotted
  static geometry stays animation-free; comets ride solid or unpainted
  guide paths.
- **Reduced motion (graft):** each chapter's default SVG attribute values
  ARE its reduced-motion tableau; all animation lives inside
  `@media (prefers-reduced-motion: no-preference)`. Reduced-motion,
  no-JS, and pre-hydration get the designed still for free.

## The chapters

**masthead — the legend (LAST to ship, maybe never).** The grammar at
full health as a hairline 1440x96 strip below the CTAs: full rail, all
eight pads, solid tick row. STATIC ONLY (graft): the Wordmark already
runs an animated canvas streak field in the first viewport; two
disagreeing motion systems there is a known conflict. Open call: ship
static, or cut entirely and let the h1 own the viewport.

**gap — "What your agent works without." PRIORITY, FIRST BUILD.**
Chapter one: before Circuit. Same stage coordinates, no rail. The pulse
crosses an empty board on an improvised orthogonal path that evaporates
behind it (comet head draws on while the tail erodes); it deposits note
rectangles that decay to ~12% opacity (compaction). The absent supports
are the DOTTED FORMS of their own later shapes in their own later
positions: dotted pads, dotted ledger row, dotted archive band, dotted
port stub. Every later chapter lands as "that empty seat, filled."
Generosity is structural: the pulse moves with the exact competent
rhythm of every other chapter and DOES reach the far edge. Work gets
done; the path is what is lost. 10s loop; the empty-board reset is
honest by construction. Tone acceptance test: a cold viewer should read
"it keeps working but nothing holds its past," not "look at everything
it lacks."

**flows — SKIP a new SVG; bridge the composer instead (graft).** The
FlowComposer already owns this beat. Bridge PR: restyle its existing
pathLength connector overlay to `--run-stage-stroke` + the system's
opacities, and add box-joint material to the panel edges, so the page's
biggest interactive element joins the documentary at zero new drawing.

**blocks — "Inside a Block."** Chapter two: the tightest camera. One pad
enlarged into a chip (~360u crop), silkscreened `run-verification` —
deliberately the step whose evidence the record section's real JSON
quotes. Box-joint teeth on the TOP edge only; left/right mid-edges carry
the teaching device: recessed slot housings with angular notch keys. An
outline token labeled `change-set` mates its two-notch edge into the
input housing; three checklist hairlines illuminate; a filled token
labeled `verification` exits through the three-notch output key; one
tick steps onto the ledger stub at the exit instant. 8s loop, cut reset.
Sits between the intro prose and the 10-card catalog as the anatomy
diagram the cards summarize.

**example-run — SKIP.** The with/without toggle IS this chapter, in its
native medium.

**record — "Every run leaves a record." SECOND BUILD, the keystone.**
Chapter four: the camera drops below the rail. The finished run on top;
beneath it a file outline shaped like the site's install-terminal-card,
header silkscreened `reports/fix-result.json . outcome: partial` — the
drawing states the same imperfect outcome the real artifact below it
states; the close pad's inner square is half-filled in this chapter
only. Pads drop plumb lines into labeled slots (`diagnosis.json`,
`verification.json`). The thesis in one move: the HOLLOW review pad
drops a DASHED line into a dash-outlined slot (`skipped . reason`) and
the DASHED TICK debuts on the ledger — the skip, written down, two
hundred pixels above the JSON field that explains it. The plumb lines
visually hand off to the actual artifact on the page. 10s loop. Reset
graft from AS-BUILT, to prototype against the strict rule: two-plane
cut where the rail/pulse layer takes the full ~0.3s dip but the closed
file dips less and recovers first — the record is visibly the last
thing standing and the first thing back.

**checkpoints — "When to loop you in."** Chapter three: the honest 2-up,
animated. Two stacked lanes, both visible at every second, each a crop
on the plan pad with its port stub rising toward the offscreen human.
Static etched rigor settings (`rigor: deep` / `rigor: light`) set before
any motion — rigor is chosen at run start; nothing resembling a dial
ever animates. These are two separate runs, not one run changing its
mind. Deep lane: pulse STOPS, question dot rises the stub, answer dot
descends, pulse continues, tick `answered`. Light lane: pulse passes
WITHOUT stopping, pad blinks, tick `default . recorded` immediately.
Both ticks then rest co-visible for 3s — the actual thesis. An ambient
viewer arriving at ANY second sees both truths; this is the treatment
that made the judge call it the most honesty-robust checkpoints in the
field. Graft: a 3-tick rigor gauge beside each etched label (all filled
= deep, one filled = light) so the lanes discriminate with all text
removed at mobile widths. 12s loop, cut reset.

**continuity — "Tomorrow starts where today ended."** Chapter five: the
widest frame. Yesterday's board left, a vertical band of bare page
background in the middle (the night, literally the site's own dark),
tomorrow's board right, continuing the SAME pad numbering. The left ends
as a transcript: dense faint hairlines above an INTACT ledger that keeps
every tick all night, dashed one included — the record is a file; it
stays. What crosses the dark is a distillation: the three brief glyphs
condense out of the dimming board (visibly derived, not detached from
the ledger), cross the night in single file, dock into a three-slot
brief plate, and a fresh pulse departs from exactly the pad where the
left side stopped. The hairlines never cross. 12s loop; the loop point
hides inside the dark.

**memory — "The next run remembers."** Chapter six: a fresh rail
silkscreened `run 0143 . fix` — another run of the SAME flow, which is
why the same spine is honest here (flows owns shape variety). Below the
board, an archive of past ledger rows stacked like sediment; the topmost
is recognizably OUR run's row, dashed tick included — the birthmark's
third appearance. Two archive ticks brighten and rise into a hint tray
beside the first pad. The tray is visibly UNWIRED, and (graft, the
field's most precise honesty gesture) the gap is drawn as an OPEN
JUMPER: two facing terminal ticks with a conspicuous full-grid-unit air
gap — the PCB idiom for a connection point that exists by design and is
deliberately not made. Recall is a designed offering, not a missing
wire. The pulse runs the rail with zero deviation; hints glow as their
pads pass; verify still seats. At loop end the finished tick row slides
down into the top of the archive as the stack shifts and the oldest row
exits — the conveyor IS the loop point: every cycle, the finished run
becomes memory. 10s loop, in-fiction reset.

**where-it-fits — SKIP.** Meta-commentary outside the run's timeline; a
chapter here would break the documentary frame.

**install — SKIP.** The terminal cards are the right artifact. Optional
zero-cost closer: reprise the masthead strip unchanged above the cards
as a credits roll.

## The connective tissue (why it reads as ONE system)

1. One master drawing; every chapter a named crop of it.
2. The recurring 14x14 pulse with an identical rhythm everywhere.
3. THE LEDGER THREAD: the dashed review tick debuts in record beside the
   JSON that explains it, then reappears in continuity (the intact
   overnight ledger) and memory (the top archive row) — one specific
   honest fact a casual scroller tracks across three sections without
   learning any glyph semantics.
4. The hue-derived stroke token re-resolving live as the scroll
   controller animates the hue.
5. Silkscreen captions, one per chapter, all referencing the same run,
   reading like reference designators on one PCB; full-board chapters
   render captions as real HTML figcaptions below the SVG.
6. The box-joint teeth quoting `.block-edge` exactly: SVGs and card grid
   cut from the same material.
7. The shared metronome (bar length, easing, steps() writes, rest beat).
8. The documentary anchor: chapters depict the run whose real
   fix-result.json sits on the page.
9. The gap chapter's dotted shapes are the empty seats every later
   chapter fills — the page IS the gap-frame, drawn.

## Build order

1. **gap** — highest marginal impact (priority section, prose-only),
   forces the geometry module + narrow-crop API into existence, proves
   the riskiest technique (comet draw-and-erode), and carries the
   biggest tone risk. If gap lands, everything else is cheaper; if its
   tone is off, learn that before seven SVGs exist.
2. **record** — the keystone: debuts the birthmark and must physically
   shake hands with the real JSON figure. Prototype both reset
   treatments here.
3. checkpoints → continuity → memory → blocks → FlowComposer bridge →
   masthead legend (static, if kept).

Feasibility: seven inline React SVG components, pure geometry + scoped
CSS, ~2–8KB JSX each, ~30–45KB total pre-gzip. CSS-only animation, no
SMIL, no JS loops.

## Taste calls (owner's, before building)

1. **Masthead:** static legend strip, or cut entirely? (Animated is off
   the table — the Wordmark canvas owns that viewport's motion.)
2. **Stroke chroma:** saturation 35–50% on the derived token; needs an
   in-browser eyeball against two adjacent sections.
3. **Keyed ports:** keep the sharp sawtooth keys (teaches "typed" without
   words, but introduces the only hard-edged geometry on a soft-cornered
   page) or unify into the rounded joint family?
4. **Loop pacing:** style-contract-only (8/10/12s, no shared phase) vs
   one strict shared period so co-visible sections on tall viewports
   breathe together?
5. **Gap tone:** run the cold-viewer test on the dotted absences —
   "nothing holds its past," never "look at everything it lacks."
6. **Checkpoints density:** the always-co-visible 2-up is the most honest
   but busiest composition in the set; accept the density, or
   time-multiplex with stronger labeling?
7. **Record reset:** strict uniform cut vs the record visibly outliving
   the blink — prototype both.
