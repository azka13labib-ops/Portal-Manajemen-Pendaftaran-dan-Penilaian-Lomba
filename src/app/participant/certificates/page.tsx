import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CertificatesListClient } from './CertificatesListClient';

export const metadata: Metadata = {
  title: 'Sertifikat Saya — Portal Lomba',
};

export default async function ParticipantCertificatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch participant's certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select('*, events(*), registrations(*)')
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false });

  return <CertificatesListClient certificates={certificates || []} />;
}
