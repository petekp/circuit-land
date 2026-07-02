/* The mechanisms that are Circuit's and not a chat window's. Three primary
   cards carry the load: the honesty gate, the compiled process, and the
   bounded loop. A quieter row underneath names the rest of the surface for
   readers who want it, without competing for the eye. Each primary card ends
   in a small evidence line in the mono face, the same register the product
   uses for real run output. */

const PRIMARY = [
  {
    title: "It can't fake done",
    body:
      "The check that lets a step advance is run by the engine, not the model. A run can't reach complete by giving up or by running out of tries.",
    tell: "outcome: blocked until verified",
  },
  {
    title: "A process, not a chat",
    body:
      "A flow is a set of typed steps compiled from a schematic, so the same work runs the same way every time. Each step gets a clean context with only what it needs, so a long session can't rot the steps that come after.",
    tell: "frame · plan · act · verify · review",
  },
  {
    title: "It loops until it's proven",
    body:
      "Some work isn't one pass. Circuit can repeat a set of steps until the goal is met and confirmed, inside hard caps on tries and spend.",
    tell: "repeat until met · capped",
  },
];

const SECONDARY = [
  {
    title: "Tools it can't reach",
    body:
      "Scope a step to the tools it should touch. For the step that edits code, on Claude Code the rest are gone, not just discouraged.",
  },
  {
    title: "Compose a flow from a description",
    body:
      "Describe a process and Circuit assembles a flow from existing blocks, checked runnable before it runs.",
  },
  {
    title: "Every feature is a command",
    body:
      "Run, resume, inspect, generate, and search past runs are one CLI, so the whole engine scripts and automates.",
  },
  {
    title: "Every run leaves a record",
    body:
      "A run ends in a folder you can read, query, or resume: the trace, the typed reports, the evidence.",
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
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {SECONDARY.map((item) => (
            <div key={item.title} className="flex flex-col gap-1.5">
              <h3 className="text-[14px] font-medium tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
