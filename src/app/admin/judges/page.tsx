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
  const [judgesResult, eventsResult, assignmentsResult] = await Promise.all([
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
  ]);

  // Get unique judge IDs from owned event assignments
  const assignedJudgeIds = new Set(
    (assignmentsResult.data || []).map((a: { judge_id: string }) => a.judge_id)
  );

  // Format judges list - only show judges who are assigned to owned events
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allJudges = (judgesResult.data || []).map((item: any) => ({
    id: item.user_id,
    full_name: item.users?.full_name || 'Juri Tanpa Nama',
    email: item.users?.email || '',
    institution: item.users?.institution || '-',
  }));

  // Filter to only judges relevant to this admin's events
  const judges = allJudges.filter((j: { id: string }) => assignedJudgeIds.has(j.id));

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
