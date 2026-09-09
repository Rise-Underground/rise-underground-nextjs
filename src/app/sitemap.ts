import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteConfig";

const ROUTES = ["/", "/leaderboard", "/poa-tracker", "/rise-tracker", "/almanac"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));
}
