/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Upload, Send, CheckCircle2,
  ExternalLink, FileDown, Award, Clock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/Modal';
import Link from 'next/link';

interface SubmissionUploadClientProps {
  registration: any;
  submission: any;
  certificate: any;
}

export function SubmissionUploadClient({
  registration,
  submission: initialSubmission,
  certificate,
}: SubmissionUploadClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const event = registration.events;
  const isSubmissionClosed = new Date() > new Date(event.submission_close_at);
  const isFinalized = event.status === 'FINALIZED';

  const [submission, setSubmission] = useState(initialSubmission);
  const [loading, setLoading] = useState(false);
  const [subFile, setSubFile] = useState<File | null>(null);
  
  // Form states
  const [externalLink, setExternalLink] = useState(initialSubmission ? initialSubmission.external_link || '' : '');
  const [description, setDescription] = useState(initialSubmission ? initialSubmission.description || '' : '');
  const [isEditing, setIsEditing] = useState(!initialSubmission);
  
  // Lock logic
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (!submission?.submitted_at) return;
    
    const submittedTime = new Date(submission.submitted_at).getTime();
    const lockTime = submittedTime + 10 * 60 * 1000;
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((lockTime - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0 && isEditing && submission) {
        setIsEditing(false);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [submission, isEditing]);

  const canEdit = !isSubmissionClosed && !isFinalized && (!submission || timeLeft > 0);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast({
        type: 'error',
        title: 'Berkas Terlalu Besar',
        message: 'Ukuran file submission maksimal adalah 50 MB.',
      });
      return;
    }
    setSubFile(file);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const handleSubmit = async () => {
    setIsConfirmOpen(false);
    if (isSubmissionClosed) {
      toast({
        type: 'error',
        title: 'Upload Ditutup',
        message: 'Batas waktu pengunggahan karya untuk event ini telah berakhir.',
      });
      return;
    }

    if (!submission && !subFile) {
      toast({
        type: 'error',
        title: 'Berkas Diperlukan',
        message: 'Silakan unggah berkas karya Anda (.zip/.pdf).',
      });
      return;
    }

    setLoading(true);

    try {
      let fileUrl = submission ? submission.file_url : '';
      let fileName = submission ? submission.file_name : '';
      let fileSize = submission ? submission.file_size_bytes : 0;

      // 1. Upload file if selected
      if (subFile) {
        const fileExt = subFile.name.split('.').pop();
        const generatedName = `${registration.id}-${Date.now()}.${fileExt}`;
        const filePath = `${event.id}/${generatedName}`;

        const { error: uploadErr } = await supabase.storage
          .from('submission-files')
          .upload(filePath, subFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadErr) {
          throw new Error(`Gagal mengunggah berkas: ${uploadErr.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('submission-files')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = subFile.name;
        fileSize = subFile.size;
      }

      // 2. Upsert submission
      const payload: any = {
        registration_id: registration.id,
        event_id: event.id,
        file_url: fileUrl,
        file_name: fileName,
        file_size_bytes: fileSize,
        external_link: externalLink.trim() || null,
        description: description.trim() || null,
        status: 'SUBMITTED',
        updated_at: new Date().toISOString(),
      };

      if (submission) {
        // If updating
        const { data, error } = await supabase
          .from('submissions')
          .update(payload)
          .eq('registration_id', registration.id)
          .select()
          .single();

        if (error) throw error;
        setSubmission(data);
      } else {
        // If first submit
        payload.submitted_at = new Date().toISOString();
        const { data, error } = await supabase
          .from('submissions')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        setSubmission(data);
      }

      toast({
        type: 'success',
        title: 'Karya Berhasil Dikumpulkan',
        message: 'Karya Anda telah tersimpan dan siap dinilai oleh Juri.',
      });

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Pengumpulan Gagal',
        message: (err as Error).message || 'Terjadi kesalahan.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link href="/participant" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft size={12} /> Kembali ke Dashboard
      </Link>

      {/* Header */}
      <Card className="p-6 relative overflow-hidden noise-overlay">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-blue-400 bg-blue-600/10 px-2 py-0.5 rounded uppercase tracking-wider">
            Pengumpulan Karya
          </span>
          <h1 className="text-xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            {event.title}
          </h1>
          <p className="text-xs text-slate-400">
            {registration.team_id ? `Tim: ${registration.teams?.name}` : 'Registrasi Individual'}
          </p>
        </div>
      </Card>

      {/* Certificate download section (shown if event finalized & certificate exists) */}
      {isFinalized && certificate && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-5 border-amber-500/20 bg-amber-500/5 flex flex-col sm:flex-row items-center justify-between gap-4 glow-gold">
            <div className="flex gap-3 text-left">
              <Award className="text-amber-400 shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-amber-300 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                  Selamat! E-Sertifikat Anda Telah Tersedia
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {certificate.type === 'WINNER' 
                    ? `Selamat atas pencapaian Anda meraih ${certificate.winner_rank.replace('_', ' ')}!` 
                    : 'Terima kasih atas partisipasi aktif Anda dalam kompetisi ini.'}
                </p>
              </div>
            </div>
            <a href={certificate.file_url} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button variant="primary" size="sm" className="w-full glow-gold" leftIcon={<FileDown size={14} />}>
                Unduh Sertifikat PDF
              </Button>
            </a>
          </Card>
        </motion.div>
      )}

      {/* Submission status panel */}
      {submission && !isEditing ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-teal-400" size={18} />
                <h2 className="font-semibold text-slate-200 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                  Karya Telah Diterima
                </h2>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Disubmit pada: {new Date(submission.submitted_at).toLocaleDateString('id-ID')}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-500">Nama Berkas:</span>
                <span className="col-span-2 font-mono text-slate-300 break-all">{submission.file_name}</span>
              </div>
              {submission.external_link && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Tautan Demo/Video:</span>
                  <span className="col-span-2 font-mono text-teal-400 break-all hover:underline">
                    <a href={submission.external_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                      {submission.external_link} <ExternalLink size={10} />
                    </a>
                  </span>
                </div>
              )}
              {submission.description && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Deskripsi:</span>
                  <span className="col-span-2 text-slate-300 whitespace-pre-wrap">{submission.description}</span>
                </div>
              )}
            </div>

            {/* Replace Button if deadline not passed */}
            {canEdit ? (
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <Clock className="text-amber-400" size={16} />
                  <p className="text-xs text-amber-300 font-medium">
                    Sisa Waktu Revisi: <span className="font-mono">{formatTime(timeLeft)}</span>
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsEditing(true)}
                >
                  Ganti / Perbarui Karya
                </Button>
              </div>
            ) : (
              !isSubmissionClosed && !isFinalized && (
                <div className="mt-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                  <p className="text-xs text-slate-400 text-center">
                    Masa revisi karya (10 menit) telah berakhir. Karya telah dikunci untuk dinilai.
                  </p>
                </div>
              )
            )}
          </Card>
        </motion.div>
      ) : (
        <form onSubmit={handlePreSubmit}>
          <Card className="p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Upload className="text-blue-400" size={18} />
              <h2 className="font-semibold text-slate-200 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                Formulir Pengunggahan Karya
              </h2>
            </div>

            {isSubmissionClosed ? (
              <div className="p-4 border border-red-500/20 bg-red-500/5 text-xs text-red-400 rounded-xl">
                Batas waktu pengumpulan karya telah ditutup. Anda tidak dapat mengunggah berkas baru.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Upload ZIP/PDF */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Unggah Berkas Karya (.ZIP atau .PDF)</label>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Silakan kumpulkan berkas source code, dokumen presentasi, atau portofolio desain Anda dalam format ZIP/PDF. Ukuran berkas maksimal 50 MB.
                  </p>

                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-800/5 hover:bg-slate-800/10 hover:border-slate-500/40 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-slate-400" />
                        <p className="text-xs text-slate-400 text-center px-4">
                          {subFile ? <span className="text-blue-400 font-semibold">{subFile.name}</span> : 'Klik untuk memilih file karya'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">ZIP, PDF (Maks. 50MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".zip,.pdf"
                      />
                    </label>
                  </div>
                </div>

                {/* External demo link */}
                <Input
                  label="Tautan Demo / Video Presentasi (Opsional)"
                  placeholder="Contoh: https://youtube.com/... atau https://figma.com/..."
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  type="url"
                />

                {/* Brief description */}
                <Textarea
                  label="Deskripsi Ringkas Karya (Opsional)"
                  placeholder="Jelaskan secara singkat fitur utama atau konsep karya Anda..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />

                <div className="flex items-center gap-3 pt-2">
                  {submission && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1"
                      onClick={() => setIsEditing(false)}
                    >
                      Batal
                    </Button>
                  )}
                  <Button
                    type="submit"
                    loading={loading}
                    className="flex-1"
                    leftIcon={<Send size={14} />}
                  >
                    Submit Karya
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </form>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSubmit}
        title={submission ? "Perbarui Karya" : "Kumpulkan Karya"}
        message={submission 
          ? "Apakah Anda yakin ingin memperbarui karya ini? Pembaruan dapat dilakukan selama masa revisi (10 menit) belum berakhir."
          : "Apakah Anda yakin ingin mengirimkan karya ini? Setelah dikirim, Anda memiliki waktu revisi selama 10 menit sebelum karya dikunci secara permanen untuk dinilai oleh juri."
        }
        confirmLabel="Ya, Kumpulkan"
        cancelLabel="Batal"
        loading={loading}
      />
    </div>
  );
}
