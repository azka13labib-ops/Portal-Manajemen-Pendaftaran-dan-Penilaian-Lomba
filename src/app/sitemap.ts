import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = 'https://portallomba.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('events')
    .select('id, updated_at')
    .in('status', ['OPEN', 'SUBMISSION_CLOSED', 'JUDGING', 'FINALIZED'])
    .order('updated_at', { ascending: false });

  const eventUrls: MetadataRoute.Sitemap = (events || []).map((event) => ({
    url: `${BASE_URL}/events/${event.id}`,
    lastModified: new Date(event.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    ...eventUrls,
  ];
}
