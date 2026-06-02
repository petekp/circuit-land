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

const exampleRunModes: Record<ExampleRunMode, ExampleRunContent> = {
  without: {
    mode: "without",
    toggleLabel: "Without Circuit",
    summary: "Same capable agent. More process left for you to hold.",
    command: "build the Circuit landing page from the outline",
    surfaceLines: [
      { text: "AGENT", emphasis: true },
      { text: "⎿ I can do that. Where should I start?" },
      { text: "⎿ Should I make a plan first?" },
      { text: "⎿ I updated the page." },
      { text: "⎿ Tests should probably pass." },
      { text: "⎿ Want me to review it too?" },
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
    command: "/circuit:run build the Circuit landing page from the outline",
    commandEmphasis: "/circuit:run",
    commandRest: "build the Circuit landing page from the outline",
    surfaceLines: [
      { text: "CIRCUIT", emphasis: true },
      { text: "⎿ Chose build." },
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

function RunTerminalBody({
  content,
  echo = false,
}: {
  content: ExampleRunContent;
  echo?: boolean;
}) {
  return (
    <>
      <div
        className={
          echo ? "px-5 py-3" : "run-terminal-divider px-5 py-3 text-foreground"
        }
      >
        <span className={echo ? undefined : "text-muted-foreground"}>$ </span>
        {echo || !content.commandEmphasis ? (
          content.command
        ) : (
          <>
            <span className="font-medium text-foreground">
              {content.commandEmphasis}
            </span>
            {content.commandRest ? (
              <span className="text-muted-foreground">
                {" "}
                {content.commandRest}
              </span>
            ) : null}
          </>
        )}
      </div>
      <div className="example-run-terminal-body flex flex-col px-5 py-4">
        {content.surfaceLines.map((line) => (
          <span
            key={line.text}
            className={
              echo
                ? undefined
                : line.emphasis
                  ? "text-foreground"
                  : "text-muted-foreground"
            }
          >
            {line.text}
          </span>
        ))}
      </div>
    </>
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
    <div
      className="example-run-toggle"
      role="group"
      aria-label="Example run mode"
    >
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
    </div>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <h2 className="font-sans text-[15px] font-semibold tracking-tight text-foreground sm:text-[16px]">
              Example Run
            </h2>
            <p className="text-balance text-[15px] leading-relaxed text-foreground">
              Most of us are steering our agents step-by-step in chat.
            </p>
          </div>
          <ExampleRunToggle mode={mode} setMode={setMode} />
        </div>
        <p className="text-balance text-[13px] leading-relaxed text-muted-foreground">
          {content.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-stretch">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="run-terminal-stage flex w-full flex-col">
            <div
              aria-hidden="true"
              className="run-terminal-echo font-mono text-[13px] leading-7"
            >
              <RunTerminalBody content={content} echo />
            </div>
            <div className="example-run-terminal run-terminal w-full overflow-hidden font-mono text-[13px] leading-7">
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
