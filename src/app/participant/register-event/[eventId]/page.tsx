import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EventRegisterFormClient } from './EventRegisterFormClient';

export const metadata: Metadata = {
  title: 'Formulir Pendaftaran Kompetisi',
};

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function ParticipantEventRegisterPage({ params }: PageProps) {
  const { eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch event details
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    notFound();
  }

  // Check if already registered
  const { data: existingReg } = await supabase
    .from('registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single();

  if (existingReg) {
    redirect('/participant');
  }

  return (
    <EventRegisterFormClient
      event={event}
      userId={user.id}
    />
  );
}
