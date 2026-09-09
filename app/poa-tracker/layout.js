import { Oswald, IBM_Plex_Mono, Inter } from 'next/font/google';
import '../components/site-nav.css';
import './styles.css';

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-oswald',
});
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-mono',
});
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'RISE POA Tracker',
  openGraph: {
    type: 'website',
    title: 'RISE Underground — POA Tracker',
    description: 'Mint Distribution · Rarity Intel. Know your odds before you mint.',
    images: ['https://rise-underground.github.io/assets/poa_tracker.jpg'],
    url: 'https://rise-underground.github.io/poa_tracker.html',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/RISE_UG_LOGO_Transparent.png',
  },
};

export default function PoaTrackerLayout({ children }) {
  return (
    <div className={`${oswald.variable} ${plexMono.variable} ${inter.variable}`}>
      {children}
    </div>
  );
}
