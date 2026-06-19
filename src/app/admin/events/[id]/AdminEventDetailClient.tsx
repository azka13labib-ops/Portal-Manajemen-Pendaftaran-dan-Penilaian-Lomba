/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Trophy, Users, FileText, ClipboardList, CheckCircle2,
  XCircle, Award, RefreshCw, Plus, Trash2, ExternalLink,
  Sparkles, Check, Send, AlertTriangle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Event, ScoringCriteria, JudgingAssignment, LeaderboardEntry, EventStatus } from '@/types';

interface JoinedRegistration {
  id: string;
  event_id: string;
  user_id: string;
  team_id: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  rejection_note: string | null;
  docs_urls: { name: string; url: string; uploaded_at: string }[];
  created_at: string;
  updated_at: string;
  users: {
    full_name: string;
    email: string;
    institution: string | null;
  } | null;
  teams: {
    name: string;
  } | null;
}

interface FormattedJudge {
  id: string;
  full_name: string;
  email: string;
  assigned_at?: string;
}

interface JoinedSubmission {
  id: string;
  registration_id: string;
  event_id: string;
  file_url: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  external_link: string | null;
  description: string | null;
  status: 'SUBMITTED' | 'DISQUALIFIED';
  submitted_at: string;
  updated_at: string;
  registrations: {
    user_id: string;
    users: {
      full_name: string;
    } | null;
    teams: {
      name: string;
    } | null;
  } | null;
}

interface AdminEventDetailClientProps {
  event: Event;
  registrations: JoinedRegistration[];
  criteria: ScoringCriteria[];
  assignedJudges: FormattedJudge[];
  allJudges: FormattedJudge[];
  submissions: JoinedSubmission[];
  assignments: JudgingAssignment[];
}

