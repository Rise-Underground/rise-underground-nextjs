import {
  Oswald,
  Rajdhani,
  Space_Grotesk,
  Inter,
  JetBrains_Mono,
  IBM_Plex_Mono,
} from "next/font/google";

// Two font sub-families across the site's pages -- see .claude/DESIGN-SYSTEM.md's Typography
// section for the full breakdown of which family is used where.
//   "vault" pages (home, POA tracker, almanac)   -> Oswald + IBM Plex Mono
//   "dashboard" pages (leaderboard, RISE tracker) -> Rajdhani/Space Grotesk + JetBrains Mono
// Inter is loaded but not currently applied anywhere as a default body font -- see
// DESIGN-SYSTEM.md's "Known gap" note.

export const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const fontVariables = [
  oswald.variable,
  rajdhani.variable,
  spaceGrotesk.variable,
  inter.variable,
  jetbrainsMono.variable,
  ibmPlexMono.variable,
].join(" ");
