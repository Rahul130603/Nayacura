import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/ui/Reveal';

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3 w-3 text-mauve/40" aria-hidden />}
            {item.to ? (
              <Link
                to={item.to}
                className="font-body text-[10px] text-mauve/70 transition-colors hover:text-ivory"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-body text-[10px] text-lavender">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({
  eyebrow,
  title,
  accent,
  description,
  children,
  visual,
  backgroundImage,
  breadcrumbs,
  align = 'left',
  className,
  art = 'rings',
}: {
  eyebrow?: string;
  title: ReactNode;
  accent?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  visual?: ReactNode;
  backgroundImage?: { src: string; width: number; height: number };
  breadcrumbs?: { label: string; to?: string }[];
  align?: 'left' | 'center';
  className?: string;
  art?: 'rings' | 'arch' | 'veil' | 'none';
}) {
  return (
    <section
      className={cn(
        'page-hero relative flex min-h-[100svh] items-center overflow-hidden bg-midnight pb-16 pt-32 sm:pb-20 sm:pt-40 lg:pb-24 lg:pt-44',
        backgroundImage && 'pb-[65vw] sm:pb-[53vw] xl:grid xl:min-h-[min(44vw,51rem)] xl:items-center xl:pb-24',
        backgroundImage && 'max-sm:flex-col-reverse max-sm:justify-end max-sm:gap-5 max-sm:pb-0',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_15%,rgba(110,53,164,0.2),transparent_50%),radial-gradient(ellipse_at_10%_70%,rgba(87,26,55,0.22),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      {backgroundImage && (
        <div
          aria-hidden="true"
          className="pointer-events-none relative w-full sm:absolute sm:bottom-0 sm:right-0 sm:w-[115%] xl:inset-0 xl:w-full"
        >
          <img
            {...backgroundImage}
            alt=""
            fetchPriority="high"
            className="block h-auto w-full max-sm:aspect-[4/3] max-sm:object-cover max-sm:object-right xl:h-full xl:object-cover xl:object-[right_20%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#09060f,transparent_25%,transparent_86%,#09060f)] xl:bg-[linear-gradient(to_right,rgba(9,6,15,0.92)_8%,rgba(9,6,15,0.6)_36%,transparent_59%)]" />
          <div className="absolute inset-0 hidden bg-gradient-to-t from-midnight/80 via-transparent to-midnight/25 xl:block" />
        </div>
      )}

      {!backgroundImage && art !== 'none' && (
        <div
          className="pointer-events-none absolute right-[-10%] top-1/2 hidden h-[520px] w-[520px] -translate-y-1/2 opacity-60 lg:block"
          aria-hidden
        >
          {art === 'rings' && (
            <>
              <span className="absolute inset-0 rounded-full border border-lavender/12" />
              <span className="absolute inset-[12%] rounded-full border border-rose/12" />
              <span className="absolute inset-[26%] rounded-full border border-lavender/10" />
              <span className="absolute inset-[38%] rounded-full bg-gradient-to-br from-royal/25 via-burgundy/15 to-transparent blur-2xl" />
            </>
          )}
          {art === 'arch' && (
            <>
              <span className="absolute bottom-0 left-1/2 h-[78%] w-[62%] -translate-x-1/2 rounded-t-full border border-lavender/12" />
              <span className="absolute bottom-0 left-1/2 h-[58%] w-[44%] -translate-x-1/2 rounded-t-full border border-rose/10 bg-gradient-to-t from-royal/10 to-transparent" />
            </>
          )}
          {art === 'veil' && (
            <>
              <span className="absolute inset-[15%] rotate-12 rounded-[38%] bg-gradient-to-br from-royal/20 via-burgundy/10 to-transparent blur-3xl" />
              <span className="absolute inset-[25%] -rotate-12 rounded-[42%] border border-lavender/10" />
            </>
          )}
        </div>
      )}

      <div className={cn('container-naya relative z-10', align === 'center' && 'text-center')}>
        {breadcrumbs && (
          <div className={cn(align === 'center' && 'flex justify-center')}>
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
        <div className={visual ? 'grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12' : undefined}>
          <Reveal className={backgroundImage ? 'xl:max-w-[min(42vw,38rem)]' : undefined}>
            {eyebrow && <p className={cn('eyebrow mb-6', align === 'center' && 'justify-center')}>{eyebrow}</p>}
            <h1
              className={cn(
                'display max-w-5xl text-[clamp(2.8rem,6vw,5.8rem)]',
                align === 'center' && 'mx-auto',
                backgroundImage && 'xl:text-[clamp(2.6rem,3.15vw,4rem)]',
              )}
            >
              {title}
              {accent && <span className="display-soft"> {accent}</span>}
            </h1>
            {description && (
              <p
                className={cn(
                  'body-copy mt-7 max-w-2xl',
                  align === 'center' && 'mx-auto',
                )}
              >
                {description}
              </p>
            )}
            {children && <div className="mt-8">{children}</div>}
          </Reveal>
          {visual && <Reveal delay={0.12}>{visual}</Reveal>}
        </div>
      </div>
    </section>
  );
}
