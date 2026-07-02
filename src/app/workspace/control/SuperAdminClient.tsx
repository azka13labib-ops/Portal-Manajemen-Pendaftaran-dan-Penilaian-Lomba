/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Trophy, ClipboardList, Upload, Shield, Search,
  ChevronDown, Trash2, RefreshCw, Activity, TrendingUp,
  UserCheck, Crown, BarChart3, LogOut, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Stats {
  totalUsers: number;
  totalAdmins: number;
  totalJudges: number;
  totalParticipants: number;
  totalEvents: number;
  totalRegistrations: number;
  totalSubmissions: number;
  newUsersToday: number;
}

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  institution: string | null;
  created_at: string;
  is_superadmin: boolean;
  user_roles: { roles: { name: string } }[];
}

interface Event {
  id: string;
  title: string;
  status: string;
  category: string | null;
  created_at: string;
  registration_close_at: string | null;
}

interface SuperAdminClientProps {
  stats: Stats;
  users: UserRow[];
  events: Event[];
  registrationsByDay: { date: string; count: number }[];
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-[rgba(216,178,107,0.15)] text-[#D8B26B] border border-[rgba(216,178,107,0.3)]',
  JUDGE: 'bg-[rgba(147,112,219,0.15)] text-[#9370DB] border border-[rgba(147,112,219,0.3)]',
  PARTICIPANT: 'bg-[rgba(100,200,150,0.15)] text-[#64C896] border border-[rgba(100,200,150,0.3)]',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-[rgba(100,200,150,0.15)] text-[#64C896]',
  SUBMISSION_CLOSED: 'bg-[rgba(216,178,107,0.15)] text-[#D8B26B]',
  JUDGING: 'bg-[rgba(147,112,219,0.15)] text-[#9370DB]',
  FINALIZED: 'bg-[rgba(100,180,255,0.15)] text-[#64B4FF]',
  DRAFT: 'bg-[rgba(156,168,189,0.15)] text-[#9CA8BD]',
};

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[rgba(15,37,71,0.6)] border border-[rgba(244,239,227,0.07)] rounded-2xl p-5 flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#F4EFE3]">{value.toLocaleString()}</p>
        <p className="text-xs text-[#6B7A9A] mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

export function SuperAdminClient({ stats, users: initialUsers, events, registrationsByDay }: SuperAdminClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'events'>('overview');
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const userRole = u.user_roles?.[0]?.roles?.name || '';
      const matchRole = !roleFilter || userRole === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const handleChangeRole = async (userId: string, roleName: string) => {
    setChangingRole(userId);
    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleName }),
      });
      if (!res.ok) throw new Error('Gagal mengubah role');

      setUsers((prev) => prev.map((u) =>
        u.id === userId
          ? { ...u, user_roles: [{ roles: { name: roleName } }] }
          : u
      ));
      toast({ type: 'success', title: 'Role diperbarui', message: `Role berhasil diubah ke ${roleName}` });
    } catch {
      toast({ type: 'error', title: 'Gagal mengubah role' });
    } finally {
      setChangingRole(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Hapus akun "${userName}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeletingUser(userId);
    try {
      const res = await fetch(`/api/superadmin/users?userId=${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus akun');
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast({ type: 'success', title: 'Akun dihapus' });
    } catch {
      toast({ type: 'error', title: 'Gagal menghapus akun' });
    } finally {
      setDeletingUser(null);
    }
  };

  const maxReg = Math.max(...registrationsByDay.map((d) => d.count), 1);

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Pengguna', icon: Users },
    { id: 'events', label: 'Semua Event', icon: Trophy },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0A1628] text-[#F4EFE3]">
      {/* Header */}
      <header className="border-b border-[rgba(244,239,227,0.07)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[rgba(216,178,107,0.15)] border border-[rgba(216,178,107,0.25)] flex items-center justify-center">
            <Crown size={18} className="text-[#D8B26B]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[#F4EFE3]">Workspace Control</h1>
            <p className="text-[10px] text-[#6B7A9A]">Super Administrator</p>
          </div>
        </div>
        <a href="/" className="flex items-center gap-2 text-xs text-[#9CA8BD] hover:text-[#F4EFE3] transition-colors">
          <LogOut size={14} />
          Keluar
        </a>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-[rgba(244,239,227,0.04)] rounded-xl p-1 w-fit border border-[rgba(244,239,227,0.07)]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[rgba(216,178,107,0.12)] text-[#D8B26B] border border-[rgba(216,178,107,0.2)]'
                  : 'text-[#9CA8BD] hover:text-[#F4EFE3]'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Pengguna" value={stats.totalUsers} color="bg-[rgba(100,180,255,0.1)] text-[#64B4FF]" />
              <StatCard icon={Trophy} label="Total Event" value={stats.totalEvents} color="bg-[rgba(216,178,107,0.1)] text-[#D8B26B]" />
              <StatCard icon={ClipboardList} label="Total Registrasi" value={stats.totalRegistrations} color="bg-[rgba(100,200,150,0.1)] text-[#64C896]" />
              <StatCard icon={Upload} label="Total Submission" value={stats.totalSubmissions} color="bg-[rgba(147,112,219,0.1)] text-[#9370DB]" />
            </div>

            {/* Role breakdown + Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Role Breakdown */}
              <div className="bg-[rgba(15,37,71,0.6)] border border-[rgba(244,239,227,0.07)] rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-[#F4EFE3] mb-5 flex items-center gap-2">
                  <UserCheck size={16} className="text-[#D8B26B]" />
                  Komposisi Pengguna
                </h2>
                <div className="space-y-4">
                  {[
                    { label: 'Peserta', value: stats.totalParticipants, color: '#64C896', icon: Users },
                    { label: 'Admin', value: stats.totalAdmins, color: '#D8B26B', icon: Shield },
                    { label: 'Juri', value: stats.totalJudges, color: '#9370DB', icon: Activity },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-[#9CA8BD]">{item.label}</span>
                        <span className="text-[#F4EFE3] font-medium">{item.value}</span>
                      </div>
                      <div className="h-1.5 bg-[rgba(244,239,227,0.06)] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.totalUsers > 0 ? (item.value / stats.totalUsers) * 100 : 0}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Registrations Chart */}
              <div className="bg-[rgba(15,37,71,0.6)] border border-[rgba(244,239,227,0.07)] rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-[#F4EFE3] mb-5 flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#D8B26B]" />
                  Registrasi 7 Hari Terakhir
                </h2>
                <div className="flex items-end gap-2 h-32">
                  {registrationsByDay.map((day) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-[#6B7A9A]">{day.count}</span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(day.count / maxReg) * 100}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="w-full bg-gradient-to-t from-[#D8B26B] to-[rgba(216,178,107,0.3)] rounded-t-sm min-h-[4px]"
                      />
                      <span className="text-[9px] text-[#6B7A9A] truncate w-full text-center">
                        {new Date(day.date).toLocaleDateString('id-ID', { weekday: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* New users today highlight */}
            {stats.newUsersToday > 0 && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(100,200,150,0.05)] border border-[rgba(100,200,150,0.2)]">
                <TrendingUp size={18} className="text-[#64C896]" />
                <p className="text-sm text-[#9CA8BD]">
                  <span className="text-[#F4EFE3] font-semibold">{stats.newUsersToday} pengguna baru</span> mendaftar hari ini
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7A9A]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau email..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-[rgba(244,239,227,0.04)] border border-[rgba(244,239,227,0.08)] rounded-xl text-[#F4EFE3] placeholder:text-[#6B7A9A] focus:outline-none focus:border-[rgba(216,178,107,0.4)]"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 text-sm bg-[rgba(244,239,227,0.04)] border border-[rgba(244,239,227,0.08)] rounded-xl text-[#F4EFE3] focus:outline-none focus:border-[rgba(216,178,107,0.4)]"
              >
                <option value="">Semua Role</option>
                <option value="ADMIN">Admin</option>
                <option value="JUDGE">Juri</option>
                <option value="PARTICIPANT">Peserta</option>
              </select>
            </div>

            <p className="text-xs text-[#6B7A9A]">{filteredUsers.length} pengguna ditemukan</p>

            <div className="bg-[rgba(15,37,71,0.6)] border border-[rgba(244,239,227,0.07)] rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(244,239,227,0.06)]">
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-[#6B7A9A]">Pengguna</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-[#6B7A9A]">Role</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-[#6B7A9A] hidden md:table-cell">Bergabung</th>
                    <th className="text-right px-5 py-3.5 text-xs font-medium text-[#6B7A9A]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => {
                    const roleName = u.user_roles?.[0]?.roles?.name || 'PARTICIPANT';
                    return (
                      <tr key={u.id} className={`border-b border-[rgba(244,239,227,0.04)] ${i % 2 === 0 ? '' : 'bg-[rgba(244,239,227,0.015)]'}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[rgba(216,178,107,0.1)] border border-[rgba(216,178,107,0.2)] flex items-center justify-center text-xs font-bold text-[#D8B26B] shrink-0">
                              {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#F4EFE3] truncate flex items-center gap-1.5">
                                {u.full_name || 'Tanpa Nama'}
                                {u.is_superadmin && <Crown size={11} className="text-[#D8B26B]" />}
                              </p>
                              <p className="text-xs text-[#6B7A9A] truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-lg ${ROLE_COLORS[roleName] || ROLE_COLORS.PARTICIPANT}`}>
                            {roleName}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="text-xs text-[#6B7A9A]">
                            {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            {!u.is_superadmin && (
                              <>
                                <div className="relative group">
                                  <button
                                    disabled={changingRole === u.id}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-[rgba(244,239,227,0.05)] border border-[rgba(244,239,227,0.1)] rounded-lg text-[#9CA8BD] hover:text-[#F4EFE3] transition-colors disabled:opacity-50"
                                  >
                                    {changingRole === u.id ? <RefreshCw size={11} className="animate-spin" /> : <ChevronDown size={11} />}
                                    Ubah Role
                                  </button>
                                  <div className="absolute right-0 top-full mt-1 w-36 bg-[#0F2547] border border-[rgba(244,239,227,0.1)] rounded-xl overflow-hidden shadow-xl z-10 hidden group-focus-within:block group-hover:block">
                                    {['PARTICIPANT', 'JUDGE', 'ADMIN'].filter(r => r !== roleName).map(r => (
                                      <button
                                        key={r}
                                        onClick={() => handleChangeRole(u.id, r)}
                                        className="w-full text-left px-4 py-2.5 text-xs text-[#9CA8BD] hover:bg-[rgba(244,239,227,0.05)] hover:text-[#F4EFE3] transition-colors"
                                      >
                                        → {r}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.full_name)}
                                  disabled={deletingUser === u.id}
                                  className="p-1.5 rounded-lg text-[#9CA8BD] hover:text-[#D98C8C] hover:bg-[rgba(217,140,140,0.06)] transition-colors disabled:opacity-50"
                                  title="Hapus akun"
                                >
                                  {deletingUser === u.id ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                </button>
                              </>
                            )}
                            {u.is_superadmin && (
                              <span className="text-xs text-[#D8B26B] flex items-center gap-1">
                                <Crown size={11} /> Super Admin
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-sm text-[#6B7A9A]">Tidak ada pengguna ditemukan</div>
              )}
            </div>
          </motion.div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-[rgba(15,37,71,0.6)] border border-[rgba(244,239,227,0.07)] rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(244,239,227,0.06)]">
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-[#6B7A9A]">Event</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-[#6B7A9A]">Status</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-[#6B7A9A] hidden md:table-cell">Kategori</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-[#6B7A9A] hidden md:table-cell">Dibuat</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev, i) => (
                    <tr key={ev.id} className={`border-b border-[rgba(244,239,227,0.04)] ${i % 2 === 0 ? '' : 'bg-[rgba(244,239,227,0.015)]'}`}>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-[#F4EFE3]">{ev.title}</p>
                        <p className="text-xs text-[#6B7A9A] mt-0.5">ID: {ev.id.slice(0, 8)}...</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-lg ${STATUS_COLORS[ev.status] || STATUS_COLORS.DRAFT}`}>
                          {ev.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-[#9CA8BD] capitalize">{ev.category || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-[#6B7A9A]">
                          {new Date(ev.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {events.length === 0 && (
                <div className="py-12 text-center">
                  <AlertTriangle size={24} className="mx-auto text-[#6B7A9A] mb-2" />
                  <p className="text-sm text-[#6B7A9A]">Belum ada event</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
