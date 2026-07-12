import type { Metadata, Viewport } from "next";
import { Fragment_Mono, Schibsted_Grotesk } from "next/font/google";
import { AgentationDev } from "@/components/agentation-dev";
import { siteUrl } from "@/lib/site-url";
import "../globals.css";

// The brand faces (one of the two surfaces that restate the brand theme
// outside globals.css — see the BRAND THEME block there). Prose face for
// humans; Fragment Mono is reserved for evidence: commands, paths, output.
const prose = Schibsted_Grotesk({
  variable: "--font-prose",
  subsets: ["latin"],
});

const evidence = Fragment_Mono({
  variable: "--font-evidence",
  weight: "400",
  subsets: ["latin"],
});

const siteTitle = "Circuit — the process your coding agent follows";
const siteDescription =
  "Encode how you want agent work done into repeatable flows for Claude Code and Codex. Circuit steps can use different model configurations, and no step can close without the evidence its checks require.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  applicationName: "Circuit",
  alternates: {
    canonical: "/",
  },
  authors: [{ name: "Pete Petrash", url: "https://github.com/petekp" }],
  creator: "Pete Petrash",
  publisher: "Circuit",
  keywords: [
    "Circuit",
    "Claude Code",
    "Codex",
    "coding agents",
    "developer workflows",
    "agentic coding",
  ],
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: "Circuit",
    type: "website",
    url: "/",
    // The explicit openGraph object shallow-replaces the file-convention
    // image from src/app/opengraph-image.tsx, so the image must be named
    // here or the home page ships no og:image at all.
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Circuit — the process your coding agent follows. For Claude Code and Codex.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  // Matches --brand-bg in globals.css so mobile browser chrome blends with
  // the dark page.
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${prose.variable} ${evidence.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-clip font-sans">
        {children}
        {process.env.NODE_ENV === "development" && <AgentationDev />}
      </body>
    </html>
  );
}
