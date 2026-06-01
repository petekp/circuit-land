// Single source of truth for the canonical site origin.
//
// Resolution order, highest priority first:
//   1. NEXT_PUBLIC_SITE_URL — set this in the Vercel project (Production) to pin
//      the launch domain explicitly: https://circuit.land
//   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel-provided; becomes the bound
//      production domain once circuit.land is attached to the project.
//   3. VERCEL_URL — the per-deployment preview host.
//   4. localhost — local dev, so OG/canonical resolve to the dev server.
//
// layout.tsx (metadataBase + og:url + canonical), robots.ts, and sitemap.ts all
// import this so the production URL is defined in exactly one place.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined) ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  "http://localhost:3000";
