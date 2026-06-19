'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Trophy, Calendar, Users, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, EmptyState } from '@/components/ui/Card';
import { EventStatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Event, EventStatus } from '@/types';

const STATUS_FILTERS: { label: string; value: EventStatus | 'ALL' }[] = [
  { label: 'Semua', value: 'ALL' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Dibuka', value: 'OPEN' },
  { label: 'Penilaian', value: 'JUDGING' },
  { label: 'Selesai', value: 'FINALIZED' },
];

export default function AdminEventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      let query = supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }

      const { data } = await query;
      setEvents((data as Event[]) ?? []);
      setLoading(false);
    }
    fetchEvents();
  }, [statusFilter, supabase]);

  const filtered = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            Manajemen Event
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {events.length} event terdaftar
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button leftIcon={<Plus size={16} />}>Buat Event Baru</Button>
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Input
          placeholder="Cari event..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftAddon={<Search size={15} />}
          className="sm:max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                  : 'bg-[rgba(17,34,64,0.6)] text-slate-400 hover:text-slate-200 border border-[rgba(93,138,205,0.15)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-white/8 rounded w-2/3" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
              <div className="h-3 bg-white/5 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Trophy size={24} />}
          title="Tidak ada event ditemukan"
          description={search ? 'Coba ubah kata kunci pencarian.' : 'Mulai dengan membuat event baru.'}
          action={
            !search && (
              <Link href="/admin/events/new">
                <Button leftIcon={<Plus size={15} />} size="sm">Buat Event</Button>
              </Link>
            )
          }
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
        >
          {filtered.map((event) => (
            <motion.div
              key={event.id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
            >
              <EventCard event={event} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/admin/events/${event.id}`}>
      <Card hover glow className="h-full flex flex-col">
        {/* Banner Placeholder */}
        <div className="w-full h-32 rounded-xl bg-gradient-to-br from-[rgba(37,99,235,0.2)] to-[rgba(13,148,136,0.1)] flex items-center justify-center mb-4 overflow-hidden">
          {event.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <Trophy size={36} className="text-blue-500/40" />
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-sm font-semibold text-slate-200 leading-snug line-clamp-2" style={{ fontFamily: 'var(--font-display)' }}>
              {event.title}
            </h3>
            <EventStatusBadge status={event.status} />
          </div>

          {event.category && (
            <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-600/15 text-blue-300 border border-blue-500/20 mb-3 self-start capitalize">
              {event.category}
            </span>
          )}

          <div className="mt-auto space-y-1.5 pt-3 border-t border-[rgba(93,138,205,0.1)]">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar size={12} />
              <span>Tutup: {formatDate(event.registration_close_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Users size={12} />
              <span>{event.registration_mode === 'TEAM' ? `Tim (${event.team_min_members}–${event.team_max_members} org)` : 'Individual'}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end text-blue-400 text-xs font-medium">
          Kelola Event <ChevronRight size={14} className="ml-0.5" />
        </div>
      </Card>
    </Link>
  );
}
