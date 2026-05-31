import type { CSSProperties, ReactNode } from "react";
import { FlowGlyph, type MotifCell } from "@/components/flow-glyph";
import { Wordmark } from "@/components/wordmark";

type Flow = {
  name: string;
  command: string;
  color: string;
  accent: string;
  motif: MotifCell[];
  summary: string;
};

type DiagramStep = {
  label: string;
  short: string;
};

type DiagramFlow = {
  name: string;
  color: string;
  accent: string;
  steps: DiagramStep[];
};

type SurfaceLine = {
  text: string;
  emphasis?: boolean;
};

type RunBeat = {
  label: string;
  note: string;
};

// The real surface Circuit streamed while building this page. Captured from
// the run, lightly trimmed to the meaningful beats.
const runCommand = "/circuit:run build the Circuit landing page from the outline";

const runSurface: SurfaceLine[] = [
  { text: "Circuit", emphasis: true },
  { text: "⎿ Chose build." },
  { text: "⎿ A worker can edit this checkout." },
  { text: "⎿ Framing the work..." },
  { text: "⎿ Planning the work..." },
  { text: "⎿ Making the change..." },
  { text: "⎿ Asking the specialist to make the change..." },
  { text: "⎿ Finished the specialist pass." },
  { text: "⎿ Checking the work..." },
  { text: "⎿ Asking the reviewer to check the result..." },
  { text: "⎿ Finished checking the result." },
  {
    text: "⎿ Build complete. Change implemented, verification passed, review accepted.",
    emphasis: true,
  },
];

const runBeats: RunBeat[] = [
  {
    label: "You describe the task",
    note: "One line in. You do not script the steps yourself.",
  },
  {
    label: "Circuit selects the flow",
    note: "It chose Build and recorded the choice. You did not have to pick one.",
  },
  {
    label: "It works the process",
    note: "Plan, make the change, then a separate pass checks and reviews the result.",
  },
  {
    label: "It asks only when needed",
    note: "No checkpoint appeared here. Nothing needed your judgment, so it kept moving.",
  },
  {
    label: "A short outcome",
    note: "Done: change implemented, verification passed, review accepted.",
  },
];

const flows: Flow[] = [
  {
    name: "EXPLORE",
    command: "/circuit:explore",
    color: "var(--flow-explore)",
    accent: "var(--flow-explore-accent)",
    motif: [
      "filled", "empty", "filled",
      "empty", "filled", "empty",
      "filled", "empty", "filled",
    ],
    summary: "Compare paths before the agent commits to one.",
  },
  {
    name: "BUILD",
    command: "/circuit:build",
    color: "var(--flow-build)",
    accent: "var(--flow-build-accent)",
    motif: [
      "empty", "empty", "filled",
      "empty", "filled", "filled",
      "filled", "filled", "filled",
    ],
    summary: "Turn a clear brief into a plan, a change, checks, and review.",
  },
  {
    name: "FIX",
    command: "/circuit:fix",
    color: "var(--flow-fix)",
    accent: "var(--flow-fix-accent)",
    motif: [
      "empty", "filled", "empty",
      "filled", "filled", "filled",
      "empty", "filled", "empty",
    ],
    summary: "Find the cause, make the fix, and keep evidence attached.",
  },
  {
    name: "REVIEW",
    command: "/circuit:review",
    color: "var(--flow-review)",
    accent: "var(--flow-review-accent)",
    motif: [
      "filled", "filled", "filled",
      "filled", "empty", "filled",
      "filled", "filled", "filled",
    ],
    summary: "Review a scoped change against evidence, not guesswork.",
  },
  {
    name: "GOAL",
    command: "/circuit:goal",
    color: "var(--flow-goal)",
    accent: "var(--flow-goal-accent)",
    motif: [
      "empty", "filled", "empty",
      "filled", "empty", "filled",
      "empty", "filled", "empty",
    ],
    summary:
      "Keep a bounded objective moving until it is done, blocked, or needs a decision.",
  },
];

const blocks = [
  "Clarify",
  "Frame",
  "Gather Context",
  "Diagnose",
  "Plan",
  "Act",
  "Run Verification",
  "Review",
  "Human Decision",
  "Close With Evidence",
];

const blockPool = [
  "Clarify",
  "Frame",
  "Context",
  "Diagnose",
  "Plan",
  "Act",
  "Verify",
  "Review",
  "Decide",
  "Close",
];

