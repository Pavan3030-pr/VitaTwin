import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://vita-twin-ten.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/terms"],
        disallow: ["/api/", "/dashboard", "/vitals", "/insights", "/timeline", "/profile", "/clinician", "/import", "/validation", "/account", "/auth/", "/reset-password"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
