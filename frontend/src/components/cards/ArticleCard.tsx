import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { ArticleSummary } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export function ArticleCard({
  article,
  variant = 'default',
  className,
}: {
  article: ArticleSummary;
  variant?: 'default' | 'featured' | 'compact';
  className?: string;
}) {
  if (variant === 'featured') {
    return (
      <Link
        to={`/journal/${article.slug}`}
        className={cn(
          'group relative block min-h-[420px] overflow-hidden rounded-[28px] border border-white/[0.08] sm:min-h-[500px]',
          className,
        )}
      >
        <img
          src={article.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/50 to-midnight/5" />
        <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-end p-6 sm:min-h-[500px] sm:p-8">
          <Badge tone="rose" className="mb-4 w-fit">
            {article.categoryName}
          </Badge>
          <h3 className="max-w-xl font-display text-[30px] leading-[1.08] text-ivory sm:text-[40px]">
            {article.title}
          </h3>
          <p className="mt-3 max-w-lg font-body text-[12.5px] leading-relaxed text-ivory/60 sm:text-sm">
            {article.excerpt}
          </p>
          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
            <p className="font-body text-[10px] uppercase tracking-[0.14em] text-mauve">
              {article.readingMinutes} min read · {formatDate(article.publishedAt)}
            </p>
            <span className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-mauve transition-colors group-hover:border-rose/40 group-hover:text-rose">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        to={`/journal/${article.slug}`}
        className={cn(
          'group flex gap-4 rounded-2xl border border-transparent p-2 transition-colors hover:border-white/[0.08] hover:bg-white/[0.025]',
          className,
        )}
      >
        <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl">
          <img
            src={article.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="min-w-0 py-1">
          <p className="font-body text-[9px] uppercase tracking-[0.14em] text-rose">
            {article.categoryName}
          </p>
          <h3 className="mt-1.5 line-clamp-2 font-sans text-[12.5px] font-semibold leading-snug text-ivory/90 transition-colors group-hover:text-lavender">
            {article.title}
          </h3>
          <p className="mt-2 font-body text-[9.5px] text-mauve">{article.readingMinutes} min read</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/journal/${article.slug}`}
      className={cn('card-surface card-lift group flex h-full flex-col overflow-hidden', className)}
    >
      <div className="relative aspect-[1.6] overflow-hidden">
        <img
          src={article.image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-plum/70 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-midnight/50 px-3 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.13em] text-ivory/80 backdrop-blur-md">
          {article.categoryName}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-[23px] leading-[1.16] text-ivory transition-colors group-hover:text-rose">
          {article.title}
        </h3>
        <p className="mt-3 line-clamp-3 font-body text-[12px] leading-[1.75] text-mauve">
          {article.excerpt}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-white/[0.07] pt-4 pt-5">
          <p className="font-body text-[9.5px] text-mauve/70">
            {article.readingMinutes} min · {formatDate(article.publishedAt)}
          </p>
          <ArrowUpRight className="h-4 w-4 text-mauve transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-rose" />
        </div>
      </div>
    </Link>
  );
}
