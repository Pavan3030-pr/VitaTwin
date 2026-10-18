import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VitaTwin — Your Living Digital Health Twin",
  description:
    "A dynamic digital twin that fuses wearable signals and EHR data to predict cardiometabolic risk before it happens. (Synthetic data only — proof of concept.)",
  icons: {
    icon: [
      { media: "(prefers-color-scheme: light)", url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-page">
        {children}
      </body>
    </html>
  );
}
