import type { Metadata } from "next";
import Link from "next/link";
import { LogoVideo } from "@/components/home/LogoVideo";
import { ScanlineOverlay } from "@/components/shared/ScanlineOverlay";
import { SITE_NAME } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "RISE Underground — Access",
  description: "Trackers, Almanac, Leaderboards. Operating in the shadows.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "RISE Underground — Access",
    description: "Trackers, Almanac, Leaderboards. Operating in the shadows.",
    url: "/",
    images: ["/assets/Index.jpg"],
  },
};

interface MenuItem {
  label: string;
  href: string;
  external?: boolean;
  built: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { label: "POA Tracker", href: "/poa-tracker", built: true },
  { label: "RISE Tracker", href: "/rise-tracker", built: true },
  { label: "Leader of the Leader Boards", href: "/leaderboard", built: true },
  { label: "Infinity Rising Almanac", href: "/almanac", built: true },
  { label: "Infinity Rising Hub", href: "https://infinity-rising-hub.vercel.app/", external: true, built: true },
];

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center">
      <ScanlineOverlay />

      <div className="z-[2] flex w-full max-w-[720px] flex-col items-center px-5 pt-[6vh] pb-[4vh]">
        <div className="relative aspect-[854/480] w-[min(88vw,640px)]">
          <LogoVideo />
        </div>

        <nav
          aria-label="Main menu"
          className="mt-12 flex w-full max-w-[460px] translate-y-3.5 flex-col items-stretch gap-3.5 opacity-0 animate-[rise-in_0.9s_cubic-bezier(0.2,0.8,0.2,1)_3s_forwards] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:animate-none"
        >
          <div className="mb-1 flex items-center gap-2.5 font-jetbrains-mono text-[10px] tracking-[0.3em] text-gold uppercase">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-bright to-transparent opacity-50" />
            Access
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-bright to-transparent opacity-50" />
          </div>

          {MENU_ITEMS.map((item) => {
            const content = (
              <>
                <span>{item.label}</span>
                {item.built ? (
                  <span className="text-lg text-dim transition-transform">&rarr;</span>
                ) : (
                  <span className="font-oswald text-[10px] tracking-[0.1em] text-dim uppercase">Coming soon</span>
                )}
              </>
            );
            const className =
              "group flex items-center justify-between border px-[22px] py-[18px] font-oswald text-base font-medium tracking-[0.06em] uppercase transition-[border-color,background,padding-left] " +
              (item.built
                ? "cursor-pointer border-gold/35 bg-gradient-to-b from-white/[0.03] to-black/20 text-ink hover:border-gold-bright hover:bg-gradient-to-b hover:from-gold/[0.14] hover:to-black/25 hover:pl-7 [&:hover_span:last-child]:translate-x-1 [&:hover_span:last-child]:text-gold-bright"
                : "cursor-default border-gold/15 bg-gradient-to-b from-white/[0.03] to-black/20 text-ink opacity-55");
            return item.external ? (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
                {content}
              </a>
            ) : item.built ? (
              <Link key={item.label} href={item.href} className={className}>
                {content}
              </Link>
            ) : (
              <span key={item.label} className={className}>
                {content}
              </span>
            );
          })}
        </nav>
      </div>

      <footer className="z-[2] mt-auto flex flex-col items-center gap-3.5 px-5 pt-7 pb-5 opacity-0 animate-[rise-in_0.8s_ease-out_3.3s_forwards] motion-reduce:opacity-100 motion-reduce:animate-none">
        <div className="flex gap-4">
          <a
            href="https://x.com/RiseUGX"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="RISE Underground on X"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-gold/25 text-dim transition-colors hover:border-gold-bright hover:bg-gold/[0.08] hover:text-gold-bright"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
