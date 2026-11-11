import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Badge({
  children,
  tone = 'lavender',
  className,
  dot,
}: {
  children: ReactNode;
  tone?: 'lavender' | 'rose' | 'burgundy' | 'muted' | 'outline';
  className?: string;
  dot?: boolean;
}) {
  const tones = {
    lavender: 'border-lavender/20 bg-lavender/10 text-lavender',
    rose: 'border-rose/25 bg-rose/10 text-rose',
    burgundy: 'border-burgundy/50 bg-burgundy/40 text-rose',
    muted: 'border-white/10 bg-white/[0.05] text-mauve',
    outline: 'border-white/15 bg-transparent text-ivory/80',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.14em]',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
