import { Oswald, IBM_Plex_Mono } from 'next/font/google';
import '../components/site-nav.css';
import './styles.css';

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
  title: 'Infinity Rising Almanac — Rise Underground',
  openGraph: {
    type: 'website',
    title: 'RISE Underground — IR Almanac',
    description: 'Every milestone. One place. Features · AMAs · Partnerships.',
    images: ['https://rise-underground.github.io/assets/almanac.jpg'],
    url: 'https://rise-underground.github.io/ir_almanac.html',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/RISE_UG_LOGO_Transparent.png',
  },
};

export default function IrAlmanacLayout({ children }) {
  return (
    <div className={`${oswald.variable} ${plexMono.variable}`}>
      {children}
    </div>
  );
}
