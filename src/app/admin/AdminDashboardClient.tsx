'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Trophy, ClipboardList, Users, Upload,
  ChevronRight, Plus, AlertCircle,
} from 'lucide-react';
import { StatCard, Card, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EventStatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { EventStatus } from '@/types';

interface AdminDashboardClientProps {
  stats: {
    totalEvents: number;
    pendingRegs: number;
    totalRegs: number;
    totalSubmissions: number;
  };
  recentEvents: {
    id: string;
    title: string;
    status: EventStatus;
    registration_open_at: string;
    registration_close_at: string;
  }[];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] as const } },
};

export function AdminDashboardClient({ stats, recentEvents }: AdminDashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            Dashboard Admin
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Pantau dan kelola semua kompetisi dari satu tempat.
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button leftIcon={<Plus size={16} />}>
            Buat Event Baru
          </Button>
        </Link>
      </motion.div>

      {/* Pending Alert */}
      {stats.pendingRegs > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300"
        >
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-sm font-medium">
            Ada <strong>{stats.pendingRegs}</strong> pendaftaran menunggu verifikasi Anda.{' '}
            <Link href="/admin/registrations" className="underline hover:text-amber-200">
              Tinjau sekarang →
            </Link>
          </p>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants}>
          <StatCard
            label="Total Event"
            value={stats.totalEvents}
            icon={<Trophy size={22} />}
            sub="Event aktif & selesai"
            color="blue"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            label="Menunggu Verifikasi"
            value={stats.pendingRegs}
            icon={<AlertCircle size={22} />}
            sub="Pendaftaran baru masuk"
            color="gold"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            label="Total Peserta"
            value={stats.totalRegs}
            icon={<Users size={22} />}
            sub="Seluruh event"
            color="teal"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard
            label="Karya Dikirim"
            value={stats.totalSubmissions}
            icon={<Upload size={22} />}
            sub="Total submission"
            color="neutral"
          />
        </motion.div>
      </motion.div>

      {/* Recent Events */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-200" style={{ fontFamily: 'var(--font-display)' }}>
            Event Terkini
          </h2>
          <Link href="/admin/events" className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
            Lihat semua <ChevronRight size={13} />
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <EmptyState
            icon={<Trophy size={24} />}
            title="Belum ada event"
            description="Buat event pertama Anda untuk mulai menerima pendaftaran."
            action={
              <Link href="/admin/events/new">
                <Button leftIcon={<Plus size={15} />} size="sm">
                  Buat Event
                </Button>
              </Link>
            }
          />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="divide-y divide-[rgba(93,138,205,0.1)]">
              {recentEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.1 + i * 0.05 }}
                  className="flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/15 flex items-center justify-center shrink-0">
                      <Trophy size={16} className="text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{event.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(event.registration_open_at)} — {formatDate(event.registration_close_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <EventStatusBadge status={event.status} />
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
      >
        <h2 className="text-base font-semibold text-slate-200 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Buat Event Baru', icon: Trophy, href: '/admin/events/new', color: 'text-blue-400 bg-blue-600/15' },
            { label: 'Verifikasi Peserta', icon: ClipboardList, href: '/admin/registrations', color: 'text-amber-400 bg-amber-600/15' },
            { label: 'Kelola Juri', icon: Users, href: '/admin/judges', color: 'text-teal-400 bg-teal-600/15' },
            { label: 'Lihat Leaderboard', icon: Upload, href: '/admin/leaderboard', color: 'text-purple-400 bg-purple-600/15' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card hover className="flex flex-col items-center text-center gap-3 py-5 px-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color}`}>
                    <Icon size={20} />
                  </div>
                  <p className="text-xs font-medium text-slate-300 leading-snug">{action.label}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
