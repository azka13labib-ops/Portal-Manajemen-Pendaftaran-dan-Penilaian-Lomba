/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  FileDown,
  Trophy,
  Calendar,
  Inbox,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WinnerBadge, Badge } from '@/components/ui/Badge';
import Link from 'next/link';

interface CertificatesListClientProps {
  certificates: any[];
}

export function CertificatesListClient({ certificates }: CertificatesListClientProps) {
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
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30 glow-gold">
            <Award size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 animate-pulse" style={{ fontFamily: 'var(--font-display)' }}>
              Sertifikat Saya
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Unduh sertifikat bukti partisipasi atau bukti juara Anda setelah perlombaan difinalisasi.
            </p>
          </div>
        </div>
      </Card>

      {/* Title Divider */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="text-xs text-slate-400 font-semibold">
          Total sertifikat terkumpul: {certificates.length}
        </div>
      </div>

      {/* Certificates Grid */}
      <AnimatePresence mode="wait">
        {certificates.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {certificates.map((cert) => {
              const event = cert.events || {};
              const isWinner = cert.type === 'WINNER';

              return (
                <motion.div key={cert.id} variants={itemVariants}>
                  <Card
                    className={`h-full flex flex-col justify-between p-5 relative overflow-hidden transition-all group ${
                      isWinner
                        ? 'border-amber-500/20 hover:border-amber-500/40 glow-gold bg-linear-to-b from-amber-500/5 to-slate-900/40'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/20'
                    }`}
                  >
                    {isWinner && (
                      <div className="absolute top-2 right-2 text-amber-500/20 pointer-events-none">
                        <Sparkles size={48} className="animate-spin-slow" />
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Badge / Type */}
                      <div className="flex items-center justify-between gap-2">
                        {isWinner ? (
                          <WinnerBadge rank={cert.winner_rank} />
                        ) : (
                          <Badge variant="default" className="bg-blue-600/10 text-blue-300 border border-blue-500/20">
                            📜 Partisipasi
                          </Badge>
                        )}
                        <span className="text-[10px] text-slate-500 font-medium">
                          e-Certificate
                        </span>
                      </div>

                      {/* Icon & Title */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isWinner
                              ? 'bg-amber-600/20 text-amber-400 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isWinner ? <Trophy size={18} /> : <Award size={18} />}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h3 className="font-bold text-slate-200 text-xs line-clamp-2 group-hover:text-blue-400 transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                            {event.title}
                          </h3>
                          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded">
                            {event.category || 'Lomba'}
                          </span>
                        </div>
                      </div>

                      {/* Issued Date */}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium pt-2 border-t border-slate-800/40">
                        <Calendar size={12} />
                        <span>Diterbitkan: {new Date(cert.generated_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                      </div>
                    </div>

                    {/* Download button */}
                    <div className="mt-5 pt-1">
                      <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                        <Button
                          variant={isWinner ? 'primary' : 'secondary'}
                          size="sm"
                          className={`w-full ${isWinner ? 'glow-gold bg-amber-600 hover:bg-amber-500 text-white' : ''}`}
                          leftIcon={<FileDown size={14} />}
                        >
                          Unduh PDF
                        </Button>
                      </a>
                    </div>
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
                <h3 className="font-bold text-slate-300 text-sm">Belum Ada Sertifikat</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Sertifikat elektronik Anda akan diterbitkan secara otomatis setelah kompetisi selesai dinilai dan difinalisasi oleh penyelenggara.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Link href="/participant/registrations">
                  <Button variant="ghost" size="sm">
                    Lihat Pendaftaran Saya
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
