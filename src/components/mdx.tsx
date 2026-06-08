import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Mermaid } from "@/components/mermaid";

// Resolves the components MDX content renders with: Fumadocs defaults, the
// Mermaid diagram renderer, plus any per-page overrides (e.g. relative-link
// handling passed from the page).
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Mermaid,
    ...components,
  };
}
