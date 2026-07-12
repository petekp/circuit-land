import type { Metadata } from "next";

import { CircuitField } from "@/components/home/circuit-field";
import { DialSection } from "@/components/home/dial-section";
import { GetStarted } from "@/components/home/get-started";
import { Hero } from "@/components/home/hero";
import { SiteFooter } from "@/components/home/site-footer";
import { WhatMakesItDifferent } from "@/components/home/what-makes-it-different";
import { WhatYouCanRun } from "@/components/home/what-you-can-run";
import { siteUrl } from "@/lib/site-url";

const siteDescription =
  "Encode how you want agent work done into repeatable flows for Claude Code and Codex. Circuit steps can use different model configurations, and no step can close without the evidence its checks require.";

export const metadata: Metadata = {
  title: "Circuit — the process your coding agent follows",
  description: siteDescription,
};

// Structured data for crawlers: the same facts the meta tags state, in
// schema.org vocabulary. The zero-price offer is accurate — Circuit is free.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Circuit",
  description: siteDescription,
  url: siteUrl,
  applicationCategory: "DeveloperApplication",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  sameAs: ["https://github.com/petekp/circuit"],
};

/* The home page is a funnel. It narrows to one idea in the hero, widens to the
   three mechanisms that are Circuit's alone, deep-dives the one mechanism that
   needs demonstrating (the role and dial system), widens again to the work you
   can run, and ends at one place to install. Each beat is its own component
   under src/components/home so this file stays a readable table of contents. */
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-16">
      {/* Fixed, opaque WebGL page ground: the diagram field runs behind all
          content; scroll tilts the camera from -40° to +40°. */}
      <CircuitField />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Hero />
      <WhatMakesItDifferent />
      <DialSection />
      <WhatYouCanRun />
      <GetStarted />
      <SiteFooter />
    </main>
  );
}
