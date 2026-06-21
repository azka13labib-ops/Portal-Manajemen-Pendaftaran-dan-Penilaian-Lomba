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
  // PRIMARY: cream background, navy text — the CTA color
  primary: [
    'bg-[#F4EFE3] hover:bg-[#E8E0CC] active:bg-[#DDD6C3]',
    'text-[#0A1628] font-semibold',
    'border border-[rgba(244,239,227,0.4)]',
    'shadow-[0_2px_12px_rgba(244,239,227,0.08)] hover:shadow-[0_4px_20px_rgba(244,239,227,0.15)]',
  ].join(' '),
  // SECONDARY: cream outline, transparent background
  secondary: [
    'bg-transparent hover:bg-[rgba(244,239,227,0.06)]',
    'text-[#F4EFE3] hover:text-[#F4EFE3]',
    'border border-[rgba(244,239,227,0.20)] hover:border-[rgba(244,239,227,0.35)]',
  ].join(' '),
  // GHOST: fully transparent, subtle hover
  ghost: [
    'bg-transparent hover:bg-[rgba(244,239,227,0.05)]',
    'text-[#9CA8BD] hover:text-[#F4EFE3]',
    'border border-transparent hover:border-[rgba(244,239,227,0.12)]',
  ].join(' '),
  // DANGER: for destructive actions
  danger: [
    'bg-[rgba(217,140,140,0.15)] hover:bg-[rgba(217,140,140,0.25)] active:bg-[rgba(217,140,140,0.30)]',
    'text-[#D98C8C]',
    'border border-[rgba(217,140,140,0.30)]',
  ].join(' '),
  // GOLD: for winner/achievement highlights
  gold: [
    'bg-[rgba(216,178,107,0.15)] hover:bg-[rgba(216,178,107,0.25)]',
    'text-[#D8B26B] font-semibold',
    'border border-[rgba(216,178,107,0.30)]',
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
          'rounded-md font-medium',
          'transition-all duration-150 ease-out',
          'focus-visible:outline-2 focus-visible:outline-[#F4EFE3] focus-visible:outline-offset-2',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
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
