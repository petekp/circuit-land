import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

// Shared nav/link options for the docs section. The "Home" link crosses back to
// the marketing root layout, which triggers a full page load by design.
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Circuit",
    },
    githubUrl: "https://github.com/petekp/circuit",
    links: [
      {
        text: "Home",
        url: "/",
      },
    ],
  };
}
