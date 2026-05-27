import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { AgentationDev } from "@/components/agentation-dev";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Circuit - repeatable work patterns for coding agents",
  description:
    "Circuit gives coding agents a better working environment: clear flows, timely skills, evidence, and checkpoints for agentic coding.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-mono">
        {children}
        {process.env.NODE_ENV === "development" && <AgentationDev />}
      </body>
    </html>
  );
}
