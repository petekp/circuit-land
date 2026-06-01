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
    note: "A factual, verified result is provided. No gaslighting.",
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
    <Tag className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
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
        d="M54.375 118.75L56.125 111L58.125 101L59.75 93L61.25 83.125L62.125 79.875L62 79.625L61.375 79.75L53.875 90L42.5 105.375L33.5 114.875L31.375 115.75L27.625 113.875L28 110.375L30.125 107.375L42.5 91.5L50 81.625L54.875 76L54.75 75.25H54.5L21.5 96.75L15.625 97.5L13 95.125L13.375 91.25L14.625 90L24.5 83.125L49.125 69.375L49.5 68.125L49.125 67.5H47.875L43.75 67.25L29.75 66.875L17.625 66.375L5.75 65.75L2.75 65.125L0 61.375L0.25 59.5L2.75 57.875L6.375 58.125L14.25 58.75L26.125 59.5L34.75 60L47.5 61.375H49.5L49.75 60.5L49.125 60L48.625 59.5L36.25 51.25L23 42.5L16 37.375L12.25 34.75L10.375 32.375L9.625 27.125L13 23.375L17.625 23.75L18.75 24L23.375 27.625L33.25 35.25L46.25 44.875L48.125 46.375L49 45.875V45.5L48.125 44.125L41.125 31.375L33.625 18.375L30.25 13L29.375 9.75C29.0417 8.625 28.875 7.375 28.875 6L32.75 0.750006L34.875 0L40.125 0.750006L42.25 2.625L45.5 10L50.625 21.625L58.75 37.375L61.125 42.125L62.375 46.375L62.875 47.75H63.75V47L64.375 38L65.625 27.125L66.875 13.125L67.25 9.125L69.25 4.375L73.125 1.87501L76.125 3.25L78.625 6.875L78.25 9.125L76.875 18.75L73.875 33.875L72 44.125H73.125L74.375 42.75L79.5 36L88.125 25.25L91.875 21L96.375 16.25L99.25 14H104.625L108.5 19.875L106.75 26L101.25 33L96.625 38.875L90 47.75L86 54.875L86.375 55.375H87.25L102.125 52.125L110.25 50.75L119.75 49.125L124.125 51.125L124.625 53.125L122.875 57.375L112.625 59.875L100.625 62.25L82.75 66.5L82.5 66.625L82.75 67L90.75 67.75L94.25 68H102.75L118.5 69.125L122.625 71.875L125 75.125L124.625 77.75L118.25 80.875L109.75 78.875L89.75 74.125L83 72.5H82V73L87.75 78.625L98.125 88L111.25 100.125L111.875 103.125L110.25 105.625L108.5 105.375L97 96.625L92.5 92.75L82.5 84.375H81.875V85.25L84.125 88.625L96.375 107L97 112.625L96.125 114.375L92.875 115.5L89.5 114.875L82.25 104.875L74.875 93.5L68.875 83.375L68.25 83.875L64.625 121.625L63 123.5L59.25 125L56.125 122.625L54.375 118.75Z"
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
        d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.500197C16.1708 0.495044 14.0893 1.16803 12.3614 2.42214C10.6335 3.67624 9.34853 5.44666 8.6917 7.47815C7.30085 7.76286 5.98686 8.3414 4.8377 9.17505C3.68854 10.0087 2.73073 11.0782 2.02839 12.312C0.956464 14.1591 0.498905 16.2988 0.721698 18.4228C0.944492 20.5467 1.83612 22.5449 3.268 24.1293C2.81966 25.4759 2.66413 26.9026 2.81182 28.3141C2.95951 29.7256 3.40701 31.0892 4.12437 32.3138C5.18791 34.1659 6.8123 35.6322 8.76321 36.5013C10.7141 37.3704 12.8907 37.5973 14.9789 37.1492C15.9208 38.2107 17.0786 39.0587 18.3747 39.6366C19.6709 40.2144 21.0755 40.5087 22.4946 40.4998C24.6307 40.5054 26.7133 39.8321 28.4418 38.5772C30.1704 37.3223 31.4556 35.5506 32.1119 33.5179C33.5027 33.2332 34.8167 32.6547 35.9659 31.821C37.115 30.9874 38.0728 29.9178 38.7752 28.684C39.8458 26.8371 40.3023 24.6979 40.0789 22.5748C39.8556 20.4517 38.9639 18.4544 37.5324 16.8707ZM22.4978 37.8849C20.7443 37.8874 19.0459 37.2733 17.6994 36.1501C17.7601 36.117 17.8666 36.0586 17.936 36.0161L25.9004 31.4156C26.1003 31.3019 26.2663 31.137 26.3813 30.9378C26.4964 30.7386 26.5563 30.5124 26.5549 30.2825V19.0542L29.9213 20.998C29.9389 21.0068 29.9541 21.0198 29.9656 21.0359C29.977 21.052 29.9842 21.0707 29.9867 21.0902V30.3889C29.9842 32.375 29.1946 34.2791 27.7909 35.6841C26.3872 37.0892 24.4838 37.8806 22.4978 37.8849ZM6.39227 31.0064C5.51397 29.4888 5.19742 27.7107 5.49804 25.9832C5.55718 26.0187 5.66048 26.0818 5.73461 26.1244L13.699 30.7248C13.8975 30.8408 14.1233 30.902 14.3532 30.902C14.583 30.902 14.8088 30.8408 15.0073 30.7248L24.731 25.1103V28.9979C24.7321 29.0177 24.7283 29.0376 24.7199 29.0556C24.7115 29.0736 24.6988 29.0893 24.6829 29.1012L16.6317 33.7497C14.9096 34.7416 12.8643 35.0097 10.9447 34.4954C9.02506 33.9811 7.38785 32.7263 6.39227 31.0064ZM4.29707 13.6194C5.17156 12.0998 6.55279 10.9364 8.19885 10.3327C8.19885 10.4013 8.19491 10.5228 8.19491 10.6071V19.808C8.19351 20.0378 8.25334 20.2638 8.36823 20.4629C8.48312 20.6619 8.64893 20.8267 8.84863 20.9404L18.5723 26.5542L15.206 28.4979C15.1894 28.5089 15.1703 28.5155 15.1505 28.5173C15.1307 28.5191 15.1107 28.516 15.0924 28.5082L7.04046 23.8557C5.32135 22.8601 4.06716 21.2235 3.55289 19.3046C3.03862 17.3858 3.30624 15.3413 4.29707 13.6194ZM31.955 20.0556L22.2312 14.4411L25.5976 12.4981C25.6142 12.4872 25.6333 12.4805 25.6531 12.4787C25.6729 12.4769 25.6928 12.4801 25.7111 12.4879L33.7631 17.1364C34.9967 17.849 36.0017 18.8982 36.6606 20.1613C37.3194 21.4244 37.6047 22.849 37.4832 24.2684C37.3617 25.6878 36.8382 27.0432 35.9743 28.1759C35.1103 29.3086 33.9415 30.1717 32.6047 30.6641C32.6047 30.5947 32.6047 30.4733 32.6047 30.3889V21.188C32.6066 20.9586 32.5474 20.7328 32.4332 20.5338C32.319 20.3348 32.154 20.1698 31.955 20.0556ZM35.3055 15.0128C35.2464 14.9765 35.1431 14.9142 35.069 14.8717L27.1045 10.2712C26.906 10.1554 26.6803 10.0943 26.4504 10.0943C26.2206 10.0943 25.9948 10.1554 25.7963 10.2712L16.0726 15.8858V11.9982C16.0715 11.9783 16.0753 11.9585 16.0837 11.9405C16.0921 11.9225 16.1048 11.9068 16.1207 11.8949L24.1719 7.25025C25.4053 6.53903 26.8158 6.19376 28.2383 6.25482C29.6608 6.31589 31.0364 6.78077 32.2044 7.59508C33.3723 8.40939 34.2842 9.53945 34.8334 10.8531C35.3826 12.1667 35.5464 13.6095 35.3055 15.0128ZM14.2424 21.9419L10.8752 19.9981C10.8576 19.9893 10.8423 19.9763 10.8309 19.9602C10.8195 19.9441 10.8122 19.9254 10.8098 19.9058V10.6071C10.8107 9.18295 11.2173 7.78848 11.9819 6.58696C12.7466 5.38544 13.8377 4.42659 15.1275 3.82264C16.4173 3.21869 17.8524 2.99464 19.2649 3.1767C20.6775 3.35876 22.0089 3.93941 23.1034 4.85067C23.0427 4.88379 22.937 4.94215 22.8668 4.98473L14.9024 9.58517C14.7025 9.69878 14.5366 9.86356 14.4215 10.0626C14.3065 10.2616 14.2466 10.4877 14.2479 10.7175L14.2424 21.9419ZM16.071 17.9991L20.4018 15.4978L24.7325 17.9975V22.9985L20.4018 25.4983L16.071 22.9985V17.9991Z"
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
    <figure className="section-artwork process-artwork relative aspect-[1.45/1] min-h-[21rem] overflow-hidden bg-muted/40 lg:min-h-[25rem]">
      <Image
        src="/expert-process-illustration.png"
        alt="Expert operator arranging process blocks, route lines, evidence cards, and verification tools."
        fill
        sizes="(max-width: 1024px) 100vw, 48vw"
        className="object-cover"
      />
    </figure>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-16">
      {/* Section 1: Masthead */}
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
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <GithubLogo />
            </a>
            <a
              href="https://x.com/petekp"
              aria-label="Pete Petrash on X"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <XLogo />
            </a>
          </div>
        </div>

        <h1 className="max-w-2xl text-base font-medium leading-tight tracking-tight sm:text-xl">
          Powerful, repeatable work patterns for coding agents.
        </h1>

        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Circuit gives agents a finely-tuned process to follow, so instead of
          micro-managing, you&apos;re handing the work off to a trusted
          colleague.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#install"
            aria-label="Install for Claude Code and Codex"
            className="soft-cta-primary inline-flex min-h-11 items-center gap-2.5 px-5 py-2 text-[13px] font-medium transition-opacity hover:opacity-90"
          >
            <InstallProviderIcons />
            <span>Install</span>
          </a>
          <a
            href="#see-one-run"
            className="soft-cta-secondary inline-flex min-h-11 items-center px-5 py-2 text-[13px] font-medium text-foreground transition-colors"
          >
            See example
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

      {/* Section 3: What Circuit is */}
      <section
        className="mt-28 grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:items-center"
        data-site-hue-stop="0.25"
      >
        <div className="flex max-w-3xl flex-col gap-10">
          <Label as="h2">Why process</Label>

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
                You describe the task, and Circuit supplies the process that
                fits it: the right moves, in the right order, with the checks
                that prove the work. You hand off more and keep your confidence,
                because the result comes with evidence, not just a claim that
                it&apos;s done.
              </p>
            </div>
          </div>
        </div>

        <ProcessArtwork />
      </section>

      {/* Section 4: Flows and blocks */}
      <section
        className="relative left-1/2 mt-28 flex w-screen -translate-x-1/2 flex-col gap-10 px-6"
        data-site-hue-stop="0.375"
      >
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10">
          <div className="flex max-w-3xl flex-col gap-3">
            <Label as="h2">Routed, not chosen</Label>
            <p className="text-balance text-[13px] leading-relaxed text-muted-foreground">
              <span className="font-mono font-medium text-foreground">
                /circuit:run
              </span>{" "}
              interprets your intent and routes it to the appropriate flow,
              automatically. Each flow is a specialized set of typed blocks. Each
              block does one job. The flow makes these jobs compound, passing
              structured handoff forward until the agent can deliver a clear
              outcome with evidence.
            </p>
          </div>

          <FlowComposer />
        </div>
      </section>

      {/* Section 5: Block internals */}
      <section
        className="block-internals-section relative left-1/2 mt-28 flex w-[calc(100vw-2rem)] -translate-x-1/2 flex-col gap-10 overflow-hidden bg-muted/20 px-6 py-14 sm:w-[calc(100vw-3rem)] sm:px-8 lg:w-[calc(100vw-4rem)]"
        data-site-hue-stop="0.5"
      >
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-10">
          <div className="flex max-w-3xl flex-col gap-3">
            <Label as="h2">Inside a block</Label>
            <p className="text-balance text-[13px] leading-relaxed text-muted-foreground">
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
          </div>
        </div>
      </section>

      {/* Section 6: What you can trust */}
      <section
        className="mt-28 flex flex-col gap-10"
        data-site-hue-stop="0.625"
      >
        <Label as="h2">Why you can trust it</Label>

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
              direction, an ambiguous goal, a visual choice. Otherwise it keeps
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
            <div className="flex items-center justify-between gap-2">
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

      {/* Section 7: How Circuit compares */}
      <section
        className="mt-28 flex flex-col gap-10"
        data-site-hue-stop="0.75"
      >
        <div className="flex max-w-3xl flex-col gap-3">
          <Label as="h2">Where it fits</Label>
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
              <div className="flex flex-col gap-2">
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

      {/* Section 8: Install and use */}
      <section
        id="install"
        className="mt-28 flex flex-col gap-7"
        data-site-hue-stop="0.875"
      >
        <div className="flex max-w-3xl flex-col gap-3">
          <Label as="h2">Get started</Label>
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

      {/* Section 9: Footer */}
      <footer
        className="mt-28 flex items-center justify-between gap-3 pt-8 text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
        data-site-hue-stop="1"
      >
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/petekp/circuit"
            aria-label="Circuit on GitHub"
            className="transition-colors hover:text-foreground"
          >
            <GithubLogo />
          </a>
          <a
            href="https://x.com/petekp"
            aria-label="Pete Petrash on X"
            className="transition-colors hover:text-foreground"
          >
            <XLogo />
          </a>
        </div>
        <a
          href="https://github.com/petekp/circuit/blob/main/LICENSE"
          className="transition-colors hover:text-foreground"
        >
          Open Source
        </a>
      </footer>
    </main>
  );
}
