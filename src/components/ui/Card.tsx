'use client';

import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className, hover = false, glow = false, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'glass-card',
        paddingClasses[padding],
        hover && [
          'transition-all duration-200 cursor-pointer',
          'hover:border-[rgba(93,138,205,0.35)]',
          'hover:bg-[rgba(17,34,64,0.8)]',
          'hover:translate-y-[-1px]',
          'hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
        ],
        glow && 'hover:shadow-[0_0_32px_rgba(37,99,235,0.15)]',
        className
      )}
    >
      {children}
    </div>
  );
}

// Stat Card
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  color?: 'blue' | 'teal' | 'gold' | 'neutral';
  trend?: { value: number; label: string; positive: boolean };
}

const colorMap = {
  blue: {
    icon: 'bg-blue-600/20 text-blue-400',
    value: 'text-blue-300',
  },
  teal: {
    icon: 'bg-teal-600/20 text-teal-400',
    value: 'text-teal-300',
  },
  gold: {
    icon: 'bg-amber-600/20 text-amber-400',
    value: 'text-amber-300',
  },
  neutral: {
    icon: 'bg-slate-600/20 text-slate-400',
    value: 'text-slate-200',
  },
};

export function StatCard({ label, value, icon, sub, color = 'blue', trend }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className={cn('text-3xl font-bold', colors.value)} style={{ fontFamily: 'var(--font-display)' }}>
            {value}
          </p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          {trend && (
            <p
              className={cn(
                'text-xs mt-2 font-medium',
                trend.positive ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl shrink-0 ml-3', colors.icon)}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// Empty State
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-16 px-6',
        'rounded-[var(--radius-lg)] border border-dashed border-[rgba(93,138,205,0.2)]',
        className
      )}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[rgba(37,99,235,0.1)] flex items-center justify-center text-blue-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// Skeleton Loader
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-md bg-[rgba(93,138,205,0.1)] animate-pulse',
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <Card>
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </Card>
  );
}
