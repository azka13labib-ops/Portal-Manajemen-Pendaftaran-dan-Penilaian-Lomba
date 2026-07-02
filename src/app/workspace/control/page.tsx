import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SuperAdminClient } from './SuperAdminClient';

export const metadata = { title: 'Workspace' };

export default async function WorkspaceControlPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('users').select('is_superadmin').eq('id', user.id).single();
  if (!profile?.is_superadmin) redirect('/');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parallel fetch all data
  const [
    { data: allUsers },
    { data: allEvents },
    { data: allRegistrations },
    { data: allSubmissions },
    { data: newToday },
  ] = await Promise.all([
    supabase.from('users').select('id, full_name, email, institution, created_at, is_superadmin, user_roles(roles(name))').order('created_at', { ascending: false }),
    supabase.from('events').select('id, title, status, category, created_at, registration_close_at').order('created_at', { ascending: false }),
    supabase.from('registrations').select('id, created_at'),
    supabase.from('submissions').select('id'),
    supabase.from('users').select('id').gte('created_at', today.toISOString()),
  ]);

  // Role counts
  const users = allUsers || [];
  const countRole = (role: string) =>
    users.filter((u) => u.user_roles?.some((r: { roles: { name: string } }) => r.roles?.name === role)).length;

  const stats = {
    totalUsers: users.length,
    totalAdmins: countRole('ADMIN'),
    totalJudges: countRole('JUDGE'),
    totalParticipants: countRole('PARTICIPANT'),
    totalEvents: (allEvents || []).length,
    totalRegistrations: (allRegistrations || []).length,
    totalSubmissions: (allSubmissions || []).length,
    newUsersToday: (newToday || []).length,
  };

  // Registrations by day (last 7 days)
  const registrationsByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);
    const count = (allRegistrations || []).filter((r) => {
      const created = new Date(r.created_at);
      return created >= d && created < nextD;
    }).length;
    return { date: d.toISOString(), count };
  });

  return (
    <SuperAdminClient
      stats={stats}
      users={users}
      events={allEvents || []}
      registrationsByDay={registrationsByDay}
    />
  );
}
