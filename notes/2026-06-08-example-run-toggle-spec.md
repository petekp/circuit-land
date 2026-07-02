# Example Run Toggle Spec

Status: superseded (2026-07-02). Specced against the old Example Run section,
which the rebuilt home page no longer has. Kept for history only.
Date: 2026-06-01

## Purpose

Update the Example Run section so it shows the same task in two modes:

- **Without Circuit**: the agent may be capable, but the operator still carries
  the process in chat.
- **With Circuit**: Circuit turns the process into a tracked run with a selected
  flow, visible progress, checks, review, and a result backed by trace and check
  output.

The section should teach the difference in one interaction. It should not turn
into a comparison table or a feature list.

## Current Section

Source: `src/app/page.tsx`

Current pieces to preserve:

- Section id: `see-one-run`
- Label: `Example Run`
- Intro line: `Most of us are steering our agents step-by-step in chat.`
- The terminal visual, including the blurred under-echo treatment.
- The right-side ordered beat list.
- The current real Circuit run copy:

```text
$ /circuit:run build the Circuit landing page from the outline

CIRCUIT
⎿ Chose build.
⎿ Framing the work...
⎿ Planning the work...
⎿ Asking the specialist to make the change...
⎿ Finished the specialist pass.
⎿ Checking the work...
⎿ Build complete. Verification passed, review accepted.
```

## Product Claim

The point is not "agents are bad without Circuit."

The point is:

> Without Circuit, you hold the process. With Circuit, the process becomes part
> of the run.

The copy should stay respectful toward the base agent. The contrast is about
where the process lives.

## User Experience

Add a small segmented control near the section heading:

```text
Without Circuit | With Circuit
```

Default selected state: **With Circuit**.

Behavior:

1. The terminal command, terminal output, intro support copy, and beat list swap
   when the user toggles.
2. The terminal frame stays the same size across modes.
3. The right-side beat list stays four items in both modes.
4. The toggle is keyboard accessible and announced as a two-option control.
5. No page-level navigation changes.

## Recommended Layout

Keep the current layout:

- Heading and intro at top.
- Terminal on the left.
- Four explanatory beats on the right.

Add the toggle inside the heading area, below the label or aligned to the right
on wider screens.

Suggested structure:

```text
Example Run
Most of us are steering our agents step-by-step in chat.

[ Without Circuit ][ With Circuit ]

[ terminal ]     [ four beats ]
```

On mobile, stack in this order:

1. Label
2. Intro
3. Toggle
4. Terminal
5. Beats

## Copy

### With Circuit

Use the existing task and run surface.

Mode summary:

> Circuit carries the process through the run.

Command:

```text
/circuit:run build the Circuit landing page from the outline
```

Terminal output:

```text
CIRCUIT
⎿ Chose build.
⎿ Framing the work...
⎿ Planning the work...
⎿ Asking the specialist to make the change...
⎿ Finished the specialist pass.
⎿ Checking the work...
⎿ Build complete. Verification passed, review accepted.
```

Beats:

1. **You describe the task**
   You can focus on the goal rather than the precise means.

2. **Circuit selects the flow**
   The right process is inferred and recorded.

3. **It follows the process**
   Plan -> change -> check -> review.

4. **Result with evidence**
   A verified result, with the trace to back it: what changed and the checks
   that passed. No gaslighting.

### Without Circuit

This mode should feel familiar, not cartoonishly bad. The agent can still help.
The missing piece is that the operator has to keep deciding what step comes next
and how to judge the result.

Mode summary:

> Same capable agent. More process left for you to hold.

Command:

```text
build the Circuit landing page from the outline
```

Terminal output:

```text
AGENT
⎿ I can do that. Where should I start?
⎿ Should I make a plan first?
⎿ I updated the page.
⎿ Tests should probably pass.
⎿ Want me to review it too?
```

Beats:

1. **You describe the task**
   The agent understands the goal, but the process is still implicit.

2. **You steer the work**
   You decide when to plan, when to edit, when to check, and when to review.

3. **You check it yourself**
   The result may be right, but you still have to inspect the change, rerun
   commands, or ask what was actually checked.

4. **The state stays in chat**
   Useful context is easy to lose before the next run.

## Component Shape

Prefer extracting the section into a small client component:

```text
src/components/example-run-toggle.tsx
```

Suggested data model:

```ts
type ExampleRunMode = "without" | "with";

type ExampleRunBeat = {
  label: string;
  note: string;
};

type ExampleRunSurfaceLine = {
  text: string;
  emphasis?: boolean;
};

type ExampleRunContent = {
  mode: ExampleRunMode;
  toggleLabel: string;
  summary: string;
  command: string;
  commandEmphasis?: string;
  commandRest?: string;
  surfaceLines: ExampleRunSurfaceLine[];
  beats: ExampleRunBeat[];
};
```

Implementation notes:

- Reuse the current `RunTerminalBody` structure.
- Keep the echo body and visible body generated from the same content object.
- Do not hard-code `/circuit:run` inside the terminal renderer. Make command
  emphasis data-driven so the non-Circuit command can render naturally.
- Keep four beats per mode so the layout does not jump.
- Do not add animation beyond a subtle opacity transition. The terminal should
  feel stable, not flashy.

## Visual Treatment

Segmented control:

- Use the same quiet visual language as the install and secondary CTA controls.
- Active segment should be obvious but not bright.
- Keep border radius modest and consistent with nearby controls.

Terminal:

- Same frame for both modes.
- With Circuit may keep the `CIRCUIT` emphasized line.
- Without Circuit should emphasize `AGENT`, not use warning colors.
- Avoid red/yellow failure styling. The point is operator load, not error.

Beats:

- Keep the existing numbered list style.
- Do not add icons.
- The labels should be short enough to scan.

## Accessibility

- The segmented control should be a `button` group or tabs with clear selected
  state.
- If using tabs, include `aria-selected`.
- If using buttons, include `aria-pressed`.
- The terminal output can remain visual text, but it should be real text in the
  DOM, not an image.
- The default mode should render without needing JavaScript for the page to make
  sense. With JavaScript disabled, showing only With Circuit is acceptable.

## Out Of Scope

- Do not redesign the hero.
- Do not change install copy.
- Do not add a full competitive comparison section.
- Do not add claims about rollback, undo, or stop-anytime controls.
- Do not claim memory improves outcomes today.
- Do not make the "Without Circuit" path look incompetent or dishonest.

## Acceptance Criteria

- The Example Run section has a visible With Circuit / Without Circuit toggle.
- With Circuit is selected by default.
- Both modes show the same underlying task.
- With Circuit uses the current captured Circuit run surface.
- Without Circuit shows operator-managed process, not agent failure.
- The rejected courtroom-style verification wording does not appear.
- The beat copy uses "You check it yourself" for the non-Circuit verification
  burden.
- The terminal and beat layout remain stable across toggle changes on desktop
  and mobile.
- `npm run lint` and `npm run build` pass after implementation.
