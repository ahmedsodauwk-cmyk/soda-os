import type { Metadata } from "next";
import { Alexandria, Geist_Mono, Outfit } from "next/font/google";
import { cookies } from "next/headers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/lib/i18n/provider";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  parseLocale,
} from "@/lib/i18n/config";
import { ThemeProvider } from "@/lib/theme/provider";
import {
  THEME_COOKIE,
  parseTheme,
  themeBootScript,
} from "@/lib/theme/config";
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
  title: {
    default: "SODA VISUALS",
    template: "%s · SODA VISUALS",
  },
  description:
    "SODA VISUALS — نظام تشغيل الاستوديو للشغل التجاري والأفراح",
  applicationName: "SODA VISUALS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/soda-icon.png", type: "image/png", sizes: "512x512" },
      { url: "/brand/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "SODA VISUALS",
    description: "نظام تشغيل الاستوديو — شغل مرتّب وطاقة عالية",
    siteName: "SODA VISUALS",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SODA VISUALS",
    description: "نظام تشغيل الاستوديو — شغل مرتّب وطاقة عالية",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jar = await cookies();
  const locale = parseLocale(jar.get(LOCALE_COOKIE)?.value) || DEFAULT_LOCALE;
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${outfit.variable} ${geistMono.variable} ${alexandria.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeBootScript() }}
        />
      </head>
      <body className={`${outfit.className} flex min-h-full flex-col`}>
        <ThemeProvider initialTheme={theme}>
          <LocaleProvider initialLocale={locale}>
            <TooltipProvider>{children}</TooltipProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
