"use client";

import { Agentation } from "agentation";

export function AgentationDev() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  // Point the toolbar at the local agentation-mcp server so annotations sync
  // to the agent. Override with NEXT_PUBLIC_AGENTATION_ENDPOINT if needed.
  const endpoint =
    process.env.NEXT_PUBLIC_AGENTATION_ENDPOINT ?? "http://localhost:4747";

  return <Agentation endpoint={endpoint} />;
}
