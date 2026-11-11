import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-2xl', className)} aria-hidden />;
}

export function PageLoader({ label = 'Preparing your private space' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5" role="status">
      <div className="relative grid h-16 w-16 place-items-center">
        <span className="absolute inset-0 animate-spin rounded-full border border-lavender/15 border-t-lavender" />
        <span className="h-2 w-2 rounded-full bg-rose" />
      </div>
      <p className="font-sans text-xs uppercase tracking-[0.22em] text-mauve">{label}</p>
    </div>
  );
}

export function SuspenseFallback() {
  return (
    <div className="grid h-full min-h-[320px] w-full place-items-center" aria-hidden>
      <div className="relative h-40 w-40">
        <span className="absolute inset-0 animate-pulse-soft rounded-full border border-lavender/15" />
        <span className="absolute inset-6 animate-[spin_18s_linear_infinite] rounded-full border border-rose/20" />
        <span className="absolute inset-12 rounded-full bg-royal/20 blur-xl" />
        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lavender/70" />
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[26px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center',
        className,
      )}
    >
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-full border border-lavender/20 bg-lavender/[0.07] text-lavender">
        {icon || <Sparkles className="h-6 w-6" />}
      </div>
      <h3 className="font-display text-2xl text-ivory">{title}</h3>
      <p className="mt-3 max-w-md font-body text-sm leading-relaxed text-mauve">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'This space could not load',
  description = 'The connection may have been interrupted. Your information has not been changed.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[26px] border border-rose/20 bg-burgundy/10 px-6 py-16 text-center"
      role="alert"
    >
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-full border border-rose/25 bg-rose/10 text-rose">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="font-display text-2xl text-ivory">{title}</h3>
      <p className="mt-3 max-w-md font-body text-sm leading-relaxed text-mauve">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />} className="mt-6">
          Try again
        </Button>
      )}
    </div>
  );
}
