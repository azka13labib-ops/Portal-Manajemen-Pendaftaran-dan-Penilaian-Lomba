import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { RegistrationsAdminClient } from './RegistrationsAdminClient';

export const metadata: Metadata = {
  title: 'Verifikasi Peserta - Admin',
};

export default async function RegistrationsAdminPage() {
  const supabase = await createClient();

  // Fetch events for filtering and registrations with related data
  const [eventsResult, registrationsResult] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, status')
      .order('created_at', { ascending: false }),
    supabase
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
      .order('created_at', { ascending: false }),
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
