/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, Calendar, ArrowRight, Sparkles, Search, Filter, Zap, Palette, Code, PenTool, Rocket, User, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface LandingClientProps {
  events: any[];
  isLoggedIn: boolean;
  userRole: string;
  userName: string;
}

const CATEGORIES = [
  { value: '', label: 'Semua Kategori' },
  { value: 'desain', label: 'Desain', icon: <Palette size={14} className="inline mr-1" /> },
  { value: 'programming', label: 'Programming', icon: <Code size={14} className="inline mr-1" /> },
  { value: 'esai', label: 'Esai', icon: <PenTool size={14} className="inline mr-1" /> },
  { value: 'inovasi', label: 'Inovasi', icon: <Rocket size={14} className="inline mr-1" /> },
];

/** BUG #5: Generate a stable gradient + dot-grid placeholder from the event title */
function EventBannerPlaceholder({ title }: { title: string }) {
  const initials = title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="w-full h-32 relative overflow-hidden border-b border-[rgba(244,239,227,0.07)]"
      style={{ background: 'linear-gradient(135deg, #0F2547 0%, #16335E 100%)' }}
    >
      {/* Dot-grid texture */}
      <div className="absolute inset-0 bg-dot-grid" />
      {/* Large subtle initial letter(s) — top-right decorative */}
      <span
        className="absolute bottom-2 right-3 text-5xl font-extrabold leading-none select-none pointer-events-none"
        style={{
          color: 'rgba(244,239,227,0.07)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {initials}
      </span>
    </div>
  );
}

export function LandingClient({
  events,
  isLoggedIn,
  userRole,
  userName,
}: LandingClientProps) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  // Filter events
  const filteredEvents = events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
                          (e.description && e.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = !selectedCat || e.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  const getDashboardHref = () => {
    if (userRole === 'ADMIN') return '/admin';
    if (userRole === 'JUDGE') return '/judge';
    return '/participant';
  };

  return (
    <div className="min-h-screen bg-[#0A1628] text-[#F4EFE3] flex flex-col bg-mesh noise-overlay relative">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[rgba(22,51,94,0.35)] rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[rgba(15,37,71,0.40)] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between border-b border-[rgba(244,239,227,0.07)]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[rgba(244,239,227,0.10)] border border-[rgba(244,239,227,0.15)] flex items-center justify-center text-[#F4EFE3] font-bold">
            <Trophy size={18} />
          </div>
          <span className="font-bold text-[#F4EFE3] text-base" style={{ fontFamily: 'var(--font-display)' }}>
            Portal Lomba
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-xs text-[#9CA8BD] font-medium">
                Halo, <span className="text-[#F4EFE3] font-semibold">{userName || 'Pengguna'}</span>
              </span>
              <Link href={getDashboardHref()}>
                <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>
                  Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Masuk
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm">
                  Daftar Akun
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(244,239,227,0.15)] bg-[rgba(244,239,227,0.05)] text-[10px] font-bold text-[#F4EFE3] uppercase tracking-widest"
        >
          <Sparkles size={11} className="animate-pulse" /> Platform Kompetisi Terpusat
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-gradient"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Tunjukkan Karya Terbaik Anda <br />
          Raih Prestasi di Tingkat Nasional
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="max-w-xl mx-auto text-xs sm:text-sm text-[#9CA8BD] leading-relaxed"
        >
          Portal Lomba menyajikan kemudahan pendaftaran, kejelasan pengunggahan karya,
          penilaian transparan oleh juri profesional, serta integrasi e-sertifikat instan.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center justify-center gap-3 pt-2"
        >
          {isLoggedIn ? (
            <Link href={getDashboardHref()}>
              <Button variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
                Mulai Kompetisi
              </Button>
            </Link>
          ) : (
            <Link href="/auth/register">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
                Daftar Sekarang
              </Button>
            </Link>
          )}
          <a href="#events-section">
            <Button variant="secondary" size="lg">
              Jelajahi Lomba
            </Button>
          </a>
        </motion.div>
      </header>

      {/* Main Browse Section */}
      <section id="events-section" className="w-full max-w-7xl mx-auto px-6 py-12 flex-1 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(244,239,227,0.07)] pb-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#F4EFE3]" style={{ fontFamily: 'var(--font-display)' }}>
              Daftar Kompetisi Aktif
            </h2>
            <p className="text-xs text-[#9CA8BD]">Pilih kompetisi sesuai minat Anda dan mulailah berprestasi.</p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Cari nama kompetisi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 rounded-xl bg-[rgba(15,37,71,0.60)] border border-[rgba(244,239,227,0.10)] text-xs px-3 pl-9 text-[#F4EFE3] placeholder:text-[#6B7A9A] focus:outline-none focus:border-[rgba(244,239,227,0.25)] transition-colors"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-[#6B7A9A]" />
            </div>

            <div className="relative">
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="h-9 rounded-xl bg-[rgba(15,37,71,0.60)] border border-[rgba(244,239,227,0.10)] text-xs px-3 pr-8 text-[#F4EFE3] focus:outline-none focus:border-[rgba(244,239,227,0.25)] transition-colors appearance-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-[#0F2547]">
                    {cat.label}
                  </option>
                ))}
              </select>
              <Filter size={12} className="absolute right-3 top-3 text-[#9CA8BD] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const isRegOpen = event.status === 'OPEN';

            return (
              <Card key={event.id} className="overflow-hidden flex flex-col group hover:border-[rgba(244,239,227,0.18)] transition-all" padding="none">
                {/* BUG #5: Gradient placeholder with initials — no Trophy icon */}
                <EventBannerPlaceholder title={event.title} />

                {/* Category + Mode badges overlaid on banner top */}
                <div className="absolute top-3 left-3 flex gap-1.5 pointer-events-none"
                  style={{ position: 'relative', top: 'auto', left: 'auto' }}
                >
                </div>

                {/* Event details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4 relative">
                  {/* Badges row */}
                  <div className="flex items-center gap-1.5 flex-wrap -mt-1">
                    <span className="badge-category text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      {event.category || 'Lomba'}
                    </span>
                    <span className="badge-category text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      {event.registration_mode === 'TEAM'
                        ? <><Users size={9} />Tim</>
                        : <><User size={9} />Individu</>}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-bold text-[#F4EFE3] text-sm line-clamp-1 group-hover:text-[#E8E0CC] transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                      {event.title}
                    </h3>
                    {/* BUG #3: only render description if it exists */}
                    {event.description ? (
                      <p className="text-[11px] text-[#9CA8BD] line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#9CA8BD]">
                      <Calendar size={12} />
                      <span>Tutup Pendaftaran: {new Date(event.registration_close_at).toLocaleDateString('id-ID')}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-[rgba(244,239,227,0.07)] pt-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-semibold ${
                        event.status === 'OPEN' ? 'badge-open' : 'badge-draft'
                      }`}>
                        {event.status === 'OPEN' ? 'Pendaftaran Dibuka' : 'Ditutup'}
                      </span>

                      {isRegOpen ? (
                        <Link href={isLoggedIn ? `/participant/register-event/${event.id}` : '/auth/login'}>
                          <Button variant="primary" size="sm" rightIcon={<Zap size={10} />}>
                            Daftar Lomba
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-[10px] text-[#9CA8BD]">Pendaftaran Ditutup</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {filteredEvents.length === 0 && (
            <div className="col-span-full py-16 text-center text-[#9CA8BD] text-xs">
              Tidak ada kompetisi aktif yang sesuai dengan kriteria pencarian.
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-[rgba(244,239,227,0.07)] py-6 text-center text-[10px] text-[#6B7A9A] mt-auto">
        &copy; {new Date().getFullYear()} Portal Lomba. Hak Cipta Dilindungi.
      </footer>
    </div>
  );
}
