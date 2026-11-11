import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NayaChat } from './NayaChat';

export function NayaAssistant() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (location.pathname === '/ai') return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] flex flex-col bg-midnight/60 backdrop-blur-sm sm:inset-auto sm:bottom-24 sm:right-6 sm:block sm:h-auto sm:w-[418px] sm:bg-transparent sm:backdrop-blur-none"
            role="dialog"
            aria-label="Naya AI wellness assistant"
          >
            <div className="flex h-full flex-col overflow-hidden border-white/[0.09] bg-plum/95 pt-safe shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:h-[min(690px,calc(100vh-130px))] sm:rounded-[28px] sm:border">
              <NayaChat variant="panel" onClose={() => setOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close Naya AI assistant' : 'Open Naya AI wellness assistant'}
        aria-expanded={open}
        className={cn(
          'group fixed bottom-5 right-5 z-[90] flex items-center gap-2.5 rounded-full border border-lavender/25 bg-gradient-to-br from-plum via-burgundy to-royal px-4 py-3.5 text-ivory shadow-[0_18px_60px_-15px_rgba(110,53,164,0.75)] transition-all duration-300 hover:border-rose/40 hover:shadow-[0_22px_70px_-15px_rgba(232,160,183,0.55)] sm:bottom-7 sm:right-7',
          open && 'scale-95 opacity-0 pointer-events-none',
        )}
      >
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full border border-plum bg-rose" />
        </span>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
          {open ? (
            <MessageCircle className="h-4 w-4 text-rose" />
          ) : (
            <Sparkles className="h-4 w-4 text-rose" />
          )}
        </span>
        <span className="text-left">
          <span className="block font-sans text-[11px] font-semibold leading-none">Ask Naya</span>
          <span className="mt-1 block font-body text-[8.5px] leading-none text-mauve">
            Private AI companion
          </span>
        </span>
      </motion.button>
    </>
  );
}
