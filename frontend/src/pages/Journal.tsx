import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookOpen, Search, Sparkles, X } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/States';
import { ButtonLink } from '@/components/ui/Button';
import { articleCategories, articles, searchArticles } from '@/data/articles';
import { cn, formatDate } from '@/lib/utils';

export default function Journal() {
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get('q') || '');
  const activeCategory = params.get('category') || 'all';
  const query = params.get('q') || '';

  const results = useMemo(
    () => searchArticles(query, activeCategory),
    [query, activeCategory],
  );
  const featured = articles.filter((article) => article.featured).slice(0, 3);
  const isFiltering = activeCategory !== 'all' || Boolean(query);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    update('q', searchInput.trim());
  }

  return (
    <>
      <Seo
        title="Wellness Journal — Intimacy, Relationships & Emotional Health"
        description="Original, medically cautious education on sexual wellness, relationships, emotional health, consent and knowing when to seek professional care."
        path="/journal"
      />
      <PageHero
        eyebrow="The wellness journal"
        title="Read slowly."
        accent="Decide clearly."
        description="Cautious, original writing on intimacy, relationships and emotional health. No shame, no miracle claims, no invented medical authority. Every article names its limits and tells you when a personal assessment matters."
        art="none"
        visual={
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-white/10 bg-plum">
            <img
              src="/images/art/journal-reading-room.jpg"
              alt=""
              fetchPriority="high"
              className="h-full w-full object-cover object-[center_70%]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-midnight/35 to-transparent" />
          </div>
        }
      >
        <form onSubmit={submitSearch} className="relative max-w-md">
          <label htmlFor="journal-search" className="sr-only">Search the journal</label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mauve" />
          <input
            id="journal-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search a topic, concern or question…"
            className="input-premium min-h-12 rounded-full py-3 pl-11 pr-24 text-[13px]"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-lavender/15 px-4 py-2 font-sans text-[9.5px] font-semibold uppercase tracking-wider text-lavender hover:bg-lavender/20"
          >
            Search
          </button>
        </form>
      </PageHero>

      {!isFiltering && (
        <section className="relative border-t border-white/[0.06] bg-midnight pb-12 pt-10">
          <div className="container-naya">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-2">Featured writing</p>
                <h2 className="font-display text-3xl text-ivory">Start here.</h2>
              </div>
              <span className="font-body text-[9.5px] text-mauve/60">
                Editorial drafts · not medically reviewed
              </span>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <ArticleCard article={featured[0]} variant="featured" />
              </div>
              <div className="grid gap-4 lg:col-span-5">
                {featured.slice(1).map((article) => (
                  <ArticleCard key={article.slug} article={article} variant="compact" />
                ))}
                <div className="rounded-[24px] border border-lavender/15 bg-gradient-to-br from-burgundy/30 via-plum to-royal/15 p-5">
                  <Sparkles className="h-4 w-4 text-rose" />
                  <p className="mt-4 font-display text-2xl leading-tight text-ivory">
                    Have a question the article did not answer?
                  </p>
                  <p className="mt-2 font-body text-[10.5px] leading-relaxed text-mauve">
                    Naya AI can give general information and help you find a relevant specialist
                    category. It is not a doctor.
                  </p>
                  <ButtonLink to="/ai" variant="secondary" size="sm" className="mt-4" arrow>
                    Ask Naya
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="relative border-t border-white/[0.06] bg-midnight pb-20 sm:pb-28">
        <div className="container-naya">
          <div className="sticky top-[76px] z-30 -mx-5 border-b border-white/[0.07] bg-midnight/85 px-5 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:mx-0 lg:rounded-none lg:px-0">
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
              {articleCategories.map((category) => {
                const active = activeCategory === category.slug;
                return (
                  <button
                    key={category.slug}
                    type="button"
                    onClick={() => update('category', category.slug)}
                    className={cn(
                      'shrink-0 rounded-full border px-3.5 py-2 font-sans text-[9.5px] font-semibold transition-all',
                      active
                        ? 'border-lavender/35 bg-lavender/[0.09] text-ivory'
                        : 'border-white/[0.08] text-mauve hover:border-white/20 hover:text-ivory',
                    )}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-rose">
                {articleCategories.find((category) => category.slug === activeCategory)?.name ||
                  'All writing'}
              </p>
              <p className="mt-1 font-body text-[10.5px] text-mauve">
                {results.length} article{results.length === 1 ? '' : 's'}
                {query && ` matching “${query}”`}
              </p>
            </div>
            {(query || activeCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setParams({}, { replace: true });
                }}
                className="inline-flex items-center gap-1.5 font-sans text-[9px] font-semibold uppercase tracking-wider text-mauve hover:text-ivory"
              >
                <X className="h-3 w-3" /> Clear filters
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeCategory}-${query}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-6"
            >
              {results.length === 0 ? (
                <EmptyState
                  icon={<BookOpen className="h-6 w-6" />}
                  title="No articles match that search"
                  description="Try a broader term such as desire, pain, anxiety, consent or communication. You can also explore all categories."
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput('');
                        setParams({}, { replace: true });
                      }}
                      className="rounded-full border border-white/15 px-4 py-2 font-sans text-[10px] text-ivory/70 hover:text-ivory"
                    >
                      Show every article
                    </button>
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((article) => (
                    <ArticleCard key={article.slug} article={article} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 grid gap-5 rounded-[26px] border border-white/[0.08] bg-white/[0.025] p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
            <div>
              <Badge tone="muted">Editorial integrity</Badge>
              <p className="mt-4 font-display text-2xl text-ivory">
                Education is not a diagnosis.
              </p>
              <p className="mt-2 max-w-2xl font-body text-[10.5px] leading-relaxed text-mauve">
                Articles in this demo are unreviewed editorial drafts. We do not invent medical
                reviewers or credentials. A production platform must establish a documented clinical
                review workflow before publishing health information.
              </p>
            </div>
            <ButtonLink to="/legal/medical-disclaimer" variant="secondary" size="sm" arrow>
              Medical disclaimer
            </ButtonLink>
          </div>

          {!isFiltering && (
            <div className="mt-10">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow mb-2">More reading</p>
                  <h2 className="font-display text-3xl text-ivory">Browse the full journal</h2>
                </div>
                <p className="hidden font-body text-[9px] text-mauve/50 sm:block">
                  Updated {formatDate(articles[0].publishedAt)}
                </p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {articles.slice(3, 7).map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => update('category', 'all')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-3 font-sans text-[10px] font-semibold text-ivory/70 transition-colors hover:border-lavender/30 hover:text-ivory"
                >
                  View all {articles.length} articles <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
