import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ErrorListener } from "@/components/system/error-listener";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://vita-twin-ten.vercel.app"),
  applicationName: "VitaTwin",
  openGraph: {
    type: "website",
    siteName: "VitaTwin",
    title: "VitaTwin — Your Living Digital Health Twin",
    description: "Explainable cardiometabolic risk from wearable and health-record data. Synthetic data only.",
  },
  twitter: { card: "summary", title: "VitaTwin — Your Living Digital Health Twin" },
  title: "VitaTwin — Your Living Digital Health Twin",
  description:
    "A dynamic digital twin that fuses wearable signals and EHR data to predict cardiometabolic risk before it happens. (Synthetic data only — proof of concept.)",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = {
  themeColor: "#FAFBFC",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-page">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-primary-strong focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        {children}
        <ErrorListener />
        <Analytics />
      </body>
    </html>
  );
}
