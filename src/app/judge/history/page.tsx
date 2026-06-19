/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, EmptyState } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FileText, Trophy, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Riwayat Penilaian - Juri',
};

export default async function JudgeHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch all assignments that have submitted scores
  const { data: assignmentsData } = await supabase
    .from('judging_assignments')
    .select(`
      id,
      event_id,
      submission_id,
      events(id, title),
      submissions(id, file_name),
      scores!inner(id, status, raw_score, notes, updated_at)
    `)
    .eq('judge_id', user.id)
    .eq('scores.status', 'SUBMITTED')
    .order('assigned_at', { ascending: false });

  const gradedAssignments = (assignmentsData || []).map((a: any) => ({
    ...a,
    event: a.events,
    submission: a.submissions,
    score: a.scores[0], // Assuming 1 score per assignment
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            Riwayat Penilaian
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Daftar karya peserta yang sudah selesai Anda nilai.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {gradedAssignments.map((a) => (
          <Card key={a.id} className="p-5 hover:border-[rgba(93,138,205,0.3)] transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="finalized">Selesai Dinilai</Badge>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Trophy size={10} /> {a.event?.title}
                  </span>
                </div>
                <h3 className="font-bold text-slate-200 text-base" style={{ fontFamily: 'var(--font-display)' }}>
                  Karya: {a.submission?.file_name || 'Tidak ada nama file'}
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock size={12}/> Dinilai pada: {new Date(a.score?.updated_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end text-right">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Nilai</p>
                  <p className="text-2xl font-bold text-teal-400">{a.score?.raw_score || 0}</p>
                </div>
              </div>
            </div>
            {a.score?.notes && (
              <div className="mt-4 pt-4 border-t border-[rgba(93,138,205,0.1)]">
                <p className="text-xs text-slate-400 italic">" {a.score.notes} "</p>
              </div>
            )}
          </Card>
        ))}

        {gradedAssignments.length === 0 && (
          <Card className="p-12">
            <EmptyState
              icon={<FileText size={32} />}
              title="Belum Ada Riwayat"
              description="Anda belum menyelesaikan penilaian untuk karya apa pun."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
