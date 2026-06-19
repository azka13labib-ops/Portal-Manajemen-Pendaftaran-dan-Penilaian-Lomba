import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { LeaderboardAdminClient } from './LeaderboardAdminClient';

export const metadata: Metadata = {
  title: 'Leaderboard - Admin',
};

export default async function LeaderboardAdminPage() {
  const supabase = await createClient();

  // Fetch all events for the dropdown selector
  const { data: events } = await supabase
    .from('events')
    .select('id, title, status')
    .order('created_at', { ascending: false });

  return (
    <LeaderboardAdminClient
      initialEvents={events || []}
    />
  );
}
