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
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';
import { SettingsModal } from './SettingsModal';

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

// Paths that require EXACT match only (no prefix matching)
const exactMatchPaths = new Set(['/admin', '/judge', '/participant', '/']);

function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (exactMatchPaths.has(href)) return false;
  return pathname.startsWith(href);
}

const roleBadgeColors: Record<UserRole, string> = {
  ADMIN: 'bg-[rgba(244,239,227,0.08)] text-[#F4EFE3] border-[rgba(244,239,227,0.15)]',
  JUDGE: 'bg-[rgba(216,178,107,0.10)] text-[#D8B26B] border-[rgba(216,178,107,0.20)]',
  PARTICIPANT: 'bg-[rgba(244,239,227,0.08)] text-[#9CA8BD] border-[rgba(244,239,227,0.12)]',
};

/** Single consistent NavItem — Gaya 1:
 *  Active: bg-navy-600 (#1F4373) + cream text + cream left-bar 3px
 *  Inactive: muted text + subtle hover
 */
function NavItem({
  item,
  isActive,
  collapsed,
  mobile,
  onClose,
}: {
  item: { label: string; href: string; icon: React.ComponentType<{ size?: number; className?: string }> };
  isActive: boolean;
  collapsed: boolean;
  mobile: boolean;
  onClose?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl',
        'text-sm font-medium transition-all duration-150',
        'group relative overflow-hidden',
        !mobile && collapsed && 'justify-center px-0 w-10 mx-auto',
        isActive
          ? 'bg-[#1F4373] text-[#F4EFE3]'
          : 'text-[#9CA8BD] hover:text-[#F4EFE3] hover:bg-[rgba(244,239,227,0.04)]'
      )}
    >
      {/* Active indicator — 3px cream left bar, always Gaya 1 */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full bg-[#F4EFE3]"
          style={{ width: 3, height: 20 }}
        />
      )}
      <Icon
        size={18}
        className={cn(
          'relative z-10 shrink-0',
          isActive ? 'text-[#F4EFE3]' : 'text-[#6B7A9A] group-hover:text-[#9CA8BD]'
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
}

export function Sidebar({ role, userName, userEmail, onSignOut }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const pathname = usePathname();
  const items = navItems[role];

  const renderSidebarContent = (mobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-5',
          'border-b border-[rgba(244,239,227,0.07)]',
          !mobile && collapsed && 'justify-center px-0'
        )}
      >
        <div className="w-9 h-9 rounded-xl bg-[rgba(244,239,227,0.10)] border border-[rgba(244,239,227,0.15)] flex items-center justify-center shrink-0">
          <Trophy size={18} className="text-[#F4EFE3]" />
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
              <span className="text-sm font-bold text-[#F4EFE3] whitespace-nowrap" style={{ fontFamily: 'var(--font-display)' }}>
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
            <div className="w-2 h-2 rounded-full bg-[rgba(244,239,227,0.40)]" />
          )}
        </AnimatePresence>
      </div>

      {/* Navigation — uses single NavItem component, identical for every page */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {items.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={isNavItemActive(pathname, item.href)}
            collapsed={collapsed}
            mobile={mobile}
            onClose={mobile ? () => setMobileOpen(false) : undefined}
          />
        ))}
      </nav>

      {/* User Section */}
      <div className={cn('border-t border-[rgba(244,239,227,0.07)] p-3 space-y-1', !mobile && collapsed && 'px-1')}>
        <button
          onClick={onSignOut}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl',
            'text-sm text-[#9CA8BD] hover:text-[#D98C8C] hover:bg-[rgba(217,140,140,0.06)]',
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

        {(mobile || !collapsed) && (
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[rgba(244,239,227,0.10)] border border-[rgba(244,239,227,0.15)] flex items-center justify-center text-xs font-bold text-[#F4EFE3] shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#F4EFE3] truncate">{userName}</p>
                <p className="text-[10px] text-[#6B7A9A] truncate">{userEmail}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-lg text-[#9CA8BD] hover:text-[#F4EFE3] hover:bg-[rgba(244,239,227,0.06)] transition-colors shrink-0 ml-2"
              title="Pengaturan Akun"
            >
              <Settings size={16} />
            </button>
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
          'bg-[#0F2547] border-r border-[rgba(244,239,227,0.06)]',
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
            'bg-[#16335E] border border-[rgba(244,239,227,0.12)]',
            'flex items-center justify-center',
            'text-[#9CA8BD] hover:text-[#F4EFE3]',
            'transition-colors shadow-md'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </motion.aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-[rgba(15,37,71,0.97)] border-b border-[rgba(244,239,227,0.07)] backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[rgba(244,239,227,0.10)] border border-[rgba(244,239,227,0.15)] flex items-center justify-center">
            <Trophy size={14} className="text-[#F4EFE3]" />
          </div>
          <span className="text-sm font-bold text-[#F4EFE3]" style={{ fontFamily: 'var(--font-display)' }}>
            Portal Lomba
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-[#9CA8BD] hover:text-[#F4EFE3]"
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
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-[rgba(15,37,71,0.99)] border-r border-[rgba(244,239,227,0.07)]"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-[#9CA8BD] hover:text-[#F4EFE3]"
              >
                <X size={18} />
              </button>
              {renderSidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentName={userName} 
        currentEmail={userEmail} 
      />
    </>
  );
}
