import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  CopyInstallInstructions,
  CopyTextButton,
} from "@/components/copy-install-instructions";
import { ExampleRunSection } from "@/components/example-run-toggle";
import { FlowComposer } from "@/components/flow-composer";
import { CircuitMark } from "@/components/brand/circuit-mark";
import { GapChapter } from "@/components/run-stage/gap-chapter";

type InstallTarget = {
  name: "Claude Code" | "Codex" | "OpenCode";
  commands?: string[];
  comingSoon?: boolean;
};

const codexInstallCommand =
  "codex plugin marketplace add petekp/circuit --ref circuit--v0.1.0-alpha.7";

export const metadata: Metadata = {
  title: "Circuit - the process your coding agent follows",
  description:
    "Coding agents do their best work inside a real process. Circuit moves the work step to step and keeps a written record. Tomorrow starts where today ended.",
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

const blockInternals = [
  {
    name: "Frame",
    detail:
      "Turns a loose request into scope, goal, constraints, and a done condition.",
  },
  {
    name: "Gather Context",
    detail:
      "Finds the files, errors, prior decisions, and live state that shape the next move.",
  },
  {
    name: "Diagnose",
    detail: "Separates symptom from cause and keeps uncertainty visible.",
  },
  {
    name: "Human Decision",
    detail:
      "Names the moments where your judgment changes the result: a tradeoff, a taste call, risky scope.",
  },
  {
    name: "Plan",
    detail:
      "Chooses the path, order, and verification points before anything changes.",
  },
  {
    name: "Coordinate",
    detail:
      "Tracks dependencies and parallelizable chunks across multi-part work.",
  },
  {
    name: "Act",
    detail: "Makes the change and records what moved and why.",
  },
  {
    name: "Run Verification",
    detail: "Runs the checks that fit the work and reports the result.",
  },
  {
    name: "Review",
    detail:
      "Checks behavior, scope, and evidence from a separate review posture.",
  },
  {
    name: "Close With Evidence",
    detail:
      "Leaves an outcome with evidence pointers, decisions, and residual risks.",
  },
];

const agentInstallInstructions = `Install Circuit, then hand it something real.

If you are Claude Code, run:
/plugin marketplace add petekp/circuit
/plugin install circuit@circuit
/reload-plugins

If you are Codex, run:
${codexInstallCommand}

When the install finishes, suggest a first run, like:
/circuit:run fix the flakiest test in this repo
/circuit:run review the changes on this branch before I open the PR

From here on, start every task with /circuit:run. Circuit picks the flow that fits: Build, Fix, Review, Explore, Prototype, or Pursue.`;

/* A representative Fix record, written to the real fix-result schema:
   field names, enum values, and the 'fixed' gating (regression proved,
   verification passed) all match src/flows/fix/reports.ts in the Circuit
   repo. Fields are trimmed to the load-bearing ones and the nine evidence
   links to four. The story is authored, not a verbatim run. */
const fixRunExcerpt = `{
  "summary": "Fix 'customers get double-charged when checkout retries': capture now reuses the order's idempotency key, so a retry settles on the original charge.",
  "outcome": "fixed",
  "regression_status": "proved",
  "verification_status": "passed",
  "review_status": "completed",
  "residual_risks": ["The refund path bypasses the idempotency key; flagged, not changed here."],
  "evidence_links": [
    { "report_id": "fix.diagnosis", "path": "reports/fix/diagnosis.json" },
    { "report_id": "fix.regression-proof", "path": "reports/fix/regression-proof.json" },
    { "report_id": "fix.verification", "path": "reports/fix/verification.json" },
    { "report_id": "fix.change-set", "path": "reports/fix/change-set.json" },
    … 5 more
  ]
}`;

/* The record is colored like a reviewer would read it: keys and structure
   recede, values carry the ink, and real check outcomes light in the
   signal color so "what passed" is answerable at a glance. */
const recordStatusInk: Record<string, string> = {
  passed: "text-signal",
  pass: "text-signal",
  fixed: "text-signal",
  proved: "text-signal",
  completed: "text-signal",
  failed: "text-destructive",
  skipped: "text-muted-foreground",
};

function RecordLine({ line }: { line: string }) {
  const m = line.match(/^(\s*)"([^"]+)": (.*?)(,?)$/);
  if (!m) {
    return <span className="block text-muted-foreground/70">{line}</span>;
  }
  const [, indent, key, value, comma] = m;
  const bareValue = value.match(/^"(.*)"$/)?.[1];
  const ink =
    bareValue !== undefined && recordStatusInk[bareValue]
      ? recordStatusInk[bareValue]
      : "text-foreground";
  return (
    <span className="block">
      {indent}
      <span className="text-muted-foreground">&quot;{key}&quot;</span>
      <span className="text-muted-foreground/70">: </span>
      <span className={ink}>{value}</span>
      <span className="text-muted-foreground/70">{comma}</span>
    </span>
  );
}

