import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import {
  CopyInstallInstructions,
  CopyTextButton,
} from "@/components/copy-install-instructions";
import { FlowComposer } from "@/components/flow-composer";
import { Wordmark } from "@/components/wordmark";

type SurfaceLine = {
  text: string;
  emphasis?: boolean;
};

type RunBeat = {
  label: string;
  note: string;
};

type InstallTarget = {
  name: "Claude Code" | "Codex" | "OpenCode";
  commands?: string[];
  comingSoon?: boolean;
};

// Faithful reconstruction of a live Circuit Build surface, assembled from the
// exact progress strings Circuit streams (circuit/src/flows/build/data.ts). The
// final line is verbatim from this run's captured summary
// (.circuit/runs/21c71c1e-.../reports/operator-summary.md).
const runCommand = "/circuit:run build the Circuit landing page from the outline";
const codexInstallCommand =
  "codex plugin marketplace add petekp/circuit --ref circuit--v0.1.0-alpha.6";

export const metadata: Metadata = {
  title: "Circuit - repeatable work patterns for coding agents",
  description:
    "Circuit gives coding agents clear flows, timely skills, evidence, and checkpoints for everyday software work.",
};

const installTargets: InstallTarget[] = [
  {
    name: "Claude Code",
    commands: [
      "/plugin marketplace add petekp/circuit",
      "/plugin install circuit@circuit",
      "/reload-plugins",
    ],
  },
  {
    name: "Codex",
    commands: [codexInstallCommand],
  },
  {
    name: "OpenCode",
    comingSoon: true,
  },
];

const runSurface: SurfaceLine[] = [
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
];

const runBeats: RunBeat[] = [
  {
    label: "You describe the task",
    note: "You can focus on the goal rather than the precise means.",
  },
  {
    label: "Circuit selects the flow",
    note: "The right process is inferred based on your prompt. You can optionally specify, too.",
  },
  {
    label: "It follows a process",
    note: "Plan → change → check → review.",
  },
  {
    label: "Outcome",
    note: "A verified result, with the trace to back it: what changed and the checks that passed. No gaslighting.",
  },
];

const comparison = [
  {
    name: "Prompting + Skills",
    approach:
      "Skills give the agent stronger moves: read a trace, write a test, inspect a browser, review a diff. You still decide which move to call, when to call it, and when enough proof exists.",
    circuit:
      "Circuit uses those moves inside a flow. It routes the task, chooses the next block, carries context forward, and asks for your judgment only when the result depends on it.",
  },
  {
    name: "AGENTS.md and Playbooks",
    approach:
      "Rules, docs, and saved prompts tell the agent what good work should look like. They are useful context, but they mostly sit still until you remember to apply them.",
    circuit:
      "Circuit turns the playbook into motion. Each block has an input, output, and done condition, so the process produces evidence instead of relying on memory and vibes.",
  },
  {
    name: "Spec-driven development",
    approach:
      "Write a detailed spec and the agent implements against it. The spec captures intent well, but it stays a document. It does not carry the work through building, checking, and review.",
    circuit:
      "Circuit treats the spec as one input. Frame turns intent into a typed brief, then the flow carries it forward through plan, act, verify, and review until the outcome is backed by evidence.",
  },
  {
    name: "Claude Code's Dynamic Workflows",
    approach:
      "Workflows orchestrate many agents from a script. They are great for large one-off jobs: codebase audits, migrations, deep research, or hand-rolled fanout.",
    circuit:
      "Circuit is the repeatable process for everyday work. It picks Build, Fix, Review, Explore, Prototype, or Pursue, then runs the same proven process without making you design the orchestration.",
  },
  {
    name: "Autonomous coding agents",
    approach:
      "Agents like Cursor, Devin, or Copilot's agent take a task and run it end to end. They are powerful, but each run is shaped by the prompt, so what they do and how rigorously they do it varies.",
    circuit:
      "Circuit is not another agent. It is the process your agent follows: running inside Claude Code or Codex, it moves the same kind of work the same way every time, with evidence to show for it.",
  },
  {
    name: "Compound engineering",
    approach:
      "A philosophy: each task should leave the system smarter, so the next one is easier, through planning, parallel review, and documenting what worked. You assemble that loop yourself, task by task.",
    circuit:
      "Circuit is that loop, productized. Every flow already plans, acts, reviews, and checks, and each run leaves structured records: the substrate that longitudinal memory builds on.",
  },
];

