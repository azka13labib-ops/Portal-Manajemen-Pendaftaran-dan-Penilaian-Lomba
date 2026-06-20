import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CertificatesAdminClient } from './CertificatesAdminClient';

export const metadata: Metadata = {
  title: 'Manajemen Sertifikat - Admin',
};

export default async function CertificatesAdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Get owned event IDs first
  const { data: ownEvents } = await supabase
    .from('events')
    .select('id')
    .eq('created_by', user.id);
  const ownEventIds = (ownEvents || []).map((e) => e.id);

  // Parallel fetch (scoped to owned events):
  const [eventsResult, certificatesResult] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, status')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false }),
    ownEventIds.length > 0
      ? supabase
          .from('certificates')
          .select(`
            id,
            registration_id,
            event_id,
            user_id,
            type,
            winner_rank,
            file_url,
            generated_at,
            events (
              title
            ),
            users (
              full_name,
              email
            ),
            registrations (
              team_id,
              teams (
                name
              )
            )
          `)
          .in('event_id', ownEventIds)
          .order('generated_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const events = eventsResult.data || [];
  const certificates = certificatesResult.data || [];

  return (
    <CertificatesAdminClient
      initialEvents={events}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialCertificates={certificates as any}
    />
  );
}
