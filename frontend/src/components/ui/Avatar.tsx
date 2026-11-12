import { cn, initials } from '@/lib/utils';

export function Avatar({
  name,
  src,
  objectPosition,
  size = 'md',
  className,
}: {
  name: string;
  src?: string | null;
  objectPosition?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = {
    sm: 'h-9 w-9 text-[10px]',
    md: 'h-12 w-12 text-xs',
    lg: 'h-20 w-20 text-lg',
    xl: 'h-32 w-32 text-2xl',
  };
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full border border-lavender/25 bg-gradient-to-br from-burgundy via-plum to-royal',
        sizes[size],
        className,
      )}
    >
      {src ? (
        <>
          <img
            src={src}
            alt=""
            loading="lazy"
            style={{ objectPosition }}
            className="h-full w-full object-cover object-center [filter:saturate(.65)_contrast(1.03)]"
          />
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-midnight/45 via-transparent to-royal/15 mix-blend-multiply"
            aria-hidden
          />
        </>
      ) : (
        <span className="grid h-full w-full place-items-center font-display text-rose">
          {initials(name)}
        </span>
      )}
    </div>
  );
}
