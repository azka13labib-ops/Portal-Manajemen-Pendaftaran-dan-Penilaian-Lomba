import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayoutClient } from '@/components/shared/DashboardLayoutClient';

export default async function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  return (
    <DashboardLayoutClient
      role="PARTICIPANT"
      userName={profile?.full_name ?? 'Peserta'}
      userEmail={profile?.email ?? user.email ?? ''}
    >
      {children}
    </DashboardLayoutClient>
  );
}
