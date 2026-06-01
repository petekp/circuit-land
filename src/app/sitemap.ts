import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// Single-page marketing site. Evaluated at build time (static route), so
// lastModified reflects the deploy that last rebuilt the page.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
