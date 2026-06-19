/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Calendar,
  AlertCircle,
  ChevronRight,
  ClipboardList,
  Inbox,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RegistrationStatusBadge } from '@/components/ui/Badge';
import Link from 'next/link';

interface RegistrationsListClientProps {
  registrations: any[];
}

type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export function RegistrationsListClient({ registrations }: RegistrationsListClientProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  // Filter registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const event = reg.events || {};
      const matchesSearch =
        event.title?.toLowerCase().includes(search.toLowerCase()) ||
        event.category?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus =
        statusFilter === 'ALL' || reg.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [registrations, search, statusFilter]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-6 relative overflow-hidden noise-overlay">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <ClipboardList size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
              Pendaftaran Saya
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Pantau status pendaftaran lomba Anda dan kumpulkan karya yang disetujui.
            </p>
          </div>
        </div>
      </Card>

      {/* Search & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as FilterStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === tab
                  ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab === 'ALL' && 'Semua'}
              {tab === 'PENDING' && 'Menunggu'}
              {tab === 'APPROVED' && 'Disetujui'}
              {tab === 'REJECTED' && 'Ditolak'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Cari pendaftaran lomba..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl bg-slate-800/40 border border-slate-800 text-xs px-3 pl-10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
        </div>
      </div>

      {/* Registrations List */}
      <AnimatePresence mode="wait">
        {filteredRegistrations.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4"
          >
            {filteredRegistrations.map((reg) => {
              const event = reg.events || {};
              const isApproved = reg.status === 'APPROVED';
              
              return (
                <motion.div key={reg.id} variants={itemVariants}>
                  <Card className="p-5 hover:border-[rgba(93,138,205,0.3)] transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wider bg-blue-600/10 px-2 py-0.5 rounded border border-blue-500/10">
                            {event.category || 'Lomba'}
                          </span>
                          <RegistrationStatusBadge status={reg.status} />
                        </div>
                        <h3 className="font-bold text-slate-200 text-sm mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                          <span>
                            Mode: {reg.team_id ? `Kelompok (Tim: ${reg.teams?.name})` : '👤 Individu'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> Terdaftar: {new Date(reg.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Right button actions */}
                      <div className="flex items-center gap-2 justify-start sm:justify-end shrink-0">
                        {isApproved && (
                          <Link href={`/participant/registrations/${reg.id}`}>
                            <Button variant="primary" size="sm" rightIcon={<ChevronRight size={12} />} className="glow-blue">
                              Detail & Upload Karya
                            </Button>
                          </Link>
                        )}
                        {reg.status === 'PENDING' && (
                          <span className="text-[11px] text-slate-500 font-medium italic">
                            Verifikasi dokumen berkas...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rejection Alert */}
                    {reg.status === 'REJECTED' && (
                      <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 mt-4 flex gap-3">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Alasan Dokumen Ditolak:</p>
                          <p className="text-slate-400 mt-1 leading-relaxed">
                            {reg.rejection_note || 'Dokumen persyaratan tidak memenuhi syarat (KTM buram atau tidak valid).'}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-2 font-medium">
                            Silakan daftarkan diri Anda kembali di halaman utama untuk kompetisi ini dengan mengunggah dokumen baru.
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-12"
          >
            <Card className="p-8 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Inbox size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-300 text-sm">Tidak Ada Pendaftaran Lomba</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  {statusFilter === 'ALL'
                    ? 'Anda belum mendaftar di kompetisi apa pun saat ini.'
                    : `Tidak ada pendaftaran dengan status filter ini.`}
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