const diagramFlows: DiagramFlow[] = [
  {
    name: "Build",
    color: "var(--flow-build)",
    accent: "var(--flow-build-accent)",
    steps: [
      { label: "Frame", short: "Frame" },
      { label: "Plan", short: "Plan" },
      { label: "Act", short: "Act" },
      { label: "Run Verification", short: "Verify" },
      { label: "Review", short: "Review" },
      { label: "Close With Evidence", short: "Close" },
    ],
  },
  {
    name: "Fix",
    color: "var(--flow-fix)",
    accent: "var(--flow-fix-accent)",
    steps: [
      { label: "Frame", short: "Frame" },
      { label: "Diagnose", short: "Diagnose" },
      { label: "Act", short: "Act" },
      { label: "Run Verification", short: "Verify" },
      { label: "Review", short: "Review" },
      { label: "Close With Evidence", short: "Close" },
    ],
  },
  {
    name: "Goal",
    color: "var(--flow-goal)",
    accent: "var(--flow-goal-accent)",
    steps: [
      { label: "Clarify", short: "Clarify" },
      { label: "Frame", short: "Frame" },
      { label: "Human Decision", short: "Decide" },
      { label: "Act", short: "Act" },
      { label: "Run Verification", short: "Verify" },
      { label: "Close With Evidence", short: "Close" },
    ],
  },
];

const comparison = [
  {
    name: "Skills",
    detail: "One move. A skill teaches a single capable thing to do.",
  },
  {
    name: "Dynamic workflows",
    detail:
      "Orchestrate many agents for large one-off jobs: a codebase-wide audit, a big migration, deep research.",
  },
  {
    name: "Circuit",
    detail:
      "A repeatable, evidence-backed process for everyday work, behind one front door.",
  },
];

const agentInstallInstructions = `Please install Circuit for the coding-agent tool I am using in this project.

If this is Claude Code, run:
/plugin marketplace add petekp/circuit
/plugin install circuit@circuit
/reload-plugins

If this is Codex, run:
codex plugin marketplace add petekp/circuit

After Circuit is installed, start with:
/circuit:run <my task>

Use a direct flow only when it is clearly the right fit:
/circuit:explore, /circuit:build, /circuit:fix, /circuit:review, or /circuit:goal`;

function Label({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </div>
  );
}

