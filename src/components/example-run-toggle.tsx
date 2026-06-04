"use client";

import { useState } from "react";

type ExampleRunMode = "without" | "with";

type ExampleRunBeat = {
  label: string;
  note: string;
};

type ExampleRunSurfaceLine = {
  text: string;
  emphasis?: boolean;
  kind?: "agent" | "user";
};

type ExampleRunContent = {
  mode: ExampleRunMode;
  toggleLabel: string;
  summary: string;
  surfaceLines: ExampleRunSurfaceLine[];
  beats: ExampleRunBeat[];
};

const exampleRunModes: Record<ExampleRunMode, ExampleRunContent> = {
  without: {
    mode: "without",
    toggleLabel: "Without Circuit",
    summary: "Same capable agent. The process is negotiated in chat.",
    surfaceLines: [
      { kind: "user", text: "build the circuit landing page from the outline" },
      { text: "I’ll take a pass and keep the existing visual language intact." },
      { text: "First pass is in:" },
      { text: "- updated the hero copy" },
      { text: "- added the example run section" },
      { text: "- revised the flow section" },
      { text: "- tightened spacing and type" },
      { kind: "user", text: "that wording doesn't sound like me" },
      { text: "Got it. I’ll make it plainer and less formal." },
      { text: "Updated the copy." },
      { kind: "user", text: "can you spec the example run update first?" },
      { text: "Created a spec for a With Circuit / Without Circuit toggle." },
      { kind: "user", text: "implement it" },
      { text: "Implemented the toggle." },
      { kind: "user", text: "/react-doctor" },
      { text: "React Doctor found a few issues in the changed React code:" },
      { text: "- state used only to trigger rerenders" },
      { text: "- an accessibility issue on the toggle" },
      { text: "- the section component was doing too much" },
      { kind: "user", text: "address all findings" },
      { text: "Refactored the section and reran checks:" },
      { text: "- npm run lint passed" },
      { text: "- npm run build passed" },
      { text: "- React Doctor 100 / 100" },
      { kind: "user", text: "commit and push" },
      { text: "Committed and pushed." },
    ],
    beats: [
      {
        label: "You describe the task",
        note: "The agent understands the goal, but the process is still implicit.",
      },
      {
        label: "You steer the work",
        note: "You decide when to plan, when to edit, when to check, and when to review.",
      },
      {
        label: "You check it yourself",
        note: "The result may be right, but you still have to inspect the change, rerun commands, or ask what was actually checked.",
      },
      {
        label: "The state stays in chat",
        note: "Useful context is easy to lose before the next run.",
      },
    ],
  },
  with: {
    mode: "with",
    toggleLabel: "With Circuit",
    summary: "Circuit carries the process through the run.",
    surfaceLines: [
      {
        kind: "user",
        text: "/circuit:run build the circuit landing page from the outline",
      },
      { text: "CIRCUIT", emphasis: true },
      { text: "⎿ Chose the Build flow." },
      { text: "⎿ Framing the work..." },
      { text: "⎿ Planning the work..." },
      { text: "⎿ Asking the specialist to make the change..." },
      { text: "⎿ Finished the specialist pass." },
      { text: "⎿ Checking the work..." },
      {
        text: "⎿ Build complete. Verification passed, review accepted.",
        emphasis: true,
      },
    ],
    beats: [
      {
        label: "You describe the task",
        note: "You can focus on the goal rather than the precise means.",
      },
      {
        label: "Circuit selects the flow",
        note: "The right process is inferred and recorded.",
      },
      {
        label: "It follows the process",
        note: "Plan -> change -> check -> review.",
      },
      {
        label: "Result with evidence",
        note: "A verified result, with the trace to back it: what changed and the checks that passed. No gaslighting.",
      },
    ],
  },
};

const exampleRunOrder: ExampleRunMode[] = ["without", "with"];

function getSurfaceLineClass(line: ExampleRunSurfaceLine) {
  if (line.kind === "user") {
    return "example-run-user-row text-foreground";
  }

  return line.emphasis ? "text-foreground" : "text-muted-foreground";
}

function RunTerminalBody({ content }: { content: ExampleRunContent }) {
  return (
    <div className="example-run-terminal-body flex flex-col px-5 py-4">
      {content.surfaceLines.map((line) => (
        <span key={line.text} className={getSurfaceLineClass(line)}>
          {line.text}
        </span>
      ))}
    </div>
  );
}

function ExampleRunToggle({
  mode,
  setMode,
}: {
  mode: ExampleRunMode;
  setMode: (mode: ExampleRunMode) => void;
}) {
  return (
    <fieldset className="example-run-toggle m-0 min-w-0 border-0">
      <legend className="sr-only">Example run mode</legend>
      {exampleRunOrder.map((option) => {
        const selected = mode === option;
        const content = exampleRunModes[option];

        return (
          <button
            key={option}
            type="button"
            className="example-run-toggle-button"
            aria-pressed={selected}
            onClick={() => setMode(option)}
          >
            {content.toggleLabel}
          </button>
        );
      })}
    </fieldset>
  );
}

export function ExampleRunSection() {
  const [mode, setMode] = useState<ExampleRunMode>("with");
  const content = exampleRunModes[mode];

  return (
    <section
      id="see-one-run"
      className="mt-28 flex flex-col gap-10"
      data-site-hue-stop="0.125"
    >
      <div className="flex max-w-3xl flex-col gap-4">
        <div className="flex flex-col gap-3">
          <h2 className="font-sans text-[15px] font-semibold tracking-tight text-foreground sm:text-[16px]">
            Example Run
          </h2>
          <p className="text-balance text-[15px] leading-relaxed text-foreground">
            Most of us are steering our agents step-by-step in chat.
          </p>
          <ExampleRunToggle mode={mode} setMode={setMode} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-stretch">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="run-terminal-stage flex w-full flex-col">
            <div className="example-run-terminal run-terminal w-full overflow-x-hidden overflow-y-auto font-mono text-[13px] leading-7">
              <RunTerminalBody content={content} />
            </div>
          </div>
        </div>

        <ol className="example-run-beats grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:flex lg:max-w-[18rem] lg:flex-col lg:justify-self-end">
          {content.beats.map((beat, index) => (
            <li key={beat.label} className="flex gap-4">
              <span
                aria-hidden="true"
                className="mt-px shrink-0 text-[12px] tabular-nums text-muted-foreground"
              >
                {index + 1}
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-balance text-[14px] font-medium tracking-tight">
                  {beat.label}
                </h3>
                <p className="text-balance text-[13px] leading-relaxed text-muted-foreground">
                  {beat.note}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
