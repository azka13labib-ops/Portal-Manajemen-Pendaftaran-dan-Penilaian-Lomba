import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditEventClient } from './EditEventClient';

export const metadata: Metadata = {
  title: 'Edit Event',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: PageProps) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  // Fetch event
  const { data: event, error: eventErr } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (eventErr || !event || event.created_by !== user.id) {
    notFound();
  }

  // Fetch scoring criteria
  const { data: criteria } = await supabase
    .from('scoring_criteria')
    .select('*')
    .eq('event_id', eventId)
    .order('display_order', { ascending: true });

  return <EditEventClient event={event} criteria={criteria || []} />;
}
