"use client";

import { useState, type CSSProperties } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { FlowGlyph, type MotifCell } from "@/components/flow-glyph";

type BlockId =
  | "frame"
  | "gather-context"
  | "diagnose"
  | "human-decision"
  | "plan"
  | "coordinate"
  | "act"
  | "run-verification"
  | "review"
  | "close-with-evidence";

const BLOCK_LABEL: Record<BlockId, string> = {
  frame: "Frame",
  "gather-context": "Gather Context",
  diagnose: "Diagnose",
  "human-decision": "Human Decision",
  plan: "Plan",
  coordinate: "Coordinate",
  act: "Act",
  "run-verification": "Run Verification",
  review: "Review",
  "close-with-evidence": "Close With Evidence",
};

type FlowKey = "build" | "fix" | "pursue" | "explore" | "review" | "prototype" | "custom";

type ComposerFlow = {
  key: FlowKey;
  name: string;
  color: string;
  accent: string;
  motif: readonly MotifCell[];
  blocks: BlockId[];
  // One-line statement of what the flow is for, shown when it is selected.
  summary?: string;
  // Forward-looking entry. Has no fixed composition; shown as a planned state.
  planned?: boolean;
};

// Keep these named by flow so identical-looking icons can still be edited
// independently without patching the wrong repeated array.
const FLOW_MOTIFS = {
  build: ["empty", "empty", "filled", "empty", "filled", "filled", "filled", "filled", "filled"],
  fix: ["empty", "filled", "empty", "filled", "filled", "filled", "empty", "filled", "empty"],
  pursue: ["empty", "empty", "filled", "empty", "filled", "empty", "filled", "empty", "empty"],
  explore: ["filled", "empty", "filled", "empty", "filled", "empty", "filled", "empty", "filled"],
  review: ["empty", "filled", "empty", "filled", "empty", "filled", "empty", "filled", "empty"],
  prototype: ["filled", "filled", "filled", "filled", "empty", "filled", "filled", "filled", "filled"],
  custom: ["empty", "empty", "empty", "filled", "filled", "filled", "empty", "empty", "empty"],
} satisfies Record<FlowKey, readonly MotifCell[]>;

// Sequences are the real flow compositions from circuit/src/flows/*/data.ts.
// Do not add blocks a flow does not actually use. "Custom" is intentionally
// empty — it represents planned flow/block authoring, not a shipped flow.
const FLOWS: ComposerFlow[] = [
  {
    key: "build",
    name: "Build",
    color: "var(--flow-build)",
    accent: "var(--flow-build-accent)",
    motif: FLOW_MOTIFS.build,
    summary: "Turn a clear brief into a reviewed change, backed by evidence.",
    blocks: ["frame", "plan", "act", "run-verification", "review", "close-with-evidence"],
  },
  {
    key: "fix",
    name: "Fix",
    color: "var(--flow-fix)",
    accent: "var(--flow-fix-accent)",
    motif: FLOW_MOTIFS.fix,
    summary: "Find the cause, make the fix, keep the evidence attached.",
    blocks: [
      "frame",
      "gather-context",
      "diagnose",
      "human-decision",
      "act",
      "run-verification",
      "review",
      "close-with-evidence",
    ],
  },
  {
    key: "pursue",
    name: "Pursue",
    color: "var(--flow-pursue)",
    accent: "var(--flow-pursue-accent)",
    motif: FLOW_MOTIFS.pursue,
    summary:
      "Coordinate several related changes without pretending they run at once.",
    blocks: [
      "frame",
      "coordinate",
      "plan",
      "act",
      "run-verification",
      "review",
      "close-with-evidence",
    ],
  },
  {
    key: "explore",
    name: "Explore",
    color: "var(--flow-explore)",
    accent: "var(--flow-explore-accent)",
    motif: FLOW_MOTIFS.explore,
    summary:
      "Compare paths before the agent commits to one. With tournament enabled, option cases fan out, then rejoin for review.",
    blocks: ["frame", "diagnose", "plan", "review", "human-decision", "close-with-evidence"],
  },
  {
    key: "review",
    name: "Review",
    color: "var(--flow-review)",
    accent: "var(--flow-review-accent)",
    motif: FLOW_MOTIFS.review,
    summary: "Judge a scoped change against evidence, not guesswork.",
    blocks: ["frame", "review", "close-with-evidence"],
  },
  {
    key: "prototype",
    name: "Prototype",
    color: "var(--flow-prototype)",
    accent: "var(--flow-prototype-accent)",
    motif: FLOW_MOTIFS.prototype,
    summary: "Build a disposable, local version to learn from before committing.",
    blocks: [
      "frame",
      "plan",
      "act",
      "run-verification",
      "review",
      "human-decision",
      "close-with-evidence",
    ],
  },
  {
    key: "custom",
    name: "Custom",
    color: "color-mix(in oklab, var(--muted-foreground) 35%, transparent)",
    accent: "color-mix(in oklab, var(--foreground) 13%, transparent)",
    motif: FLOW_MOTIFS.custom,
    blocks: [],
    planned: true,
  },
];

