'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Search, Calendar, Trophy, ChevronRight, FileDown } from 'lucide-react';
import { Card, StatCard, EmptyState } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Badge, WinnerBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

interface Certificate {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  type: 'PARTICIPATION' | 'WINNER';
  winner_rank: string | null;
  file_url: string;
  generated_at: string;
  events: {
    title: string;
  } | null;
  users: {
    full_name: string;
    email: string;
  } | null;
  registrations: {
    team_id: string | null;
    teams: {
      name: string;
    } | null;
  } | null;
}

interface EventItem {
  id: string;
  title: string;
  status: string;
}

interface CertificatesAdminClientProps {
  initialEvents: EventItem[];
  initialCertificates: Certificate[];
}

export function CertificatesAdminClient({
  initialEvents,
  initialCertificates,
}: CertificatesAdminClientProps) {
  const [certificates] = useState<Certificate[]>(initialCertificates);
  const [search, setSearch] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Compute statistics
  const stats = useMemo(() => {
    return {
      total: certificates.length,
      winners: certificates.filter((c) => c.type === 'WINNER').length,
      participation: certificates.filter((c) => c.type === 'PARTICIPATION').length,
    };
  }, [certificates]);

  // Filter certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter((cert) => {
      const matchSearch =
        cert.users?.full_name.toLowerCase().includes(search.toLowerCase()) ||
        cert.users?.email.toLowerCase().includes(search.toLowerCase()) ||
        cert.events?.title.toLowerCase().includes(search.toLowerCase()) ||
        (cert.registrations?.teams?.name &&
          cert.registrations.teams.name.toLowerCase().includes(search.toLowerCase()));

      const matchEvent = selectedEventId === 'ALL' || cert.event_id === selectedEventId;
      const matchType = selectedType === 'ALL' || cert.type === selectedType;

      return matchSearch && matchEvent && matchType;
    });
  }, [certificates, search, selectedEventId, selectedType]);

  // Find events in judging state that can be finalized
  const judgingEvents = useMemo(() => {
    return initialEvents.filter((e) => e.status === 'JUDGING');
  }, [initialEvents]);

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
            Manajemen Sertifikat
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Lihat, cari, dan unduh sertifikat partisipasi serta sertifikat juara yang telah diterbitkan untuk peserta.
          </p>
        </div>
      </motion.div>

      {/* Stats and Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Sertifikat"
            value={stats.total}
            icon={<Award size={20} />}
            color="neutral"
          />
          <StatCard
            label="Sertifikat Juara"
            value={stats.winners}
            icon={<Trophy size={20} />}
            color="gold"
          />
          <StatCard
            label="Sertifikat Partisipasi"
            value={stats.participation}
            icon={<Award size={20} />}
            color="teal"
          />
        </div>

        {/* Judging Event Link Alerts */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Butuh Finalisasi?
            </h3>
            {judgingEvents.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Tidak ada event aktif yang menunggu finalisasi saat ini.
              </p>
            ) : (
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                {judgingEvents.map((e) => (
                  <Link
                    key={e.id}
                    href={`/admin/events/${e.id}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 text-amber-300 transition-colors text-[11px]"
                  >
                    <span className="truncate max-w-[150px] font-medium">{e.title}</span>
                    <span className="flex items-center gap-0.5 text-[10px] underline shrink-0">
                      Finalisasi <ChevronRight size={10} />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Cari penerima, email, nama event..."
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
                { value: 'ALL', label: 'Semua Tipe' },
                { value: 'WINNER', label: 'Juara (Winner)' },
                { value: 'PARTICIPATION', label: 'Partisipasi (Participation)' },
              ]}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Certificates List */}
      <Card padding="none" className="overflow-hidden border border-[rgba(93,138,205,0.15)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/30">
                <th className="px-5 py-3.5">Penerima Sertifikat</th>
                <th className="px-5 py-3.5">Event Lomba</th>
                <th className="px-5 py-3.5">Tipe Sertifikat</th>
                <th className="px-5 py-3.5">Tanggal Terbit</th>
                <th className="px-5 py-3.5 text-right">Berkas PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              <AnimatePresence mode="popLayout">
                {filteredCertificates.map((cert) => (
                  <motion.tr
                    key={cert.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-slate-800/10 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-200">
                        {cert.registrations?.team_id
                          ? `${cert.registrations?.teams?.name} (Tim)`
                          : cert.users?.full_name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {cert.registrations?.team_id
                          ? `Ketua: ${cert.users?.full_name} (${cert.users?.email})`
                          : cert.users?.email}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      <div className="font-medium">{cert.events?.title || 'Unknown Event'}</div>
                    </td>
                    <td className="px-5 py-4">
                      {cert.type === 'WINNER' ? (
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant="finalized">Juara</Badge>
                          {cert.winner_rank && (
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            <WinnerBadge rank={cert.winner_rank as any} />
                          )}
                        </div>
                      ) : (
                        <Badge variant="approved">Partisipasi</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-500" />
                        {formatDate(cert.generated_at)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <a
                        href={cert.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 transition-all font-medium"
                      >
                        <FileDown size={13} />
                        <span>Unduh PDF</span>
                      </a>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>

              {filteredCertificates.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <EmptyState
                      icon={<Award size={24} />}
                      title="Sertifikat tidak ditemukan"
                      description="Belum ada sertifikat terbit atau tidak ada sertifikat yang cocok dengan filter pencarian."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
