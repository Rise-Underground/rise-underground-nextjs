"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/poa-tracker", label: "POA Tracker" },
  { href: "/almanac", label: "IR Almanac" },
  { href: "/leaderboard", label: "Leaderboards" },
  { href: "/rise-tracker", label: "Rise Tracker" },
] as const;

export function SiteNav({
  current,
  title,
  right,
}: {
  current: (typeof LINKS)[number]["href"];
  /** Page-specific brand mark shown beside the logo (e.g. "RISE POA Tracker"). Defaults to "Rise Underground". */
  title?: string;
  /** Optional page-specific extra rendered next to the nav links (e.g. leaderboard's season tag). */
  right?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-void/92 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-7">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="RISE Underground home">
          <Image
            src="/RISE_UG_LOGO_Transparent.png"
            alt="Rise Underground"
            width={160}
            height={67}
            className="h-10 w-auto [filter:drop-shadow(0_0_14px_rgba(224,32,43,0.5))] sm:h-12"
            priority
          />
          <span className="flex flex-col">
            <span className="font-oswald text-sm font-bold tracking-[0.05em] text-ink uppercase sm:text-base">
              {title ?? "Rise Underground"}
            </span>
            <span className="hidden font-jetbrains-mono text-[11px] tracking-[0.1em] text-dim uppercase sm:block">
              Operating in the shadows
            </span>
          </span>
        </Link>

        <nav
          aria-label="Site"
          className="hidden flex-wrap items-center gap-2 font-rajdhani text-[13px] font-semibold uppercase tracking-[0.06em] md:flex"
        >
          {LINKS.map((link) => {
            const isCurrent = link.href === current;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isCurrent ? "page" : undefined}
                className={
                  "inline-flex items-center rounded-[3px] border px-3.5 py-1.5 transition-colors " +
                  (isCurrent
                    ? "border-ink text-ink"
                    : "border-line text-ink hover:border-gold hover:text-gold")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] border border-line text-ink transition-colors hover:border-gold hover:text-gold md:hidden"
        >
          {open ? (
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* fixed-height slot, always rendered, so the main bar above never shifts whether or not a page passes `right` */}
      {
        right && <div className="hidden h-[27px] items-center justify-end px-5 pb-4 sm:px-7 md:flex">{right}</div>
      }

      {open && (
        <nav
          aria-label="Site (mobile)"
          className="flex flex-col gap-2 border-t border-line px-5 py-4 font-rajdhani text-sm font-semibold uppercase tracking-[0.06em] md:hidden"
        >
          {LINKS.map((link) => {
            const isCurrent = link.href === current;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isCurrent ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={
                  "rounded-[3px] border px-4 py-2.5 transition-colors " +
                  (isCurrent ? "border-gold text-gold bg-gold/10" : "border-line text-ink hover:border-gold hover:text-gold")
                }
              >
                {link.label}
              </Link>
            );
          })}
          {right && <div className="py-1">{right}</div>}
        </nav>
      )}
    </header>
  );
}
