import type { Metadata } from "next";
import { Fragment_Mono, Schibsted_Grotesk } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import { siteUrl } from "@/lib/site-url";
import "./docs.css";

// The docs section is its own root layout (separate <html>/<body>) so Fumadocs'
// theme provider and stylesheet stay fully isolated from the marketing site in
// the (home) group. Navigating between the two triggers a full page load, which
// is expected with multiple root layouts. The brand faces load again here (same
// families as the home layout) because next/font variables don't cross root
// layouts; docs.css maps them onto Fumadocs' --font-sans/--font-mono.

const prose = Schibsted_Grotesk({
  variable: "--font-prose",
  subsets: ["latin"],
});

const evidence = Fragment_Mono({
  variable: "--font-evidence",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Circuit Docs",
    template: "%s — Circuit Docs",
  },
  description:
    "Documentation for Circuit: the process your coding agent follows.",
};

export default function DocsRootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${prose.variable} ${evidence.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col antialiased">
        {/* Docs are dark-only: one register, matching the always-dark home.
            forcedTheme pins next-themes; the toggle is disabled in
            layout.shared.tsx. */}
        <RootProvider theme={{ defaultTheme: "dark", forcedTheme: "dark" }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
