/**
 * This site's own public URL -- used to build absolute OG/canonical URLs in metadata. Not deployed
 * yet (see SETUP.md), so this falls back to a placeholder; set NEXT_PUBLIC_SITE_URL once a real
 * domain exists and nothing else needs to change.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rise-underground.vercel.app";

export const SITE_NAME = "RISE Underground";
