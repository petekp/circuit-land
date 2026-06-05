import { defineDocs, defineConfig } from "fumadocs-mdx/config";

// Fumadocs content source. Markdown/MDX lives in content/docs and is compiled
// into the generated .source folder, which lib/source.ts loads at runtime.
export const docs = defineDocs({
  dir: "content/docs",
});

export default defineConfig();
