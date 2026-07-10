import type { Metadata } from "next";
import { Alexandria, Geist_Mono, Outfit } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

/** Distinctive geometric sans — English UI + headings. */
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
 * Premium Arabic UI face — Alexandria (Google Fonts).
 * Applied via `.font-ar`. Falls back to IBM Plex Sans Arabic in CSS.
 */
const alexandria = Alexandria({
  variable: "--font-alexandria",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SODA OS — Command Center",
  description: "SODA Visuals Studio — commercial & wedding operations",
  icons: {
    icon: [
      { url: "/brand/soda-mark.svg", type: "image/svg+xml" },
      { url: "/brand/soda-logo-master.png", type: "image/png" },
    ],
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
      className={`dark ${outfit.variable} ${geistMono.variable} ${alexandria.variable} h-full antialiased`}
    >
      <body className={`${outfit.className} flex min-h-full flex-col`}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
