import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RegistrationsListClient } from './RegistrationsListClient';

export const metadata: Metadata = {
  title: 'Pendaftaran Saya — Portal Lomba',
};

export default async function ParticipantRegistrationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch participant's registrations sorted by newest
  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, events(*), teams(*)')
    .order('created_at', { ascending: false });

  return <RegistrationsListClient registrations={registrations || []} />;
}
