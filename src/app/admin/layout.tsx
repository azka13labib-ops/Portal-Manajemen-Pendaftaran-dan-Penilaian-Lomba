import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardLayoutClient } from '@/components/shared/DashboardLayoutClient';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch ALL user roles (user may have multiple)
  const { data: userRolesData } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleNames: string[] = (userRolesData ?? []).map((r: any) => r.roles?.name).filter(Boolean);

  if (!roleNames.includes('ADMIN')) {
    redirect(roleNames.includes('JUDGE') ? '/judge' : '/participant');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  return (
    <DashboardLayoutClient
      role="ADMIN"
      userName={profile?.full_name ?? user.email ?? 'Admin'}
      userEmail={profile?.email ?? user.email ?? ''}
    >
      {children}
    </DashboardLayoutClient>
  );
}
