/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, EmptyState } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FileText, Clock, ChevronRight, Trophy } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Antrian Penilaian - Juri',
};

export default async function JudgeAssignmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch all assignments for this judge
  const { data: assignmentsData } = await supabase
    .from('judging_assignments')
    .select(`
      id,
      event_id,
      submission_id,
      assigned_at,
      events(id, title, category, status),
      submissions(id, file_name, submitted_at),
      scores(id, status)
    `)
    .eq('judge_id', user.id)
    .order('assigned_at', { ascending: false });

  const assignments = (assignmentsData || []).map((a: any) => {
    const isGraded = (a.scores || []).some((s: any) => s.status === 'SUBMITTED');
    return {
      ...a,
      isGraded,
      event: a.events,
      submission: a.submissions,
    };
  });

  const pendingAssignments = assignments.filter((a) => !a.isGraded);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            Antrian Penilaian
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Daftar karya peserta yang perlu Anda nilai.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {pendingAssignments.map((a) => (
          <Card key={a.id} className="p-5 hover:border-[rgba(93,138,205,0.3)] transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="pending">Belum Dinilai</Badge>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Trophy size={10} /> {a.event?.title}
                  </span>
                </div>
                <h3 className="font-bold text-slate-200 text-base" style={{ fontFamily: 'var(--font-display)' }}>
                  Karya: {a.submission?.file_name || 'Tidak ada nama file'}
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock size={12}/> Ditugaskan: {new Date(a.assigned_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link href={`/judge/events/${a.event_id}`}>
                  <Button variant="primary" size="sm" rightIcon={<ChevronRight size={14} />}>
                    Nilai Sekarang
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}

        {pendingAssignments.length === 0 && (
          <Card className="p-12">
            <EmptyState
              icon={<FileText size={32} />}
              title="Tidak Ada Antrian"
              description="Anda belum memiliki karya yang harus dinilai, atau semua karya sudah selesai Anda nilai."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
