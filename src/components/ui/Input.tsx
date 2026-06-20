'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftAddon, rightAddon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-300"
          >
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              {leftAddon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full h-10 rounded-md',
              'bg-[rgba(17,34,64,0.6)] border border-[rgba(93,138,205,0.2)]',
              'text-slate-100 placeholder:text-slate-500 text-sm',
              'px-3',
              'transition-all duration-150',
              'focus:outline-none focus:border-blue-500 focus:bg-[rgba(17,34,64,0.9)]',
              'focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-300',
              leftAddon && 'pl-10',
              rightAddon && 'pr-10',
              error && 'border-red-500/60 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]',
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 text-slate-400">
              {rightAddon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertTriangle size={12} /> {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-slate-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea variant
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            'w-full min-h-[100px] rounded-md',
            'bg-[rgba(17,34,64,0.6)] border border-[rgba(93,138,205,0.2)]',
            'text-slate-100 placeholder:text-slate-500 text-sm',
            'px-3 py-2.5 resize-y',
            'transition-all duration-150',
            'focus:outline-none focus:border-blue-500 focus:bg-[rgba(17,34,64,0.9)]',
            'focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500/60 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> {error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Select variant
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          className={cn(
            'w-full h-10 rounded-md',
            'bg-[rgba(17,34,64,0.6)] border border-[rgba(93,138,205,0.2)]',
            'text-slate-100 text-sm',
            'px-3',
            'transition-all duration-150',
            'focus:outline-none focus:border-blue-500',
            'focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500/60',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-[#112240] text-slate-100"
            >
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> {error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
