import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Nayacura home"
      className={cn('group inline-flex items-center gap-3', className)}
    >
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-lavender/25 bg-midnight/60">
        <span className="absolute inset-0 bg-gradient-to-br from-royal/40 via-transparent to-rose/20 opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
        <svg viewBox="0 0 32 32" className="relative h-5 w-5" fill="none" aria-hidden>
          <path
            d="M8 24V8l16 16V8"
            stroke="url(#naya-logo)"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="naya-logo" x1="8" y1="8" x2="24" y2="24">
              <stop stopColor="#C9A7F5" />
              <stop offset="1" stopColor="#E8A0B7" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display text-[21px] font-medium tracking-[0.02em]',
            light ? 'text-plum' : 'text-ivory',
          )}
        >
          Nayacura
        </span>
        <span
          className={cn(
            'mt-1 font-sans text-[7.5px] font-semibold uppercase tracking-[0.29em]',
            light ? 'text-plum/55' : 'text-mauve',
          )}
        >
          Private care
        </span>
      </span>
    </Link>
  );
}