function Label({
  children,
  as: Tag = "div",
}: {
  children: ReactNode;
  as?: "div" | "h2";
}) {
  return (
    <Tag className="font-sans text-[17px] font-semibold tracking-tight text-foreground sm:text-[19px]">
      {children}
    </Tag>
  );
}

function SectionDocsLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[14px] font-medium text-foreground underline decoration-foreground/40 underline-offset-4 hover:decoration-foreground"
    >
      {children}
    </Link>
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
      viewBox="0 0 24 24"
      focusable="false"
    >
      <path
        d="M19.503 0H4.496A4.496 4.496 0 000 4.496v15.007A4.496 4.496 0 004.496 24h15.007A4.496 4.496 0 0024 19.503V4.496A4.496 4.496 0 0019.503 0z"
        fill="#fff"
      />
      <path
        d="M9.064 3.344a4.578 4.578 0 012.285-.312c1 .115 1.891.54 2.673 1.275.01.01.024.017.037.021a.09.09 0 00.043 0 4.55 4.55 0 013.046.275l.047.022.116.057a4.581 4.581 0 012.188 2.399c.209.51.313 1.041.315 1.595a4.24 4.24 0 01-.134 1.223.123.123 0 00.03.115c.594.607.988 1.33 1.183 2.17.289 1.425-.007 2.71-.887 3.854l-.136.166a4.548 4.548 0 01-2.201 1.388.123.123 0 00-.081.076c-.191.551-.383 1.023-.74 1.494-.9 1.187-2.222 1.846-3.711 1.838-1.187-.006-2.239-.44-3.157-1.302a.107.107 0 00-.105-.024c-.388.125-.78.143-1.204.138a4.441 4.441 0 01-1.945-.466 4.544 4.544 0 01-1.61-1.335c-.152-.202-.303-.392-.414-.617a5.81 5.81 0 01-.37-.961 4.582 4.582 0 01-.014-2.298.124.124 0 00.006-.056.085.085 0 00-.027-.048 4.467 4.467 0 01-1.034-1.651 3.896 3.896 0 01-.251-1.192 5.189 5.189 0 01.141-1.6c.337-1.112.982-1.985 1.933-2.618.212-.141.413-.251.601-.33.215-.089.43-.164.646-.227a.098.098 0 00.065-.066 4.51 4.51 0 01.829-1.615 4.535 4.535 0 011.837-1.388zm3.482 10.565a.637.637 0 000 1.272h3.636a.637.637 0 100-1.272h-3.636zM8.462 9.23a.637.637 0 00-1.106.631l1.272 2.224-1.266 2.136a.636.636 0 101.095.649l1.454-2.455a.636.636 0 00.005-.64L8.462 9.23z"
        fill="url(#codex-logo-gradient)"
      />
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="codex-logo-gradient"
          x1="12"
          x2="12"
          y1="3"
          y2="21"
        >
          <stop stopColor="#B1A7FF" />
          <stop offset=".5" stopColor="#7A9DFF" />
          <stop offset="1" stopColor="#3941FF" />
        </linearGradient>
      </defs>
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
      <path d="M18 30H6V18H18V30Z" fill="currentColor" opacity={0.35} />
      <path
        d="M18 12H6V30H18V12ZM24 36H0V6H24V36Z"
        fill="currentColor"
        opacity={0.9}
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
      className="size-[27px]"
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
      className="size-6"
      focusable="false"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function MastheadSection() {
  return (
    <section className="mt-4 flex flex-col gap-8 sm:mt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 text-foreground">
            <CircuitMark size={34} />
            <span className="text-[30px] font-semibold leading-none tracking-tight">
              circuit
            </span>
          </div>
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

      <h1 className="max-w-2xl text-pretty text-lg font-medium leading-tight tracking-tight sm:text-2xl">
        Coding agents aren&apos;t unreliable. Your process is.
      </h1>

      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
        Agents learned to work from us, and like us, they do their best work
        inside a real process. Circuit is that process.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href="#install"
          aria-label="Install for Claude Code and Codex"
          className="soft-cta-primary inline-flex min-h-11 items-center gap-2.5 px-5 py-2 text-[14px] font-semibold"
        >
          <span>Install</span>
          <InstallProviderIcons />
        </a>
        <Link
          href="/docs"
          className="soft-cta-secondary inline-flex min-h-11 items-center px-5 py-2 text-[14px] font-medium text-foreground"
        >
          View Docs
        </Link>
      </div>
    </section>
  );
}

