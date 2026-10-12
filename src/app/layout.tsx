import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://imsoroush.ir"),
  title: "سروش | توسعه‌دهنده نرم‌افزار و نویسنده",
  description:
    "پورتفولیو شخصی سروش چگینی: توسعه‌دهنده نرم‌افزار، سازنده ربات‌های تلگرام، تجربه‌های سه‌بعدی و نویسنده.",
  keywords: ["سروش", "توسعه‌دهنده", "ربات تلگرام", "پورتفولیو", "Next.js", "Three.js"],
  authors: [{ name: "Soroush Chegini" }],
  icons: {
    icon: "/photos/logo_dark.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "سروش | توسعه‌دهنده نرم‌افزار و نویسنده",
    description: "توسعه‌دهنده نرم‌افزار، نویسنده و علاقه‌مند به یادگیری مستمر.",
    url: "https://imsoroush.ir",
    siteName: "imsoroush.ir",
    type: "website",
    locale: "fa_IR",
  },
  twitter: {
    card: "summary_large_image",
    title: "سروش | توسعه‌دهنده نرم‌افزار و نویسنده",
    description: "توسعه‌دهنده نرم‌افزار، سازنده ربات‌های تلگرام و نویسنده — imsoroush.ir",
  },
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