const blockInternals = [
  {
    name: "Frame",
    input: "Your raw task",
    output: "Scoped brief",
    detail:
      "Turns a loose request into scope, goal, constraints, and a concrete done condition before work starts.",
  },
  {
    name: "Gather Context",
    input: "Brief plus repo signals",
    output: "Relevant context",
    detail:
      "Finds the files, docs, errors, prior decisions, and live state that should shape the next move.",
  },
  {
    name: "Diagnose",
    input: "Context packet",
    output: "Cause and confidence",
    detail:
      "Separates symptoms from cause, names the likely failure mode, and keeps uncertainty visible.",
  },
  {
    name: "Human Decision",
    input: "A real fork in the work",
    output: "User decision",
    detail:
      "Pauses only when judgment changes the result: tradeoffs, taste calls, risky scope, or missing intent.",
  },
  {
    name: "Plan",
    input: "Brief and context",
    output: "Work strategy",
    detail:
      "Chooses the path, order, verification points, and handoffs before the agent starts changing things.",
  },
  {
    name: "Coordinate",
    input: "Several related goals",
    output: "Dependency map",
    detail:
      "Keeps multi-part work legible by tracking dependencies, parallelizable chunks, and shared evidence.",
  },
  {
    name: "Act",
    input: "Plan strategy",
    output: "Changed work",
    detail:
      "Makes the change and records what moved, why it moved, and what proof the next block needs.",
  },
  {
    name: "Run Verification",
    input: "Change evidence",
    output: "Check results",
    detail:
      "Runs the checks that fit the work and reports the command, result, and any remaining risk.",
  },
  {
    name: "Review",
    input: "Change plus evidence",
    output: "Review verdict",
    detail:
      "Checks behavior, scope, and proof from a separate review posture before the run calls itself done.",
  },
  {
    name: "Close With Evidence",
    input: "The final verdict",
    output: "Final report",
    detail:
      "Leaves a short outcome with evidence pointers, decisions, residual risks, and the final status.",
  },
];

const agentInstallInstructions = `Please install Circuit for the coding-agent tool I am using in this project.

If this is Claude Code, run:
/plugin marketplace add petekp/circuit
/plugin install circuit@circuit
/reload-plugins

If this is Codex, run:
${codexInstallCommand}

After Circuit is installed, start with:
/circuit:run <my task>

Use /circuit:run to start each task. Circuit routes the task to Build, Fix, Review, Explore, Prototype, or Pursue when that is the right fit.`;

function Label({
  children,
  as: Tag = "div",
}: {
  children: ReactNode;
  as?: "div" | "h2";
}) {
  return (
    <Tag className="font-sans text-[15px] font-semibold tracking-tight text-foreground sm:text-[16px]">
      {children}
    </Tag>
  );
}

function InstallProviderIcons() {
  return (
    <span className="install-provider-icons" aria-hidden="true">
      <ClaudeCodeLogo />
      <CodexLogo />
    </span>
  );
}