function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="overflow-x-auto border border-border bg-[var(--panel)] px-5 py-4 text-[13px] leading-7 text-foreground">
      <code>{children}</code>
    </pre>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-16">
      {/* Section 1: Masthead */}
      <header className="flex items-center justify-end">
        <a
          href="https://github.com/petekp/circuit"
          className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          github.com/petekp/circuit
        </a>
      </header>

      <section className="mt-12 flex flex-col gap-8 sm:mt-16">
        <div className="flex flex-col gap-2">
          <Wordmark />
          <p className="text-[11px] leading-none text-muted-foreground">
            a plugin for Claude Code and Codex
          </p>
        </div>

        <h1 className="max-w-2xl text-base font-medium leading-tight tracking-tight sm:text-xl">
          Powerful, repeatable work patterns for coding agents.
        </h1>

        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          You hand a task to a coding agent, then spend the next hour steering
          every step in chat. Circuit gives the agent a real process to follow,
          so you can hand off the work instead.
        </p>

        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Alpha, v0.0.1.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#see-one-run"
            className="inline-flex items-center border border-border bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            See a run
          </a>
          <a
            href="#install"
            className="inline-flex items-center border border-border bg-[var(--panel)] px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            Install
          </a>
        </div>
      </section>

      {/* Section 2: See one run */}
      <section id="see-one-run" className="mt-28 flex flex-col gap-10">
        <div className="flex max-w-3xl flex-col gap-3">
          <Label>[ See one run ]</Label>
          <p className="text-balance text-[15px] leading-relaxed text-foreground">
            Normally you steer each step in chat. Here you describe the task
            once, and the agent works a real process, asking only when a choice
            genuinely needs you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="flex flex-col gap-3">
            <div className="overflow-x-auto border border-border bg-[var(--panel)] px-5 py-4 font-mono text-[13px] leading-7">
              <div className="text-foreground">
                <span className="text-muted-foreground">$ </span>
                {runCommand}
              </div>
              <div className="mt-2 flex flex-col">
                {runSurface.map((line) => (
                  <span
                    key={line.text}
                    className={
                      line.emphasis ? "text-foreground" : "text-muted-foreground"
                    }
                  >
                    {line.text}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              This page was built by this run.
            </p>
          </div>

          <ol className="flex flex-col gap-6">
            {runBeats.map((beat) => (
              <li key={beat.label} className="flex flex-col gap-1">
                <h3 className="text-[14px] font-medium tracking-tight">
                  {beat.label}
                </h3>
                <p className="text-balance text-[13px] leading-relaxed text-muted-foreground">
                  {beat.note}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <p className="max-w-3xl text-balance text-[13px] leading-relaxed text-muted-foreground">
          The screen stays short on purpose. The full record (plan, checks,
          evidence) is kept for the agent and the next run, not dumped on you.
        </p>
      </section>

      {/* Section 3: What Circuit is */}
      <section className="mt-28 flex max-w-3xl flex-col gap-10">
        <Label>[ What Circuit is ]</Label>

        <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-muted-foreground">
          <p className="text-[17px] leading-snug text-foreground">
            Skilled people rarely wing it. They follow a process, pick the right
            move at the right moment, and check the work before moving on.
          </p>
          <p>
            Ad-hoc chat makes you carry that process by hand: the state, the
            next move, the right skill, when to check, and when to pause. That
            is a tax on you, and it is not a great way for the agent to work
            either.
          </p>
          <p>
            Circuit gives that process to the agent. You describe the task;
            Circuit brings the practice for how to do that kind of work well.
            You delegate more, and you keep your confidence that the work was
            done properly.
          </p>
          <p className="text-foreground">
            A skill is one move. A flow is the practice: the right moves, in the
            right order, with checks along the way. Process is the layer above
            your skills that decides which to use and when.
          </p>
        </div>
      </section>

      {/* Section 4: Flows and blocks */}
      <section className="mt-28 flex flex-col gap-10">
        <div className="flex max-w-3xl flex-col gap-3">
          <Label>[ Flows and blocks ]</Label>
          <p className="text-balance text-[13px] leading-relaxed text-muted-foreground">
            You never have to pick a flow. Run chooses the one that fits the
            task. But here is what is under the hood.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-5">
          {flows.map((f) => (
            <div key={f.name} className="flex flex-col gap-5">
              <FlowGlyph
                name={f.name}
                color={f.color}
                accent={f.accent}
                motif={f.motif}
                cellSize={25}
              />
              <div className="flex flex-col gap-1">
                <div className="text-[15px] font-medium tracking-tight">
                  {f.name}
                </div>
                <code className="text-[11px] text-muted-foreground">
                  {f.command}
                </code>
              </div>
              <p className="text-balance text-[13px] leading-relaxed text-muted-foreground">
                {f.summary}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <Label>[ Blocks ]</Label>
          <div className="flex flex-wrap gap-2">
            {blocks.map((b) => (
              <span
                key={b}
                className="border border-border bg-[var(--panel)] px-3 py-2 text-[13px] text-foreground"
              >
                {b}
              </span>
            ))}
          </div>
          <p className="max-w-3xl text-balance text-[13px] leading-relaxed text-muted-foreground">
            A flow is just these blocks arranged for a kind of work. Same
            pieces, different order.
          </p>
        </div>

        <div className="flow-composer" aria-label="Flows made from blocks">
          <div className="flow-composer-grid">
            <div className="flow-composer-bank">
              <div className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                Reusable blocks
              </div>
              <div className="flow-composer-pool">
                {blockPool.map((block) => (
                  <span className="flow-composer-pool-chip" key={block}>
                    {block}
                  </span>
                ))}
              </div>
            </div>

            <div className="flow-composer-routes">
              {diagramFlows.map((flow) => (
                <div
                  className="flow-composer-route"
                  key={flow.name}
                  style={
                    {
                      "--flow-color": flow.color,
                      "--flow-accent": flow.accent,
                    } as CSSProperties
                  }
                >
                  <div className="flow-composer-route-name">
                    <span>{flow.name}</span>
                  </div>
                  <div
                    className="flow-composer-sequence"
                    aria-label={`${flow.name} flow blocks: ${flow.steps
                      .map((step) => step.label)
                      .join(", ")}`}
                  >
                    {flow.steps.map((step) => (
                      <span
                        className="flow-composer-step"
                        key={`${flow.name}-${step.label}`}
                        title={step.label}
                      >
                        {step.short}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: What you can trust */}
      <section className="mt-28 flex max-w-3xl flex-col gap-10">
        <Label>[ What you can trust ]</Label>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h3 className="text-[15px] font-medium tracking-tight">Evidence</h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Circuit keeps checks and results attached to the work. The agent
              evaluates its own work against that evidence instead of asking you
              to take it on faith.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-[15px] font-medium tracking-tight">
              Checkpoints
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Checkpoints are rare and worth it. Circuit pauses when your
              judgment changes the outcome: a risky direction, an ambiguous
              goal, a visual choice. Otherwise it keeps moving.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-[15px] font-medium tracking-tight">
              Confidence
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              The point is confidence while you delegate more: you can trust the
              agent did its best work, did not cut corners, did not spin its
              wheels, and is learning from what came before.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-[15px] font-medium tracking-tight">
              Where it is heading
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Circuit also keeps a record across runs so future work can build
              on what was already learned in your project. Think of it the way a
              practitioner gets better with experience. This part is in active
              development.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Circuit and your other tools */}
      <section className="mt-28 flex flex-col gap-10">
        <div className="flex max-w-3xl flex-col gap-5">
          <Label>[ Circuit and your other tools ]</Label>
          <p className="text-[15px] leading-relaxed text-foreground">
            Circuit does not replace your coding agent, your skills, or anything
            Claude Code or Codex already gives you. It sits above them and
            decides how the work gets done.
          </p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            A skill teaches one move. Circuit decides which moves to use, in
            what order, and what to check before moving on. Your skills still
            apply, at the right steps.
          </p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Claude Code&apos;s dynamic workflows orchestrate many subagents from
            a script for big one-off jobs: a codebase-wide audit, a large
            migration, deep research. Circuit is for the everyday work in front
            of you. It picks a repeatable process for this task, keeps evidence
            attached, and pauses only when your judgment matters. The two stack
            rather than compete.
          </p>
        </div>

        <div className="grid grid-cols-1 border-y border-border sm:grid-cols-3 sm:border-y-0">
          {comparison.map((c) => (
            <div
              key={c.name}
              className="flex flex-col gap-2 border-b border-border py-5 sm:border-b-0 sm:border-r sm:px-5 sm:py-0 sm:first:pl-0 sm:last:border-r-0"
            >
              <h3 className="text-[15px] font-medium tracking-tight">
                {c.name}
              </h3>
              <p className="text-balance text-[13px] leading-relaxed text-muted-foreground">
                {c.detail}
              </p>
            </div>
          ))}
        </div>

        <p className="max-w-3xl text-balance text-[13px] leading-relaxed text-muted-foreground">
          If your task is a hand-rolled mega-orchestration, reach for a
          workflow. If it is build this, fix that, review this change, reach for
          Circuit.
        </p>
      </section>

      {/* Section 7: Install and start */}
      <section id="install" className="mt-28 flex flex-col gap-10">
        <Label>[ Install and start ]</Label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h2 className="text-[15px] font-medium tracking-tight">
              Claude Code
            </h2>
            <CodeBlock>
              {`/plugin marketplace add petekp/circuit
/plugin install circuit@circuit
/reload-plugins`}
            </CodeBlock>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-[15px] font-medium tracking-tight">Codex</h2>
            <CodeBlock>{`codex plugin marketplace add petekp/circuit`}</CodeBlock>
          </div>
        </div>

        <div className="flex max-w-3xl flex-col gap-3">
          <p className="text-[13px] text-muted-foreground">Then start with:</p>
          <CodeBlock>{`/circuit:run <your task>`}</CodeBlock>
          <p className="text-[13px] text-muted-foreground">
            The CLI needs Node.js 22.18.0 or newer.
          </p>
        </div>

        <div className="flex w-full max-w-3xl flex-col gap-3">
          <Label>[ Copy these instructions to your coding agent ]</Label>
          <textarea
            readOnly
            rows={9}
            value={agentInstallInstructions}
            className="max-h-56 min-h-36 w-full resize-y overflow-y-auto border border-border bg-[var(--panel)] px-5 py-4 font-mono text-[13px] leading-6 text-foreground outline-none"
          />
        </div>
      </section>

      {/* Section 8: Footer */}
      <footer className="mt-28 flex flex-col gap-3 border-t border-border pt-8 text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <a
          href="https://github.com/petekp/circuit"
          className="transition-colors hover:text-foreground"
        >
          github.com/petekp/circuit
        </a>
        <span className="normal-case tracking-normal">
          <a
            href="https://github.com/petekp/circuit/blob/main/LICENSE"
            className="underline underline-offset-4 transition-colors hover:text-foreground"
          >
            MIT
          </a>{" "}
          licensed.
        </span>
        <span>Alpha, v0.0.1.</span>
      </footer>
    </main>
  );
}
