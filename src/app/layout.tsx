import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '../components/ui/Toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://portallomba.vercel.app'),
  title: {
    default: 'Portal Lomba — Platform Pendaftaran & Penilaian Kompetisi',
    template: '%s | Portal Lomba',
  },
  description:
    'Platform terpusat untuk pendaftaran lomba, pengumpulan karya, penilaian juri, dan sertifikat digital. Temukan lomba esai, desain, coding, dan kompetisi nasional terkini.',
  keywords: [
    'lomba', 'kompetisi', 'pendaftaran lomba', 'lomba nasional', 'lomba mahasiswa',
    'lomba online', 'lomba gratis bersertifikat', 'lomba esai', 'lomba desain',
    'lomba coding', 'olimpiade', 'kompetisi online', 'sertifikat digital',
    'portal lomba', 'daftar lomba', 'info lomba terbaru', 'jadwal lomba',
  ],
  authors: [{ name: 'Portal Lomba' }],
  creator: 'Portal Lomba',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Portal Lomba',
    title: 'Portal Lomba — Platform Pendaftaran & Penilaian Kompetisi',
    description:
      'Daftarkan diri atau tim Anda, submit karya terbaik, dan dapatkan sertifikat digital resmi tingkat nasional.',
    url: 'https://portallomba.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portal Lomba — Platform Pendaftaran & Penilaian Kompetisi',
    description:
      'Temukan dan daftar lomba terbaru. Gratis, bersertifikat, tingkat nasional.',
    creator: '@portallomba',
  },
  alternates: {
    canonical: 'https://portallomba.vercel.app',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <body className="antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
