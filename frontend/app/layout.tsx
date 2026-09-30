import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Shell } from "@/components/layout/shell";

// Self-hosted via next/font/local rather than next/font/google.
//
// next/font/google downloads the CSS and woff2 files from fonts.googleapis.com
// at BUILD time (the browser never contacts Google, but the builder does). That
// made `next build` depend on a live third-party request: a CI run failed with
// "Module not found: Can't resolve
// '@vercel/turbopack-next/internal/font/google/font'" after two runs had
// passed, and a Vercel build would fail the same way. Local files make the
// build hermetic and reproducible.
//
// Files in app/fonts/ are the latin subsets. IBM Plex Sans and Newsreader are
// variable fonts, so one file each covers every weight in use. Google does not
// serve a variable axis for IBM Plex Mono, so its three weights are static.
// CSS custom property names are unchanged, so globals.css is untouched.

const ibmPlexSans = localFont({
  src: "./fonts/plex-sans.woff2",
  weight: "100 700",
  style: "normal",
  variable: "--font-plex-sans",
  display: "swap",
});

const ibmPlexMono = localFont({
  src: [
    { path: "./fonts/plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/plex-mono-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/plex-mono-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

const newsreader = localFont({
  src: [
    { path: "./fonts/newsreader-roman.woff2", weight: "200 800", style: "normal" },
    { path: "./fonts/newsreader-italic.woff2", weight: "200 800", style: "italic" },
  ],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ImpactLens AI — Sustainability & Impact Media Intelligence",
  description:
    "AI-powered sustainability and environmental impact media intelligence platform for NGOs, governments, and research institutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${newsreader.variable}`}
    >
      <body className="font-sans antialiased bg-[#F8F7F4] text-[#111827]">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
