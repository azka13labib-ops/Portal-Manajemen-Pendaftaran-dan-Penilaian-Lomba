/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  FileDown,
  Trophy,
  Calendar,
  Ribbon,
  Sparkles,
  FileText,
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
        <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(216,178,107,0.06)] rounded-full blur-3xl -z-10" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(244,239,227,0.08)] text-[#F4EFE3] flex items-center justify-center border border-[rgba(244,239,227,0.12)]">
            <Award size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#F4EFE3]" style={{ fontFamily: 'var(--font-display)' }}>
              Sertifikat Saya
            </h1>
            <p className="text-xs text-[#9CA8BD] mt-0.5">
              Unduh sertifikat bukti partisipasi atau bukti juara Anda setelah perlombaan difinalisasi.
            </p>
          </div>
        </div>
      </Card>

      {/* Title Divider */}
      <div className="flex items-center justify-between border-b border-[rgba(244,239,227,0.07)] pb-5">
        <div className="text-xs text-[#9CA8BD] font-semibold">
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
                        ? 'border-[rgba(216,178,107,0.20)] hover:border-[rgba(216,178,107,0.35)] bg-[rgba(216,178,107,0.03)]'
                        : 'border-[rgba(244,239,227,0.08)] hover:border-[rgba(244,239,227,0.18)]'
                    }`}
                  >
                    {isWinner && (
                      <div className="absolute top-2 right-2 text-[rgba(216,178,107,0.15)] pointer-events-none">
                        <Sparkles size={48} className="animate-spin-slow" />
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Badge / Type */}
                      <div className="flex items-center justify-between gap-2">
                        {isWinner ? (
                          <WinnerBadge rank={cert.winner_rank} />
                        ) : (
                          <Badge variant="default">
                            <FileText size={12} className="inline mr-1" /> Partisipasi
                          </Badge>
                        )}
                        <span className="text-[10px] text-[#9CA8BD] font-medium">
                          e-Certificate
                        </span>
                      </div>

                      {/* Icon & Title */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isWinner
                              ? 'bg-[rgba(216,178,107,0.10)] text-[#D8B26B] border-[rgba(216,178,107,0.25)]'
                              : 'bg-[rgba(244,239,227,0.06)] text-[rgba(244,239,227,0.50)] border-[rgba(244,239,227,0.10)]'
                          }`}
                        >
                          {isWinner ? <Trophy size={18} /> : <Award size={18} />}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h3 className="font-bold text-[#F4EFE3] text-xs line-clamp-2 group-hover:text-[#E8E0CC] transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                            {event.title}
                          </h3>
                          <span className="badge-category text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block">
                            {event.category || 'Lomba'}
                          </span>
                        </div>
                      </div>

                      {/* Issued Date */}
                      <div className="flex items-center gap-1.5 text-[10px] text-[#9CA8BD] font-medium pt-2 border-t border-[rgba(244,239,227,0.07)]">
                        <Calendar size={12} />
                        <span>Diterbitkan: {new Date(cert.generated_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                      </div>
                    </div>

                    {/* Download button */}
                    <div className="mt-5 pt-1">
                      <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                        <Button
                          variant={isWinner ? 'gold' : 'secondary'}
                          size="sm"
                          className="w-full"
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
            {/* BUG #6: Ribbon/Award icon — cream-100 with 40% opacity, more thematic than Inbox */}
            <Card className="p-8 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#16335E] flex items-center justify-center mx-auto border border-[rgba(244,239,227,0.08)]">
                <Ribbon size={32} className="text-[rgba(244,239,227,0.42)]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-[#F4EFE3] text-sm">Belum Ada Sertifikat</h3>
                <p className="text-xs text-[#9CA8BD] leading-normal">
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