function GapSection() {
  return (
    <section className="mt-28 flex flex-col gap-10">
      <GapChapter />

      {/* The heading lives with the prose it introduces, below the
          visualization, so the stage opens the section on its own. */}
      <div className="flex max-w-3xl flex-col gap-3">
        <Label as="h2">What your agent works without</Label>
        <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-muted-foreground">
          <p>
            Watch your agent work. It reads the codebase and the AGENTS.md,
            checks what CI will catch, and improvises a process on the spot.
            It survives on notes to itself like Guy Pearce in{" "}
            <em>Memento</em>: plan files, scratchpads, a compressed summary
            of what it had to forget. When the notes run out, you become the
            working memory.
          </p>
          <p>
            Human engineers don&apos;t work this way. An engineer is a
            specialist with a process for their role: the reviewer knows when
            to look, the release engineer keeps the paper trail, the tech
            lead remembers what was decided and why. Your agent is asked to
            be every role at once.
          </p>
          <p className="text-foreground">
            Your agent learned this work from those specialists. Every one
            of these gaps can be filled.
          </p>
        </div>
      </div>
    </section>
  );
}

function FlowFlexSection() {
  return (
    <section className="mt-28 flex flex-col gap-10">
      {/* Header and lead live in the standard content column, aligned with the
          rest of the page. */}
      <div className="flex max-w-3xl flex-col gap-3">
        <Label as="h2">A process that fits</Label>
        <p className="text-balance text-[15px] leading-relaxed text-muted-foreground">
          A hotfix is not a redesign. Point{" "}
          <span className="font-mono font-medium text-foreground">
            /circuit:run
          </span>{" "}
          at a task and Circuit picks the flow that fits, at the rigor you
          choose. Typed handoffs mean no skipped steps and no dropped context.
          And when a task deserves more than one attempt, Tournament mode runs
          competing solutions in parallel.
        </p>
      </div>

      {/* The flow explorer breaks out of the standard column so it can sit
          wider than the prose above it; the panel caps and centers itself. */}

      <FlowComposer />
    </section>
  );
}

function BlockInternalsSection() {
  return (
    <section className="mt-28 flex flex-col gap-10">
      <div className="flex flex-col gap-10">
        <div className="flex max-w-3xl flex-col gap-3">
          <Label as="h2">What every flow is made of</Label>
          <p className="text-balance text-[15px] leading-relaxed text-muted-foreground">
            Blocks are the power units inside every flow. Each one has a typed
            input, a typed output, and a clear job, so flows can combine them
            without losing track of what the agent knows.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
          {blockInternals.map((block) => (
            <article
              key={block.name}
              className="block-internal-card relative flex flex-col gap-2.5 bg-muted/70 p-5"
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
              <p className="text-pretty text-[13px] leading-relaxed text-muted-foreground">
                {block.detail}
              </p>
            </article>
          ))}
        </div>

        <SectionDocsLink href="/docs/concepts/how-it-works">
          See how blocks compose into stages and flows →
        </SectionDocsLink>
      </div>
    </section>
  );
}

