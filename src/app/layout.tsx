import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AgentationDev } from "@/components/agentation-dev";
import { SiteThemeController } from "@/components/site-theme-controller";
import { SiteThemeDials } from "@/components/site-theme-dials";
import { siteUrl } from "@/lib/site-url";
import "dialkit/styles.css";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Proportional companion to the monospace body, used for section-label
// eyebrows to give them visual contrast against the mono type.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const siteTitle = "Circuit - repeatable work patterns for coding agents";
const siteDescription =
  "Circuit gives coding agents clear flows, timely skills, evidence, and checkpoints for everyday software work.";

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
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  // Matches the default globals.css --site-primary-hue background so mobile
  // browser chrome blends with the dark page before DialKit can run.
  themeColor: "#141a17",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} ${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-clip font-mono">
        {children}
        <SiteThemeController />
        {process.env.NODE_ENV === "development" && <SiteThemeDials />}
        {process.env.NODE_ENV === "development" && <AgentationDev />}
      </body>
    </html>
  );
}
