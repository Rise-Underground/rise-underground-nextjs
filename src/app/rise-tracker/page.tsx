import type { Metadata } from "next";
import { RiseTrackerApp } from "@/components/riseTracker/RiseTrackerApp";
import { fetchRiseTrackerSummary } from "@/lib/data/riseTracker";
import { SITE_NAME } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "RISE Staking Pool — Dashboard",
  description: "RISE Token Ecosystem Dashboard. Cardano · Base · Flows · Rewards.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Infinity Rising — RISE Tracker",
    description: "RISE Token Ecosystem Dashboard. Cardano · Base · Flows · Rewards.",
    url: "/rise-tracker",
    images: ["/assets/rise_tracker.jpg"],
  },
};

export default async function RiseTrackerPage() {
  const summaryData = await fetchRiseTrackerSummary();
  return <RiseTrackerApp {...summaryData} />;
}
