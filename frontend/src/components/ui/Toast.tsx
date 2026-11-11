import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'success' | 'error' | 'info';
type ToastInput = { title: string; description?: string; tone?: Tone };
type ToastItem = ToastInput & { id: number };

const ToastContext = createContext<{ push: (t: ToastInput) => void } | null>(null);

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const accents = {
  success: 'text-lavender border-lavender/30',
  error: 'text-rose border-rose/30',
  info: 'text-mauve border-white/15',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (t: ToastInput) => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev.slice(-3), { ...t, id }]);
      window.setTimeout(() => dismiss(id), 6000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-5 left-1/2 z-[120] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-2 sm:bottom-7 sm:left-auto sm:right-7 sm:translate-x-0"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence>
          {items.map((item) => {
            const Icon = icons[item.tone || 'info'];
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.97 }}
                transition={{ duration: 0.28 }}
                className={cn(
                  'glass-strong pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-card',
                  accents[item.tone || 'info'],
                )}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-sm font-semibold text-ivory">{item.title}</p>
                  {item.description && (
                    <p className="mt-1 font-body text-xs leading-relaxed text-mauve">
                      {item.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="rounded-full p-1 text-mauve transition-colors hover:bg-white/10 hover:text-ivory"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
