'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Trophy,
  Users,
  ClipboardList,
  BarChart3,
  Award,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Star,
  FileText,
  Upload,
  Medal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

interface SidebarProps {
  role: UserRole;
  userName: string;
  userEmail: string;
  onSignOut: () => void;
}

const navItems: Record<UserRole, { label: string; href: string; icon: React.ComponentType<{ size?: number; className?: string }> }[]> = {
  ADMIN: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Manajemen Event', href: '/admin/events', icon: Trophy },
    { label: 'Verifikasi Peserta', href: '/admin/registrations', icon: ClipboardList },
    { label: 'Manajemen Juri', href: '/admin/judges', icon: Users },
    { label: 'Leaderboard', href: '/admin/leaderboard', icon: BarChart3 },
    { label: 'Sertifikat', href: '/admin/certificates', icon: Award },
  ],
  JUDGE: [
    { label: 'Dashboard', href: '/judge', icon: LayoutDashboard },
    { label: 'Antrian Penilaian', href: '/judge/assignments', icon: Star },
    { label: 'Riwayat Nilai', href: '/judge/history', icon: FileText },
  ],
  PARTICIPANT: [
    { label: 'Dashboard', href: '/participant', icon: LayoutDashboard },
    { label: 'Jelajahi Event', href: '/', icon: Trophy },
    { label: 'Pendaftaran Saya', href: '/participant/registrations', icon: ClipboardList },
    { label: 'Upload Karya', href: '/participant/submissions', icon: Upload },
    { label: 'Sertifikat Saya', href: '/participant/certificates', icon: Medal },
  ],
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  JUDGE: 'Juri',
  PARTICIPANT: 'Peserta',
};

const roleBadgeColors: Record<UserRole, string> = {
  ADMIN: 'bg-blue-600/20 text-blue-300 border-blue-500/30',
  JUDGE: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
  PARTICIPANT: 'bg-teal-600/20 text-teal-300 border-teal-500/30',
};

export function Sidebar({ role, userName, userEmail, onSignOut }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const items = navItems[role];

  const renderSidebarContent = (mobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-5',
          'border-b border-[rgba(93,138,205,0.12)]',
          !mobile && collapsed && 'justify-center px-0'
        )}
      >
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(37,99,235,0.4)]">
          <Trophy size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {(mobile || !collapsed) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <span className="text-sm font-bold text-slate-100 whitespace-nowrap" style={{ fontFamily: 'var(--font-display)' }}>
                Portal Lomba
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Role Badge */}
      <div className={cn('px-4 py-3', !mobile && collapsed && 'flex justify-center px-2')}>
        <AnimatePresence>
          {(mobile || !collapsed) ? (
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                roleBadgeColors[role]
              )}
            >
              {roleLabels[role]}
            </span>
          ) : (
            <div className={cn('w-2 h-2 rounded-full bg-current', roleBadgeColors[role].split(' ')[1])} />
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' &&
              item.href !== '/judge' &&
              item.href !== '/participant' &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => mobile && setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                'text-sm font-medium transition-all duration-150',
                'group relative',
                !mobile && collapsed && 'justify-center px-0 w-10 mx-auto',
                isActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId={`nav-indicator-${role}`}
                  className="absolute inset-0 rounded-xl bg-blue-600/10"
                  transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                />
              )}
              <Icon
                size={18}
                className={cn(
                  'relative z-10 shrink-0',
                  isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                )}
              />
              <AnimatePresence>
                {(mobile || !collapsed) && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="relative z-10 whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className={cn('border-t border-[rgba(93,138,205,0.12)] p-3 space-y-1', !mobile && collapsed && 'px-1')}>
        {/* Sign Out */}
        <button
          onClick={onSignOut}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl',
            'text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10',
            'transition-all duration-150',
            !mobile && collapsed && 'justify-center px-0'
          )}
        >
          <LogOut size={18} className="shrink-0" />
          <AnimatePresence>
            {(mobile || !collapsed) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                Keluar
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User Info */}
        {(mobile || !collapsed) && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-300 truncate">{userName}</p>
              <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
        className={cn(
          'hidden lg:flex flex-col relative',
          'bg-[rgba(10,22,40,0.95)] border-r border-[rgba(93,138,205,0.12)]',
          'h-screen sticky top-0 overflow-hidden shrink-0'
        )}
      >
        {renderSidebarContent()}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'absolute bottom-[120px] -right-3.5 z-10',
            'w-7 h-7 rounded-full',
            'bg-[#112240] border border-[rgba(93,138,205,0.2)]',
            'flex items-center justify-center',
            'text-slate-400 hover:text-slate-200',
            'transition-colors shadow-md'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </motion.aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-[rgba(10,22,40,0.95)] border-b border-[rgba(93,138,205,0.12)] backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Trophy size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
            Portal Lomba
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-slate-400 hover:text-slate-200"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', bounce: 0.1, duration: 0.35 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-[rgba(10,22,40,0.98)] border-r border-[rgba(93,138,205,0.15)]"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200"
              >
                <X size={18} />
              </button>
              {renderSidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
