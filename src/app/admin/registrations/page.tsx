import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RegistrationsAdminClient } from './RegistrationsAdminClient';

export const metadata: Metadata = {
  title: 'Verifikasi Peserta - Admin',
};

export default async function RegistrationsAdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Get owned event IDs first
  const { data: ownEvents } = await supabase
    .from('events')
    .select('id')
    .eq('created_by', user.id);
  const ownEventIds = (ownEvents || []).map((e) => e.id);

  // Fetch events for filtering and registrations with related data (scoped)
  const [eventsResult, registrationsResult] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, status')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false }),
    ownEventIds.length > 0
      ? supabase
          .from('registrations')
          .select(`
            id,
            event_id,
            user_id,
            team_id,
            status,
            rejection_note,
            docs_urls,
            created_at,
            updated_at,
            users (
              full_name,
              email,
              institution
            ),
            teams (
              name
            ),
            events (
              title
            )
          `)
          .in('event_id', ownEventIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const events = eventsResult.data || [];
  const registrations = registrationsResult.data || [];

  return (
    <RegistrationsAdminClient
      initialEvents={events}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialRegistrations={registrations as any}
    />
  );
}