function RecordSection() {
  return (
    <section className="mt-28 flex flex-col gap-8">
      <div className="flex max-w-3xl flex-col gap-3">
        <Label as="h2">Every run leaves a record</Label>
        <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-muted-foreground">
          <p>
            An engineer&apos;s work leaves a trail. Commits, review threads, CI
            logs. You can go back and check. An agent leaves you a diff and a
            note. And in a note, &apos;verified&apos; is just another claim.
          </p>
          <p>
            With Circuit, every run ends in a file: what was checked and what
            it showed, what was decided, what risks stay open.
          </p>
        </div>
      </div>

      <figure className="flex w-full max-w-3xl flex-col gap-3">
        <div className="install-terminal-card overflow-hidden">
          <pre className="whitespace-pre-wrap break-words px-5 py-4 font-mono text-[12px] leading-6 text-foreground">
            <code>
              {fixRunExcerpt.split("\n").map((line, index) => (
                <RecordLine key={index} line={line} />
              ))}
            </code>
          </pre>
        </div>
        <figcaption className="text-[12px] leading-relaxed text-muted-foreground">
          What a Fix run leaves behind, condensed. Each evidence link names a
          report the run wrote along the way.
        </figcaption>
      </figure>

      <SectionDocsLink href="/docs/concepts/evidence-and-runs">
        More on run records →
      </SectionDocsLink>
    </section>
  );
}

/* The three quieter sections each carry one compact artifact: the product
   surface the prose is describing, drawn in the page's own materials. They
   are illustrative examples, not verbatim records, like the run record
   above. */
function CheckpointArtifact() {
  return (
    <aside
      aria-label="Example checkpoint"
      className="soft-info-card flex flex-col gap-4 p-5"
    >
      <p className="font-mono text-[12px] text-signal">decision needed</p>
      <p className="text-[14px] leading-relaxed text-foreground">
        The fix touches the session refresh path. Patch it in place, or hold
        for the auth migration landing this week?
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="soft-chip px-3 py-1.5 text-[12px] text-foreground">
          1 · Patch in place
        </span>
        <span className="soft-chip px-3 py-1.5 text-[12px] text-foreground">
          2 · Hold for the migration
        </span>
      </div>
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        At deep rigor the run waits here. Otherwise it takes the safe default
        and records it.
      </p>
    </aside>
  );
}

function ContinuityArtifact() {
  return (
    <aside
      aria-label="Example session brief"
      className="soft-info-card flex flex-col gap-4 p-5"
    >
      <p className="font-mono text-[12px] text-muted-foreground">
        next session opens with
      </p>
      <dl className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-[12px] font-medium text-muted-foreground">
            Goal
          </dt>
          <dd className="text-[13px] leading-relaxed text-foreground">
            Ship the staged deploy behind a feature flag
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-[12px] font-medium text-muted-foreground">
            Next
          </dt>
          <dd className="text-[13px] leading-relaxed text-foreground">
            Wire the flag into the router, then rerun e2e
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-[12px] font-medium text-muted-foreground">
            State
          </dt>
          <dd className="font-mono text-[12px] leading-relaxed text-foreground">
            verify green · feat/staged-deploy · no PR yet
          </dd>
        </div>
      </dl>
    </aside>
  );
}

