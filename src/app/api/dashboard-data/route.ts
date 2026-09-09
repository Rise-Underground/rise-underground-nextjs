import { NextResponse } from "next/server";
import { fetchSourceFile, SOURCE_PATHS, SourceFileError } from "@/lib/data/source";

/**
 * Proxies combined_dashboard_data.json from the old site. A same-origin route rather than a
 * Server Component prop for one reason: this file is ~600KB and rise_tracker only needs it to
 * draw charts (no SEO/SSR value in it) -- fetching it client-side, same as the original page did,
 * avoids bloating the page's initial payload with chart data. Next's fetch cache (see source.ts's
 * revalidate window) still means this rarely actually hits the old site.
 */
export async function GET() {
  try {
    const { text } = await fetchSourceFile(SOURCE_PATHS.dashboardData);
    return new NextResponse(text, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=0, must-revalidate, s-maxage=300",
      },
    });
  } catch (err) {
    const status = err instanceof SourceFileError ? err.status : 502;
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status });
  }
}
