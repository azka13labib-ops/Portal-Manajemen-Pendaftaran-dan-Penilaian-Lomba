'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Plus, Trophy,
  X, Mail, Building, Trash2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card, StatCard, EmptyState } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';

interface Judge {
  id: string;
  full_name: string;
  email: string;
  institution: string;
}

interface EventItem {
  id: string;
  title: string;
  status: string;
}

interface Assignment {
  event_id: string;
  judge_id: string;
  event_title: string;
}

interface JudgesAdminClientProps {
  initialJudges: Judge[];
  initialEvents: EventItem[];
  initialAssignments: Assignment[];
}

export function JudgesAdminClient({
  initialJudges,
  initialEvents,
  initialAssignments,
}: JudgesAdminClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [judges, setJudges] = useState<Judge[]>(initialJudges);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [search, setSearch] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Assignment Modal states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Filter judges based on search
  const filteredJudges = useMemo(() => {
    return judges.filter((j) => {
      return (
        j.full_name.toLowerCase().includes(search.toLowerCase()) ||
        j.email.toLowerCase().includes(search.toLowerCase()) ||
        j.institution.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [judges, search]);

  // Map assignments by judge ID
  const assignmentsByJudge = useMemo(() => {
    const map: Record<string, Assignment[]> = {};
    assignments.forEach((a) => {
      if (!map[a.judge_id]) map[a.judge_id] = [];
      map[a.judge_id].push(a);
    });
    return map;
  }, [assignments]);

  // Invite Judge by Email
  const handleInviteJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      // 1. Find user by email in database
      const { data: userRecord, error: userErr } = await supabase
        .from('users')
        .select('*')
        .eq('email', inviteEmail.trim())
        .single();

      if (userErr || !userRecord) {
        toast({
          type: 'warning',
          title: 'User Tidak Ditemukan',
          message: 'Email belum terdaftar. Minta Juri mendaftar akun di portal terlebih dahulu.',
        });
        setInviting(false);
        return;
      }

      // 2. Fetch JUDGE role ID
      const { data: roleRecord, error: roleErr } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'JUDGE')
        .single();

      if (roleErr || !roleRecord) {
        throw new Error('Role Juri tidak ditemukan di database.');
      }

      // 3. Upsert user role
      const { error: roleUpsertErr } = await supabase
        .from('user_roles')
        .upsert({ user_id: userRecord.id, role_id: roleRecord.id });

      if (roleUpsertErr) throw roleUpsertErr;

      // 4. Update local state
      if (!judges.some((j) => j.id === userRecord.id)) {
        setJudges((prev) => [
          ...prev,
          {
            id: userRecord.id,
            full_name: userRecord.full_name,
            email: userRecord.email,
            institution: userRecord.institution || '-',
          },
        ]);
      }

      setInviteEmail('');
      toast({
        type: 'success',
        title: 'Juri Ditambahkan',
        message: `${userRecord.full_name} berhasil dijadikan Juri.`,
      });
      router.refresh();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Gagal Menambahkan Juri',
        message: (err as Error).message || 'Terjadi kesalahan.',
      });
    } finally {
      setInviting(false);
    }
  };

  // Open Assign Modal
  const openAssignModal = (judge: Judge) => {
    setSelectedJudge(judge);
    setSelectedEventId('');
    setIsAssignModalOpen(true);
  };

  // Assign Judge to Event
  const handleAssignToEvent = async () => {
    if (!selectedJudge || !selectedEventId) return;

    setAssigning(true);
    try {
      const activeEvent = initialEvents.find((e) => e.id === selectedEventId);
      if (!activeEvent) throw new Error('Event tidak ditemukan.');

      // Check if already assigned
      const alreadyAssigned = assignments.some(
        (a) => a.judge_id === selectedJudge.id && a.event_id === selectedEventId
      );

      if (alreadyAssigned) {
        toast({
          type: 'warning',
          title: 'Sudah Ditugaskan',
          message: 'Juri ini sudah ditugaskan ke event tersebut.',
        });
        setIsAssignModalOpen(false);
        return;
      }

      // Insert assignment
      const { error } = await supabase.from('event_judges').insert({
        event_id: selectedEventId,
        judge_id: selectedJudge.id,
        assigned_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;

      // Update local state
      setAssignments((prev) => [
        ...prev,
        {
          event_id: selectedEventId,
          judge_id: selectedJudge.id,
          event_title: activeEvent.title,
        },
      ]);

      toast({
        type: 'success',
        title: 'Tugas Juri Ditambahkan',
        message: `Berhasil menugaskan juri ke event ${activeEvent.title}.`,
      });
      setIsAssignModalOpen(false);
      router.refresh();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Gagal Menugaskan Juri',
        message: (err as Error).message || 'Terjadi kesalahan.',
      });
    } finally {
      setAssigning(false);
    }
  };

  // Remove Judge Assignment
  const handleRemoveAssignment = async (eventId: string, judgeId: string) => {
    try {
      const { error } = await supabase
        .from('event_judges')
        .delete()
        .eq('event_id', eventId)
        .eq('judge_id', judgeId);

      if (error) throw error;

      // Update local state
      setAssignments((prev) =>
        prev.filter((a) => !(a.event_id === eventId && a.judge_id === judgeId))
      );

      toast({
        type: 'success',
        title: 'Tugas Juri Dicabut',
        message: 'Tugas juri untuk event tersebut telah berhasil dicabut.',
      });
      router.refresh();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Gagal Mencabut Tugas',
        message: (err as Error).message || 'Terjadi kesalahan.',
      });
    }
  };

  // Remove Judge Role
  const handleRemoveJudgeRole = async (judgeId: string, judgeName: string) => {
    const judgeAssignments = assignmentsByJudge[judgeId] || [];
    if (judgeAssignments.length > 0) {
      toast({
        type: 'error',
        title: 'Tidak Bisa Menghapus Juri',
        message: 'Juri ini masih memiliki tugas aktif di event. Cabut semua tugasnya terlebih dahulu.',
      });
      return;
    }

    try {
      const { data: roleRecord } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'JUDGE')
        .single();

      if (!roleRecord) throw new Error('Role Juri tidak ditemukan.');

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', judgeId)
        .eq('role_id', roleRecord.id);

      if (error) throw error;

      // Update local state
      setJudges((prev) => prev.filter((j) => j.id !== judgeId));

      toast({
        type: 'success',
        title: 'Peran Juri Dicabut',
        message: `Berhasil mencabut status Juri untuk ${judgeName}.`,
      });
      router.refresh();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Gagal Mencabut Peran',
        message: (err as Error).message || 'Terjadi kesalahan.',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            Manajemen Juri
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Daftarkan juri baru dan atur penugasan penilaian juri ke masing-masing kompetisi.
          </p>
        </div>
      </motion.div>

      {/* Stats and Invite Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <StatCard
            label="Total Juri Terdaftar"
            value={judges.length}
            icon={<Users size={22} />}
            sub="Dapat menilai berbagai kompetisi"
            color="blue"
          />
        </div>
        <Card className="p-5 flex flex-col justify-between">
          <form onSubmit={handleInviteJudge} className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
              Tambah Juri Baru
            </h3>
            <Input
              placeholder="Masukkan email juri..."
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              type="email"
              leftAddon={<Mail size={15} />}
            />
            <Button
              type="submit"
              className="w-full mt-2"
              loading={inviting}
              leftIcon={<Plus size={15} />}
            >
              Jadikan Juri
            </Button>
          </form>
        </Card>
      </div>

      {/* Search & List */}
      <Card className="p-4">
        <Input
          placeholder="Cari juri berdasarkan nama, email, atau instansi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftAddon={<Search size={16} />}
        />
      </Card>

      <Card padding="none" className="overflow-hidden border border-[rgba(93,138,205,0.15)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/30">
                <th className="px-5 py-3.5">Nama & Kontak</th>
                <th className="px-5 py-3.5">Instansi</th>
                <th className="px-5 py-3.5">Event Penilaian</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              <AnimatePresence mode="popLayout">
                {filteredJudges.map((judge) => {
                  const judgeAssignments = assignmentsByJudge[judge.id] || [];
                  return (
                    <motion.tr
                      key={judge.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-800/10 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          {judge.full_name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {judge.email}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Building size={12} className="text-slate-500" />
                          {judge.institution}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {judgeAssignments.map((a) => (
                            <Badge
                              key={a.event_id}
                              variant="default"
                              className="bg-blue-600/15 border border-blue-500/20 text-blue-300 flex items-center gap-1 text-[10px] pr-1 py-0.5"
                            >
                              <span>{a.event_title}</span>
                              <button
                                onClick={() => handleRemoveAssignment(a.event_id, judge.id)}
                                className="p-0.5 hover:bg-blue-500/20 hover:text-white rounded-full transition-colors"
                                title="Cabut tugas juri dari event ini"
                              >
                                <X size={10} />
                              </button>
                            </Badge>
                          ))}
                          {judgeAssignments.length === 0 && (
                            <span className="text-[10px] text-slate-500 italic">Belum ada tugas event</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Trophy size={12} />}
                            onClick={() => openAssignModal(judge)}
                          >
                            Tugaskan Lomba
                          </Button>
                          <button
                            onClick={() => handleRemoveJudgeRole(judge.id, judge.full_name)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                            title="Cabut Peran Juri"
                            disabled={judgeAssignments.length > 0}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>

              {filteredJudges.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <EmptyState
                      icon={<Users size={24} />}
                      title="Juri tidak ditemukan"
                      description="Tidak ada juri terdaftar yang cocok dengan kriteria pencarian."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Assign Judge to Event Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedJudge(null);
        }}
        title={`Tugaskan Juri: ${selectedJudge?.full_name}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Pilih event aktif di bawah ini untuk menugaskan juri ini. Juri akan dapat melihat semua karya peserta yang diserahkan padanya untuk dinilai.
          </p>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Pilih Event Lomba</label>
            <Select
              options={[
                { value: '', label: '-- Pilih Event --' },
                ...initialEvents
                  .filter((e) => e.status !== 'FINALIZED' && e.status !== 'ARCHIVED')
                  .map((e) => ({
                    value: e.id,
                    label: `${e.title} (${e.status})`,
                  })),
              ]}
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setIsAssignModalOpen(false);
                setSelectedJudge(null);
              }}
              className="h-9 px-4 text-xs rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors font-medium"
            >
              Batal
            </button>
            <Button
              variant="primary"
              size="sm"
              loading={assigning}
              disabled={!selectedEventId}
              onClick={handleAssignToEvent}
            >
              Tugaskan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