export function AdminEventDetailClient({
  event: initialEvent,
  registrations: initialRegistrations,
  criteria,
  assignedJudges: initialAssignedJudges,
  allJudges,
  submissions: initialSubmissions,
  assignments: initialAssignments,
}: AdminEventDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'judges' | 'submissions' | 'leaderboard' | 'finalize'>('overview');
  
  // States
  const [event, setEvent] = useState<Event>(initialEvent);
  const [registrations, setRegistrations] = useState<JoinedRegistration[]>(initialRegistrations);
  const [assignedJudges, setAssignedJudges] = useState<FormattedJudge[]>(initialAssignedJudges);
  const submissions = initialSubmissions;
  const [assignments, setAssignments] = useState<JudgingAssignment[]>(initialAssignments);
  
  const [loading, setLoading] = useState(false);
  const [selectedReg, setSelectedReg] = useState<JoinedRegistration | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<EventStatus | ''>('');

  // Judge invite state
  const [judgeEmail, setJudgeEmail] = useState('');
  
  // Realtime Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Finalize state
  const [winner1, setWinner1] = useState('');
  const [winner2, setWinner2] = useState('');
  const [winner3, setWinner3] = useState('');
  const [harapan1, setHarapan1] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    Promise.resolve().then(() => setLoadingLeaderboard(true));
    try {
      const { data, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .eq('event_id', event.id);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [supabase, event.id]);

  useEffect(() => {
    if (activeTab === 'leaderboard' || activeTab === 'finalize') {
      fetchLeaderboard();
    }
  }, [activeTab, fetchLeaderboard]);

  // Subscribe to real-time score updates
  useEffect(() => {
    const channel = supabase
      .channel('scores-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores' },
        () => {
          if (activeTab === 'leaderboard' || activeTab === 'finalize') {
            fetchLeaderboard();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, fetchLeaderboard, supabase]);

  // Handle Event Status Transition
  const handleStatusTransition = async () => {
    if (!targetStatus) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: targetStatus, updated_at: new Date().toISOString() })
        .eq('id', event.id);

      if (error) throw error;
      
      setEvent({ ...event, status: targetStatus as EventStatus });
      toast({
        type: 'success',
        title: 'Status Berhasil Diperbarui',
        message: `Event sekarang berstatus ${targetStatus}`,
      });
      setIsStatusConfirmOpen(false);
      router.refresh();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Gagal Memperbarui Status',
        message: (err as Error).message || 'Terjadi kesalahan.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration Verification
  const handleVerifyRegistration = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedReg) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          status,
          rejection_note: status === 'REJECTED' ? rejectionNote : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedReg.id);

      if (error) throw error;

      setRegistrations(
        registrations.map((r) =>
          r.id === selectedReg.id
            ? { ...r, status, rejection_note: status === 'REJECTED' ? rejectionNote : null }
            : r
        )
      );

      toast({
        type: 'success',
        title: status === 'APPROVED' ? 'Pendaftaran Disetujui' : 'Pendaftaran Ditolak',
        message: `Status pendaftaran peserta ${selectedReg.users?.full_name} telah diperbarui.`,
      });
      setIsVerifyModalOpen(false);
      setSelectedReg(null);
      setRejectionNote('');
      router.refresh();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Gagal Memperbarui Pendaftaran',
        message: (err as Error).message || 'Terjadi kesalahan.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Judge Invitation/Assignment
  const handleAssignJudge = async (judgeId: string) => {
    try {
      const { error } = await supabase
        .from('event_judges')
        .insert({
          event_id: event.id,
          judge_id: judgeId,
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      const judgeInfo = allJudges.find((j) => j.id === judgeId);
      if (judgeInfo) {
        setAssignedJudges([...assignedJudges, { ...judgeInfo, assigned_at: new Date().toISOString() }]);
      }

      toast({
        type: 'success',
        title: 'Juri Ditambahkan',
        message: 'Juri berhasil ditugaskan ke event ini.',
      });
    } catch (err) {
      toast({
        type: 'error',
        title: 'Gagal Menambahkan Juri',
        message: (err as Error).message || 'Terjadi kesalahan.',
      });
    }
  };

  const handleRemoveJudge = async (judgeId: string) => {
    try {
      const { error } = await supabase
        .from('event_judges')
        .delete()
        .eq('event_id', event.id)
        .eq('judge_id', judgeId);

      if (error) throw error;

      setAssignedJudges(assignedJudges.filter((j) => j.id !== judgeId));

      toast({
        type: 'success',
        title: 'Juri Dihapus',
        message: 'Tugas juri untuk event ini telah dicabut.',
      });
    } catch (err) {
      toast({
        type: 'error',
        title: 'Gagal Menghapus Juri',
        message: (err as Error).message || 'Terjadi kesalahan.',
      });
    }
  };

  const handleInviteJudgeByEmail = async () => {
    if (!judgeEmail.trim()) return;
    setLoading(true);
    try {
      // Find user in users table by email
      const { data: userRecord, error: userErr } = await supabase
        .from('users')
        .select('*')
        .eq('email', judgeEmail.trim())
        .single();

      if (userErr || !userRecord) {
        toast({
          type: 'warning',
          title: 'User Tidak Ditemukan',
          message: 'Email belum terdaftar. Minta Juri mendaftar akun di portal terlebih dahulu.',
        });
        setLoading(false);
        return;
      }

      // Upgrade role to JUDGE (if not already)
      const { data: roleRecord } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'JUDGE')
        .single();

      if (roleRecord) {
        await supabase
          .from('user_roles')
          .upsert({ user_id: userRecord.id, role_id: roleRecord.id });
      }

      // Add to event_judges
      const { error: assignErr } = await supabase
        .from('event_judges')
        .insert({
          event_id: event.id,
          judge_id: userRecord.id,
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (assignErr) throw assignErr;

      setAssignedJudges([
        ...assignedJudges,
        { id: userRecord.id, full_name: userRecord.full_name, email: userRecord.email, assigned_at: new Date().toISOString() },
      ]);
      setJudgeEmail('');
      toast({
        type: 'success',
        title: 'Juri Berhasil Diundang',
        message: `${userRecord.full_name} berhasil disematkan sebagai Juri.`,
      });
    } catch (err) {
      toast({
        type: 'error',
        title: 'Gagal Mengundang Juri',
        message: (err as Error).message || 'Terjadi kesalahan.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle Submission Assignment to Judge
  const handleToggleAssignment = async (submissionId: string, judgeId: string) => {
    const isAssigned = assignments.some(
      (a) => a.submission_id === submissionId && a.judge_id === judgeId
    );

    try {
      if (isAssigned) {
        const { error } = await supabase
          .from('judging_assignments')
          .delete()
          .eq('event_id', event.id)
          .eq('submission_id', submissionId)
          .eq('judge_id', judgeId);

        if (error) throw error;
        setAssignments(
          assignments.filter(
            (a) => !(a.submission_id === submissionId && a.judge_id === judgeId)
          )
        );
      } else {
        const { data, error } = await supabase
          .from('judging_assignments')
          .insert({
            event_id: event.id,
            submission_id: submissionId,
            judge_id: judgeId,
          })
          .select()
          .single();

        if (error) throw error;
        setAssignments([...assignments, data]);
      }
      toast({
        type: 'success',
        title: 'Penugasan Diperbarui',
        message: 'Penugasan karya ke juri berhasil diubah.',
      });
    } catch (err) {
      toast({
        type: 'error',
        title: 'Gagal Memperbarui Penugasan',
        message: (err as Error).message || 'Terjadi kesalahan.',
      });
    }
  };

  // Auto Distribute Submissions
  const handleAutoDistribute = async () => {
    if (assignedJudges.length === 0) {
      toast({ type: 'error', title: 'Juri Kosong', message: 'Tugaskan juri ke event ini terlebih dahulu.' });
      return;
    }
    if (submissions.length === 0) {
      toast({ type: 'error', title: 'Karya Kosong', message: 'Belum ada karya yang diunggah peserta.' });
      return;
    }

    setLoading(true);
    try {
      const newAssignments: { event_id: string; submission_id: string; judge_id: string }[] = [];
      
      // Clear existing assignments first to avoid duplicate errors
      await supabase.from('judging_assignments').delete().eq('event_id', event.id);

      // Distribute each submission to all judges (Standard double-blind / full evaluation panel)
      for (const sub of submissions) {
        for (const judge of assignedJudges) {
          newAssignments.push({
            event_id: event.id,
            submission_id: sub.id,
            judge_id: judge.id,
          });
        }
      }

      const { data, error } = await supabase
        .from('judging_assignments')
        .insert(newAssignments)
        .select();

      if (error) throw error;
      setAssignments(data || []);

      toast({
        type: 'success',
        title: 'Distribusi Berhasil',
        message: `Mendistribusikan ${submissions.length} karya ke ${assignedJudges.length} juri secara merata.`,
      });
    } catch (err) {
      toast({
        type: 'error',
        title: 'Gagal Mendistribusikan Karya',
        message: (err as Error).message || 'Terjadi kesalahan.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Finalize Event & Generate Certificates
  const handleFinalize = async () => {
    setIsFinalizing(true);
    
    // Validations
    if (!winner1) {
      toast({ type: 'error', title: 'Juara 1 Belum Dipilih', message: 'Tentukan Juara 1 untuk memfinalisasi.' });
      setIsFinalizing(false);
      return;
    }

    try {
      // 1. Save Winners
      const winnersPayload = [
        { regId: winner1, rank: 'JUARA_1' },
        { regId: winner2, rank: 'JUARA_2' },
        { regId: winner3, rank: 'JUARA_3' },
        { regId: harapan1, rank: 'HARAPAN_1' },
      ].filter(w => w.regId);

      // 2. Change Event Status to FINALIZED in database
      const { error: eventErr } = await supabase
        .from('events')
        .update({ status: 'FINALIZED', announced_at: new Date().toISOString() })
        .eq('id', event.id);

      if (eventErr) throw eventErr;
      setEvent({ ...event, status: 'FINALIZED' });

      // 3. Batch Generate Certificates via API Route
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          winners: winnersPayload,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal men-generate sertifikat batch.');
      }

      toast({
        type: 'success',
        title: 'Kompetisi Difinalisasi',
        message: 'Pemenang diumumkan dan e-sertifikat berhasil dibuat untuk semua peserta!',
      });
      setActiveTab('overview');
      router.refresh();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Gagal Memfinalisasi',
        message: (err as Error).message || 'Terjadi kesalahan saat memproses sertifikat.',
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="draft">Draft</Badge>;
      case 'OPEN': return <Badge variant="open">Pendaftaran Dibuka</Badge>;
      case 'SUBMISSION_CLOSED': return <Badge variant="submitted">Karya Ditutup</Badge>;
      case 'JUDGING': return <Badge variant="pending">Penilaian Berlangsung</Badge>;
      case 'FINALIZED': return <Badge variant="finalized">Selesai</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 relative overflow-hidden noise-overlay">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider bg-blue-600/10 px-2 py-0.5 rounded">
                {event.category || 'Lomba'}
              </span>
              {getStatusBadge(event.status)}
            </div>
            <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
              {event.title}
            </h1>
            <p className="text-xs text-slate-400 font-mono">ID: {event.id}</p>
          </div>

          {/* Quick status actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {event.status === 'DRAFT' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => { setTargetStatus('OPEN'); setIsStatusConfirmOpen(true); }}
                leftIcon={<Sparkles size={14} />}
              >
                Buka Pendaftaran
              </Button>
            )}
            {event.status === 'OPEN' && (
              <Button
                variant="gold"
                size="sm"
                onClick={() => { setTargetStatus('SUBMISSION_CLOSED'); setIsStatusConfirmOpen(true); }}
                leftIcon={<XCircle size={14} />}
              >
                Tutup Pendaftaran
              </Button>
            )}
            {event.status === 'SUBMISSION_CLOSED' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setTargetStatus('JUDGING'); setIsStatusConfirmOpen(true); }}
                leftIcon={<ClipboardList size={14} />}
              >
                Mulai Penilaian
              </Button>
            )}
            {event.status === 'JUDGING' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('finalize')}
                leftIcon={<Award size={14} />}
              >
                Finalisasi & Umumkan
              </Button>
            )}
            {event.status === 'FINALIZED' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400 text-xs font-medium glow-gold">
                <Trophy size={14} />
                Kompetisi Telah Selesai
              </div>
            )}
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex items-center gap-1 border-b border-[rgba(93,138,205,0.15)] mt-6 overflow-x-auto pb-px">
          {([
            { id: 'overview', label: 'Ringkasan', icon: Trophy },
            { id: 'registrations', label: `Pendaftaran (${registrations.length})`, icon: Users },
            { id: 'judges', label: 'Assign Juri', icon: ClipboardList },
            { id: 'submissions', label: `Karya (${submissions.length})`, icon: FileText },
            { id: 'leaderboard', label: 'Leaderboard', icon: Award },
            { id: 'finalize', label: 'Finalisasi', icon: CheckCircle2 }
          ] as const).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? 'border-blue-500 text-blue-300 bg-blue-600/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Tab Panels */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="p-5 space-y-4">
                <h3 className="font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                  Deskripsi Event
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                  {event.description || 'Tidak ada deskripsi.'}
                </p>
              </Card>

              <Card className="p-5 space-y-4">
                <h3 className="font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                  Jadwal & Timeline
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                  <div className="p-3.5 rounded-xl border border-slate-700 bg-slate-800/20 space-y-1">
                    <p className="text-slate-500">Pendaftaran Dibuka</p>
                    <p className="text-slate-200 text-sm">{format(new Date(event.registration_open_at), 'dd MMMM yyyy, HH:mm', { locale: localeId })} WIB</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-700 bg-slate-800/20 space-y-1">
                    <p className="text-slate-500">Pendaftaran Ditutup</p>
                    <p className="text-slate-200 text-sm">{format(new Date(event.registration_close_at), 'dd MMMM yyyy, HH:mm', { locale: localeId })} WIB</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-700 bg-slate-800/20 space-y-1">
                    <p className="text-slate-500">Batas Upload Karya</p>
                    <p className="text-slate-200 text-sm">{format(new Date(event.submission_close_at), 'dd MMMM yyyy, HH:mm', { locale: localeId })} WIB</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-700 bg-slate-800/20 space-y-1">
                    <p className="text-slate-500">Pengumuman Pemenang</p>
                    <p className="text-slate-200 text-sm">
                      {event.announced_at ? format(new Date(event.announced_at), 'dd MMMM yyyy, HH:mm', { locale: localeId }) + ' WIB' : 'Belum Dijadwalkan'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="p-5 space-y-4">
                <h3 className="font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                  Statistik Ringkas
                </h3>
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/25 border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Users size={14} /> Total Pendaftar
                    </div>
                    <span className="text-sm font-bold text-slate-200">{registrations.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/25 border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <CheckCircle2 size={14} className="text-teal-400" /> Disetujui
                    </div>
                    <span className="text-sm font-bold text-teal-400">
                      {registrations.filter((r) => r.status === 'APPROVED').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/25 border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <AlertTriangle size={14} className="text-amber-400" /> Pending
                    </div>
                    <span className="text-sm font-bold text-amber-400">
                      {registrations.filter((r) => r.status === 'PENDING').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/25 border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <FileText size={14} className="text-blue-400" /> Karya Diupload
                    </div>
                    <span className="text-sm font-bold text-blue-400">{submissions.length}</span>
                  </div>
                </div>
              </Card>

              {/* Rubric Criteria Summary */}
              <Card className="p-5 space-y-4">
                <h3 className="font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                  Rubrik Kriteria ({criteria.length})
                </h3>
                <div className="space-y-2">
                  {criteria.map((c) => (
                    <div key={c.id} className="flex justify-between items-center text-xs p-2 rounded border border-slate-800 bg-slate-800/10">
                      <span className="text-slate-300 font-medium">{c.name}</span>
                      <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded">{c.weight}%</span>
                    </div>
                  ))}
                  {criteria.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-2">Belum ada kriteria penilaian.</p>
                  )}
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Tab: Registrations */}
        {activeTab === 'registrations' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Card className="overflow-hidden border border-[rgba(93,138,205,0.15)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/30">
                      <th className="px-5 py-3">Peserta / Tim</th>
                      <th className="px-5 py-3">Instansi</th>
                      <th className="px-5 py-3">Tipe Pendaftaran</th>
                      <th className="px-5 py-3">Berkas Syarat</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-800/10 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-200">
                            {reg.team_id ? `${reg.teams?.name} (Tim)` : reg.users?.full_name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {reg.team_id ? `Ketua: ${reg.users?.full_name}` : reg.users?.email}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{reg.users?.institution || '-'}</td>
                        <td className="px-5 py-4 text-slate-400">
                          {reg.team_id ? '👥 Kelompok' : '👤 Individu'}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            {reg.docs_urls && Array.isArray(reg.docs_urls) && reg.docs_urls.map((doc, idx: number) => (
                              <a
                                key={idx}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300"
                              >
                                <ExternalLink size={10} /> {doc.name || 'Dokumen'}
                              </a>
                            ))}
                            {(!reg.docs_urls || reg.docs_urls.length === 0) && (
                              <span className="text-[10px] text-slate-500">Tidak ada berkas</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            reg.status === 'APPROVED' ? 'badge-approved' :
                            reg.status === 'PENDING' ? 'badge-pending' :
                            'badge-rejected'
                          }`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {reg.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedReg(reg);
                                  handleVerifyRegistration('APPROVED');
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setSelectedReg(reg);
                                  setIsVerifyModalOpen(true);
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">Sudah Diverifikasi</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {registrations.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          Belum ada peserta yang mendaftar pada kompetisi ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tab: Judges Assignment */}
        {activeTab === 'judges' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-3 gap-6">
            {/* Assigned Judges List */}
            <div className="md:col-span-2 space-y-4">
              <Card className="p-5 space-y-4">
                <h3 className="font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                  Juri Ditugaskan ({assignedJudges.length})
                </h3>
                <div className="divide-y divide-slate-800 text-xs">
                  {assignedJudges.map((judge) => (
                    <div key={judge.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-semibold text-slate-200">{judge.full_name}</p>
                        <p className="text-[10px] text-slate-500">{judge.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveJudge(judge.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
                        title="Hapus Juri"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {assignedJudges.length === 0 && (
                    <p className="text-slate-500 text-center py-6 text-xs">Belum ada juri yang ditugaskan ke event ini.</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Invite/Add Judge panel */}
            <div className="space-y-6">
              <Card className="p-5 space-y-4">
                <h3 className="font-semibold text-slate-200 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                  Undang Juri Baru
                </h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Masukkan email juri..."
                    value={judgeEmail}
                    onChange={(e) => setJudgeEmail(e.target.value)}
                    type="email"
                  />
                  <Button
                    onClick={handleInviteJudgeByEmail}
                    loading={loading}
                    className="w-full"
                    leftIcon={<Send size={14} />}
                  >
                    Tambah via Email
                  </Button>
                </div>
              </Card>

              {/* Available Judges in System */}
              <Card className="p-5 space-y-4 max-h-[300px] overflow-y-auto">
                <h3 className="font-semibold text-slate-200 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                  Daftar Juri Terdaftar
                </h3>
                <div className="space-y-2.5 text-xs">
                  {allJudges
                    .filter((j) => !assignedJudges.some((aj) => aj.id === j.id))
                    .map((judge) => (
                      <div key={judge.id} className="flex items-center justify-between p-2 rounded border border-slate-800 bg-slate-800/10">
                        <div>
                          <p className="font-medium text-slate-200">{judge.full_name}</p>
                          <p className="text-[9px] text-slate-500">{judge.email}</p>
                        </div>
                        <button
                          onClick={() => handleAssignJudge(judge.id)}
                          className="p-1 rounded bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ))}
                  {allJudges.filter((j) => !assignedJudges.some((aj) => aj.id === j.id)).length === 0 && (
                    <p className="text-slate-500 text-center py-2 text-[10px]">Semua juri terdaftar sudah ditugaskan.</p>
                  )}
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Tab: Submissions Assignment Grid */}
        {activeTab === 'submissions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-200 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                Tabel Distribusi Karya ke Juri
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAutoDistribute}
                loading={loading}
                leftIcon={<RefreshCw size={14} />}
              >
                Distribusikan Otomatis (Semua Juri)
              </Button>
            </div>

            <Card className="overflow-hidden border border-[rgba(93,138,205,0.15)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/30">
                      <th className="px-5 py-3">Nama Karya / Pengirim</th>
                      <th className="px-5 py-3">Berkas Karya</th>
                      {assignedJudges.map((judge) => (
                        <th key={judge.id} className="px-5 py-3 text-center min-w-[120px]">
                          {judge.full_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {submissions.map((sub) => {
                      const displaySender = sub.registrations?.teams?.name 
                        ? `${sub.registrations.teams.name} (Tim)`
                        : sub.registrations?.users?.full_name || 'Individual';
                        
                      return (
                        <tr key={sub.id} className="hover:bg-slate-800/10 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-200">
                              {sub.file_name || 'Karya Tanpa Nama'}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Oleh: {displaySender}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1 text-[10px]">
                              {sub.file_url && (
                                <a
                                  href={sub.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink size={10} /> Berkas Utama
                                </a>
                              )}
                              {sub.external_link && (
                                <a
                                  href={sub.external_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-teal-400 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink size={10} /> Link Demo/Video
                                </a>
                              )}
                            </div>
                          </td>
                          {assignedJudges.map((judge) => {
                            const isAssigned = assignments.some(
                              (a) => a.submission_id === sub.id && a.judge_id === judge.id
                            );
                            
                            return (
                              <td key={judge.id} className="px-5 py-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  onChange={() => handleToggleAssignment(sub.id, judge.id)}
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-800/50 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {submissions.length === 0 && (
                      <tr>
                        <td colSpan={2 + assignedJudges.length} className="text-center py-8 text-slate-500">
                          Belum ada karya yang diunggah peserta untuk didistribusikan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tab: Realtime Leaderboard */}
        {activeTab === 'leaderboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-200 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                Peringkat Karya Sementara (Live Agregat)
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchLeaderboard}
                loading={loadingLeaderboard}
                leftIcon={<RefreshCw size={12} />}
              >
                Refresh
              </Button>
            </div>

            <Card className="overflow-hidden border border-[rgba(93,138,205,0.15)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/30">
                      <th className="px-5 py-3 text-center w-12">Peringkat</th>
                      <th className="px-5 py-3">Nama Peserta / Tim</th>
                      <th className="px-5 py-3">Instansi</th>
                      <th className="px-5 py-3 text-center">Juri Menilai</th>
                      <th className="px-5 py-3 text-center">Status Juara</th>
                      <th className="px-5 py-3 text-right">Skor Agregat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {leaderboard.map((entry, index) => (
                      <tr key={entry.submission_id} className={`hover:bg-slate-800/10 transition-colors ${
                        index < 3 ? 'bg-blue-600/5' : ''
                      }`}>
                        <td className="px-5 py-4 text-center font-bold text-slate-300">
                          {index + 1}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-200">
                            {entry.team_name ? `${entry.team_name} (Tim)` : entry.participant_name}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{entry.institution || '-'}</td>
                        <td className="px-5 py-4 text-center text-slate-400">
                          {entry.judges_scored} juri
                        </td>
                        <td className="px-5 py-4 text-center">
                          {entry.winner_rank ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold glow-gold">
                              🏆 {entry.winner_rank.replace('_', ' ')}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-mono font-bold text-blue-400 text-sm">
                          {entry.final_score.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {leaderboard.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          Belum ada nilai yang disubmit oleh juri.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tab: Finalize & Certificates */}
        {activeTab === 'finalize' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card className="p-5 border border-amber-500/20 bg-amber-500/5 space-y-4">
              <div className="flex gap-3">
                <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                <div className="space-y-1">
                  <h4 className="font-semibold text-amber-300 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                    PENTING: Finalisasi Event & Pembuatan Sertifikat
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tindakan finalisasi tidak dapat dibatalkan. Event akan ditandai sebagai selesai (`FINALIZED`), 
                    leaderboard akan dikunci, dan platform akan men-generate sertifikat digital secara massal untuk seluruh peserta 
                    yang telah mengunggah karya. Pemenang akan mendapatkan sertifikat Juara, sedangkan peserta lainnya akan mendapatkan sertifikat Partisipasi.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-5">
              <h3 className="font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                Tentukan Pemenang
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Juara 1 (Utama)</label>
                  <select
                    value={winner1}
                    onChange={(e) => setWinner1(e.target.value)}
                    className="h-10 rounded-xl bg-[#112240] border border-slate-700 text-slate-100 text-xs px-3 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Pilih Juara 1 --</option>
                    {leaderboard.map((entry) => (
                      <option key={entry.registration_id} value={entry.registration_id}>
                        {entry.team_name ? `${entry.team_name} (Tim)` : entry.participant_name} - Skor: {entry.final_score}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Juara 2</label>
                  <select
                    value={winner2}
                    onChange={(e) => setWinner2(e.target.value)}
                    className="h-10 rounded-xl bg-[#112240] border border-slate-700 text-slate-100 text-xs px-3 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Pilih Juara 2 --</option>
                    {leaderboard.map((entry) => (
                      <option key={entry.registration_id} value={entry.registration_id}>
                        {entry.team_name ? `${entry.team_name} (Tim)` : entry.participant_name} - Skor: {entry.final_score}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Juara 3</label>
                  <select
                    value={winner3}
                    onChange={(e) => setWinner3(e.target.value)}
                    className="h-10 rounded-xl bg-[#112240] border border-slate-700 text-slate-100 text-xs px-3 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Pilih Juara 3 --</option>
                    {leaderboard.map((entry) => (
                      <option key={entry.registration_id} value={entry.registration_id}>
                        {entry.team_name ? `${entry.team_name} (Tim)` : entry.participant_name} - Skor: {entry.final_score}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Juara Harapan 1</label>
                  <select
                    value={harapan1}
                    onChange={(e) => setHarapan1(e.target.value)}
                    className="h-10 rounded-xl bg-[#112240] border border-slate-700 text-slate-100 text-xs px-3 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Pilih Juara Harapan 1 --</option>
                    {leaderboard.map((entry) => (
                      <option key={entry.registration_id} value={entry.registration_id}>
                        {entry.team_name ? `${entry.team_name} (Tim)` : entry.participant_name} - Skor: {entry.final_score}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {event.status !== 'FINALIZED' ? (
                <Button
                  onClick={handleFinalize}
                  loading={isFinalizing}
                  variant="primary"
                  className="w-full mt-4 glow-blue"
                  leftIcon={<Check size={16} />}
                >
                  {isFinalizing ? `Memproses Sertifikat...` : 'Finalisasi & Umumkan Pemenang'}
                </Button>
              ) : (
                <div className="p-3 text-center rounded-xl bg-slate-800/40 text-slate-400 text-xs font-medium">
                  Kompetisi ini telah ditutup & difinalisasi.
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>

      {/* Verification Dialog */}
      <Modal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} title="Tolak Pendaftaran" size="sm">
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Berikan alasan penolakan pendaftaran untuk peserta <strong>{selectedReg?.users?.full_name}</strong>. Alasan ini akan tampil di dashboard peserta.
          </p>
          <Textarea
            placeholder="Alasan penolakan (mis. Berkas KTM tidak terbaca)..."
            value={rejectionNote}
            onChange={(e) => setRejectionNote(e.target.value)}
            required
            className="min-h-[80px]"
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsVerifyModalOpen(false)}
              className="h-9 px-4 text-xs rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
            >
              Batal
            </button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleVerifyRegistration('REJECTED')}
              loading={loading}
            >
              Tolak Pendaftaran
            </Button>
          </div>
        </div>
      </Modal>

      {/* Status Confirm Dialog */}
      <ConfirmModal
        isOpen={isStatusConfirmOpen}
        onClose={() => setIsStatusConfirmOpen(false)}
        onConfirm={handleStatusTransition}
        title="Ubah Status Event"
        message={`Apakah Anda yakin ingin memindahkan status event ke "${targetStatus}"? Tindakan ini akan merubah alur workflow pada sisi peserta dan juri.`}
        confirmLabel="Ya, Ubah Status"
        variant="primary"
        loading={loading}
      />
    </div>
  );
}
