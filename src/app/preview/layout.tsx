import type { Metadata } from "next";
import { Fragment_Mono, Schibsted_Grotesk } from "next/font/google";
import "../globals.css";

// Throwaway dev-only route for comparing flow-tour variants side by side. It is
// its own root layout (noindex), mirroring the home brand faces so the diagram
// renders exactly as it will in the hero. Not linked anywhere and not in the
// sitemap. Delete this segment once a variant is chosen.

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
  title: "Circuit — flow-tour variants",
  robots: { index: false, follow: false },
};

export default function PreviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${prose.variable} ${evidence.variable} h-full antialiased`}
    >
      <body className="min-h-full overflow-x-clip font-sans">{children}</body>
    </html>
  );
}
