'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-blue-600 hover:bg-blue-500 active:bg-blue-700',
    'text-white',
    'border border-blue-500/50 hover:border-blue-400',
    'shadow-[0_0_16px_rgba(37,99,235,0.3)] hover:shadow-[0_0_24px_rgba(37,99,235,0.5)]',
  ].join(' '),
  secondary: [
    'bg-[rgba(17,34,64,0.8)] hover:bg-[rgba(26,51,88,0.9)]',
    'text-slate-200 hover:text-white',
    'border border-[rgba(93,138,205,0.2)] hover:border-[rgba(93,138,205,0.4)]',
  ].join(' '),
  ghost: [
    'bg-transparent hover:bg-[rgba(255,255,255,0.05)]',
    'text-slate-400 hover:text-slate-200',
    'border border-transparent hover:border-[rgba(93,138,205,0.2)]',
  ].join(' '),
  danger: [
    'bg-red-600/90 hover:bg-red-500 active:bg-red-700',
    'text-white',
    'border border-red-500/50',
    'shadow-[0_0_16px_rgba(239,68,68,0.2)] hover:shadow-[0_0_24px_rgba(239,68,68,0.4)]',
  ].join(' '),
  gold: [
    'bg-amber-500 hover:bg-amber-400 active:bg-amber-600',
    'text-[#0a1628] font-semibold',
    'border border-amber-400/50',
    'shadow-[0_0_16px_rgba(245,158,11,0.3)] hover:shadow-[0_0_24px_rgba(245,158,11,0.5)]',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center',
          'rounded-[var(--radius-md)] font-medium',
          'transition-all duration-150 ease-out',
          'focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'cursor-pointer select-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Spinner size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
