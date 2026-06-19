/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy, AlertCircle, ChevronRight, Inbox, Check, X
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
}

export function ParticipantDashboardClient({
  registrations: initialRegs,
  invitations: initialInvites,
  availableEvents,
}: ParticipantDashboardClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const registrations = initialRegs;
  const [invitations, setInvitations] = useState(initialInvites);
  const [loading, setLoading] = useState(false);

  // Handle accepting team invitation
  const handleAcceptInvite = async (invite: any) => {
    setLoading(true);
    try {
      // 1. Confirm member status in team_members
      const { error: memberErr } = await supabase
        .from('team_members')
        .update({ status: 'CONFIRMED', confirmed_at: new Date().toISOString() })
        .eq('team_id', invite.team_id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (memberErr) throw memberErr;

      // 2. Insert record in registrations table for this user & event
      const { error: regErr } = await supabase
        .from('registrations')
        .insert({
          event_id: invite.teams.event_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          team_id: invite.team_id,
          status: 'PENDING', // Will wait for admin approval
        });

      if (regErr) throw regErr;

      setInvitations(invitations.filter((inv) => inv.team_id !== invite.team_id));
      toast({
        type: 'success',
        title: 'Undangan Diterima',
        message: `Anda sekarang bergabung dengan tim ${invite.teams.name}. Pendaftaran Anda menunggu verifikasi.`,
      });
      router.refresh();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Gagal Menerima Undangan',
        message: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle declining team invitation
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
      toast({
        type: 'info',
        title: 'Undangan Ditolak',
        message: 'Undangan tim berhasil ditolak.',
      });
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Gagal Menolak Undangan',
        message: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="p-6 relative overflow-hidden noise-overlay">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
          Selamat Datang di Portal Lomba!
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Temukan kompetisi yang menarik, daftarkan diri Anda secara individu maupun tim, kumpulkan karya terbaik Anda, 
          dan unduh sertifikat bukti pencapaian Anda.
        </p>
      </Card>

      {/* Invitations Alert */}
      {invitations.length > 0 && (
        <Card className="p-4 border-blue-500/25 bg-blue-600/5 space-y-3">
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold">
            <Inbox size={16} /> Anda mendapat {invitations.length} Undangan Tim baru!
          </div>
          <div className="grid gap-2">
            {invitations.map((inv) => (
              <div key={inv.team_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs gap-3">
                <div>
                  <p className="font-semibold text-slate-200">
                    Gabung Tim: <span className="text-blue-400 font-bold">{inv.teams?.name}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Untuk Event: {inv.teams?.events?.title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeclineInvite(inv)}
                    disabled={loading}
                    leftIcon={<X size={12} />}
                    className="text-red-400 hover:text-red-300"
                  >
                    Tolak
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAcceptInvite(inv)}
                    disabled={loading}
                    leftIcon={<Check size={12} />}
                  >
                    Gabung Tim
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Side: Registered Events */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
            Kompetisi yang Saya Ikuti
          </h2>

          <div className="grid gap-4">
            {registrations.map((reg) => {
              const event = reg.events;
              const hasSub = reg.status === 'APPROVED';
              
              return (
                <Card key={reg.id} className="p-5 hover:border-[rgba(93,138,205,0.3)] transition-all">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/40 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider bg-blue-600/10 px-2 py-0.5 rounded">
                            {event?.category || 'Lomba'}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            reg.status === 'APPROVED' ? 'badge-approved' :
                            reg.status === 'PENDING' ? 'badge-pending' :
                            'badge-rejected'
                          }`}>
                            {reg.status === 'APPROVED' ? 'Pendaftaran Disetujui' :
                             reg.status === 'PENDING' ? 'Menunggu Verifikasi' :
                             'Pendaftaran Ditolak'}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-200 text-sm mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                          {event?.title}
                        </h3>
                        <p className="text-[10px] text-slate-500">
                          Mode: {reg.team_id ? `Kelompok (Tim: ${reg.teams?.name})` : '👤 Individu'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        {hasSub && (
                          <Link href={`/participant/registrations/${reg.id}`}>
                            <Button variant="primary" size="sm" rightIcon={<ChevronRight size={12} />}>
                              Kumpulkan Karya
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Rejection Note */}
                    {reg.status === 'REJECTED' && (
                      <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 flex gap-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Alasan Penolakan:</p>
                          <p className="text-slate-400 mt-0.5">{reg.rejection_note || 'Tidak ada catatan.'}</p>
                        </div>
                      </div>
                    )}

                    {/* Timeline Tracker */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>Batas Upload Karya: {new Date(event?.submission_close_at).toLocaleDateString('id-ID')}</span>
                      {event?.status === 'FINALIZED' && (
                        <span className="text-amber-400 flex items-center gap-0.5">
                          <Trophy size={10} /> Live Juara diumumkan!
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {registrations.length === 0 && (
              <Card className="p-8 text-center text-slate-500 text-sm">
                Anda belum mendaftar kompetisi apa pun. Jelajahi event yang tersedia di bawah ini untuk memulai!
              </Card>
            )}
          </div>
        </div>

        {/* Right Side: Available Competitions */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
            Eksplor Lomba Baru
          </h2>

          <div className="grid gap-4">
            {availableEvents.map((event) => (
              <Card key={event.id} className="p-4 space-y-3.5 hover:border-[rgba(93,138,205,0.25)] transition-all">
                <div className="space-y-1">
                  <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wider bg-blue-600/10 px-2 py-0.5 rounded">
                    {event.category || 'Lomba'}
                  </span>
                  <h3 className="font-bold text-slate-200 text-xs mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                    {event.title}
                  </h3>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-800/40 pt-3 text-[10px] text-slate-500">
                  <span className="font-medium">Deadline: {new Date(event.registration_close_at).toLocaleDateString('id-ID')}</span>
                  <Link href={`/participant/register-event/${event.id}`}>
                    <Button variant="secondary" size="sm" rightIcon={<ChevronRight size={10} />}>
                      Daftar
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}

            {availableEvents.length === 0 && (
              <Card className="p-6 text-center text-slate-500 text-xs">
                Tidak ada event baru yang dibuka untuk pendaftaran saat ini.
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
