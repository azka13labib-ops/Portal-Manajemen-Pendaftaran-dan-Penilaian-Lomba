/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ClipboardList,
  Inbox,
  User,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface RegistrationsListClientProps {
  registrations: any[];
}

type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const tabLabels: Record<FilterStatus, string> = {
  ALL: 'Semua',
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
};

// ─────────────────────────────────────────────
// Shared EventBannerPlaceholder
// ─────────────────────────────────────────────
function EventBannerPlaceholder({ title, bannerUrl }: { title: string; bannerUrl?: string | null }) {
  if (bannerUrl) {
    return (
      <div className="w-full h-24 relative overflow-hidden border-b border-[rgba(244,239,227,0.07)] rounded-t-2xl">
        <img src={bannerUrl} alt={title} className="w-full h-full object-cover" />
      </div>
    );
  }

  const initials = title
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="w-full h-24 relative overflow-hidden border-b border-[rgba(244,239,227,0.07)]"
      style={{ background: 'linear-gradient(135deg, #0F2547 0%, #16335E 100%)' }}
    >
      <div className="absolute inset-0 bg-dot-grid" />
      <span
        className="absolute bottom-1 right-2 text-5xl font-extrabold leading-none select-none pointer-events-none"
        style={{ color: 'rgba(244,239,227,0.07)', fontFamily: 'var(--font-display)' }}
      >
        {initials}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Registration Card
// ─────────────────────────────────────────────
function RegistrationCard({ reg }: { reg: any }) {
  const event = reg.events || {};
  const isApproved = reg.status === 'APPROVED';
  const registeredDate = new Date(reg.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const statusLabel =
    reg.status === 'APPROVED' ? 'Pendaftaran Disetujui' :
    reg.status === 'PENDING' ? 'Menunggu Verifikasi' :
    'Pendaftaran Ditolak';

  const statusClass =
    reg.status === 'APPROVED' ? 'badge-approved' :
    reg.status === 'PENDING' ? 'badge-pending' :
    'badge-rejected';

  return (
    <Card className="overflow-hidden flex flex-col group hover:border-[rgba(244,239,227,0.18)] transition-all bg-[rgba(15,37,71,0.55)]" padding="none">
      <EventBannerPlaceholder title={event.title ?? 'Lomba'} bannerUrl={event.banner_url} />

      <div className="p-4 sm:p-5 flex-1 flex flex-col space-y-4">
        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap -mt-1">
          <span className="badge-category text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full">
            {event.category || 'Lomba'}
          </span>
          <span className="badge-category text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
            {reg.team_id ? <><Users size={9} />Kelompok</> : <><User size={9} />Individu</>}
          </span>
        </div>

        {/* Title & Secondary Info */}
        <div className="space-y-1">
          <h3 className="font-bold text-[#F4EFE3] text-sm sm:text-base line-clamp-2 group-hover:text-[#E8E0CC] transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
            {event.title ?? '—'}
          </h3>
          <p className="text-xs text-[#9CA8BD] line-clamp-1">
            {reg.team_id && reg.teams?.name ? `Tim: ${reg.teams.name} • ` : 'Individu • '}
            Terdaftar: {registeredDate}
          </p>
        </div>

        {/* Status & Rejection Note */}
        <div className="flex-1 space-y-2">
          <span className={`inline-block px-2 py-1 rounded text-[10px] font-semibold ${statusClass}`}>
            {statusLabel}
          </span>
          {reg.status === 'REJECTED' && (
            <p className="text-[10px] text-[#D98C8C] mt-1 leading-snug">
              Alasan: {reg.rejection_note || 'Dokumen tidak lengkap.'}
            </p>
          )}
        </div>

        {/* Footer Action */}
        <div className="border-t border-[rgba(244,239,227,0.07)] pt-4 mt-auto">
          {isApproved ? (
            <Link href={`/participant/registrations/${reg.id}`} className="block w-full">
              <Button variant="primary" size="sm" className="w-full justify-center">
                Detail &amp; Upload Karya
              </Button>
            </Link>
          ) : (
            <Link href={`/participant/registrations/${reg.id}`} className="block w-full">
              <Button variant="secondary" size="sm" className="w-full justify-center">
                Lihat Detail Pendaftaran
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

export function RegistrationsListClient({ registrations }: RegistrationsListClientProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const event = reg.events || {};
      const matchesSearch =
        event.title?.toLowerCase().includes(search.toLowerCase()) ||
        event.category?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || reg.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [registrations, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-6 relative overflow-hidden noise-overlay">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(22,51,94,0.30)] rounded-full blur-3xl -z-10" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(244,239,227,0.08)] text-[#F4EFE3] flex items-center justify-center border border-[rgba(244,239,227,0.12)]">
            <ClipboardList size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#F4EFE3]" style={{ fontFamily: 'var(--font-display)' }}>
              Pendaftaran Saya
            </h1>
            <p className="text-xs text-[#9CA8BD] mt-0.5">
              Pantau status pendaftaran lomba Anda dan kumpulkan karya yang disetujui.
            </p>
          </div>
        </div>
      </Card>

      {/* Search & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(244,239,227,0.07)] pb-5">
        <div className="flex flex-wrap gap-1">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as FilterStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                statusFilter === tab
                  ? 'bg-[#F4EFE3] text-[#0A1628]'
                  : 'text-[rgba(244,239,227,0.60)] hover:text-[#F4EFE3] hover:bg-[rgba(244,239,227,0.04)]'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Cari pendaftaran lomba..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl bg-[rgba(15,37,71,0.60)] border border-[rgba(244,239,227,0.10)] text-xs px-3 pl-10 text-[#F4EFE3] placeholder:text-[#6B7A9A] focus:outline-none focus:border-[rgba(244,239,227,0.25)] transition-colors"
          />
          <Search size={14} className="absolute left-3.5 top-3 text-[#6B7A9A]" />
        </div>
      </div>

      <div className="text-xs text-[#9CA8BD] font-medium -mt-3">
        {filteredRegistrations.length} pendaftaran ditemukan
      </div>

      {/* Grid List */}
      <AnimatePresence mode="wait">
        {filteredRegistrations.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredRegistrations.map((reg) => (
              <RegistrationCard key={reg.id} reg={reg} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="py-12"
          >
            <Card className="p-8 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-[rgba(244,239,227,0.06)] flex items-center justify-center mx-auto text-[rgba(244,239,227,0.35)]">
                <Inbox size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-[#F4EFE3] text-sm">Tidak Ada Pendaftaran</h3>
                <p className="text-xs text-[#9CA8BD] leading-normal">
                  {statusFilter === 'ALL'
                    ? 'Anda belum mendaftar di kompetisi apa pun saat ini.'
                    : 'Tidak ada pendaftaran dengan status ini.'}
                </p>
              </div>
              {statusFilter === 'ALL' && (
                <Link href="/">
                  <Button variant="secondary" size="sm" className="mt-2">
                    Jelajahi Kompetisi
                  </Button>
                </Link>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
