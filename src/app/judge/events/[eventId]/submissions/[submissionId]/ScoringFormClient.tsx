/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Check, ExternalLink, FileDown, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

interface ScoringFormClientProps {
  event: any;
  submission: any;
  assignment: any;
  criteria: any[];
  existingScores: any[];
}

export function ScoringFormClient({
  event,
  submission,
  assignment,
  criteria,
  existingScores,
}: ScoringFormClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Check if already finalized (status = SUBMITTED on any existing score)
  const isLocked = existingScores.some((s) => s.status === 'SUBMITTED') || event.status === 'FINALIZED';

  // State for raw scores and notes
  const [formState, setFormState] = useState<Record<string, { rawScore: number; notes: string }>>(() => {
    const initialState: Record<string, { rawScore: number; notes: string }> = {};
    
    criteria.forEach((c) => {
      const match = existingScores.find((s) => s.criteria_id === c.id);
      initialState[c.id] = {
        rawScore: match ? Number(match.raw_score) : Number(c.min_score),
        notes: match ? match.notes || '' : '',
      };
    });
    
    return initialState;
  });

  const [loading, setLoading] = useState(false);

  // Update a single score
  const handleScoreChange = (criteriaId: string, val: number) => {
    if (isLocked) return;
    setFormState((prev) => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        rawScore: val,
      },
    }));
  };

  // Update a single note
  const handleNoteChange = (criteriaId: string, val: string) => {
    if (isLocked) return;
    setFormState((prev) => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        notes: val,
      },
    }));
  };

  // Calculations
  const calculations = criteria.map((c) => {
    const current = formState[c.id] || { rawScore: 0, notes: '' };
    const raw = current.rawScore;
    const max = c.max_score || 100;
    const weight = c.weight || 0;
    
    const weighted = (raw / max) * weight;
    return {
      id: c.id,
      name: c.name,
      raw,
      max,
      weight,
      weighted,
    };
  });

  const finalAggregateScore = calculations.reduce((sum, item) => sum + item.weighted, 0);

  // Save functionality
  const handleSave = async (status: 'DRAFT' | 'SUBMITTED') => {
    setLoading(true);
    try {
      const payloads = criteria.map((c) => {
        const state = formState[c.id];
        const match = existingScores.find((s) => s.criteria_id === c.id);
        
        const payload: any = {
          assignment_id: assignment.id,
          criteria_id: c.id,
          raw_score: state.rawScore,
          notes: state.notes || null,
          status,
        };
        if (match?.id) {
          payload.id = match.id;
        }
        return payload;
      });

      const { error } = await supabase.from('scores').upsert(payloads);

      if (error) throw error;

      toast({
        type: 'success',
        title: status === 'SUBMITTED' ? 'Penilaian Dikunci & Dikirim' : 'Draft Disimpan',
        message: status === 'SUBMITTED' 
          ? 'Nilai berhasil dikirim ke leaderboard.' 
          : 'Nilai disimpan sebagai draft.',
      });

      router.refresh();
      if (status === 'SUBMITTED') {
        router.push(`/judge/events/${event.id}`);
      }
    } catch (err) {
      toast({
        type: 'error',
        title: 'Gagal Menyimpan Nilai',
        message: (err as Error).message || 'Terjadi kesalahan.',
      });
    } finally {
      setLoading(false);
    }
  };

  const displaySender = submission.registrations?.teams?.name 
    ? `${submission.registrations.teams.name} (Tim)`
    : submission.registrations?.users?.full_name || 'Individual';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href={`/judge/events/${event.id}`} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft size={12} /> Kembali ke Antrian
      </Link>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Left panel: Submission Information */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-5 space-y-5">
            <div>
              <span className="text-[10px] font-semibold text-teal-400 bg-teal-600/10 px-2 py-0.5 rounded uppercase tracking-wider">
                Detail Karya
              </span>
              <h1 className="text-lg font-bold text-slate-200 mt-2" style={{ fontFamily: 'var(--font-display)' }}>
                {submission.file_name || 'Karya Tanpa Nama'}
              </h1>
              <p className="text-xs text-slate-500">Dikirim oleh: {displaySender}</p>
              <p className="text-xs text-slate-500 font-mono">ID: {submission.id}</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-slate-400">Deskripsi Karya</p>
                <p className="text-slate-300 leading-relaxed bg-slate-800/20 p-3 rounded-xl border border-slate-800 whitespace-pre-wrap">
                  {submission.description || 'Tidak ada deskripsi.'}
                </p>
              </div>

              {submission.file_url && (
                <div className="space-y-1">
                  <p className="font-bold text-slate-400">Berkas Karya</p>
                  <a
                    href={submission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-800/10 text-blue-400 hover:text-blue-300 hover:border-blue-500/30 transition-all font-medium"
                  >
                    <FileDown size={14} /> Unduh Berkas Utama (.zip/.pdf)
                  </a>
                </div>
              )}

              {submission.external_link && (
                <div className="space-y-1">
                  <p className="font-bold text-slate-400">Tautan Demo/Video Presentasi</p>
                  <a
                    href={submission.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-800/10 text-teal-400 hover:text-teal-300 hover:border-teal-500/30 transition-all font-medium break-all"
                  >
                    <ExternalLink size={14} /> {submission.external_link}
                  </a>
                </div>
              )}
            </div>
          </Card>

          {isLocked && (
            <Card className="p-4 border-amber-500/25 bg-amber-500/5 flex gap-3 text-amber-400 text-xs">
              <AlertTriangle size={16} className="shrink-0" />
              <div>
                <p className="font-bold">Penilaian Terkunci</p>
                <p className="text-slate-400 mt-0.5">
                  Anda telah mengirimkan penilaian final ini, atau kompetisi telah difinalisasi oleh Admin. Data nilai sekarang bersifat read-only.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Right panel: Scoring Form */}
        <div className="md:col-span-3 space-y-6">
          <Card className="p-5 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h2 className="font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
                Formulir Penilaian Juri
              </h2>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Skor Agregat</p>
                <p className="text-xl font-mono font-bold text-blue-400">{finalAggregateScore.toFixed(2)} <span className="text-xs text-slate-500">/ 100</span></p>
              </div>
            </div>

            <div className="space-y-5">
              {criteria.map((c) => {
                const current = formState[c.id] || { rawScore: 0, notes: '' };
                const weighted = (current.rawScore / c.max_score) * c.weight;
                
                return (
                  <div key={c.id} className="p-4 rounded-xl border border-[rgba(93,138,205,0.15)] bg-[rgba(17,34,64,0.3)] space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-200 text-sm">{c.name}</h4>
                        <p className="text-[10px] text-slate-500 leading-normal">{c.description || 'Tidak ada deskripsi kriteria.'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">
                          Bobot: {c.weight}%
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">Weighted: {weighted.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Range limits & Current Input */}
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={c.min_score}
                        max={c.max_score}
                        value={current.rawScore}
                        onChange={(e) => handleScoreChange(c.id, Number(e.target.value))}
                        disabled={isLocked}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <div className="w-16 shrink-0">
                        <input
                          type="number"
                          min={c.min_score}
                          max={c.max_score}
                          value={current.rawScore}
                          onChange={(e) => handleScoreChange(c.id, Number(e.target.value))}
                          disabled={isLocked}
                          className="w-full text-center h-8 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Text Area Note */}
                    <Textarea
                      placeholder="Tambahkan catatan khusus untuk kriteria ini..."
                      value={current.notes}
                      onChange={(e) => handleNoteChange(c.id, e.target.value)}
                      disabled={isLocked}
                      className="min-h-[50px] text-xs py-1.5 px-2.5 rounded-lg bg-slate-900/50 border-slate-800"
                    />
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            {!isLocked && (
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <Button
                  variant="secondary"
                  onClick={() => handleSave('DRAFT')}
                  loading={loading}
                  leftIcon={<Save size={16} />}
                  className="flex-1"
                >
                  Simpan Draft
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleSave('SUBMITTED')}
                  loading={loading}
                  leftIcon={<Check size={16} />}
                  className="flex-1"
                >
                  Kunci & Kirim
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
