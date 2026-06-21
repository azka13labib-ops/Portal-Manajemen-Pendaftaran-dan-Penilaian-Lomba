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

  // Registrations for this user
  const { data: registrations } = await supabase
    .from('registrations')
    .select('*, events(*), teams(*)')
    .order('created_at', { ascending: false });

  // Team invitations
  const { data: invitations } = await supabase
    .from('team_members')
    .select('*, teams(*, events(*))')
    .eq('user_id', user.id)
    .eq('status', 'INVITED');

  // Submission count (for stat card)
  const approvedRegIds = (registrations || [])
    .filter((r) => r.status === 'APPROVED')
    .map((r) => r.id);

  let submissionCount = 0;
  if (approvedRegIds.length > 0) {
    const { count } = await supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .in('registration_id', approvedRegIds);
    submissionCount = count ?? 0;
  }

  // Certificate count (for stat card)
  const { count: certificateCount } = await supabase
    .from('certificates')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return (
    <ParticipantDashboardClient
      registrations={registrations || []}
      invitations={invitations || []}
      availableEvents={[]}
      submissionCount={submissionCount}
      certificateCount={certificateCount ?? 0}
    />
  );
}
