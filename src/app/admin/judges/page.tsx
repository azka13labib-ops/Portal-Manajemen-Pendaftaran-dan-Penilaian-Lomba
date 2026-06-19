import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { JudgesAdminClient } from './JudgesAdminClient';

export const metadata: Metadata = {
  title: 'Kelola Juri - Admin',
};

export default async function JudgesAdminPage() {
  const supabase = await createClient();

  // Parallel fetch:
  // 1. All users with JUDGE role
  // 2. All events (for assignment)
  // 3. All event-judge assignments
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
      .order('created_at', { ascending: false }),
    supabase
      .from('event_judges')
      .select(`
        event_id,
        judge_id,
        events (
          title
        )
      `),
  ]);

  // Format judges list
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const judges = (judgesResult.data || []).map((item: any) => ({
    id: item.user_id,
    full_name: item.users?.full_name || 'Juri Tanpa Nama',
    email: item.users?.email || '',
    institution: item.users?.institution || '-',
  }));

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
