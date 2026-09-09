import { NextResponse } from "next/server";
import { fetchSourceFile, SOURCE_PATHS, SourceFileError } from "@/lib/data/source";

/** Proxies pool_summary.json from the old site. See dashboard-data/route.ts for why this is a route, not a Server Component prop. */
export async function GET() {
  try {
    const { text } = await fetchSourceFile(SOURCE_PATHS.poolSummary);
    return new NextResponse(text, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=0, must-revalidate, s-maxage=300",
      },
    });
  } catch (err) {
    const status = err instanceof SourceFileError ? err.status : 502;
    return NextResponse.json({ error: "Failed to load pool summary data" }, { status });
  }
}
