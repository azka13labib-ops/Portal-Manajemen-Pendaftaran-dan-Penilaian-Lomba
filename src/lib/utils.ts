import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { EventStatus, RegistrationStatus, ScoreStatus, WinnerRank } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...opts,
  }).format(new Date(dateStr));
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getEventStatusLabel(status: EventStatus): string {
  const labels: Record<EventStatus, string> = {
    DRAFT: 'Draft',
    OPEN: 'Pendaftaran Dibuka',
    SUBMISSION_CLOSED: 'Upload Ditutup',
    JUDGING: 'Sedang Dinilai',
    FINALIZED: 'Selesai',
    ARCHIVED: 'Diarsipkan',
  };
  return labels[status];
}

export function getEventStatusVariant(status: EventStatus): string {
  const variants: Record<EventStatus, string> = {
    DRAFT: 'badge-draft',
    OPEN: 'badge-open',
    SUBMISSION_CLOSED: 'badge-submitted',
    JUDGING: 'badge-pending',
    FINALIZED: 'badge-finalized',
    ARCHIVED: 'badge-draft',
  };
  return variants[status];
}

export function getRegistrationStatusLabel(status: RegistrationStatus): string {
  const labels: Record<RegistrationStatus, string> = {
    PENDING: 'Menunggu Verifikasi',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
    WITHDRAWN: 'Dicabut',
  };
  return labels[status];
}

export function getRegistrationStatusVariant(status: RegistrationStatus): string {
  const variants: Record<RegistrationStatus, string> = {
    PENDING: 'badge-pending',
    APPROVED: 'badge-approved',
    REJECTED: 'badge-rejected',
    WITHDRAWN: 'badge-draft',
  };
  return variants[status];
}

export function getScoreStatusLabel(status: ScoreStatus): string {
  return status === 'DRAFT' ? 'Draft' : 'Selesai';
}

export function getWinnerRankLabel(rank: WinnerRank | null | undefined): string {
  if (!rank) return '';
  const labels: Record<WinnerRank, string> = {
    JUARA_1: 'Juara 1',
    JUARA_2: 'Juara 2',
    JUARA_3: 'Juara 3',
    HARAPAN_1: 'Juara Harapan 1',
    HARAPAN_2: 'Juara Harapan 2',
    HARAPAN_3: 'Juara Harapan 3',
  };
  return labels[rank];
}

export function getWinnerRankEmoji(rank: WinnerRank | null | undefined): string {
  if (!rank) return '';
  const emojis: Record<WinnerRank, string> = {
    JUARA_1: '🥇',
    JUARA_2: '🥈',
    JUARA_3: '🥉',
    HARAPAN_1: '🏅',
    HARAPAN_2: '🏅',
    HARAPAN_3: '🏅',
  };
  return emojis[rank];
}

export function calculateWeightedScore(
  rawScore: number,
  weight: number,
  maxScore: number
): number {
  return (rawScore / maxScore) * weight;
}

export function isEventRegistrationOpen(event: { status: EventStatus; registration_open_at: string; registration_close_at: string }): boolean {
  if (event.status !== 'OPEN') return false;
  const now = new Date();
  const open = new Date(event.registration_open_at);
  const close = new Date(event.registration_close_at);
  return now >= open && now <= close;
}

export function isSubmissionOpen(event: { status: EventStatus; submission_close_at: string }): boolean {
  if (event.status !== 'OPEN' && event.status !== 'SUBMISSION_CLOSED') return false;
  const now = new Date();
  const close = new Date(event.submission_close_at);
  return now <= close;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}