function Connector() {
  return (
    <div
      aria-hidden
      className="flex w-full shrink-0 select-none items-center justify-center self-center px-1 sm:w-auto"
    >
      <svg
        width="34"
        height="8"
        viewBox="0 0 34 8"
        fill="none"
        className="shrink-0 rotate-90 sm:rotate-0"
        style={{ color: "color-mix(in oklab, var(--flow-color) 60%, var(--border))" }}
      >
        <path
          d="M0 4 H29 M25 1 L30 4 L25 7"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function BlockTile({
  block,
  transition,
}: {
  block: BlockId;
  transition: Parameters<typeof motion.div>[0]["transition"];
}) {
  return (
    <motion.div
      layoutId={block}
      layout
      transition={transition}
      role="listitem"
      className="flow-block-tile flex w-full flex-col justify-center gap-2 px-4 py-4 text-foreground sm:w-auto sm:min-w-[108px]"
      style={{
        backgroundColor: "color-mix(in oklab, var(--flow-color) 18%, var(--muted))",
      }}
    >
      <span className="text-[15px] font-medium leading-tight tracking-tight">
        {BLOCK_LABEL[block]}
      </span>
    </motion.div>
  );
}

function LinearFlowDiagram({
  flow,
  transition,
}: {
  flow: ComposerFlow;
  transition: Parameters<typeof motion.div>[0]["transition"];
}) {
  return (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-x-1 sm:gap-y-5"
      role="list"
      aria-label={`${flow.name} flow, in order: ${flow.blocks
        .map((b) => BLOCK_LABEL[b])
        .join(", then ")}`}
    >
      {flow.blocks.map((b, i) => (
        <div
          key={b}
          className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-1"
        >
          {i > 0 ? <Connector /> : null}
          <BlockTile block={b} transition={transition} />
        </div>
      ))}
    </div>
  );
}

function ExploreTournamentDiagram({
  transition,
}: {
  transition: Parameters<typeof motion.div>[0]["transition"];
}) {
  return (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-1 sm:gap-y-5"
      role="list"
      aria-label="Explore flow with tournament enabled, in order: Frame, Diagnose, Plan, fan out option cases, Review, Human Decision, Close With Evidence"
    >
      {(["frame", "diagnose", "plan"] as const).map((block, i) => (
        <div
          key={block}
          className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-1"
        >
          {i > 0 ? <Connector /> : null}
          <BlockTile block={block} transition={transition} />
        </div>
      ))}

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-1">
        <Connector />
        <div
          role="listitem"
          className="flow-fanout-cluster flex flex-col gap-2 px-3 py-3 text-foreground"
        >
          <div className="text-[10px] uppercase leading-none tracking-[0.16em] text-muted-foreground">
            Tournament fanout
          </div>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {["Option case 1", "Option case 2", "Option case 3"].map((label) => (
              <div
                key={label}
                className="flow-fanout-branch px-3 py-2 text-[12px] font-medium leading-tight"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {(["review", "human-decision", "close-with-evidence"] as const).map(
        (block) => (
          <div
            key={block}
            className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-1"
          >
            <Connector />
            <BlockTile block={block} transition={transition} />
          </div>
        ),
      )}
    </div>
  );
}

export function FlowComposer() {
  const [active, setActive] = useState<FlowKey>("build");
  const reduceMotion = useReducedMotion();

  const flow = FLOWS.find((f) => f.key === active) ?? FLOWS[0];
  const planned = flow.planned === true;

  const transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 36, mass: 0.9 };

  return (
    <div
      className="flex w-full flex-col"
      style={{ "--flow-color": flow.color } as CSSProperties}
    >
      <LayoutGroup>
        {/* The selected flow: larger blocks wired by the artifacts they hand forward */}
        <div
          className="flow-composer-panel flex flex-col gap-8 p-5 transition-colors sm:p-8 lg:p-10"
          style={{
            backgroundColor: planned
              ? "color-mix(in oklab, var(--muted) 58%, transparent)"
              : "color-mix(in oklab, var(--flow-color) 8%, var(--panel))",
          }}
        >
          {/* Flow toggle */}
          <div role="group" aria-label="Choose a flow" className="flow-picker-grid">
            {FLOWS.map((f) => {
              const selected = f.key === active;
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActive(f.key)}
                  className="flow-picker-button inline-flex min-h-12 items-center gap-2.5 px-5 py-3 text-[16px] font-medium transition-colors hover:text-foreground"
                  style={{
                    color: selected
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                    backgroundColor: selected
                      ? `color-mix(in oklab, ${f.color} 22%, var(--muted))`
                      : undefined,
                  }}
                >
                  <FlowGlyph
                    name={f.name}
                    color={f.color}
                    accent={f.accent}
                    motif={f.motif}
                    cellSize={24}
                    className="size-6 shrink-0"
                  />
                  {f.name}
                  {f.planned ? (
                    <span className="soft-chip px-1.5 py-1 text-[10px] uppercase leading-none tracking-[0.15em] text-muted-foreground">
                      soon
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {planned ? (
            <div className="flex max-w-xl flex-col gap-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Custom · not yet shipped
              </div>
              <p className="text-[15px] leading-relaxed text-foreground">
                Compose a flow from any block in the catalog — or author new
                blocks with their own typed contracts.
              </p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Flow and block authoring is in the works. Today{" "}
                <span className="font-mono text-foreground/80">/circuit:run</span>{" "}
                routes to the six built-in flows above.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-2 text-[18px] font-medium leading-tight tracking-tight text-foreground">
                {flow.name}
              </div>
              {flow.summary ? (
                <p className="mb-6 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                  {flow.key === "explore" ? (
                    <>
                      Compare paths before the agent commits to one. With{" "}
                      <span className="font-medium text-foreground">
                        tournament
                      </span>{" "}
                      enabled, option cases fan out, then rejoin for review.
                    </>
                  ) : (
                    flow.summary
                  )}
                </p>
              ) : null}
              {flow.key === "explore" ? (
                <ExploreTournamentDiagram transition={transition} />
              ) : (
                <LinearFlowDiagram flow={flow} transition={transition} />
              )}
              <p className="mt-6 max-w-2xl text-[12px] leading-relaxed text-muted-foreground">
                Each block does one powerful job: frame the task, gather
                context, decide the next move, make the change, or verify the
                result. The flow makes those jobs compound, passing a
                structured handoff forward until the agent can close with a
                clear outcome, evidence, and remaining risk.
              </p>
            </>
          )}
        </div>
      </LayoutGroup>
    </div>
  );
}
