import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Mermaid } from "@/components/mermaid";

// Resolves the components MDX content renders with: Fumadocs defaults, the
// Mermaid diagram renderer, plus any per-page overrides (e.g. relative-link
// handling passed from the page).
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  // @react-three/fiber's type augmentation adds three.js's element catalog to
  // JSX.IntrinsicElements program-wide, and a few of those entries type as
  // Component<never> — which makes mdx/types' mapped type violate its own
  // index signature. The cast restates what held before the augmentation; no
  // MDX content renders three elements.
  return {
    ...defaultMdxComponents,
    Mermaid,
    ...components,
  } as MDXComponents;
}
