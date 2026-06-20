import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ParticipantDashboardClient } from './ParticipantDashboardClient';

export const metadata: Metadata = {
  title: 'Dashboard Peserta',
};

export default async function ParticipantDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, events(*), teams(*)');

  // Fetch team member invitations for this user
  const { data: invitations } = await supabase
    .from('team_members')
    .select('*, teams(*, events(*))')
    .eq('user_id', user.id)
    .eq('status', 'INVITED');

  // Fetch all open events
  const { data: openEvents } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'OPEN');

  // Filter out open events that the user is already registered in
  const registeredEventIds = new Set((registrations || []).map((r) => r.event_id));
  const availableEvents = (openEvents || []).filter((e) => !registeredEventIds.has(e.id));

  return (
    <ParticipantDashboardClient
      registrations={registrations || []}
      invitations={invitations || []}
      availableEvents={availableEvents}
    />
  );
}
