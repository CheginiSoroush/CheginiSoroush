import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const SITE_URL = "https://imsoroush.ir";
const TITLE = "سروش | توسعه‌دهنده نرم‌افزار و نویسنده";
const DESCRIPTION =
  "پورتفولیو شخصی سروش چگینی: توسعه‌دهنده نرم‌افزار، سازنده ربات‌های تلگرام، تجربه‌های سه‌بعدی و نویسنده.";

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
      sameAs: ["https://github.com/CheginiSoroush"],
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
      inLanguage: "fa-IR",
      publisher: { "@id": `${SITE_URL}/#person` },
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | سروش",
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
  },
  icons: {
    icon: [{ url: "/photos/logo_dark.png", type: "image/png" }],
    apple: [{ url: "/photos/logo_dark.png" }],
    shortcut: ["/photos/logo_dark.png"],
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
    description: "توسعه‌دهنده نرم‌افزار، نویسنده و علاقه‌مند به یادگیری مستمر.",
    url: SITE_URL,
    siteName: "imsoroush.ir",
    type: "website",
    locale: "fa_IR",
    alternateLocale: ["en_US"],
    // NOTE: og:image is provided by the src/app/opengraph-image.tsx file
    // convention (dynamic 1200×630 card) — do not duplicate it here.
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description:
      "توسعه‌دهنده نرم‌افزار، سازنده ربات‌های تلگرام و نویسنده — imsoroush.ir",
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
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.classList.toggle('dark',t!=='light');document.documentElement.classList.toggle('light',t==='light');var l=localStorage.getItem('imsoroush-lang');if(l==='en'){document.documentElement.lang='en';document.documentElement.dir='ltr';}}catch(e){document.documentElement.classList.add('dark');}})();`,
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
