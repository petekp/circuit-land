import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import { siteUrl } from "@/lib/site-url";
import "./docs.css";

// The docs section is its own root layout (separate <html>/<body>) so Fumadocs'
// theme provider and stylesheet stay fully isolated from the always-dark
// marketing site in the (home) group. Navigating between the two triggers a
// full page load, which is expected with multiple root layouts.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Circuit Docs",
    template: "%s - Circuit Docs",
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
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col antialiased">
        <RootProvider theme={{ defaultTheme: "dark" }}>{children}</RootProvider>
      </body>
    </html>
  );
}
