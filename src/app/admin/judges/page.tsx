import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { JudgesAdminClient } from './JudgesAdminClient';

export const metadata: Metadata = {
  title: 'Kelola Juri - Admin',
};

export default async function JudgesAdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Get owned event IDs first
  const { data: ownEvents } = await supabase
    .from('events')
    .select('id')
    .eq('created_by', user.id);
  const ownEventIds = (ownEvents || []).map((e) => e.id);

  // Parallel fetch:
  // 1. All users with JUDGE role (for potential assignment)
  // 2. Owned events (for assignment dropdown)
  // 3. Event-judge assignments scoped to owned events
  // 4. All assignments in the database (to detect unassigned judges)
  const [judgesResult, eventsResult, assignmentsResult, allAssignmentsResult] = await Promise.all([
    supabase
      .from('user_roles')
      .select(`
        user_id,
        users (
          full_name,
          email,
          institution
        ),
        roles!inner (
          name
        )
      `)
      .eq('roles.name', 'JUDGE'),
    supabase
      .from('events')
      .select('id, title, status')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false }),
    ownEventIds.length > 0
      ? supabase
          .from('event_judges')
          .select(`
            event_id,
            judge_id,
            events (
              title
            )
          `)
          .in('event_id', ownEventIds)
      : Promise.resolve({ data: [] }),
    supabase
      .from('event_judges')
      .select('judge_id'),
  ]);

  // Get unique judge IDs from owned event assignments
  const assignedJudgeIds = new Set(
    (assignmentsResult.data || []).map((a: { judge_id: string }) => a.judge_id)
  );

  // Get all judge IDs who have at least one assignment in the system
  const allAssignedJudgeIds = new Set(
    (allAssignmentsResult.data || []).map((a: { judge_id: string }) => a.judge_id)
  );

  // Format judges list
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allJudges = (judgesResult.data || []).map((item: any) => ({
    id: item.user_id,
    full_name: item.users?.full_name || 'Juri Tanpa Nama',
    email: item.users?.email || '',
    institution: item.users?.institution || '-',
  }));

  // Filter to:
  // - Judges assigned to this admin's events
  // - OR Judges who are completely unassigned (so they can be assigned to events)
  const judges = allJudges.filter((j: { id: string }) => 
    assignedJudgeIds.has(j.id) || !allAssignedJudgeIds.has(j.id)
  );

  const events = eventsResult.data || [];
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignments = (assignmentsResult.data || []).map((a: any) => ({
    event_id: a.event_id,
    judge_id: a.judge_id,
    event_title: a.events?.title || 'Unknown Event',
  }));

  return (
    <JudgesAdminClient
      initialJudges={judges}
      initialEvents={events}
      initialAssignments={assignments}
    />
  );
}
