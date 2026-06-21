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
          'hover:border-[rgba(244,239,227,0.20)]',
          'hover:bg-[rgba(22,51,94,0.75)]',
          'hover:-translate-y-px',
          'hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
        ],
        glow && 'hover:shadow-[0_0_32px_rgba(244,239,227,0.06)]',
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
  color?: 'blue' | 'teal' | 'gold' | 'neutral' | 'cream';
  trend?: { value: number; label: string; positive: boolean };
}

const colorMap = {
  cream: {
    icon: 'bg-[rgba(244,239,227,0.08)] text-[#F4EFE3]',
    value: 'text-[#F4EFE3]',
  },
  blue: {
    icon: 'bg-[rgba(244,239,227,0.06)] text-[#F4EFE3]',
    value: 'text-[#F4EFE3]',
  },
  teal: {
    icon: 'bg-[rgba(143,196,169,0.10)] text-[#8FC4A9]',
    value: 'text-[#8FC4A9]',
  },
  gold: {
    icon: 'bg-[rgba(216,178,107,0.10)] text-[#D8B26B]',
    value: 'text-[#D8B26B]',
  },
  neutral: {
    icon: 'bg-[rgba(156,168,189,0.10)] text-[#9CA8BD]',
    value: 'text-[#9CA8BD]',
  },
};

export function StatCard({ label, value, icon, sub, color = 'cream', trend }: StatCardProps) {
  const colors = colorMap[color] ?? colorMap.cream;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#9CA8BD] uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className={cn('text-3xl font-bold', colors.value)} style={{ fontFamily: 'var(--font-display)' }}>
            {value}
          </p>
          {sub && <p className="text-xs text-[#9CA8BD] mt-1">{sub}</p>}
          {trend && (
            <p
              className={cn(
                'text-xs mt-2 font-medium',
                trend.positive ? 'text-[#8FC4A9]' : 'text-[#D98C8C]'
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
        'rounded-lg border border-dashed border-[rgba(244,239,227,0.12)]',
        className
      )}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[rgba(244,239,227,0.06)] flex items-center justify-center text-[rgba(244,239,227,0.4)] mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[#F4EFE3] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#9CA8BD] max-w-xs leading-relaxed">{description}</p>
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
        'rounded-md bg-[rgba(244,239,227,0.06)] animate-pulse',
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
