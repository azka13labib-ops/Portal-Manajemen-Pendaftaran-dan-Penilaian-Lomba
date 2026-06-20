/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Upload,
  Calendar,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  User,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

interface SubmissionsListClientProps {
  registrations: any[];
  submissions: any[];
}

export function SubmissionsListClient({
  registrations,
  submissions,
}: SubmissionsListClientProps) {
  const [search, setSearch] = useState('');

  // Map registrations to their submissions
  const mappedSubmissions = useMemo(() => {
    return registrations.map((reg) => {
      const submission = submissions.find((s) => s.registration_id === reg.id);
      return {
        ...reg,
        submission,
      };
    });
  }, [registrations, submissions]);

  // Filter based on search query
  const filteredSubmissions = useMemo(() => {
    return mappedSubmissions.filter((item) => {
      const event = item.events || {};
      return (
        event.title?.toLowerCase().includes(search.toLowerCase()) ||
        event.category?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [mappedSubmissions, search]);

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
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -z-10" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Upload size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
              Pengumpulan Karya Lomba
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Kumpulkan project, tautan demo, dan deskripsi konsep karya terbaik Anda di sini.
            </p>
          </div>
        </div>
      </Card>

      {/* Search bar & count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="text-xs text-slate-400 font-semibold">
          Menampilkan {filteredSubmissions.length} event aktif yang siap dikumpulkan
        </div>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari event lomba..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl bg-slate-800/40 border border-slate-800 text-xs px-3 pl-10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
          <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
        </div>
      </div>

      {/* Submissions Cards */}
      <AnimatePresence mode="wait">
        {filteredSubmissions.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6"
          >
            {filteredSubmissions.map((item) => {
              const event = item.events || {};
              const submission = item.submission;
              const isSubmissionClosed = new Date() > new Date(event.submission_close_at);
              const isJudgingOrFinalized = ['JUDGING', 'FINALIZED', 'ARCHIVED'].includes(event.status);
              const canSubmit = !isSubmissionClosed && !isJudgingOrFinalized;

              return (
                <motion.div key={item.id} variants={itemVariants}>
                  <Card className="p-6 hover:border-[rgba(13,148,136,0.3)] transition-all">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-4 border-b border-slate-800/40">
                      {/* Event details */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-semibold text-teal-400 uppercase tracking-wider bg-teal-600/10 px-2 py-0.5 rounded border border-teal-500/10">
                            {event.category || 'Lomba'}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {item.team_id ? `Kelompok (Tim: ${item.teams?.name})` : <><User size={9} className="inline mr-1" /> Individu</>}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-100 text-base mt-2" style={{ fontFamily: 'var(--font-display)' }}>
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Calendar size={13} className="text-slate-500" />
                          <span>
                            Batas Upload: {new Date(event.submission_close_at).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Status and Button */}
                      <div className="flex flex-col items-start md:items-end justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          {submission ? (
                            <Badge variant="approved" dot>Karya Diterima</Badge>
                          ) : (
                            <Badge variant="pending" dot pulse={canSubmit}>Karya Belum Diunggah</Badge>
                          )}
                          {isSubmissionClosed && (
                            <Badge variant="rejected">Batas Waktu Lewat</Badge>
                          )}
                        </div>

                        <Link href={`/participant/registrations/${item.id}`} className="w-full md:w-auto">
                          {submission ? (
                            <Button
                              variant={canSubmit ? 'secondary' : 'ghost'}
                              size="sm"
                              className="w-full"
                              rightIcon={<ChevronRight size={12} />}
                            >
                              {canSubmit ? 'Perbarui Karya' : 'Lihat Karya Saya'}
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-full glow-blue"
                              disabled={!canSubmit}
                              leftIcon={<Upload size={13} />}
                            >
                              {canSubmit ? 'Kumpulkan Karya' : 'Upload Ditutup'}
                            </Button>
                          )}
                        </Link>
                      </div>
                    </div>

                    {/* Submission content details */}
                    {submission ? (
                      <div className="pt-4 space-y-3.5 text-xs">
                        <div className="flex items-center gap-2 text-teal-400 font-semibold">
                          <CheckCircle2 size={15} /> Detail Unggahan Karya Anda:
                        </div>
                        <div className="grid sm:grid-cols-3 gap-2 pl-6">
                          <div className="text-slate-500">Nama Berkas ZIP/PDF:</div>
                          <div className="sm:col-span-2 font-mono text-slate-300 break-all">{submission.file_name}</div>

                          {submission.external_link && (
                            <>
                              <div className="text-slate-500">Tautan Demo/Video:</div>
                              <div className="sm:col-span-2 font-mono text-blue-400 hover:underline break-all">
                                <a
                                  href={submission.external_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1"
                                >
                                  {submission.external_link} <ExternalLink size={10} />
                                </a>
                              </div>
                            </>
                          )}

                          {submission.description && (
                            <>
                              <div className="text-slate-500">Deskripsi Karya:</div>
                              <div className="sm:col-span-2 text-slate-400 whitespace-pre-wrap">{submission.description}</div>
                            </>
                          )}

                          <div className="text-slate-500">Tanggal Pengiriman:</div>
                          <div className="sm:col-span-2 text-slate-500 font-medium">
                            {new Date(submission.submitted_at).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-4 text-xs text-slate-500 pl-2 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-slate-500" />
                        <span>
                          {canSubmit
                            ? 'Silakan segera unggah berkas karya Anda sebelum batas waktu berakhir.'
                            : 'Batas waktu pendaftaran dan pengumpulan karya untuk lomba ini telah resmi ditutup.'}
                        </span>
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
                <FileCheck size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-300 text-sm">Tidak Ada Event yang Disetujui</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Anda hanya dapat mengumpulkan karya pada event lomba yang pendaftarannya telah disetujui (Approved) oleh Admin.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <Link href="/participant/registrations">
                  <Button variant="ghost" size="sm">
                    Lihat Pendaftaran Saya
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="primary" size="sm" className="glow-blue">
                    Jelajahi Lomba
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
