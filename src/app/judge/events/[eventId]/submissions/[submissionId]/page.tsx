import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ScoringFormClient } from './ScoringFormClient';

export const metadata: Metadata = {
  title: 'Penilaian Karya Peserta',
};

interface PageProps {
  params: Promise<{ eventId: string; submissionId: string }>;
}

export default async function JudgeScoringPage({ params }: PageProps) {
  const { eventId, submissionId } = await params;
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

  if (eventErr || !event) notFound();

  // Fetch Submission
  const { data: submission, error: subErr } = await supabase
    .from('submissions')
    .select('*, registrations(*, users(full_name, email, institution), teams(name))')
    .eq('id', submissionId)
    .single();

  if (subErr || !submission) notFound();

  // Fetch Judging Assignment
  const { data: assignment, error: assignmentErr } = await supabase
    .from('judging_assignments')
    .select('*')
    .eq('submission_id', submissionId)
    .eq('judge_id', user.id)
    .single();

  if (assignmentErr || !assignment) notFound();

  // Fetch Scoring Criteria
  const { data: criteria } = await supabase
    .from('scoring_criteria')
    .select('*')
    .eq('event_id', eventId)
    .order('display_order', { ascending: true });

  // Fetch Existing Scores
  const { data: existingScores } = await supabase
    .from('scores')
    .select('*')
    .eq('assignment_id', assignment.id);

  return (
    <ScoringFormClient
      event={event}
      submission={submission}
      assignment={assignment}
      criteria={criteria || []}
      existingScores={existingScores || []}
    />
  );
}
