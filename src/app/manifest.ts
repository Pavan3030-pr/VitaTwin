import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VitaTwin — Your Living Digital Health Twin",
    short_name: "VitaTwin",
    description: "Wearable and health-record fusion for explainable cardiometabolic risk. Synthetic data only.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FAFBFC",
    theme_color: "#0F766E",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
