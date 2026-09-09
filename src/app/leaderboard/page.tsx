import type { Metadata } from "next";
import { LeaderboardApp } from "@/components/leaderboard/LeaderboardApp";
import { fetchLeaderboardData } from "@/lib/data/leaderboard";
import { SITE_NAME } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Rise Underground presents: Leaders of the Leaderboards",
  description: "Calido Valley · AeroTrails · Holocache. Where do you stand?",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "RISE Underground — Leaders of the Leaderboards",
    description: "Calido Valley · AeroTrails · Holocache. Where do you stand?",
    url: "/leaderboard",
    images: ["/assets/leaderboards.jpg"],
  },
};

export default async function LeaderboardPage() {
  const { placements, boards, placementsLastModified } = await fetchLeaderboardData();

  return (
    <div className="min-h-full bg-asphalt text-ink">
      <LeaderboardApp
        placements={placements}
        boards={boards}
        placementsLastModified={placementsLastModified}
      />
    </div>
  );
}
