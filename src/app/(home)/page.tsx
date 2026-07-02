import type { Metadata } from "next";

import { GetStarted } from "@/components/home/get-started";
import { Hero } from "@/components/home/hero";
import { SiteFooter } from "@/components/home/site-footer";
import { WhatMakesItDifferent } from "@/components/home/what-makes-it-different";
import { WhatYouCanRun } from "@/components/home/what-you-can-run";

export const metadata: Metadata = {
  title: "Circuit - the process your coding agent follows",
  description:
    "Coding agents do their best work inside a real process. Circuit moves the work step to step and keeps a written record. Tomorrow starts where today ended.",
};

/* The home page is a funnel. It narrows to one idea in the hero, widens to the
   three mechanisms that are Circuit's alone, widens again to the work you can
   run, and ends at one place to install. Each beat is its own component under
   src/components/home so this file stays a readable table of contents. */
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-16">
      <Hero />
      <WhatMakesItDifferent />
      <WhatYouCanRun />
      <GetStarted />
      <SiteFooter />
    </main>
  );
}
