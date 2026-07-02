import type { Metadata } from "next";

import { DialSection } from "@/components/home/dial-section";
import { GetStarted } from "@/components/home/get-started";
import { Hero } from "@/components/home/hero";
import { SiteFooter } from "@/components/home/site-footer";
import { WhatMakesItDifferent } from "@/components/home/what-makes-it-different";
import { WhatYouCanRun } from "@/components/home/what-you-can-run";

export const metadata: Metadata = {
  title: "Circuit - the process your coding agent follows",
  description:
    "Encode how you want agent work done into repeatable flows for Claude Code and Codex. Circuit routes each step to the right model, and no step can close without the evidence its checks require.",
};

/* The home page is a funnel. It narrows to one idea in the hero, widens to the
   three mechanisms that are Circuit's alone, deep-dives the one mechanism that
   needs demonstrating (the role and dial system), widens again to the work you
   can run, and ends at one place to install. Each beat is its own component
   under src/components/home so this file stays a readable table of contents. */
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-16">
      <Hero />
      <WhatMakesItDifferent />
      <DialSection />
      <WhatYouCanRun />
      <GetStarted />
      <SiteFooter />
    </main>
  );
}
