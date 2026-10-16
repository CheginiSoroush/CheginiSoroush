import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سروش چگینی | Soroush Chegini",
    short_name: "سروش",
    description:
      "پورتفولیو شخصی سروش چگینی: توسعه‌دهنده نرم‌افزار، سازنده ربات‌های تلگرام و نویسنده.",
    start_url: "/",
    id: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0a0a10",
    theme_color: "#14d2b8",
    lang: "fa",
    dir: "rtl",
    categories: ["portfolio", "productivity"],
    icons: [
      {
        src: "/photos/logo_icon_192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/photos/logo_icon_512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/photos/logo_icon_192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
