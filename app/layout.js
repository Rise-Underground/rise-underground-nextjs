import { Oswald, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-oswald',
});
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
});

export const metadata = {
  title: 'RISE Underground',
  openGraph: {
    type: 'website',
    title: 'RISE Underground — Access',
    description: 'Trackers, Almanac, Leaderboards. Operating in the shadows.',
    images: ['https://rise-underground.github.io/assets/Index.jpg'],
    url: 'https://rise-underground.github.io/index.html',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/RISE_UG_LOGO_Transparent.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${oswald.variable} ${plexMono.variable}`}>{children}</body>
    </html>
  );
}
