import { Oswald, Inter, IBM_Plex_Mono } from 'next/font/google';
import '../components/site-nav.css';
import './styles.css';

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-oswald',
});
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
});
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
});

export const metadata = {
  title: 'RISE Staking Pool — Dashboard',
  openGraph: {
    type: 'website',
    title: 'Infinity Rising — RISE Tracker',
    description: 'RISE Token Ecosystem Dashboard. Cardano · Base · Flows · Rewards.',
    images: ['https://rise-underground.github.io/assets/rise_tracker.jpg'],
    url: 'https://rise-underground.github.io/rise_tracker.html',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/RISE_UG_LOGO_Transparent.png',
  },
};

export default function RiseTrackerLayout({ children }) {
  return (
    <div className={`${oswald.variable} ${inter.variable} ${plexMono.variable}`}>
      {children}
    </div>
  );
}