function MemoryArtifact() {
  return (
    <aside
      aria-label="Example recall hints"
      className="soft-info-card flex flex-col gap-4 p-5"
    >
      <p className="font-mono text-[12px] text-muted-foreground">
        recalled at run start
      </p>
      <ul className="flex flex-col gap-4">
        <li className="flex flex-col gap-1">
          <p className="text-[13px] leading-relaxed text-foreground">
            The e2e suite is flaky on a cold start. Rerun once before trusting
            a failure.
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            from a Fix run · 2 weeks ago
          </p>
        </li>
        <li className="flex flex-col gap-1">
          <p className="text-[13px] leading-relaxed text-foreground">
            Auth is mocked in tests. Never point them at the live endpoint.
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">
            from a Build run · last month
          </p>
        </li>
      </ul>
    </aside>
  );
}

function CheckpointsSection() {
  return (
    <section className="mt-28 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:items-center">
      <div className="flex max-w-3xl flex-col gap-5">
        <Label as="h2">When to loop you in</Label>
        <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-muted-foreground">
          <p>
            You&apos;d never make an engineer guess which calls to run past
            you. Nobody ever told your agent which ones.
          </p>
          <p>
            Circuit&apos;s flows name those moments up front: a risky
            direction, an ambiguous goal, a visual choice. At deep rigor,
            Circuit waits for your answer. Otherwise it takes the safe default
            and writes it down. The decision point lives in the flow, not the
            agent&apos;s discretion.
          </p>
        </div>
        <SectionDocsLink href="/docs/concepts/checkpoints">
          More on checkpoints →
        </SectionDocsLink>
      </div>
      <CheckpointArtifact />
    </section>
  );
}

function ContinuitySection() {
  return (
    <section className="mt-28 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:items-center">
      <div className="flex max-w-3xl flex-col gap-5">
        <Label as="h2">Tomorrow starts where today ended</Label>
        <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-muted-foreground">
          <p>
            A session ends as a transcript, not a status. Somewhere in it is
            what you decided and what comes next, and carrying that forward
            has been your job. Circuit writes it down instead.
          </p>
          <p>
            Stop mid-task and close the terminal. Your goal, next action, and
            run state are waiting in the next session as a distilled brief.
            Zero setup on Claude Code.
          </p>
        </div>
        <SectionDocsLink href="/docs/concepts/continuity">
          More on continuity →
        </SectionDocsLink>
      </div>
      <ContinuityArtifact />
    </section>
  );
}

function MemorySection() {
  return (
    <section className="mt-28 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:items-center">
      <div className="flex max-w-3xl flex-col gap-5">
        <Label as="h2">The next run remembers</Label>
        <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-muted-foreground">
          <p>
            Teams write things down so no one pays for the same lesson twice.
            Your agent has been working without that record. Circuit keeps it.
          </p>
          <p>
            Every run leaves a structured record you can search from the
            command line. Each new run starts by recalling a few hints from
            past runs, ranked against the goal at hand. Hints only. They never
            override a check.
          </p>
        </div>
        <SectionDocsLink href="/docs/concepts/memory-and-history">
          More on memory →
        </SectionDocsLink>
      </div>
      <MemoryArtifact />
    </section>
  );
}

function InstallSection() {
  return (
    <section id="install" className="mt-28 flex flex-col gap-7">
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
              ) : (
                <span className="soft-chip inline-flex min-h-8 shrink-0 items-center justify-center px-3 py-1.5 text-[12px] font-medium text-muted-foreground">
                  Soon
                </span>
              )}
            </div>

            {target.commands ? (
              <pre className="whitespace-pre-wrap break-words px-5 pb-4 font-mono text-[13px] leading-7 text-foreground">
                <code>
                  {target.commands.map((command) => `› ${command}`).join("\n")}
                </code>
              </pre>
            ) : (
              <div className="flex flex-1 items-center justify-center px-5 pb-4 text-center text-[13px] leading-7 text-muted-foreground">
                OpenCode support is coming.
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
    <footer className="mt-28 flex items-center justify-between gap-3 pt-8 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
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
      <GapSection />
      <FlowFlexSection />
      <BlockInternalsSection />
      <ExampleRunSection />
      <RecordSection />
      <CheckpointsSection />
      <ContinuitySection />
      <MemorySection />
      <InstallSection />
      <SiteFooter />
    </main>
  );
}
