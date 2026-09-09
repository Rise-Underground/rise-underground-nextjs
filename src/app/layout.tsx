import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import { SITE_NAME, SITE_URL } from "@/lib/siteConfig";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "RISE Underground",
  description: "Trackers, Almanac, Leaderboards. Operating in the shadows.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "RISE Underground — Access",
    description: "Trackers, Almanac, Leaderboards. Operating in the shadows.",
    url: "/",
    images: ["/assets/Index.jpg"],
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0a0908",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black">{children}</body>
    </html>
  );
}
