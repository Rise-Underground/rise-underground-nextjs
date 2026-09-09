import type { Metadata } from "next";
import { AlmanacApp } from "@/components/almanac/AlmanacApp";
import { SITE_NAME } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Infinity Rising Almanac — Rise Underground",
  description: "Every milestone. One place. Features · AMAs · Partnerships.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "RISE Underground — IR Almanac",
    description: "Every milestone. One place. Features · AMAs · Partnerships.",
    url: "/almanac",
    images: ["/assets/almanac.jpg"],
  },
};

export default function AlmanacPage() {
  return <AlmanacApp />;
}
