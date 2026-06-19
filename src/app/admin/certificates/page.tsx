import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { CertificatesAdminClient } from './CertificatesAdminClient';

export const metadata: Metadata = {
  title: 'Manajemen Sertifikat - Admin',
};

export default async function CertificatesAdminPage() {
  const supabase = await createClient();

  // Parallel fetch:
  // 1. All events
  // 2. All certificates with relations
  const [eventsResult, certificatesResult] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, status')
      .order('created_at', { ascending: false }),
    supabase
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
      .order('generated_at', { ascending: false }),
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
