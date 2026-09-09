import { Rajdhani, Inter, JetBrains_Mono } from 'next/font/google';
import './styles.css';

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-rajdhani',
});
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains-mono',
});

export const metadata = {
  title: 'Rise Underground presents: Leaders of the Leaderboards',
  openGraph: {
    type: 'website',
    title: 'RISE Underground — Leaders of the Leaderboards',
    description: 'Calido Valley · AeroTrails · Holocache. Where do you stand?',
    images: ['https://rise-underground.github.io/assets/leaderboards.jpg'],
    url: 'https://rise-underground.github.io/leaderboard.html',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/RISE_UG_LOGO_Transparent.png',
  },
};

export default function LeaderboardLayout({ children }) {
  return (
    <div className={`${rajdhani.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      {children}
    </div>
  );
}
