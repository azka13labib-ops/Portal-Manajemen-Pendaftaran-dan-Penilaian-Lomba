/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, RefreshCw, Star, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, EmptyState } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { WinnerBadge } from '@/components/ui/Badge';
import { LeaderboardEntry } from '@/types';

interface EventItem {
  id: string;
  title: string;
  status: string;
}

interface LeaderboardAdminClientProps {
  initialEvents: EventItem[];
}

export function LeaderboardAdminClient({ initialEvents }: LeaderboardAdminClientProps) {
  const supabase = createClient();

  const [selectedEventId, setSelectedEventId] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (eventId: string) => {
    if (!eventId) {
      setLeaderboard([]);
      return;
    }
    Promise.resolve().then(() => setLoading(true));
    try {
      const { data, error } = await supabase
        .from('leaderboard_view')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Handle Event selection change
  useEffect(() => {
    fetchLeaderboard(selectedEventId);
  }, [selectedEventId, fetchLeaderboard]);

  // Real-time subscription to score updates
  useEffect(() => {
    if (!selectedEventId) return;

    const channel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores' },
        () => {
          fetchLeaderboard(selectedEventId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedEventId, fetchLeaderboard, supabase]);

  // Format ranking badges
  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <WinnerBadge rank="JUARA_1" />;
      case 1:
        return <WinnerBadge rank="JUARA_2" />;
      case 2:
        return <WinnerBadge rank="JUARA_3" />;
      case 3:
        return <WinnerBadge rank="HARAPAN_1" />;
      default:
        return (
          <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-400">
            {index + 1}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            Leaderboard Utama
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Pantau peringkat nilai dan perolehan skor peserta secara real-time berdasarkan penilaian juri.
          </p>
        </div>
        {selectedEventId && (
          <button
            onClick={() => fetchLeaderboard(selectedEventId)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-slate-700/50 transition-colors font-medium self-end sm:self-auto"
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh Nilai
          </button>
        )}
      </motion.div>

      {/* Select Event */}
      <Card className="p-5 max-w-md">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Pilih Kompetisi / Event
          </label>
          <Select
            options={[
              { value: '', label: '-- Pilih Event --' },
              ...initialEvents.map((e) => ({
                value: e.id,
                label: `${e.title} (${e.status === 'FINALIZED' ? 'Selesai' : 'Aktif'})`,
              })),
            ]}
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          />
        </div>
      </Card>

      {/* Leaderboard Table */}
      <div className="min-h-[300px]">
        {selectedEventId ? (
          loading && leaderboard.length === 0 ? (
            <Card className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="animate-spin text-blue-400" size={18} />
              <span>Memuat data leaderboard...</span>
            </Card>
          ) : leaderboard.length === 0 ? (
            <EmptyState
              icon={<Star size={24} />}
              title="Leaderboard Kosong"
              description="Belum ada karya peserta yang dinilai secara final oleh juri pada event ini."
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card padding="none" className="overflow-hidden border border-[rgba(93,138,205,0.15)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-800/30">
                        <th className="px-6 py-4 w-24">Peringkat</th>
                        <th className="px-6 py-4">Peserta / Tim</th>
                        <th className="px-6 py-4">Instansi</th>
                        <th className="px-6 py-4 text-center">Juri Menilai</th>
                        <th className="px-6 py-4 text-right">Skor Akhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-xs">
                      <AnimatePresence>
                        {leaderboard.map((entry, index) => (
                          <motion.tr
                            key={entry.submission_id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="hover:bg-slate-800/10 transition-colors"
                          >
                            <td className="px-6 py-4 font-bold">
                              {getRankBadge(index)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-200">
                                {entry.team_name ? `${entry.team_name} (Tim)` : entry.participant_name}
                              </div>
                              {entry.team_name && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Ketua: {entry.participant_name}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {entry.institution || '-'}
                            </td>
                            <td className="px-6 py-4 text-center text-slate-300">
                              <span className="inline-flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/30">
                                <Users size={10} className="text-slate-400" />
                                {entry.judges_scored} Juri
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-bold text-blue-300 font-mono">
                                {entry.final_score}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )
        ) : (
          <EmptyState
            icon={<BarChart3 size={24} />}
            title="Pilih Event Lomba"
            description="Silakan pilih salah satu event untuk melihat daftar peringkat nilai secara real-time."
          />
        )}
      </div>
    </div>
  );
}
