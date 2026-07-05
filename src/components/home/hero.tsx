import Link from "next/link";

import { CircuitMark } from "@/components/brand/circuit-mark";

import { FlowExplorer } from "./flow-explorer";
import { GithubLogo, InstallProviderIcons, XLogo } from "./host-logos";

/* The hero: the whole page narrows to one idea here. Wordmark and links on
   top, then one line that says what Circuit is (the same line the tab title,
   OG card, and docs intro lead with), one line that names what the reader's
   current setup can't do, and one place to install. Below the
   masthead, the flow explorer runs against the background in its focus layout:
   a vertical feature nav on the left, the diagram in the center, the
   explanation on the right. Pick a feature and the diagram slides to bring its
   steps into view while the nav and blurb stay put; the power dial reallocates
   every step's model and effort at once. Each step carries its full scope: its
   model and effort, its scoped tools, the context it sees, the skills it pulls
   in. The routing reads at a glance — expensive judgment is concentrated where
   direction is decided, and the bulk work runs cheap, sometimes many at once in
   a fan-out. The want comes first in words; the mechanism is shown, not told;
   the sections below elaborate. */
export function Hero() {
  return (
    <section className="relative isolate flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 text-foreground">
            <CircuitMark size={34} state="running" />
            <span className="text-[30px] font-semibold leading-none tracking-tight">
              circuit
            </span>
          </div>
          <p className="pl-px text-[11px] leading-none text-muted-foreground">
            a plugin for Claude Code and Codex
          </p>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <a
            href="https://github.com/petekp/circuit"
            aria-label="Circuit on GitHub"
            className="hover:text-foreground"
          >
            <GithubLogo />
          </a>
          <a
            href="https://x.com/petekp"
            aria-label="Pete Petrash on X"
            className="hover:text-foreground"
          >
            <XLogo />
          </a>
        </div>
      </div>

      <div className="flex flex-col py-12 sm:py-16">
        <h1 className="max-w-2xl text-balance text-[2rem] font-medium leading-[1.08] tracking-tight sm:text-[2.7rem]">
          The process your coding agent follows.
        </h1>
        <p className="mt-6 max-w-xl text-pretty text-[16px] leading-relaxed text-muted-foreground sm:text-[17px]">
          AGENTS.md and a pile of skill files can only suggest. Circuit encodes
          the process itself: typed steps, mechanical checks, a written record
          of every run.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a
            href="#install"
            className="soft-cta-primary inline-flex min-h-11 items-center gap-2.5 px-5 py-2 text-[14px] font-semibold"
          >
            <span>Install</span>
            <InstallProviderIcons />
          </a>
          <Link
            href="/docs"
            className="soft-cta-secondary inline-flex min-h-11 items-center px-5 py-2 text-[14px] font-medium text-foreground"
          >
            View docs
          </Link>
        </div>

        {/* The focus treatment: tabs on the left, the diagram at full height
            in the center, the explanation pinned at the focal plane on the
            right. The page is the only scroll container; a scroll-linked
            depth of field keeps one step sharp at a time and selecting a
            feature scrolls the page to bring that step to the plane. The band
            breaks out of the page column (hero-breakout) and re-caps at 88rem
            so the diagram column clears the width where the tile grid goes
            three-up; it stacks to one column below the lg breakpoint. */}
        <div className="hero-breakout mt-16 sm:mt-20">
          <div className="mx-auto w-full max-w-[88rem] px-6">
            <FlowExplorer variant="focus" />
          </div>
        </div>
      </div>
    </section>
  );
}
