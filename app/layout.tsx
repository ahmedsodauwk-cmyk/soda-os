import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Sans_Arabic, Outfit } from "next/font/google";
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

/** Premium Arabic pairing — IBM Plex Sans Arabic */
const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SODA OS",
  description: "Visuals Studio — creative operations",
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
      className={`dark ${outfit.variable} ${geistMono.variable} ${ibmPlexArabic.variable} h-full antialiased`}
    >
      <body className={`${outfit.className} flex min-h-full flex-col`}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
