import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Nayacura home"
      className={cn('group inline-flex items-center', className)}
    >
      <img
        src="/images/nayacura-logo.png"
        alt="Nayacura Private Care"
        className="h-10 sm:h-12 w-auto object-contain transition-all duration-300 group-hover:scale-[1.03] group-hover:brightness-110"
      />
    </Link>
  );
}
