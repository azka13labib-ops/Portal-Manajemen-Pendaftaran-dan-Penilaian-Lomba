/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, Check, X, User, Users, Clock, Upload, ClipboardCheck, UserPlus
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface ParticipantDashboardClientProps {
  registrations: any[];
  invitations: any[];
  availableEvents: any[];
  submissionCount?: number;
  certificateCount?: number;
}

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
// Dashboard Event Card
// ─────────────────────────────────────────────

function DashboardEventCard({ reg }: { reg: any }) {
  const event = reg.events;
  const isApproved = reg.status === 'APPROVED';

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
      <EventBannerPlaceholder title={event?.title ?? 'Lomba'} bannerUrl={event?.banner_url} />

      <div className="p-4 sm:p-5 flex-1 flex flex-col space-y-4">
        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap -mt-1">
          <span className="badge-category text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full">
            {event?.category || 'Lomba'}
          </span>
          <span className="badge-category text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
            {reg.team_id ? <><Users size={9} />Kelompok</> : <><User size={9} />Individu</>}
          </span>
        </div>

        {/* Title & Secondary Info */}
        <div className="space-y-1">
          <h3 className="font-bold text-[#F4EFE3] text-sm sm:text-base line-clamp-2 group-hover:text-[#E8E0CC] transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
            {event?.title ?? '—'}
          </h3>
          <p className="text-xs text-[#9CA8BD] line-clamp-1">
            {reg.team_id && reg.teams?.name ? `Tim: ${reg.teams.name}` : 'Individu'}
          </p>
        </div>

        {/* Status & Extra Info */}
        <div className="flex-1 space-y-2">
          <span className={`inline-block px-2 py-1 rounded text-[10px] font-semibold ${statusClass}`}>
            {statusLabel}
          </span>
          {event?.submission_close_at && (
            <p className="text-[10px] text-[#6B7A9A]">
              Batas Upload: {new Date(event.submission_close_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Footer Action */}
        <div className="border-t border-[rgba(244,239,227,0.07)] pt-4 mt-auto">
          {isApproved ? (
            <Link href={`/participant/registrations/${reg.id}`} className="block w-full">
              <Button variant="primary" size="sm" className="w-full justify-center">
                Kumpulkan Karya
              </Button>
            </Link>
          ) : (
            <Button variant="primary" size="sm" className="w-full justify-center opacity-50" disabled>
              Kumpulkan Karya
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Activity feed helpers
// ─────────────────────────────────────────────

type ActivityType = 'register' | 'approve' | 'reject' | 'upload';

interface ActivityItem {
  id: string;
  type: ActivityType;
  text: string;
  createdAt: string; // ISO
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const activityMeta: Record<ActivityType, { icon: React.ReactNode; color: string }> = {
  register: { icon: <UserPlus size={13} />, color: 'bg-[rgba(156,168,189,0.12)] text-[#9CA8BD]' },
  approve: { icon: <ClipboardCheck size={13} />, color: 'bg-[rgba(143,196,169,0.12)] text-[#8FC4A9]' },
  reject: { icon: <AlertCircle size={13} />, color: 'bg-[rgba(217,140,140,0.12)] text-[#D98C8C]' },
  upload: { icon: <Upload size={13} />, color: 'bg-[rgba(216,178,107,0.12)] text-[#D8B26B]' },
};

function ActivityFeedItem({ item }: { item: ActivityItem }) {
  const meta = activityMeta[item.type];
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${meta.color}`}>
        {meta.icon}
      </div>
      <p className="flex-1 text-xs text-[#9CA8BD] leading-relaxed min-w-0">{item.text}</p>
      <span className="text-[10px] text-[#6B7A9A] shrink-0 whitespace-nowrap flex items-center gap-1">
        <Clock size={9} />{timeAgo(item.createdAt)}
      </span>
    </div>
  );
}

function buildActivityFeed(registrations: any[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const reg of registrations) {
    const eventTitle = reg.events?.title ?? 'lomba';
    items.push({ id: `reg-${reg.id}`, type: 'register', text: `Anda mendaftar lomba "${eventTitle}"`, createdAt: reg.created_at });
    if (reg.status === 'APPROVED') {
      items.push({ id: `approve-${reg.id}`, type: 'approve', text: `Pendaftaran untuk lomba "${eventTitle}" disetujui`, createdAt: reg.updated_at ?? reg.created_at });
    } else if (reg.status === 'REJECTED') {
      items.push({ id: `reject-${reg.id}`, type: 'reject', text: `Pendaftaran untuk lomba "${eventTitle}" ditolak`, createdAt: reg.updated_at ?? reg.created_at });
    }
  }
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export function ParticipantDashboardClient({
  registrations: initialRegs,
  invitations: initialInvites,
  submissionCount = 0,
  certificateCount = 0,
}: ParticipantDashboardClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const registrations = initialRegs;
  const [invitations, setInvitations] = useState(initialInvites);
  const [loading, setLoading] = useState(false);

  const activityFeed = buildActivityFeed(registrations);

  const handleAcceptInvite = async (invite: any) => {
    setLoading(true);
    try {
      const { error: memberErr } = await supabase
        .from('team_members')
        .update({ status: 'CONFIRMED', confirmed_at: new Date().toISOString() })
        .eq('team_id', invite.team_id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      if (memberErr) throw memberErr;
      setInvitations(invitations.filter((inv) => inv.team_id !== invite.team_id));
      toast({ type: 'success', title: 'Undangan Diterima', message: `Bergabung dengan tim ${invite.teams.name}.` });
      router.refresh();
    } catch (err: any) {
      toast({ type: 'error', title: 'Gagal', message: err.message || 'Terjadi kesalahan.' });
    } finally { setLoading(false); }
  };

  const handleDeclineInvite = async (invite: any) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'DECLINED' })
        .eq('team_id', invite.team_id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      if (error) throw error;
      setInvitations(invitations.filter((inv) => inv.team_id !== invite.team_id));
      toast({ type: 'info', title: 'Undangan Ditolak', message: 'Undangan tim ditolak.' });
    } catch (err: any) {
      toast({ type: 'error', title: 'Gagal', message: err.message || 'Terjadi kesalahan.' });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner + Stat Row ── */}
      <Card className="p-6 relative overflow-hidden noise-overlay">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(31,67,115,0.25)] rounded-full blur-3xl -z-10" />
        <h1 className="text-2xl font-bold text-[#F4EFE3]" style={{ fontFamily: 'var(--font-display)' }}>
          Selamat Datang di Portal Lomba!
        </h1>
        <p className="text-xs text-[#9CA8BD] mt-1 max-w-xl">
          Pantau kompetisi yang Anda ikuti, kumpulkan karya terbaik, dan unduh sertifikat bukti pencapaian.
        </p>

        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: 'Lomba Diikuti', value: registrations.length },
            { label: 'Karya Terkumpul', value: submissionCount },
            { label: 'Sertifikat', value: certificateCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#0F2547] border border-[rgba(244,239,227,0.08)] rounded-xl px-4 py-3 text-center"
            >
              <p className="text-2xl font-bold text-[#F4EFE3]" style={{ fontFamily: 'var(--font-display)' }}>
                {stat.value}
              </p>
              <p className="text-[10px] text-[#9CA8BD] mt-0.5 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Invitations Alert ── */}
      {invitations.length > 0 && (
        <Card className="p-4 border-[rgba(244,239,227,0.15)] bg-[rgba(244,239,227,0.03)] space-y-3">
          <div className="flex items-center gap-2 text-[#F4EFE3] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#F4EFE3] animate-pulse" />
            Anda mendapat {invitations.length} Undangan Tim baru!
          </div>
          <div className="grid gap-2">
            {invitations.map((inv) => (
              <div key={inv.team_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[rgba(15,37,71,0.60)] border border-[rgba(244,239,227,0.08)] text-xs gap-3">
                <div>
                  <p className="font-semibold text-[#F4EFE3]">
                    Gabung Tim: <span className="font-bold">{inv.teams?.name}</span>
                  </p>
                  <p className="text-[10px] text-[#9CA8BD] mt-0.5">Untuk Event: {inv.teams?.events?.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleDeclineInvite(inv)} disabled={loading}
                    leftIcon={<X size={12} />} className="text-[#D98C8C] hover:bg-[rgba(217,140,140,0.08)]">
                    Tolak
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleAcceptInvite(inv)} disabled={loading}
                    leftIcon={<Check size={12} />}>
                    Gabung Tim
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Kompetisi yang Saya Ikuti (Grid) ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#F4EFE3]" style={{ fontFamily: 'var(--font-display)' }}>
          Kompetisi yang Saya Ikuti
        </h2>

        {registrations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {registrations.map((reg) => (
              <DashboardEventCard key={reg.id} reg={reg} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-[#9CA8BD] text-sm rounded-xl border border-[rgba(244,239,227,0.07)] bg-[rgba(15,37,71,0.30)]">
            Anda belum mendaftar kompetisi apa pun.{' '}
            <Link href="/" className="text-[#F4EFE3] underline underline-offset-2 hover:text-[#E8E0CC]">
              Jelajahi event sekarang
            </Link>
          </div>
        )}
      </section>

      {/* ── Aktivitas Terbaru ── */}
      {activityFeed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#F4EFE3]" style={{ fontFamily: 'var(--font-display)' }}>
            Aktivitas Terbaru
          </h2>
          <Card className="px-5 py-1 divide-y divide-[rgba(244,239,227,0.06)]">
            {activityFeed.map((item) => (
              <ActivityFeedItem key={item.id} item={item} />
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
