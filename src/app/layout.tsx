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
  title: {
    default: 'Portal Lomba — Sistem Manajemen Kompetisi',
    template: '%s | Portal Lomba',
  },
  description:
    'Platform terpusat untuk pendaftaran, pengumpulan karya, penilaian, dan pengumuman kompetisi secara profesional dan efisien.',
  keywords: ['lomba', 'kompetisi', 'pendaftaran', 'penilaian', 'sertifikat'],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Portal Lomba',
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
