'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Search, ExternalLink,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card, StatCard, EmptyState } from '@/components/ui/Card';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { RegistrationStatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

interface Registration {
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
  events: {
    title: string;
  } | null;
}

interface EventItem {
  id: string;
  title: string;
  status: string;
}

interface RegistrationsAdminClientProps {
  initialEvents: EventItem[];
  initialRegistrations: Registration[];
}

export function RegistrationsAdminClient({
  initialEvents,
  initialRegistrations,
}: RegistrationsAdminClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [registrations, setRegistrations] = useState<Registration[]>(initialRegistrations);
  const [search, setSearch] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Compute statistics
  const stats = useMemo(() => {
    return {
      total: registrations.length,
      pending: registrations.filter((r) => r.status === 'PENDING').length,
      approved: registrations.filter((r) => r.status === 'APPROVED').length,
      rejected: registrations.filter((r) => r.status === 'REJECTED').length,
    };
  }, [registrations]);

  // Filter registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const matchSearch =
        reg.users?.full_name.toLowerCase().includes(search.toLowerCase()) ||
        reg.users?.email.toLowerCase().includes(search.toLowerCase()) ||
        reg.teams?.name.toLowerCase().includes(search.toLowerCase()) ||
        reg.events?.title.toLowerCase().includes(search.toLowerCase()) ||
        (reg.users?.institution && reg.users.institution.toLowerCase().includes(search.toLowerCase()));

      const matchEvent = selectedEventId === 'ALL' || reg.event_id === selectedEventId;
      const matchStatus = selectedStatus === 'ALL' || reg.status === selectedStatus;

      return matchSearch && matchEvent && matchStatus;
    });
  }, [registrations, search, selectedEventId, selectedStatus]);

  // Handle Verify Registration
  const handleVerifyRegistration = async (regId: string, status: 'APPROVED' | 'REJECTED', note?: string) => {
    setLoadingId(regId);
    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          status,
          rejection_note: status === 'REJECTED' ? note : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', regId);

      if (error) throw error;

      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === regId
            ? { ...r, status, rejection_note: status === 'REJECTED' ? (note || null) : null }
            : r
        )
      );

      toast({
        type: 'success',
        title: status === 'APPROVED' ? 'Pendaftaran Disetujui' : 'Pendaftaran Ditolak',
        message: 'Status pendaftaran peserta berhasil diperbarui.',
      });

      if (status === 'REJECTED') {
        setIsRejectModalOpen(false);
        setSelectedReg(null);
        setRejectionNote('');
      }
      router.refresh();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Gagal Memproses Pendaftaran',
        message: (err as Error).message || 'Terjadi kesalahan.',
      });
    } finally {
      setLoadingId(null);
    }
  };

  const openRejectModal = (reg: Registration) => {
    setSelectedReg(reg);
    setRejectionNote('');
    setIsRejectModalOpen(true);
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
            Verifikasi Peserta
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Tinjau dan verifikasi dokumen persyaratan pendaftaran peserta kompetisi.
          </p>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Pendaftar"
          value={stats.total}
          icon={<ClipboardList size={20} />}
          color="neutral"
        />
        <StatCard
          label="Menunggu Verifikasi"
          value={stats.pending}
          icon={<AlertCircle size={20} className={stats.pending > 0 ? "animate-pulse text-amber-400" : ""} />}
          color="gold"
        />
        <StatCard
          label="Disetujui"
          value={stats.approved}
          icon={<CheckCircle2 size={20} />}
          color="teal"
        />
        <StatCard
          label="Ditolak"
          value={stats.rejected}
          icon={<XCircle size={20} />}
          color="blue"
        />
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Cari nama peserta, tim, email, instansi, atau nama lomba..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftAddon={<Search size={16} />}
            />
          </div>
          <div>
            <Select
              options={[
                { value: 'ALL', label: 'Semua Event' },
                ...initialEvents.map((e) => ({ value: e.id, label: e.title })),
              ]}
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            />
          </div>
          <div>
            <Select
              options={[
                { value: 'ALL', label: 'Semua Status' },
                { value: 'PENDING', label: 'PENDING (Menunggu)' },
                { value: 'APPROVED', label: 'APPROVED (Disetujui)' },
                { value: 'REJECTED', label: 'REJECTED (Ditolak)' },
              ]}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Registrations List */}
      <Card padding="none" className="overflow-hidden border border-[rgba(93,138,205,0.15)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/30">
                <th className="px-5 py-3.5">Peserta / Tim</th>
                <th className="px-5 py-3.5">Event Lomba</th>
                <th className="px-5 py-3.5">Instansi</th>
                <th className="px-5 py-3.5">Berkas Syarat</th>
                <th className="px-5 py-3.5">Tanggal Daftar</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              <AnimatePresence mode="popLayout">
                {filteredRegistrations.map((reg) => (
                  <motion.tr
                    key={reg.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-800/10 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-200">
                        {reg.team_id ? `${reg.teams?.name} (Tim)` : reg.users?.full_name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {reg.team_id ? `Ketua: ${reg.users?.full_name}` : reg.users?.email}
                      </div>
                      {reg.team_id && reg.users?.email && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          {reg.users.email}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-300 font-medium">{reg.events?.title || 'Unknown Event'}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{reg.users?.institution || '-'}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        {reg.docs_urls && Array.isArray(reg.docs_urls) && reg.docs_urls.map((doc, idx: number) => (
                          <a
                            key={idx}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors w-fit"
                          >
                            <ExternalLink size={10} /> {doc.name || 'Dokumen'}
                          </a>
                        ))}
                        {(!reg.docs_urls || reg.docs_urls.length === 0) && (
                          <span className="text-[10px] text-slate-500">Tidak ada berkas</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono">{formatDate(reg.created_at)}</td>
                    <td className="px-5 py-4">
                      <RegistrationStatusBadge status={reg.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {reg.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            loading={loadingId === reg.id}
                            onClick={() => handleVerifyRegistration(reg.id, 'APPROVED')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={loadingId === reg.id}
                            onClick={() => openRejectModal(reg)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : reg.status === 'REJECTED' ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[10px] text-slate-500">Ditolak</span>
                          {reg.rejection_note && (
                            <span className="text-[9px] text-red-400 max-w-[150px] truncate" title={reg.rejection_note}>
                              Note: {reg.rejection_note}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">Disetujui</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <EmptyState
                      icon={<ClipboardList size={24} />}
                      title="Pendaftaran tidak ditemukan"
                      description="Tidak ada data pendaftaran yang cocok dengan kriteria filter saat ini."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedReg(null);
        }}
        title="Tolak Pendaftaran"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Masukkan alasan penolakan berkas untuk pendaftar{' '}
            <strong>{selectedReg?.team_id ? selectedReg.teams?.name : selectedReg?.users?.full_name}</strong>.{' '}
            Alasan ini akan dikirimkan kepada peserta untuk diperbaiki.
          </p>
          <Textarea
            label="Alasan Penolakan"
            placeholder="Contoh: Berkas KTM tidak terbaca atau tidak valid..."
            value={rejectionNote}
            onChange={(e) => setRejectionNote(e.target.value)}
            required
            className="min-h-[100px]"
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setIsRejectModalOpen(false);
                setSelectedReg(null);
              }}
              className="h-9 px-4 text-xs rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors font-medium"
            >
              Batal
            </button>
            <Button
              variant="danger"
              size="sm"
              loading={loadingId === selectedReg?.id}
              onClick={() => selectedReg && handleVerifyRegistration(selectedReg.id, 'REJECTED', rejectionNote)}
            >
              Tolak Pendaftaran
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
