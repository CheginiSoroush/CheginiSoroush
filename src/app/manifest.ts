import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سروش چگینی | Soroush Chegini",
    short_name: "سروش",
    description:
      "پورتفولیو شخصی سروش چگینی: توسعه‌دهنده نرم‌افزار، سازنده ربات‌های تلگرام و نویسنده.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a10",
    theme_color: "#14d2b8",
    lang: "fa",
    dir: "rtl",
    icons: [
      {
        src: "/photos/logo_dark.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
