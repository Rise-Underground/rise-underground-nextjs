"use client";

import { useEffect, useState } from "react";
import { formatAgo } from "@/lib/poaTracker/format";

/** "Last updated N minutes ago", counting up from generated_at rather than re-fetching. */
export function LastUpdatedText({ generatedAt }: { generatedAt: string | null }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!generatedAt) return null;
  const dt = new Date(generatedAt);
  if (Number.isNaN(dt.getTime())) return null;

  const seconds = Math.max(0, Math.floor((now.getTime() - dt.getTime()) / 1000));

  return (
    <div suppressHydrationWarning className="font-ibm-plex-mono text-[11px] tracking-[1px] text-dim">
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-gold align-middle" />
      Last updated {formatAgo(seconds)}
    </div>
  );
}
