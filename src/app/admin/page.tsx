import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminDashboardClient } from './AdminDashboardClient';

export const metadata: Metadata = { title: 'Dashboard Admin' };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Get owned event IDs first
  const { data: ownEvents } = await supabase
    .from('events')
    .select('id')
    .eq('created_by', user.id);
  const ownEventIds = (ownEvents || []).map((e) => e.id);

  // Parallel fetch stats (scoped to owned events)
  const [
    { count: totalEvents },
    { count: pendingRegs },
    { count: totalRegs },
    { count: totalSubmissions },
    { data: recentEvents },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('created_by', user.id),
    ownEventIds.length > 0
      ? supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'PENDING').in('event_id', ownEventIds)
      : Promise.resolve({ count: 0 }),
    ownEventIds.length > 0
      ? supabase.from('registrations').select('*', { count: 'exact', head: true }).in('event_id', ownEventIds)
      : Promise.resolve({ count: 0 }),
    ownEventIds.length > 0
      ? supabase.from('submissions').select('*', { count: 'exact', head: true }).in('event_id', ownEventIds)
      : Promise.resolve({ count: 0 }),
    supabase
      .from('events')
      .select('id, title, status, registration_open_at, registration_close_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return (
    <AdminDashboardClient
      stats={{
        totalEvents: totalEvents ?? 0,
        pendingRegs: pendingRegs ?? 0,
        totalRegs: totalRegs ?? 0,
        totalSubmissions: totalSubmissions ?? 0,
      }}
      recentEvents={recentEvents ?? []}
    />
  );
}
