import type { ReactNode } from "react";
import { CopyInstallInstructions } from "@/components/copy-install-instructions";
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

// Faithful reconstruction of a live Circuit Build surface, assembled from the
// exact progress strings Circuit streams (circuit/src/flows/build/data.ts). The
// final line is verbatim from this run's captured summary
// (.circuit/runs/21c71c1e-.../reports/operator-summary.md).
const runCommand = "/circuit:run build the Circuit landing page from the outline";
const currentAlpha = "0.1.0-alpha.6";
const alphaLabel = `Plugin alpha, ${currentAlpha}`;
const codexInstallCommand =
  "codex plugin marketplace add petekp/circuit --ref circuit--v0.1.0-alpha.6";

const runSurface: SurfaceLine[] = [
  { text: "CIRCUIT", emphasis: true },
  { text: "⎿ Chose build." },
  { text: "⎿ Framing the work..." },
  { text: "⎿ Planning the work..." },
  { text: "⎿ Making the change..." },
  { text: "⎿ Asking the specialist to make the change..." },
  { text: "⎿ Finished the specialist pass." },
  { text: "⎿ Checking the work..." },
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
    note: "It chose Build — the process that fits this kind of task — and recorded the choice. You did not have to pick one.",
  },
  {
    label: "It works the process",
    note: "Plan, make the change, then a separate pass checks and reviews the result.",
  },
  {
    label: "A short outcome",
    note: "Done: change implemented, verification passed, review accepted.",
  },
];

