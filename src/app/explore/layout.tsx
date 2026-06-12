import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "../globals.css";

// Throwaway visual-direction explorations. This segment is its own root
// layout so each treatment can fully own typography and color without
// fighting the home layout's global monospace.

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Circuit — visual direction explorations",
  robots: { index: false, follow: false },
};

export default function ExploreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full overflow-x-clip">{children}</body>
    </html>
  );
}
