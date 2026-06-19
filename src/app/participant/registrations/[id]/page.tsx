import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SubmissionUploadClient } from './SubmissionUploadClient';

export const metadata: Metadata = {
  title: 'Pengumpulan Karya Lomba',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ParticipantSubmissionPage({ params }: PageProps) {
  const { id: registrationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch Registration
  const { data: registration, error: regErr } = await supabase
    .from('registrations')
    .select('*, events(*), teams(*)')
    .eq('id', registrationId)
    .single();

  if (regErr || !registration) {
    notFound();
  }

  // Double check authorization
  if (registration.user_id !== user.id) {
    // If it's a team registration, verify if the user is a confirmed member of the team
    if (registration.team_id) {
      const { data: isMember } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', registration.team_id)
        .eq('user_id', user.id)
        .eq('status', 'CONFIRMED')
        .single();
        
      if (!isMember) {
        redirect('/participant');
      }
    } else {
      redirect('/participant');
    }
  }

  // Fetch existing submission
  const { data: submission } = await supabase
    .from('submissions')
    .select('*')
    .eq('registration_id', registrationId)
    .single();

  // Fetch certificate if event finalized
  const { data: certificate } = await supabase
    .from('certificates')
    .select('*')
    .eq('registration_id', registrationId)
    .single();

  return (
    <SubmissionUploadClient
      registration={registration}
      submission={submission}
      certificate={certificate}
    />
  );
}
