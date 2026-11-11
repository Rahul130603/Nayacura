import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Reveal } from './Reveal';

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  tone = 'dark',
  action,
  className,
  as = 'h2',
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  action?: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}) {
  const Tag = as;
  return (
    <div
      className={cn(
        'flex flex-col gap-7 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'md:flex-col md:items-center md:text-center',
        className,
      )}
    >
      <Reveal className={cn('max-w-3xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <p className={cn('eyebrow mb-5', tone === 'light' && 'text-burgundy')}>{eyebrow}</p>
        )}
        <Tag
          className={cn(
            'display text-[clamp(2.25rem,4.8vw,4.6rem)]',
            tone === 'light' && 'text-plum',
          )}
        >
          {title}
        </Tag>
        {description && (
          <p
            className={cn(
              'body-copy mt-6 max-w-2xl',
              align === 'center' && 'mx-auto',
              tone === 'light' && 'text-plum/70',
            )}
          >
            {description}
          </p>
        )}
      </Reveal>
      {action && <Reveal delay={0.1} className="shrink-0">{action}</Reveal>}
    </div>
  );
}
