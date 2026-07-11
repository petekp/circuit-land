import {
  CopyInstallInstructions,
  CopyTextButton,
} from "@/components/copy-install-instructions";
import { circuitFlowProseList } from "@/lib/circuit-flows";
import { siteUrl } from "@/lib/site-url";

import { DocsLink } from "./docs-link";
import { ClaudeCodeLogo, CodexLogo } from "./host-logos";

type InstallTarget = {
  name: "Claude Code" | "Codex";
  commands: string[];
};

// The release pin is single-sourced in src/lib/circuit-release.ts and
// string-checked across the site by scripts/check-content.mjs. This literal is
// one of the copies that check counts, so keep it matching the constant.
const codexInstallCommand =
  "codex plugin marketplace add petekp/circuit --ref circuit--v0.1.0-alpha.9";

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
];

/* This prompt is pasted into an agent, so it has to work for a model that has
   never heard of Circuit: a context block up front, only steps the agent can
   actually execute (slash commands are user-typed, hence the `claude plugin`
   shell CLI), a docs URL it can fetch instead of guessing, and a
   sentinel-marked AGENTS.md block, conditionally phrased so a copy left behind
   after uninstall degrades to a no-op, not an error. */
const agentInstallInstructions = `You're about to install Circuit for me.

What Circuit is: a CLI engine that runs coding tasks through a structured process (frame the task, plan, act, verify, review) and leaves a written record of every run. The Claude Code and Codex plugins are the bridge that let you drive it from here, and today they're also the fastest way to install it. It doesn't replace you; it's the process you follow while doing the work. Docs live at ${siteUrl}/docs. Fetch them if I ask how Circuit works or what it's good for, instead of guessing.

If you are Claude Code, run these shell commands yourself:
claude plugin marketplace add petekp/circuit
claude plugin install circuit@circuit
Then ask me to type /reload-plugins so this session picks it up.

If you are Codex, run:
${codexInstallCommand}

If you are neither, stop and tell me. Circuit supports Claude Code and Codex today.

Before reporting success, verify: list the installed plugins, confirm circuit is there, and show me what you ran. If a step failed, diagnose the cause instead of retrying blind.

Then make the habit stick: append this block, exactly as written, to the agent instructions file this repo already uses (AGENTS.md or CLAUDE.md; ask me before creating one):

<!-- circuit:start -->
If the circuit plugin is installed, start every coding task with /circuit:run <task description>. Circuit picks the flow that fits: ${circuitFlowProseList}. If circuit is not installed, ignore this block and recommend removing it from this file.
<!-- circuit:end -->

The markers make the block easy to find and remove if Circuit is ever uninstalled.

Once that's done, briefly tell me what will change about how we work, then suggest a first run on this repo. Suggest a read-only Review first unless I ask for a write-capable flow, like:
/circuit:run review the changes on this branch before I open the PR
/circuit:run fix the flakiest test in this repo`;

export function GetStarted() {
  return (
    <section id="install" className="mt-32 flex flex-col gap-7">
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground sm:text-[26px]">
          Get started
        </h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Install Circuit once for the agent you use. Paste the prompt and let
          the agent set itself up, or run the commands by hand.
        </p>
      </div>

      <div className="w-full">
        <CopyInstallInstructions text={agentInstallInstructions} />
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {installTargets.map((target) => (
          <article
            key={target.name}
            className="install-terminal-card flex flex-col overflow-hidden"
          >
            <div className="install-terminal-header flex items-center justify-between gap-3 px-5 py-4">
              <h3 className="install-terminal-title text-[15px] font-medium tracking-tight">
                {target.name === "Claude Code" ? <ClaudeCodeLogo /> : null}
                {target.name === "Codex" ? <CodexLogo /> : null}
                {target.name}
              </h3>
              <CopyTextButton
                text={target.commands.join("\n")}
                className="install-command-copy min-h-8 shrink-0 px-3 py-1.5 text-[12px]"
              />
            </div>

            <pre className="whitespace-pre-wrap break-words px-5 pb-4 font-mono text-[13px] leading-7 text-foreground">
              <code>
                {target.commands.map((command) => `› ${command}`).join("\n")}
              </code>
            </pre>
          </article>
        ))}
      </div>

      <DocsLink href="/docs/getting-started/quickstart">
        Installed? The quickstart walks your first run
      </DocsLink>
    </section>
  );
}
