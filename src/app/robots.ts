import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Throwaway visual-direction explorations. They are already
      // noindex/nofollow via the explore layout, but they also carry
      // older marketing copy, so keep crawlers out of them entirely.
      disallow: "/explore/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
