import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { CircuitMark } from "@/components/brand/circuit-mark";

// Shared nav/link options for the docs section. The "Home" link crosses back to
// the marketing root layout, which triggers a full page load by design.
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // The home masthead in miniature: mark, then the lowercase wordmark.
      title: (
        <span className="inline-flex items-center gap-2 text-foreground">
          <CircuitMark size={18} />
          <span className="text-[15px] font-semibold leading-none tracking-tight">
            circuit
          </span>
        </span>
      ),
    },
    githubUrl: "https://github.com/petekp/circuit",
    // Docs are dark-only; the root layout forces the theme, this hides the
    // switch.
    themeSwitch: { enabled: false },
    links: [
      {
        text: "Home",
        url: "/",
      },
    ],
  };
}
