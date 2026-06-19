import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AdminDashboardClient } from './AdminDashboardClient';

export const metadata: Metadata = { title: 'Dashboard Admin' };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Parallel fetch stats
  const [
    { count: totalEvents },
    { count: pendingRegs },
    { count: totalRegs },
    { count: totalSubmissions },
    { data: recentEvents },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('registrations').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('*', { count: 'exact', head: true }),
    supabase
      .from('events')
      .select('id, title, status, registration_open_at, registration_close_at')
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
