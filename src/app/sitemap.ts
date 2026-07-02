import type { MetadataRoute } from "next";
import { source } from "@/lib/source";
import { siteUrl } from "@/lib/site-url";

// Evaluated at build time (static route), so lastModified reflects the deploy
// that last rebuilt the site. Docs pages are enumerated from the same source
// the docs router uses, so a new page joins the sitemap without an edit here.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 1,
    },
    ...source.getPages().map((page) => ({
      url: `${siteUrl}${page.url}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
