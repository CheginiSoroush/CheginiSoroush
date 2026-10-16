import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { GITHUB_PROFILE_URL } from "@/lib/site-config";

const SITE_URL = "https://imsoroush.ir";
// Site default language is English (see src/lib/i18n.ts) — SEO metadata follows.
const TITLE = "Soroush | Software Developer & Writer";
const DESCRIPTION =
  "Soroush Chegini's personal portfolio: software developer, Telegram bot maker, 3D experience builder and writer.";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Soroush Chegini",
      alternateName: "سروش چگینی",
      url: SITE_URL,
      image: `${SITE_URL}/photos/logo_dark.png`,
      jobTitle: "Software Developer & Writer",
      description:
        "Software developer, Telegram bot maker, 3D enthusiast and writer.",
      sameAs: [GITHUB_PROFILE_URL],
      knowsAbout: [
        "Software Development",
        "Telegram Bots",
        "Next.js",
        "TypeScript",
        "Three.js",
        "Technical Writing",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: TITLE,
      inLanguage: ["en", "fa-IR"],
      publisher: { "@id": `${SITE_URL}/#person` },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Soroush",
  },
  description: DESCRIPTION,
  keywords: [
    "سروش",
    "سروش چگینی",
    "توسعه‌دهنده",
    "ربات تلگرام",
    "پورتفولیو",
    "Next.js",
    "Three.js",
    "Soroush Chegini",
  ],
  authors: [{ name: "Soroush Chegini", url: SITE_URL }],
  creator: "Soroush Chegini",
  applicationName: "imsoroush.ir",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  icons: {
    icon: [{ url: "/photos/logo_icon_48.png", type: "image/png", sizes: "48x48" }],
    apple: [{ url: "/photos/logo_icon_180.png" }],
    shortcut: ["/photos/logo_icon_48.png"],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: TITLE,
    description:
      "Software developer, Telegram bot maker, 3D experience builder and writer — projects, articles and open-source work.",
    url: SITE_URL,
    siteName: "imsoroush.ir",
    type: "website",
    locale: "en_US",
    alternateLocale: ["fa_IR"],
    // NOTE: og:image is provided by the src/app/opengraph-image.tsx file
    // convention (dynamic 1200×630 card) — do not duplicate it here.
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description:
      "Software developer, Telegram bot maker and writer — imsoroush.ir",
    // no twitter.images → crawlers fall back to og:image (dynamic card)
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a10" },
    { media: "(prefers-color-scheme: light)", color: "#f8f7f4" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.classList.toggle('dark',t!=='light');document.documentElement.classList.toggle('light',t==='light');var l=localStorage.getItem('imsoroush-lang');if(l!=='fa'&&l!=='en'){l=(navigator.language&&navigator.language.toLowerCase().indexOf('fa')===0)?'fa':'en';}if(l==='fa'){document.documentElement.lang='fa';document.documentElement.dir='rtl';}else{document.documentElement.lang='en';document.documentElement.dir='ltr';}}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
