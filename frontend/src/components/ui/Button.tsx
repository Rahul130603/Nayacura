import { forwardRef, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-sans font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender focus-visible:ring-offset-2 focus-visible:ring-offset-midnight';

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-rose via-[#e9b4c6] to-lavender text-midnight shadow-rose hover:shadow-[0_24px_80px_-24px_rgba(201,167,245,0.65)] hover:brightness-105 active:scale-[0.98]',
  secondary:
    'border border-white/15 bg-white/[0.06] text-ivory backdrop-blur-md hover:border-lavender/40 hover:bg-white/[0.09] active:scale-[0.98]',
  outline:
    'border border-lavender/30 text-lavender hover:border-lavender/70 hover:bg-lavender/[0.07] active:scale-[0.98]',
  ghost: 'text-ivory/80 hover:bg-white/[0.06] hover:text-ivory',
  danger:
    'border border-rose/25 bg-burgundy/50 text-rose hover:bg-burgundy hover:border-rose/40 active:scale-[0.98]',
};

const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-4 text-[12px] tracking-wide',
  md: 'min-h-11 px-6 text-[13px] tracking-wide',
  lg: 'min-h-[54px] px-8 text-[13.5px] tracking-[0.02em]',
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  arrow?: boolean;
  loading?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { to?: never; href?: never };

type LinkProps = CommonProps & {
  to: string;
  href?: never;
  target?: string;
  onClick?: () => void;
  state?: unknown;
};

type AnchorProps = CommonProps & {
  href: string;
  to?: never;
  target?: string;
  rel?: string;
  onClick?: () => void;
};

function Inner({
  loading,
  icon,
  arrow,
  children,
}: Pick<CommonProps, 'loading' | 'icon' | 'arrow' | 'children'>) {
  return (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      <span>{children}</span>
      {arrow && (
        <ArrowUpRight
          className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden
        />
      )}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
    </>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, arrow, loading, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      aria-busy={loading || undefined}
      {...props}
    >
      <Inner loading={loading} icon={icon} arrow={arrow}>
        {children}
      </Inner>
    </button>
  );
});

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  icon,
  arrow,
  className,
  children,
  target,
  onClick,
  state,
}: LinkProps) {
  return (
    <Link
      to={to}
      target={target}
      onClick={onClick}
      state={state}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      <Inner icon={icon} arrow={arrow}>
        {children}
      </Inner>
    </Link>
  );
}

export function ButtonAnchor({
  href,
  variant = 'primary',
  size = 'md',
  icon,
  arrow,
  className,
  children,
  target,
  rel,
  onClick,
}: AnchorProps) {
  return (
    <a
      href={href}
      target={target}
      rel={rel || (target === '_blank' ? 'noreferrer' : undefined)}
      onClick={onClick}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      <Inner icon={icon} arrow={arrow}>
        {children}
      </Inner>
    </a>
  );
}

export function Magnetic({
  children,
  className,
  strength = 14,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function move(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * strength;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * strength;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function leave() {
    if (ref.current) ref.current.style.transform = 'translate3d(0,0,0)';
  }

  return (
    <div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={leave}
      className={cn('inline-block transition-transform duration-300 ease-out', className)}
    >
      {children}
    </div>
  );
}
