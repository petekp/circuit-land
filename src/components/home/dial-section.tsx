"use client";

import { useState } from "react";

import { DocsLink } from "./docs-link";

/* The dial system, demonstrated instead of described. The left column carries
   the idea in prose: steps declare roles, one dial prices the roles, and the
   allocation is deliberately lopsided. The right column is the product's own
   readout: the model matrix that `circuit preview build --matrix` prints,
   with a working dial that highlights the column the engine would resolve.
   Every model name and the non-relay footer are the real allocation for the
   built-in Build flow, so if the allocation ever changes, this table is what
   gets fixed. The dial defaults to low because low is where the asymmetry
   shows: the implementer drops two tiers and the researcher row does not move. */

type DialPosition = "low" | "medium" | "high" | "auto";

const DIAL_POSITIONS: DialPosition[] = ["low", "medium", "high", "auto"];

const TIERS = ["low", "medium", "high"] as const;

type Tier = (typeof TIERS)[number];

/* The Build flow's relay steps as `circuit preview build --matrix` reports
   them, one column per dial position. The researcher row being flat is the
   point of the whole section. */
const RELAYS: Array<{ step: string; role: string } & Record<Tier, string>> = [
  {
    step: "analyze-step",
    role: "researcher",
    low: "opus",
    medium: "opus",
    high: "opus",
  },
  {
    step: "act-step",
    role: "implementer",
    low: "haiku",
    medium: "sonnet",
    high: "opus",
  },
  {
    step: "review-step",
    role: "reviewer",
    low: "sonnet",
    medium: "sonnet",
    high: "opus",
  },
];

/* One readout-flavored line per dial position. The auto line's first clause is
   verbatim from the CLI: `dial: auto (resolves to medium)`. */
const CAPTIONS: Record<DialPosition, string> = {
  low: "dial: low · the implementer drops two tiers. the researcher does not move.",
  medium: "dial: medium · the flow as authored. opus reads, sonnet edits.",
  high: "dial: high · every relay on the top tier, for changes you'd rather not redo.",
  auto: "dial: auto (resolves to medium) · the run's opening read picks the tier, inside bounds you set.",
};

export function DialSection() {
  const [dial, setDial] = useState<DialPosition>("low");
  const activeTier: Tier = dial === "auto" ? "medium" : dial;

  return (
    <section id="dial" className="mt-32 flex scroll-mt-24 flex-col gap-10">
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground sm:text-[26px]">
          Roles and the power dial
        </h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Model choice moves out of your head and into the process. Steps
          declare archetypes, one dial prices those archetypes, and the split
          is visible before a single token is spent.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <div className="flex max-w-xl flex-col gap-5 text-[14px] leading-relaxed text-muted-foreground">
          <p>
            Every step in a flow declares an archetype. The researcher reads
            the code and sets direction. The implementer makes the edits. The
            reviewer judges the result. Circuit resolves each step&apos;s
            model and effort from its archetype and the dial at the moment
            the step runs.
          </p>
          <p>
            The allocation is deliberately lopsided. Turn the dial down and the
            implementer drops to a cheap, fast model while the researcher holds
            the top tier at every setting. The reading that steers the run is
            the wrong place to save.
          </p>
          <p>
            On auto, the run sizes itself: the researcher recommends a tier and
            the engine clamps it to bounds you set. A failed step retries one
            tier up. An explicit model or effort you set yourself always wins
            over the dial.
          </p>
          <p>
            After the run, the receipt reports the dial position and what each
            archetype spent.
          </p>
          <div className="mt-1 flex flex-col gap-2">
            <DocsLink href="/docs/flows/modes#power">
              Power and process, in detail
            </DocsLink>
            <DocsLink href="/docs/configuration/selection">
              How selection resolves, layer by layer
            </DocsLink>
            <DocsLink href="/docs/cli/preview">
              Preview any flow&apos;s allocation before spending
            </DocsLink>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="install-terminal-card flex flex-col overflow-hidden">
            <div className="install-terminal-header flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-4">
              <span className="font-mono text-[12px] text-muted-foreground">
                <span className="text-signal">$</span> circuit preview build
                --matrix
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
                  power
                </span>
                <div
                  role="group"
                  aria-label="Power dial"
                  className="flow-feature-tabs--segmented"
                >
                  {DIAL_POSITIONS.map((position) => {
                    const selected = position === dial;
                    return (
                      <button
                        key={position}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setDial(position)}
                        className="flow-feature-tab inline-flex min-h-8 items-center px-3 py-1 text-[12px] font-medium capitalize transition-colors"
                        style={{
                          color: selected
                            ? "var(--foreground)"
                            : "var(--muted-foreground)",
                          background: selected
                            ? "color-mix(in oklab, var(--signal) 22%, var(--muted))"
                            : "color-mix(in oklab, var(--muted) 38%, transparent)",
                          boxShadow: selected
                            ? "inset 0 0 0 1px color-mix(in oklab, var(--signal) 45%, transparent)"
                            : "none",
                        }}
                      >
                        {position}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto px-5">
              <table className="w-full border-separate border-spacing-0 text-left font-mono text-[12px] leading-6">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.14em]">
                    <th className="py-2 pr-4 font-medium text-muted-foreground/60">
                      step
                    </th>
                    <th className="py-2 pr-4 font-medium text-muted-foreground/60">
                      role
                    </th>
                    {TIERS.map((tier) => (
                      <th
                        key={tier}
                        className={[
                          "px-3 py-2 font-medium transition-colors",
                          tier === activeTier
                            ? "text-signal"
                            : "text-muted-foreground/60",
                        ].join(" ")}
                      >
                        {tier}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RELAYS.map((relay, rowIndex) => (
                    <tr key={relay.step}>
                      <td className="py-1.5 pr-4 text-muted-foreground/70">
                        {relay.step}
                      </td>
                      <td className="py-1.5 pr-4 text-foreground">
                        {relay.role}
                      </td>
                      {TIERS.map((tier) => {
                        const active = tier === activeTier;
                        return (
                          <td
                            key={tier}
                            className={[
                              "px-3 py-1.5 transition-colors",
                              active
                                ? "bg-signal/10 text-foreground"
                                : "text-muted-foreground",
                              active && rowIndex === 0 ? "rounded-t-lg" : "",
                              active && rowIndex === RELAYS.length - 1
                                ? "rounded-b-lg"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {relay[tier]}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p
              aria-live="polite"
              className="min-h-10 px-5 pt-3 font-mono text-[11px] leading-relaxed text-muted-foreground"
            >
              <span className="text-signal">›</span> {CAPTIONS[dial]}
            </p>

            <p className="px-5 pb-4 pt-2 font-mono text-[10px] leading-relaxed text-muted-foreground/60">
              non-relay steps: frame-step (checkpoint), plan-step (compose),
              build-baseline (verification), verify-step (verification),
              build-touch-area (verification), close-step (compose)
            </p>
          </div>

          <p className="text-[12px] leading-relaxed text-muted-foreground">
            The matrix is the Build flow&apos;s real allocation, straight from
            circuit preview. On Codex the dial moves each step&apos;s reasoning
            effort too. The non-relay steps carry no model at all: the engine
            runs those checks itself.
          </p>
        </div>
      </div>
    </section>
  );
}
