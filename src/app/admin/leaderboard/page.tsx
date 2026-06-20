import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LeaderboardAdminClient } from './LeaderboardAdminClient';

export const metadata: Metadata = {
  title: 'Leaderboard - Admin',
};

export default async function LeaderboardAdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Fetch only owned events for the dropdown selector
  const { data: events } = await supabase
    .from('events')
    .select('id, title, status')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  return (
    <LeaderboardAdminClient
      initialEvents={events || []}
    />
  );
}
