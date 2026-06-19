/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ClipboardList, Calendar, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dashboard Juri',
};

export default async function JudgeDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch assigned events
  const { data: assignedEventsData } = await supabase
    .from('event_judges')
    .select('*, events(*)')
    .eq('judge_id', user.id);

  // Fetch all assignments for statistics
  const { data: assignments } = await supabase
    .from('judging_assignments')
    .select('id, event_id, submission_id')
    .eq('judge_id', user.id);

  // Fetch all scores submitted by this judge
  const { data: scores } = await supabase
    .from('scores')
    .select('id, status, assignment_id, assignment:judging_assignments!inner(judge_id)')
    .eq('assignment.judge_id', user.id);

  const assignedEvents = (assignedEventsData || []).map((ae: any) => {
    const event = ae.events;
    const eventAssignments = (assignments || []).filter((a) => a.event_id === event.id);
    
    // Graded submissions: assignments where at least one score exists and it is SUBMITTED
    // For simplicity, find the unique assignments that have scores with 'SUBMITTED' status
    const submittedAssignmentIds = new Set(
      (scores || [])
        .filter((s) => s.status === 'SUBMITTED')
        .map((s) => s.assignment_id)
    );
    
    const gradedCount = eventAssignments.filter((a) => submittedAssignmentIds.has(a.id)).length;
    const totalCount = eventAssignments.length;

    return {
      ...event,
      totalCount,
      gradedCount,
    };
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <Badge variant="open">Pendaftaran Dibuka</Badge>;
      case 'SUBMISSION_CLOSED': return <Badge variant="submitted">Karya Ditutup</Badge>;
      case 'JUDGING': return <Badge variant="pending">Penilaian Berlangsung</Badge>;
      case 'FINALIZED': return <Badge variant="finalized">Selesai</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="p-6 relative overflow-hidden noise-overlay">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -z-10" />
        <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
          Selamat Datang, Juri!
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Portal ini menyajikan daftar karya yang di-assign kepada Anda untuk dinilai secara objektif dan rahasia.
          Pastikan untuk menyelesaikan penilaian sebelum batas waktu yang ditentukan.
        </p>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Event Ditugaskan</p>
            <p className="text-lg font-bold text-slate-200">{assignedEvents.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-400 flex items-center justify-center">
            <ClipboardList size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Karya Di-assign</p>
            <p className="text-lg font-bold text-slate-200">
              {assignments?.length || 0}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-400 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Karya Selesai Dinilai</p>
            <p className="text-lg font-bold text-slate-200">
              {
                (assignments || []).filter((a) => 
                  (scores || []).some((s) => s.assignment_id === a.id && s.status === 'SUBMITTED')
                ).length
              }
            </p>
          </div>
        </Card>
      </div>

      {/* Assigned Events List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
          Kompetisi Aktif Anda
        </h2>

        <div className="grid gap-4">
          {assignedEvents.map((event) => (
            <Card key={event.id} className="p-5 hover:border-[rgba(93,138,205,0.3)] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider bg-teal-600/10 px-2 py-0.5 rounded">
                      {event.category || 'Kompetisi'}
                    </span>
                    {getStatusBadge(event.status)}
                  </div>
                  <h3 className="font-bold text-slate-200 text-base" style={{ fontFamily: 'var(--font-display)' }}>
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Mulai: {new Date(event.registration_open_at).toLocaleDateString('id-ID')}</span>
                    <span>Deadline Karya: {new Date(event.submission_close_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between sm:justify-end">
                  <div className="text-right sm:mr-4">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Progress Penilaian</p>
                    <p className="text-sm font-bold text-slate-200">
                      {event.gradedCount} <span className="text-slate-500 font-medium">/ {event.totalCount} Karya</span>
                    </p>
                  </div>

                  <Link href={`/judge/events/${event.id}`}>
                    <Button variant="secondary" size="sm" rightIcon={<ChevronRight size={14} />}>
                      Mulai Menilai
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}

          {assignedEvents.length === 0 && (
            <Card className="p-8 text-center text-slate-500 text-sm">
              Anda belum ditugaskan sebagai juri pada event kompetisi apa pun saat ini.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
