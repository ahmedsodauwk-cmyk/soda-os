import type { Metadata } from "next";
import { Cairo, Geist_Mono, Outfit } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

/** Distinctive geometric sans — English UI + headings (not Inter/Geist-generic). */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Premium Arabic UI face — Cairo covers Egyptian Arabic glyphs (incl. چ)
 * and renders cleanly at UI sizes. Applied via `.font-ar`.
 */
const cairoArabic = Cairo({
  variable: "--font-cairo-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SODA OS — Command Center",
  description: "SODA Visuals Studio — creative operations · Experience v1.0",
  icons: {
    icon: [{ url: "/brand/soda-mark.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${outfit.variable} ${geistMono.variable} ${cairoArabic.variable} h-full antialiased`}
    >
      <body className={`${outfit.className} flex min-h-full flex-col`}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
