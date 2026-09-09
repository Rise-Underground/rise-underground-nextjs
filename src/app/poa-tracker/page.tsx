import type { Metadata } from "next";
import { PoaTrackerApp } from "@/components/poaTracker/PoaTrackerApp";
import { fetchPoaTrackerData } from "@/lib/data/poaTracker";
import { SITE_NAME } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "RISE POA Tracker",
  description: "Mint Distribution · Rarity Intel. Know your odds before you mint.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "RISE Underground — POA Tracker",
    description: "Mint Distribution · Rarity Intel. Know your odds before you mint.",
    url: "/poa-tracker",
    images: ["/assets/poa_tracker.jpg"],
  },
};

export default async function PoaTrackerPage() {
  const data = await fetchPoaTrackerData();
  return <PoaTrackerApp {...data} />;
}
