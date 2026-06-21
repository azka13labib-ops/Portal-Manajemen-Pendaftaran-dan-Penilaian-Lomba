/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Upload,
  FileCheck,
  User,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import Link from 'next/link';

interface SubmissionsListClientProps {
  registrations: any[];
  submissions: any[];
}

function formatTimeRemaining(deadlineStr: string): { text: string; urgency: 'urgent' | 'soon' | 'normal' | 'past' } {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) return { text: 'Batas waktu lewat', urgency: 'past' };

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 3) return { text: `${hours < 1 ? '<1' : hours} jam lagi`, urgency: 'urgent' };
  if (hours < 24) return { text: `${hours} jam lagi`, urgency: 'soon' };
  return { text: `${days} hari lagi`, urgency: 'normal' };
}

const urgencyTextClass: Record<string, string> = {
  urgent: 'text-[#D98C8C] font-bold',
  soon: 'text-[#D8B26B] font-semibold',
  normal: 'text-[#8FC4A9]',
  past: 'text-[#6B7A9A]',
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
// Submission Card
// ─────────────────────────────────────────────
function SubmissionCard({ item }: { item: any }) {
  const event = item.events || {};
  const submission = item.submission;

  const isSubmissionClosed = new Date() > new Date(event.submission_close_at);
  const isJudgingOrFinalized = ['JUDGING', 'FINALIZED', 'ARCHIVED'].includes(event.status);
  const canSubmit = !isSubmissionClosed && !isJudgingOrFinalized;

  const { text: timeText, urgency } = formatTimeRemaining(event.submission_close_at);

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
            {item.team_id ? <><Users size={9} />Kelompok</> : <><User size={9} />Individu</>}
          </span>
        </div>

        {/* Title & Secondary Info */}
        <div className="space-y-1">
          <h3 className="font-bold text-[#F4EFE3] text-sm sm:text-base line-clamp-2 group-hover:text-[#E8E0CC] transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
            {event.title ?? '—'}
          </h3>
          <p className="text-xs text-[#9CA8BD] line-clamp-1">
            {item.team_id && item.teams?.name ? `Tim: ${item.teams.name}` : 'Individu'}
          </p>
        </div>

        {/* Status & Extra Info */}
        <div className="flex-1 space-y-2">
          {submission ? (
            <span className="inline-block px-2 py-1 rounded text-[10px] font-semibold badge-approved">
              Karya Terkumpul
            </span>
          ) : (
            <span className={`inline-block px-2 py-1 rounded text-[10px] font-semibold ${canSubmit ? 'badge-pending' : 'badge-rejected'}`}>
              {canSubmit ? 'Karya Belum Diunggah' : 'Pendaftaran Ditutup'}
            </span>
          )}
          
          {!submission && canSubmit && (
            <p className={`text-[10px] mt-1 ${urgencyTextClass[urgency]}`}>
              Sisa Waktu: {timeText}
            </p>
          )}
        </div>

        {/* Footer Action */}
        <div className="border-t border-[rgba(244,239,227,0.07)] pt-4 mt-auto">
          <Link href={`/participant/registrations/${item.id}`} className="block w-full">
            {submission ? (
              <Button variant="secondary" size="sm" className="w-full justify-center">
                {canSubmit ? 'Perbarui Karya' : 'Lihat Karya'}
              </Button>
            ) : (
              <Button variant="primary" size="sm" className="w-full justify-center" disabled={!canSubmit}>
                {canSubmit ? 'Kumpulkan Karya' : 'Ditutup'}
              </Button>
            )}
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function SubmissionsListClient({ registrations, submissions }: SubmissionsListClientProps) {
  const [search, setSearch] = useState('');

  const mappedItems = useMemo(() => {
    return registrations.map((reg) => ({
      ...reg,
      submission: submissions.find((s) => s.registration_id === reg.id) ?? null,
    }));
  }, [registrations, submissions]);

  const filteredItems = useMemo(() => {
    return mappedItems.filter((item) => {
      const event = item.events || {};
      return (
        event.title?.toLowerCase().includes(search.toLowerCase()) ||
        event.category?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [mappedItems, search]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-6 relative overflow-hidden noise-overlay">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(22,51,94,0.30)] rounded-full blur-3xl -z-10" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(244,239,227,0.08)] text-[#F4EFE3] flex items-center justify-center border border-[rgba(244,239,227,0.12)]">
            <Upload size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#F4EFE3]" style={{ fontFamily: 'var(--font-display)' }}>
              Upload Karya
            </h1>
            <p className="text-xs text-[#9CA8BD] mt-0.5">
              Kumpulkan karya terbaik Anda untuk setiap kompetisi yang pendaftarannya disetujui.
            </p>
          </div>
        </div>
      </Card>

      {/* Search & count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(244,239,227,0.07)] pb-5">
        <span className="text-xs text-[#9CA8BD] font-medium">
          {filteredItems.length} event aktif
        </span>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari event lomba..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl bg-[rgba(15,37,71,0.60)] border border-[rgba(244,239,227,0.10)] text-xs px-3 pl-10 text-[#F4EFE3] placeholder:text-[#6B7A9A] focus:outline-none focus:border-[rgba(244,239,227,0.25)] transition-colors"
          />
          <Search size={14} className="absolute left-3.5 top-3 text-[#6B7A9A]" />
        </div>
      </div>

      {/* Grid List */}
      <AnimatePresence mode="wait">
        {filteredItems.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredItems.map((item) => (
              <SubmissionCard key={item.id} item={item} />
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
                <FileCheck size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-[#F4EFE3] text-sm">Tidak Ada Event Aktif</h3>
                <p className="text-xs text-[#9CA8BD] leading-normal">
                  Hanya event dengan status pendaftaran &quot;Disetujui&quot; yang bisa dikumpulkan karyanya.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <Link href="/participant/registrations">
                  <Button variant="ghost" size="sm">Lihat Pendaftaran</Button>
                </Link>
                <Link href="/">
                  <Button variant="primary" size="sm">Jelajahi Lomba</Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
