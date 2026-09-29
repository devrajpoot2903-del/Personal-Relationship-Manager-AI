import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const VARIANTS = {
  success: {
    Icon: CheckCircle2,
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    iconClass: 'text-emerald-600',
  },
  error: {
    Icon: AlertCircle,
    wrapper: 'border-red-200 bg-red-50 text-red-900',
    iconClass: 'text-red-600',
  },
  info: {
    Icon: Info,
    wrapper: 'border-ink-200 bg-white text-ink-800',
    iconClass: 'text-ink-500',
  },
};

/**
 * Lightweight toast notifications — friendly messages instead of raw JS errors.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, variant = 'info', duration = 3200) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current.slice(-2), { id, message, variant }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error', 4600),
      info: (message) => push(message, 'info'),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const variant = VARIANTS[toast.variant] ?? VARIANTS.info;
          const Icon = variant.Icon;

          return (
            <div
              key={toast.id}
              className={`animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-[var(--shadow-lift)] ${variant.wrapper}`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${variant.iconClass}`} aria-hidden="true" />
              <p className="flex-1 text-sm leading-snug">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider');
  }
  return context;
}

export default ToastProvider;
