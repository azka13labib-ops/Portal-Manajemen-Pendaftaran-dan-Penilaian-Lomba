import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { LandingClient } from './LandingClient';

export const metadata: Metadata = {
  title: 'Portal Lomba — Platform Manajemen Kompetisi Mahasiswa',
  description:
    'Daftarkan diri atau tim Anda, submit karya terbaik, dan dapatkan sertifikat digital resmi tingkat nasional.',
};

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch active open events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('status', ['OPEN', 'SUBMISSION_CLOSED', 'JUDGING', 'FINALIZED'])
    .order('registration_open_at', { ascending: false });

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole = '';
  let profile = null;

  if (user) {
    // Get all roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleNames = (userRoles ?? []).map((r: any) => r.roles?.name).filter(Boolean);
    if (roleNames.includes('ADMIN')) userRole = 'ADMIN';
    else if (roleNames.includes('JUDGE')) userRole = 'JUDGE';
    else userRole = 'PARTICIPANT';

    // Get user profile
    const { data: profileData } = await supabase
      .from('users')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();
    profile = profileData;
  }

  return (
    <LandingClient
      events={events || []}
      isLoggedIn={!!user}
      userRole={userRole}
      userName={profile?.full_name || ''}
    />
  );
}
