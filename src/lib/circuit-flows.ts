// The single declared roster of shipped Circuit flows. Every other
// enumeration must either derive from this constant (TSX interpolates it)
// or mention every name in it (docs prose) — scripts/check-content.mjs
// [flows] enforces the prose half; the CircuitFlowKey derivation in
// flow-composer.tsx enforces the diagram half at compile time. Add or
// remove a flow here first; the compiler and the content gate then list
// every site that disagrees.
export const CIRCUIT_FLOWS = [
  { key: "build", name: "Build" },
  { key: "fix", name: "Fix" },
  { key: "review", name: "Review" },
  { key: "explore", name: "Explore" },
  { key: "prototype", name: "Prototype" },
  { key: "pursue", name: "Pursue" },
] as const;

export type CircuitFlowKey = (typeof CIRCUIT_FLOWS)[number]["key"];

const flowNames = CIRCUIT_FLOWS.map((flow) => flow.name);

// "Build, Fix, Review, Explore, Prototype, or Pursue" — for prose that
// enumerates the roster as alternatives.
export const circuitFlowProseList = `${flowNames
  .slice(0, -1)
  .join(", ")}, or ${flowNames[flowNames.length - 1]}`;
