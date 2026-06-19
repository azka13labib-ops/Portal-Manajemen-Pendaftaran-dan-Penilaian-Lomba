import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Submission } from '@/types';
import { SubmissionsListClient } from './SubmissionsListClient';

export const metadata: Metadata = {
  title: 'Upload Karya — Portal Lomba',
};

export default async function ParticipantSubmissionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch approved registrations (eligible for submissions)
  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, events(*), teams(*)')
    .eq('user_id', user.id)
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false });

  // Fetch submissions for these registrations
  const regIds = (registrations || []).map((r) => r.id);
  
  let submissions: Submission[] = [];
  if (regIds.length > 0) {
    const { data: subs } = await supabase
      .from('submissions')
      .select('*')
      .in('registration_id', regIds);
    submissions = subs || [];
  }

  return (
    <SubmissionsListClient
      registrations={registrations || []}
      submissions={submissions}
    />
  );
}
