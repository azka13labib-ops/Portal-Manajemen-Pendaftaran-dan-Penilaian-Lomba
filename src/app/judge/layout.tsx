import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayoutClient } from '@/components/shared/DashboardLayoutClient';

export default async function JudgeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: userRoleData } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleName = (userRoleData as any)?.roles?.name;
  if (roleName !== 'JUDGE' && roleName !== 'ADMIN') redirect('/participant');

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  return (
    <DashboardLayoutClient
      role="JUDGE"
      userName={profile?.full_name ?? 'Juri'}
      userEmail={profile?.email ?? user.email ?? ''}
    >
      {children}
    </DashboardLayoutClient>
  );
}
