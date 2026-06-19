/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ChevronRight, ArrowLeft, ClipboardList, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Antrian Penilaian Karya',
};

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function JudgeEventPage({ params }: PageProps) {
  const { eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch Event
  const { data: event, error: eventErr } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (eventErr || !event) {
    notFound();
  }

  // Fetch assigned submissions & scores
  const { data: assignments } = await supabase
    .from('judging_assignments')
    .select(`
      id,
      assigned_at,
      submissions (
        id,
        file_url,
        file_name,
        external_link,
        description,
        registrations (
          id,
          user_id,
          users (full_name, email),
          teams (name)
        )
      ),
      scores (
        id,
        status,
        raw_score
      )
    `)
    .eq('event_id', eventId)
    .eq('judge_id', user.id);

  const formattedAssignments = (assignments || []).map((a: any) => {
    // PostgREST sometimes returns many-to-one relations as an array
    const sub = Array.isArray(a.submissions) ? a.submissions[0] : a.submissions;
    const reg = Array.isArray(sub?.registrations) ? sub?.registrations[0] : sub?.registrations;
    const scores = Array.isArray(a.scores) ? a.scores : (a.scores ? [a.scores] : []);

    // Assess grading status
    // If there are no scores: 'BELUM_DINILAI'
    // If all scores are 'SUBMITTED': 'SELESAI'
    // Otherwise (some scores exist, or they are 'DRAFT'): 'DRAFT'
    let gradingStatus: 'BELUM' | 'DRAFT' | 'SELESAI' = 'BELUM';
    if (scores.length > 0) {
      const allSubmitted = scores.every((s: any) => s.status === 'SUBMITTED');
      gradingStatus = allSubmitted ? 'SELESAI' : 'DRAFT';
    }

    return {
      assignmentId: a.id,
      submissionId: sub?.id,
      fileName: sub?.file_name || 'Karya Tanpa Nama',
      description: sub?.description || '',
      fileUrl: sub?.file_url,
      externalLink: sub?.external_link,
      participantName: reg?.teams?.name 
        ? `${reg.teams.name} (Tim)`
        : reg?.users?.full_name || 'Individual',
      institution: reg?.users?.institution || '',
      gradingStatus,
      scoresCount: scores.length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/judge" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft size={12} /> Kembali ke Dashboard
      </Link>

      {/* Header */}
      <Card className="p-6 relative overflow-hidden noise-overlay">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -z-10" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider bg-teal-600/10 px-2 py-0.5 rounded">
              {event.category || 'Kompetisi'}
            </span>
            <Badge variant="pending">Fase Penilaian</Badge>
          </div>
          <h1 className="text-xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            {event.title}
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Di bawah ini adalah antrian karya peserta yang didelegasikan kepada Anda. Klik tombol &ldquo;Nilai Karya&rdquo; pada masing-masing baris untuk melakukan penilaian.
          </p>
        </div>
      </Card>

      {/* Queue List */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Antrian Penilaian Karya ({formattedAssignments.length})
        </h2>

        <div className="grid gap-3">
          {formattedAssignments.map((item) => (
            <Card key={item.assignmentId} className="p-4 hover:border-[rgba(93,138,205,0.25)] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-200 text-sm">
                      {item.fileName}
                    </h3>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      item.gradingStatus === 'SELESAI' ? 'badge-approved' :
                      item.gradingStatus === 'DRAFT' ? 'badge-pending' :
                      'badge-draft'
                    }`}>
                      {item.gradingStatus === 'SELESAI' ? 'Selesai Dinilai' :
                       item.gradingStatus === 'DRAFT' ? 'Draft Disimpan' :
                       'Belum Dinilai'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Oleh: {item.participantName}</p>
                  
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                    {item.fileUrl && (
                      <span className="flex items-center gap-0.5">
                        <ClipboardList size={10} /> Berkas Tersedia
                      </span>
                    )}
                    {item.externalLink && (
                      <span className="flex items-center gap-0.5">
                        <ExternalLink size={10} /> Demo Link
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Link href={`/judge/events/${eventId}/submissions/${item.submissionId}`}>
                    <Button
                      variant={item.gradingStatus === 'SELESAI' ? 'secondary' : 'primary'}
                      size="sm"
                      rightIcon={<ChevronRight size={14} />}
                    >
                      {item.gradingStatus === 'SELESAI' ? 'Lihat Nilai' : 'Nilai Karya'}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}

          {formattedAssignments.length === 0 && (
            <Card className="p-8 text-center text-slate-500 text-sm">
              Belum ada karya yang di-assign untuk Anda pada event ini.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