const comparison = [
  {
    name: "Skills",
    detail: "One move. A skill teaches a single capable thing to do.",
  },
  {
    name: "Dynamic workflows (Claude Code)",
    detail:
      "Orchestrate many agents for large one-off jobs: a codebase-wide audit, a big migration, deep research.",
  },
  {
    name: "Circuit",
    detail:
      "A repeatable, evidence-backed process for everyday work, behind one front door.",
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

Use /circuit:run as the normal front door. Circuit routes the task to Build, Fix, Review, Explore, Prototype, or Pursue when that is the right fit.`;

function Label({
  children,
  as: Tag = "div",
}: {
  children: ReactNode;
  as?: "div" | "h2";
}) {
  return (
    <Tag className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </Tag>
  );
}

function CodeBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="soft-code-block whitespace-pre-wrap break-words px-5 py-4 text-[13px] leading-7 text-foreground">
      <code>{children}</code>
    </pre>
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

      <section
        className="mt-12 flex flex-col gap-8 sm:mt-16"
        data-site-hue-stop="0"
      >
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

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#see-one-run"
            className="soft-cta-primary inline-flex min-h-11 items-center px-5 py-2 text-[13px] font-medium transition-opacity hover:opacity-90"
          >
            See example
          </a>
          <a
            href="#install"
            className="soft-cta-secondary inline-flex min-h-11 items-center px-5 py-2 text-[13px] font-medium text-foreground transition-colors"
          >
            Install
          </a>
        </div>
      </section>

      {/* Section 2: See one run */}
      <section
        id="see-one-run"
        className="mt-28 flex flex-col gap-10"
        data-site-hue-stop="0.125"
      >
        <div className="flex max-w-3xl flex-col gap-3">
          <Label as="h2">Example run</Label>
          <p className="text-balance text-[15px] leading-relaxed text-foreground">
            Normally you steer each step in chat. Here you describe the task
            once, and the agent works a real process, asking only when a choice
            genuinely needs you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.72fr)] lg:items-start">
          <div className="flex flex-col gap-3">
            <div className="run-terminal-stage">
              {/* Blurred ghost of the same content, masked to bloom only below
                  the opaque pane — the terminal's text showing through. */}
              <div
                aria-hidden="true"
                className="run-terminal-echo font-mono text-[13px] leading-7"
              >
                <RunTerminalBody echo />
              </div>
              <div className="run-terminal overflow-hidden font-mono text-[13px] leading-7">
                <RunTerminalBody />
              </div>
            </div>
          </div>

          <ol className="flex max-w-sm flex-col gap-6 lg:justify-self-end">
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

      {/* Section 3: What Circuit is */}
      <section
        className="mt-28 flex max-w-3xl flex-col gap-10"
        data-site-hue-stop="0.25"
      >
        <Label as="h2">What Circuit is</Label>

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
      <section
        className="relative left-1/2 mt-28 flex w-screen -translate-x-1/2 flex-col gap-10 px-6"
        data-site-hue-stop="0.375"
      >
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10">
          <div className="flex max-w-3xl flex-col gap-3">
            <Label as="h2">Flows and blocks</Label>
            <p className="text-balance text-[13px] leading-relaxed text-muted-foreground">
              You never pick a flow —{" "}
              <span className="font-mono font-medium text-foreground">
                /circuit:run
              </span>{" "}
              reads the task and routes it. Each flow is the same set of typed
              blocks, arranged for one kind of work. Pick one to watch it
              compose.
            </p>
          </div>

          <FlowComposer />
        </div>
      </section>

      {/* Section 5: Block internals */}
      <section
        className="relative left-1/2 mt-28 flex w-screen -translate-x-1/2 flex-col gap-10 bg-muted/20 px-6 py-14"
        data-site-hue-stop="0.5"
      >
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10">
          <div className="flex max-w-3xl flex-col gap-3">
            <Label as="h2">Block internals</Label>
            <p className="text-balance text-[13px] leading-relaxed text-muted-foreground">
              Blocks are the power units inside every flow. Each one has a
              typed input, a typed output, and a clear job, so flows can combine
              them without losing track of what the agent knows.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {blockInternals.map((block) => (
              <article
                key={block.name}
                className="block-internal-card flex flex-col gap-4 bg-muted/70 p-5"
              >
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
          </div>
        </div>
      </section>

      {/* Section 6: What you can trust */}
      <section
        className="mt-28 flex max-w-3xl flex-col gap-10"
        data-site-hue-stop="0.625"
      >
        <Label as="h2">What you can trust</Label>

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
              The point is confidence while you delegate more: Circuit keeps
              the process explicit, the evidence attached, and the outcome
              honest.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-[15px] font-medium tracking-tight">
              Where it is heading
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Memory is in the works. Circuit already leaves structured run
              records, evidence links, flow choices, checks, and history entries
              behind each run. That gives future memory something concrete to
              cite: what happened, why it happened, and which proof backed it.
            </p>
          </div>
        </div>
      </section>

      {/* Section 7: Circuit and your other tools */}
      <section
        className="mt-28 flex flex-col gap-10"
        data-site-hue-stop="0.75"
      >
        <div className="flex max-w-3xl flex-col gap-5">
          <Label as="h2">Circuit and your other tools</Label>
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

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {comparison.map((c) => (
            <div
              key={c.name}
              className="soft-info-card flex flex-col gap-2 p-5"
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

      {/* Section 8: Install and start */}
      <section
        id="install"
        className="mt-28 flex flex-col gap-10"
        data-site-hue-stop="0.875"
      >
        <Label as="h2">Install and start</Label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-[15px] font-medium tracking-tight">
              Claude Code
            </h3>
            <CodeBlock>
              {`/plugin marketplace add petekp/circuit
/plugin install circuit@circuit
/reload-plugins`}
            </CodeBlock>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-[15px] font-medium tracking-tight">Codex</h3>
            <CodeBlock>{codexInstallCommand}</CodeBlock>
          </div>
        </div>

        <div className="flex max-w-3xl flex-col gap-3">
          <p className="text-[13px] text-muted-foreground">Then start with:</p>
          <CodeBlock>{`/circuit:run <your task>`}</CodeBlock>
          <p className="text-[13px] text-muted-foreground">
            Circuit requires Node.js 22.18.0 or newer.
          </p>
        </div>

        <div className="flex w-full max-w-3xl flex-col gap-3">
          <Label>Copy these instructions to your coding agent</Label>
          <CopyInstallInstructions text={agentInstallInstructions} />
        </div>
      </section>

      {/* Section 9: Footer */}
      <footer
        className="mt-28 flex flex-col gap-3 pt-8 text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
        data-site-hue-stop="1"
      >
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
            MIT licensed
          </a>
          .
        </span>
        <span>{alphaLabel}</span>
      </footer>
    </main>
  );
}
