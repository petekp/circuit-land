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
      {/* The masthead owns ~80% of the viewport: logo row pinned at the top,
          the tagline/description/CTAs centered in the remaining space over
          the circuit-field background, and the flow explorer peeking above
          the fold below it. Type is fluid (clamp) so the centered block
          scales with the viewport instead of stepping at breakpoints. */}
      <div className="flex min-h-[80svh] flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 text-foreground">
              <CircuitMark size={34} state="running" />
              <span className="text-[30px] font-semibold leading-none tracking-tight">
                circuit
              </span>
            </div>
            <p className="pl-px text-[11px] leading-none text-muted-foreground">
              a workflow engine, driven from Claude Code and Codex
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

        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <h1 className="max-w-4xl text-balance text-[clamp(2.25rem,1.2rem+4.5vw,4.25rem)] font-medium leading-[1.06] tracking-tight">
            The process your coding agent follows.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-[clamp(1rem,0.85rem+0.7vw,1.3rem)] leading-relaxed text-muted-foreground">
            AGENTS.md and a pile of skill files can only suggest. Circuit
            encodes the process itself: typed steps, mechanical checks, a
            written record of every run.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#install"
              className="soft-cta-primary inline-flex min-h-12 items-center gap-2.5 px-6 py-2.5 text-[clamp(0.9rem,0.8rem+0.4vw,1.1rem)] font-semibold"
            >
              <span>Install</span>
              <InstallProviderIcons />
            </a>
            <Link
              href="/docs"
              className="soft-cta-secondary inline-flex min-h-12 items-center px-6 py-2.5 text-[clamp(0.9rem,0.8rem+0.4vw,1.1rem)] font-medium text-foreground"
            >
              View docs
            </Link>
          </div>
        </div>
      </div>

      {/* The focus treatment: tabs on the left, the diagram at full height
          in the center, the explanation pinned at the focal plane on the
          right. The page is the only scroll container; a scroll-linked
          depth of field keeps one step sharp at a time and selecting a
          feature scrolls the page to bring that step to the plane. The band
          breaks out of the page column (hero-breakout) and re-caps at 88rem
          so the diagram column clears the width where the tile grid goes
          three-up; it stacks to one column below the lg breakpoint. */}
      <div className="hero-breakout">
        <div className="mx-auto w-full max-w-[88rem] px-4 sm:px-6">
          {/* The well: a near-opaque panel that quiets the circuit-field
              behind the explorer so the two visualizations stop competing.
              See .flow-focus-well in globals.css for the constraints
              (no overflow clipping — sticky columns — and no backdrop-blur). */}
          <div className="flow-focus-well px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
            <FlowExplorer variant="focus" />
          </div>
        </div>
      </div>
    </section>
  );
}