function ClaudeCodeLogo() {
  return (
    <svg
      aria-hidden="true"
      className="claude-code-logo"
      viewBox="0 0 125 125"
      focusable="false"
    >
      <path
        d="M54.38 118.75L56.13 111L58.13 101L59.75 93L61.25 83.13L62.13 79.88L62 79.63L61.38 79.75L53.88 90L42.5 105.38L33.5 114.88L31.38 115.75L27.63 113.88L28 110.38L30.13 107.38L42.5 91.5L50 81.63L54.88 76L54.75 75.25H54.5L21.5 96.75L15.63 97.5L13 95.13L13.38 91.25L14.63 90L24.5 83.13L49.13 69.38L49.5 68.13L49.13 67.5H47.88L43.75 67.25L29.75 66.88L17.63 66.38L5.75 65.75L2.75 65.13L0 61.38L0.25 59.5L2.75 57.88L6.38 58.13L14.25 58.75L26.13 59.5L34.75 60L47.5 61.38H49.5L49.75 60.5L49.13 60L48.63 59.5L36.25 51.25L23 42.5L16 37.38L12.25 34.75L10.38 32.38L9.63 27.13L13 23.38L17.63 23.75L18.75 24L23.38 27.63L33.25 35.25L46.25 44.88L48.13 46.38L49 45.88V45.5L48.13 44.13L41.13 31.38L33.63 18.38L30.25 13L29.38 9.75C29.04 8.63 28.88 7.38 28.88 6L32.75 0.75L34.88 0L40.13 0.75L42.25 2.63L45.5 10L50.63 21.63L58.75 37.38L61.13 42.13L62.38 46.38L62.88 47.75H63.75V47L64.38 38L65.63 27.13L66.88 13.13L67.25 9.13L69.25 4.38L73.13 1.88L76.13 3.25L78.63 6.88L78.25 9.13L76.88 18.75L73.88 33.88L72 44.13H73.13L74.38 42.75L79.5 36L88.13 25.25L91.88 21L96.38 16.25L99.25 14H104.63L108.5 19.88L106.75 26L101.25 33L96.63 38.88L90 47.75L86 54.88L86.38 55.38H87.25L102.13 52.13L110.25 50.75L119.75 49.13L124.13 51.13L124.63 53.13L122.88 57.38L112.63 59.88L100.63 62.25L82.75 66.5L82.5 66.63L82.75 67L90.75 67.75L94.25 68H102.75L118.5 69.13L122.63 71.88L125 75.13L124.63 77.75L118.25 80.88L109.75 78.88L89.75 74.13L83 72.5H82V73L87.75 78.63L98.13 88L111.25 100.13L111.88 103.13L110.25 105.63L108.5 105.38L97 96.63L92.5 92.75L82.5 84.38H81.88V85.25L84.13 88.63L96.38 107L97 112.63L96.13 114.38L92.88 115.5L89.5 114.88L82.25 104.88L74.88 93.5L68.88 83.38L68.25 83.88L64.63 121.63L63 123.5L59.25 125L56.13 122.63L54.38 118.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CodexLogo() {
  return (
    <svg
      aria-hidden="true"
      className="codex-logo"
      viewBox="0 0 41 41"
      focusable="false"
    >
      <path
        d="M37.53 16.87C37.98 15.52 38.14 14.1 37.99 12.69C37.84 11.27 37.39 9.91 36.68 8.69C35.61 6.83 33.99 5.37 32.04 4.5C30.09 3.63 27.91 3.4 25.82 3.85C24.88 2.79 23.72 1.94 22.43 1.36C21.13 0.79 19.72 0.49 18.31 0.5C16.17 0.5 14.09 1.17 12.36 2.42C10.63 3.68 9.35 5.45 8.69 7.48C7.3 7.76 5.99 8.34 4.84 9.18C3.69 10.01 2.73 11.08 2.03 12.31C0.96 14.16 0.5 16.3 0.72 18.42C0.94 20.55 1.84 22.54 3.27 24.13C2.82 25.48 2.66 26.9 2.81 28.31C2.96 29.73 3.41 31.09 4.12 32.31C5.19 34.17 6.81 35.63 8.76 36.5C10.71 37.37 12.89 37.6 14.98 37.15C15.92 38.21 17.08 39.06 18.37 39.64C19.67 40.21 21.08 40.51 22.49 40.5C24.63 40.51 26.71 39.83 28.44 38.58C30.17 37.32 31.46 35.55 32.11 33.52C33.5 33.23 34.82 32.65 35.97 31.82C37.12 30.99 38.07 29.92 38.78 28.68C39.85 26.84 40.3 24.7 40.08 22.57C39.86 20.45 38.96 18.45 37.53 16.87ZM22.5 37.88C20.74 37.89 19.05 37.27 17.7 36.15C17.76 36.12 17.87 36.06 17.94 36.02L25.9 31.42C26.1 31.3 26.27 31.14 26.38 30.94C26.5 30.74 26.56 30.51 26.55 30.28V19.05L29.92 21C29.94 21.01 29.95 21.02 29.97 21.04C29.98 21.05 29.98 21.07 29.99 21.09V30.39C29.98 32.38 29.19 34.28 27.79 35.68C26.39 37.09 24.48 37.88 22.5 37.88ZM6.39 31.01C5.51 29.49 5.2 27.71 5.5 25.98C5.56 26.02 5.66 26.08 5.73 26.12L13.7 30.72C13.9 30.84 14.12 30.9 14.35 30.9C14.58 30.9 14.81 30.84 15.01 30.72L24.73 25.11V29C24.73 29.02 24.73 29.04 24.72 29.06C24.71 29.07 24.7 29.09 24.68 29.1L16.63 33.75C14.91 34.74 12.86 35.01 10.94 34.5C9.03 33.98 7.39 32.73 6.39 31.01ZM4.3 13.62C5.17 12.1 6.55 10.94 8.2 10.33C8.2 10.4 8.19 10.52 8.19 10.61V19.81C8.19 20.04 8.25 20.26 8.37 20.46C8.48 20.66 8.65 20.83 8.85 20.94L18.57 26.55L15.21 28.5C15.19 28.51 15.17 28.52 15.15 28.52C15.13 28.52 15.11 28.52 15.09 28.51L7.04 23.86C5.32 22.86 4.07 21.22 3.55 19.3C3.04 17.39 3.31 15.34 4.3 13.62ZM31.95 20.06L22.23 14.44L25.6 12.5C25.61 12.49 25.63 12.48 25.65 12.48C25.67 12.48 25.69 12.48 25.71 12.49L33.76 17.14C35 17.85 36 18.9 36.66 20.16C37.32 21.42 37.6 22.85 37.48 24.27C37.36 25.69 36.84 27.04 35.97 28.18C35.11 29.31 33.94 30.17 32.6 30.66C32.6 30.59 32.6 30.47 32.6 30.39V21.19C32.61 20.96 32.55 20.73 32.43 20.53C32.32 20.33 32.15 20.17 31.95 20.06ZM35.31 15.01C35.25 14.98 35.14 14.91 35.07 14.87L27.1 10.27C26.91 10.16 26.68 10.09 26.45 10.09C26.22 10.09 25.99 10.16 25.8 10.27L16.07 15.89V12C16.07 11.98 16.08 11.96 16.08 11.94C16.09 11.92 16.1 11.91 16.12 11.89L24.17 7.25C25.41 6.54 26.82 6.19 28.24 6.25C29.66 6.32 31.04 6.78 32.2 7.6C33.37 8.41 34.28 9.54 34.83 10.85C35.38 12.17 35.55 13.61 35.31 15.01ZM14.24 21.94L10.88 20C10.86 19.99 10.84 19.98 10.83 19.96C10.82 19.94 10.81 19.93 10.81 19.91V10.61C10.81 9.18 11.22 7.79 11.98 6.59C12.75 5.39 13.84 4.43 15.13 3.82C16.42 3.22 17.85 2.99 19.26 3.18C20.68 3.36 22.01 3.94 23.1 4.85C23.04 4.88 22.94 4.94 22.87 4.98L14.9 9.59C14.7 9.7 14.54 9.86 14.42 10.06C14.31 10.26 14.25 10.49 14.25 10.72L14.24 21.94ZM16.07 18L20.4 15.5L24.73 18V23L20.4 25.5L16.07 23V18Z"
        fill="currentColor"
      />
    </svg>
  );
}

function OpenCodeLogo() {
  return (
    <svg
      aria-hidden="true"
      className="opencode-logo"
      viewBox="0 0 24 42"
      focusable="false"
    >
      <path d="M18 30H6V18H18V30Z" fill="#4B4646" />
      <path
        d="M18 12H6V30H18V12ZM24 36H0V6H24V36Z"
        fill="#B7B1B1"
      />
    </svg>
  );
}

function GithubLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-[18px]"
      focusable="false"
    >
      <path d="M12 .5C5.37.5 0 5.78 0 12.292c0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.335-1.725-1.335-1.725-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.803 2.809 1.282 3.495.981.108-.763.417-1.282.76-1.577-2.665-.295-5.466-1.309-5.466-5.827 0-1.287.465-2.339 1.235-3.164-.135-.295-.54-1.494.105-3.117 0 0 1.005-.315 3.3 1.209.96-.262 1.98-.392 3-.398 1.02.006 2.04.136 3 .398 2.28-1.524 3.285-1.209 3.285-1.209.645 1.623.24 2.822.12 3.117.765.825 1.23 1.877 1.23 3.164 0 4.53-2.805 5.527-5.475 5.817.42.354.81 1.077.81 2.182 0 1.578-.015 2.846-.015 3.229 0 .309.21.678.825.561C20.565 21.917 24 17.495 24 12.292 24 5.78 18.627.5 12 .5z" />
    </svg>
  );
}

function XLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
      focusable="false"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Shared body for the run terminal. The real pane and its blurred under-echo
// render the same rows, so their padding and leading can only be defined once
// (the echo just drops the per-line coloring and the prompt divider).
function RunTerminalBody({ echo = false }: { echo?: boolean }) {
  return (
    <>
      <div
        className={
          echo ? "px-5 py-3" : "run-terminal-divider px-5 py-3 text-foreground"
        }
      >
        <span className={echo ? undefined : "text-muted-foreground"}>$ </span>
        {echo ? (
          runCommand
        ) : (
          <>
            <span className="font-medium text-foreground">/circuit:run</span>
            <span className="text-muted-foreground">
              {" "}
              build the Circuit landing page from the outline
            </span>
          </>
        )}
      </div>
      <div className="flex flex-col px-5 py-4">
        {runSurface.map((line) => (
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

function ProcessArtwork() {
  return (
    <figure className="section-artwork process-artwork relative aspect-[1.45/1] min-h-[21rem] w-full max-w-full overflow-hidden bg-muted/40 lg:min-h-[25rem]">
      <Image
        src="/expert-process-illustration.png"
        alt="Expert operator arranging process blocks, route lines, evidence cards, and verification tools."
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 48vw"
        className="object-cover"
      />
    </figure>
  );
}

function MastheadSection() {
  return (
    <section
      className="mt-4 flex flex-col gap-8 sm:mt-6"
      data-site-hue-stop="0"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Wordmark />
          <p className="text-[11px] leading-none text-muted-foreground">
            a plugin for Claude Code and Codex
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/petekp/circuit"
            aria-label="Circuit on GitHub"
            className="text-muted-foreground hover:text-foreground"
          >
            <GithubLogo />
          </a>
          <a
            href="https://x.com/petekp"
            aria-label="Pete Petrash on X"
            className="text-muted-foreground hover:text-foreground"
          >
            <XLogo />
          </a>
        </div>
      </div>

      <h1 className="max-w-2xl text-base font-medium leading-tight tracking-tight sm:text-xl">
        Disciplined autonomy for coding agents.
      </h1>

      <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
        Your agent follows a process instead of improvising on the spot. Less
        micro-managing, more working with a colleague you can trust.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href="#install"
          aria-label="Install for Claude Code and Codex"
          className="soft-cta-primary inline-flex min-h-11 items-center gap-2.5 px-5 py-2 text-[13px] font-medium"
        >
          <InstallProviderIcons />
          <span>Install</span>
        </a>
        <a
          href="#see-one-run"
          className="soft-cta-secondary inline-flex min-h-11 items-center px-5 py-2 text-[13px] font-medium text-foreground"
        >
          See example
        </a>
      </div>
    </section>
  );
}

function ExampleRunSection() {
  return (
    <section
      id="see-one-run"
      className="mt-28 flex flex-col gap-10"
      data-site-hue-stop="0.125"
    >
      <div className="flex max-w-3xl flex-col gap-3">
        <Label as="h2">Example Run</Label>
        <p className="text-balance text-[15px] leading-relaxed text-foreground">
          Most of us are steering our agents step-by-step in chat.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-stretch">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="run-terminal-stage flex w-full flex-1 flex-col">
            {/* Blurred ghost of the same content, masked to bloom only below
                the opaque pane — the terminal's text showing through. */}
            <div
              aria-hidden="true"
              className="run-terminal-echo font-mono text-[13px] leading-7"
            >
              <RunTerminalBody echo />
            </div>
            <div className="run-terminal w-full flex-1 overflow-hidden font-mono text-[13px] leading-7">
              <RunTerminalBody />
            </div>
          </div>
        </div>

        <ol className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:flex lg:max-w-[18rem] lg:flex-col lg:justify-self-end">
          {runBeats.map((beat, i) => (
            <li key={beat.label} className="flex gap-4">
              <span
                aria-hidden="true"
                className="mt-px shrink-0 text-[12px] tabular-nums text-muted-foreground"
              >
                {i + 1}
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

function ProcessSection() {
  return (
    <section
      className="mt-28 grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:items-center"
      data-site-hue-stop="0.25"
    >
      <div className="flex max-w-3xl flex-col gap-10">
        <Label as="h2">Why Process</Label>

        <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-muted-foreground">
          <div className="flex flex-col gap-3">
            <p className="text-[18px] font-medium leading-snug tracking-tight text-foreground">
              Great engineers don&apos;t rely on raw talent.
            </p>
            <p>
              They work through a process they trust, and that process is what
              lets their judgment do its best work. It frees them to stop
              re-deciding the basics and spend attention where it matters.
            </p>
          </div>
          <p>
            Coding agents are surprisingly capable, but like humans, ad-hoc
            chat isn&apos;t the best way to do effective work. You become the
            agent&apos;s working memory. This is taxing for you, and a
            suboptimal experience for the agent that puts it at a disadvantage.
          </p>
          <div className="flex flex-col gap-3">
            <p className="text-[18px] font-medium leading-snug tracking-tight text-foreground">
              Circuit sets agents up for success.
            </p>
            <p>
              The agent is the capable part. Circuit is the path it runs
              along. You describe the task, and Circuit supplies the process
              that fits it: the right moves, in the right order, with the
              checks that prove the work. You hand off more and keep your
              confidence, because the result comes with evidence, not just a
              claim that it&apos;s done.
            </p>
          </div>
        </div>
      </div>

      <ProcessArtwork />
    </section>
  );
}

function FlowFlexSection() {
  return (
    <section
      className="mt-28 flex flex-col gap-10"
      data-site-hue-stop="0.375"
    >
      {/* Header and lead live in the standard content column, aligned with the
          rest of the page. */}
      <div className="flex max-w-3xl flex-col gap-3">
        <Label as="h2">Flexible, Not Rigid</Label>
        <p className="text-balance text-[15px] leading-relaxed text-muted-foreground">
          <span className="font-mono font-medium text-foreground">
            /circuit:run
          </span>{" "}
          starts with the flow that fits the task, but a flow is not a rigid
          script. When the work calls for it, supported flows can change rigor,
          continue autonomously with bounded recovery, or fan out into
          tournament mode. The blocks stay typed, so flexibility stays
          visible.
        </p>
      </div>

      {/* The flow explorer breaks out of the standard column so it can sit
          wider than the prose above it; the panel caps and centers itself. */}
      <div className="relative left-1/2 w-screen -translate-x-1/2 px-6">
        <FlowComposer />
      </div>
    </section>
  );
}

function BlockInternalsSection() {
  return (
    <section
      className="block-internals-section relative left-1/2 mt-28 flex w-[calc(100vw-2rem)] -translate-x-1/2 flex-col gap-10 overflow-hidden bg-muted/20 px-6 py-14 sm:w-[calc(100vw-3rem)] sm:px-8 lg:w-[calc(100vw-4rem)]"
      data-site-hue-stop="0.5"
    >
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10">
        <div className="flex max-w-3xl flex-col gap-3">
          <Label as="h2">Inside a Block</Label>
          <p className="text-balance text-[15px] leading-relaxed text-muted-foreground">
            Blocks are the power units inside every flow. Each one has a
            typed input, a typed output, and a clear job, so flows can combine
            them without losing track of what the agent knows.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 overflow-hidden sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {blockInternals.map((block) => (
            <article
              key={block.name}
              className="block-internal-card relative flex flex-col gap-4 bg-muted/70 p-5"
            >
              <span aria-hidden="true" className="block-edge block-edge-t">
                <i />
                <i />
                <i />
              </span>
              <span aria-hidden="true" className="block-edge block-edge-l">
                <i />
                <i />
                <i />
              </span>
              <h3 className="text-balance text-[15px] font-medium leading-tight tracking-tight">
                {block.name}
              </h3>
              <dl className="flex flex-col gap-1.5 text-[11px] leading-snug">
                <div className="grid grid-cols-[3.75rem_minmax(0,1fr)] items-baseline gap-3">
                  <dt className="uppercase tracking-[0.18em] text-muted-foreground">
                    Input
                  </dt>
                  <dd className="text-balance text-[12px] text-foreground">
                    {block.input}
                  </dd>
                </div>
                <div className="grid grid-cols-[3.75rem_minmax(0,1fr)] items-baseline gap-3">
                  <dt className="uppercase tracking-[0.18em] text-muted-foreground">
                    Output
                  </dt>
                  <dd className="text-balance text-[12px] text-foreground">
                    {block.output}
                  </dd>
                </div>
              </dl>
              <p className="text-balance text-[12px] leading-relaxed text-muted-foreground">
                {block.detail}
              </p>
            </article>
          ))}
          <article className="block-internal-card block-internal-card-planned relative flex flex-col gap-4 bg-muted/40 p-5">
            <span aria-hidden="true" className="block-edge block-edge-t">
              <i />
              <i />
              <i />
            </span>
            <span aria-hidden="true" className="block-edge block-edge-l">
              <i />
              <i />
              <i />
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-medium tracking-tight">
                Custom
              </h3>
              <span className="soft-chip shrink-0 px-1.5 py-1 text-[10px] uppercase leading-none tracking-[0.15em] text-muted-foreground">
                soon
              </span>
            </div>
            <p className="text-balance text-[12px] leading-relaxed text-muted-foreground">
              Author your own blocks with typed inputs and outputs, then
              compose them into new flows. Block and flow authoring is on the
              way.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section
      className="mt-28 flex flex-col gap-10"
      data-site-hue-stop="0.625"
    >
      <Label as="h2">Why You Can Trust It</Label>

      <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="text-[15px] font-medium tracking-tight">Evidence</h3>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Circuit keeps checks and results attached to the work. The agent
            evaluates its own work against that evidence instead of asking you
            to take it on faith.
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="text-[15px] font-medium tracking-tight">
            Checkpoints
          </h3>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Circuit pauses when your judgment changes the outcome: a risky
            direction, an ambiguous goal, a visual choice. The pause is part
            of the flow, not the agent&apos;s discretion. Otherwise it keeps
            moving.
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <h3 className="text-[15px] font-medium tracking-tight">
            Confidence
          </h3>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            The point is confidence while you delegate more: Circuit keeps
            the process explicit, the evidence attached, and the outcome
            honest.
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-medium tracking-tight">Memory</h3>
            <span className="soft-chip shrink-0 px-1.5 py-1 text-[10px] uppercase leading-none tracking-[0.15em] text-muted-foreground">
              soon
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Every run generates structured, CLI-queryable records: choices,
            checks, evidence, and what happened next. These form a powerful
            substrate for longitudinal memory.
          </p>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section
      className="mt-28 flex flex-col gap-10"
      data-site-hue-stop="0.75"
    >
      <div className="flex max-w-3xl flex-col gap-3">
        <Label as="h2">Where It Fits</Label>
        <p className="text-[15px] leading-relaxed text-foreground">
          Circuit overlaps with tools and approaches you already use, but it
          solves a different problem. Those tools shape what the agent can do;
          Circuit shapes how the work moves from request to evidence-backed
          outcome.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {comparison.map((c) => (
          <div
            key={c.name}
            className="soft-info-card flex flex-col gap-5 p-5"
          >
            <h3 className="text-[15px] font-medium tracking-tight">
              {c.name}
            </h3>
            <div className="flex flex-col gap-2">
              <p className="text-balance text-[13px] leading-relaxed text-muted-foreground">
                {c.approach}
              </p>
            </div>
            <div className="mt-auto flex flex-col gap-2">
              <p className="font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                How Circuit differs
              </p>
              <p className="text-balance text-[13px] leading-relaxed text-foreground">
                {c.circuit}
              </p>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}

function InstallSection() {
  return (
    <section
      id="install"
      className="mt-28 flex flex-col gap-7"
      data-site-hue-stop="0.875"
    >
      <div className="flex max-w-3xl flex-col gap-3">
        <Label as="h2">Get Started</Label>
        <p className="text-balance text-[15px] leading-relaxed text-foreground">
          Install Circuit once for the agent you use.
        </p>
      </div>

      <div className="w-full">
        <CopyInstallInstructions text={agentInstallInstructions} />
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {installTargets.map((target) => (
          <article
            key={target.name}
            className={[
              "install-terminal-card flex flex-col overflow-hidden",
              target.comingSoon ? "md:col-span-2 lg:col-span-1" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="install-terminal-header flex items-center justify-between gap-3 px-5 py-4">
              <h3 className="install-terminal-title text-[15px] font-medium tracking-tight">
                {target.name === "Claude Code" ? <ClaudeCodeLogo /> : null}
                {target.name === "Codex" ? <CodexLogo /> : null}
                {target.name === "OpenCode" ? <OpenCodeLogo /> : null}
                {target.name}
              </h3>
              {target.commands ? (
                <CopyTextButton
                  text={target.commands.join("\n")}
                  className="install-command-copy min-h-8 shrink-0 px-3 py-1.5 text-[12px]"
                />
              ) : target.comingSoon ? (
                <span className="soft-chip inline-flex min-h-8 shrink-0 items-center justify-center px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Soon
                </span>
              ) : null}
            </div>

            {target.commands ? (
              <pre className="whitespace-pre-wrap break-words px-5 py-4 text-[13px] leading-7 text-foreground">
                <code>
                  {target.commands
                    .map((command) => `› ${command}`)
                    .join("\n")}
                </code>
              </pre>
            ) : (
              <div className="flex flex-1 items-center justify-center px-5 py-4 text-center text-[13px] leading-7 text-muted-foreground">
                OpenCode support coming soon.
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer
      className="mt-28 flex items-center justify-between gap-3 pt-8 text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
      data-site-hue-stop="1"
    >
      <div className="flex items-center gap-4">
        <a
          href="https://github.com/petekp/circuit"
          aria-label="Circuit on GitHub"
          className="hover:text-foreground"
        >
          <GithubLogo />
        </a>
        <a
          href="https://x.com/petekp"
          aria-label="Pete Petrash on X"
          className="hover:text-foreground"
        >
          <XLogo />
        </a>
      </div>
      <a
        href="https://github.com/petekp/circuit/blob/main/LICENSE"
        className="hover:text-foreground"
      >
        Open Source
      </a>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-16">
      <MastheadSection />
      <ExampleRunSection />
      <ProcessSection />
      <FlowFlexSection />
      <BlockInternalsSection />
      <TrustSection />
      <ComparisonSection />
      <InstallSection />
      <SiteFooter />
    </main>
  );
}
