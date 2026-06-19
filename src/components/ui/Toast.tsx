'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toast, ToastType } from '@/types';

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
  error: <XCircle size={16} className="text-red-400 shrink-0" />,
  warning: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
  info: <Info size={16} className="text-blue-400 shrink-0" />,
};

const borderColors: Record<ToastType, string> = {
  success: 'border-emerald-500/30',
  error: 'border-red-500/30',
  warning: 'border-amber-500/30',
  info: 'border-blue-500/30',
};

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 64, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: 16 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
      className={cn(
        'flex items-start gap-3 w-80',
        'glass-card px-4 py-3',
        'border',
        borderColors[t.type],
        'shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
      )}
    >
      {icons[t.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-100">{t.title}</p>
        {t.message && (
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{t.message}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-500 hover:text-slate-300 transition-colors mt-0.5 shrink-0"
        aria-label="Tutup"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...opts, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
