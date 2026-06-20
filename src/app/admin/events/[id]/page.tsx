import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminEventDetailClient } from './AdminEventDetailClient';

export const metadata: Metadata = {
  title: 'Detail Event & Manajemen',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEventDetailPage({ params }: PageProps) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  // Parallel fetch event data
  const [
    { data: event, error: eventErr },
    { data: registrations },
    { data: criteria },
    { data: assignedJudges },
    { data: allJudges },
    { data: submissions },
    { data: assignments },
  ] = await Promise.all([
    supabase.from('events').select('*').eq('id', eventId).single(),
    supabase
      .from('registrations')
      .select('*, users(full_name, email, institution), teams(name)')
      .eq('event_id', eventId),
    supabase
      .from('scoring_criteria')
      .select('*')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true }),
    supabase
      .from('event_judges')
      .select('*, users!event_judges_judge_id_fkey(full_name, email)')
      .eq('event_id', eventId),
    // Fetch all users who have the JUDGE role
    supabase
      .from('user_roles')
      .select('user_id, users(full_name, email), roles!inner(name)')
      .eq('roles.name', 'JUDGE'),
    supabase
      .from('submissions')
      .select('*, registrations(user_id, users(full_name), teams(name))')
      .eq('event_id', eventId),
    supabase
      .from('judging_assignments')
      .select('*')
      .eq('event_id', eventId),
  ]);

  // Guard: event must exist AND belong to the current admin
  if (eventErr || !event || event.created_by !== user.id) {
    notFound();
  }

  // Format allJudges properly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedAllJudges = (allJudges || []).map((j: any) => ({
    id: j.user_id,
    full_name: j.users?.full_name || 'Juri Tanpa Nama',
    email: j.users?.email || '',
  }));

  // Format assignedJudges properly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedAssignedJudges = (assignedJudges || []).map((j: any) => ({
    id: j.judge_id,
    full_name: j.users?.full_name || 'Juri Tanpa Nama',
    email: j.users?.email || '',
    assigned_at: j.assigned_at,
  }));

  return (
    <AdminEventDetailClient
      event={event}
      registrations={registrations || []}
      criteria={criteria || []}
      assignedJudges={formattedAssignedJudges}
      allJudges={formattedAllJudges}
      submissions={submissions || []}
      assignments={assignments || []}
    />
  );
}
