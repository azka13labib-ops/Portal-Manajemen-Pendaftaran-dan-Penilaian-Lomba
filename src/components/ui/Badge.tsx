'use client';

import { cn } from '@/lib/utils';
import { EventStatus, RegistrationStatus, ScoreStatus, WinnerRank } from '@/types';
import { Medal, Trophy } from 'lucide-react';

type BadgeVariant =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'submitted'
  | 'draft'
  | 'finalized'
  | 'open'
  | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
  submitted: 'badge-submitted',
  draft: 'badge-draft',
  finalized: 'badge-finalized',
  open: 'badge-open',
  default: 'bg-slate-700/50 text-slate-300 border border-slate-600/30',
};

export function Badge({ children, variant = 'default', className, dot, pulse }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'px-2.5 py-0.5 rounded-full text-xs font-medium',
        'transition-colors duration-150',
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full bg-current',
            pulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </span>
  );
}

// Convenience wrappers
export function EventStatusBadge({ status }: { status: EventStatus }) {
  const labels: Record<EventStatus, string> = {
    DRAFT: 'Draft',
    OPEN: 'Dibuka',
    SUBMISSION_CLOSED: 'Upload Ditutup',
    JUDGING: 'Penilaian',
    FINALIZED: 'Selesai',
    ARCHIVED: 'Diarsipkan',
  };

  const variants: Record<EventStatus, BadgeVariant> = {
    DRAFT: 'draft',
    OPEN: 'open',
    SUBMISSION_CLOSED: 'submitted',
    JUDGING: 'pending',
    FINALIZED: 'finalized',
    ARCHIVED: 'draft',
  };

  return (
    <Badge
      variant={variants[status]}
      dot
      pulse={status === 'OPEN' || status === 'JUDGING'}
    >
      {labels[status]}
    </Badge>
  );
}

export function RegistrationStatusBadge({ status }: { status: RegistrationStatus }) {
  const labels: Record<RegistrationStatus, string> = {
    PENDING: 'Menunggu',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
    WITHDRAWN: 'Dicabut',
  };

  const variants: Record<RegistrationStatus, BadgeVariant> = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    WITHDRAWN: 'draft',
  };

  return (
    <Badge
      variant={variants[status]}
      dot
      pulse={status === 'PENDING'}
    >
      {labels[status]}
    </Badge>
  );
}

export function ScoreStatusBadge({ status }: { status: ScoreStatus }) {
  return (
    <Badge variant={status === 'SUBMITTED' ? 'approved' : 'draft'} dot>
      {status === 'SUBMITTED' ? 'Selesai' : 'Draft'}
    </Badge>
  );
}

export function WinnerBadge({ rank }: { rank: WinnerRank }) {
  const getIconAndLabel = (rank: WinnerRank) => {
    switch (rank) {
      case 'JUARA_1':
        return { icon: <Trophy size={14} className="mr-1" />, label: 'Juara 1' };
      case 'JUARA_2':
        return { icon: <Medal size={14} className="mr-1" />, label: 'Juara 2' };
      case 'JUARA_3':
        return { icon: <Medal size={14} className="mr-1" />, label: 'Juara 3' };
      case 'HARAPAN_1':
        return { icon: <Medal size={14} className="mr-1" />, label: 'Harapan 1' };
      case 'HARAPAN_2':
        return { icon: <Medal size={14} className="mr-1" />, label: 'Harapan 2' };
      case 'HARAPAN_3':
        return { icon: <Medal size={14} className="mr-1" />, label: 'Harapan 3' };
      default:
        return { icon: null, label: '' };
    }
  };

  const { icon, label } = getIconAndLabel(rank);

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold badge-finalized">
      {icon}
      {label}
    </span>
  );
}
