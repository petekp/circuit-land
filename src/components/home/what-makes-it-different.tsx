import { DocsLink } from "./docs-link";

/* The mechanisms that are Circuit's and not a chat window's. Three primary
   cards carry the load in the framing-ladder order: the encoded process
   leads, the multi-model dial is the co-pillar, and the evidence gate is
   the floor. A quieter row underneath names the rest of the surface for
   readers who want it, without competing for the eye. Each primary card ends
   in a small evidence line in the mono face, the same register the product
   uses for real run output, then a link to the layer below: the dial card
   hands off to the demo section on this page, the other two to the docs.
   Secondary items link only where a docs page actually elaborates them;
   an item with no page gets no link rather than a loosely related one. */

type MechanismLink = { href: string; label: string };

const PRIMARY: Array<{
  title: string;
  body: string;
  tell: string;
  link: MechanismLink;
}> = [
  {
    title: "A process, not a chat",
    body:
      "A flow is a set of typed steps compiled from a schematic, so the same work runs the same way every time. Each step is a micro-harness: its own model, tool scope, and a clean context with only what it needs, so a long session can't rot the steps that come after.",
    tell: "frame · plan · act · verify · review",
    link: { href: "/docs/concepts/how-it-works", label: "How a run works" },
  },
  {
    title: "One dial, models by role",
    body:
      "Circuit picks model, effort, and tool per step from the step's role and one power dial. Turn the dial down and the step that edits code gets cheaper while research stays on the high tier. After a run, the receipt shows spend per role.",
    tell: "--power low · researcher stays high",
    link: { href: "#dial", label: "Try the dial below" },
  },
  {
    title: "It can't skip the proof",
    body:
      "The check that lets a step advance is run by the engine, not the model. A run can't reach complete by giving up or by running out of tries.",
    tell: "outcome: blocked until verified",
    link: {
      href: "/docs/concepts/evidence-and-runs",
      label: "Evidence and runs",
    },
  },
];

const SECONDARY: Array<{
  title: string;
  body: string;
  link?: MechanismLink;
}> = [
  {
    title: "It loops until it's proven",
    body:
      "Some work isn't one pass. Circuit can repeat a set of steps until the goal is met and confirmed, inside hard caps on tries and spend.",
    link: { href: "/docs/concepts/until-loop", label: "How the loop works" },
  },
  {
    title: "Tools it can't reach",
    body:
      "Scope a step to the tools it should touch. For the step that edits code, on Claude Code the rest are gone, not just discouraged.",
  },
  {
    title: "Compose a flow from a description",
    body:
      "Describe a process and Circuit assembles a flow from existing blocks, checked runnable before it runs. Today it's an experimental CLI on your machine, not a host command.",
    link: {
      href: "/docs/concepts/how-flows-compose",
      label: "How flows compose",
    },
  },
  {
    title: "Every feature is a command",
    body:
      "Run, resume, inspect, generate, and search past runs are one CLI, so the whole engine scripts and automates.",
    link: { href: "/docs/cli/overview", label: "The CLI, end to end" },
  },
  {
    title: "Every run leaves a record",
    body:
      "A run ends in a folder you can read, query, or resume: the trace, the typed reports, the evidence.",
    link: {
      href: "/docs/concepts/memory-and-history",
      label: "What the next run recalls",
    },
  },
];

export function WhatMakesItDifferent() {
  return (
    <section className="mt-32 flex flex-col gap-10">
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground sm:text-[26px]">
          What makes it different
        </h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Not a smarter agent. A process the agent runs inside, with rules it
          can&apos;t talk its way around.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PRIMARY.map((card) => (
          <article
            key={card.title}
            className="soft-info-card flex flex-col gap-4 p-6"
          >
            <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
              {card.title}
            </h3>
            <p className="flex-1 text-[14px] leading-relaxed text-muted-foreground">
              {card.body}
            </p>
            <p className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2 font-mono text-[11px] text-muted-foreground">
              <span className="text-signal">›</span>
              {card.tell}
            </p>
            <DocsLink href={card.link.href}>{card.link.label}</DocsLink>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            And the rest of the surface
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {SECONDARY.map((item) => (
            <div key={item.title} className="flex flex-col gap-1.5">
              <h3 className="text-[14px] font-medium tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {item.body}
              </p>
              {item.link ? (
                <DocsLink href={item.link.href}>{item.link.label}</DocsLink>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
