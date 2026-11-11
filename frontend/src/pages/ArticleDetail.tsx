import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  Clock3,
  Copy,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { getArticle, articles } from '@/data/articles';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { NotFound } from './NotFound';

export default function ArticleDetail() {
  const { slug } = useParams();
  const article = getArticle(slug || '');
  const contentRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [headings, setHeadings] = useState<{ id: string; text: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    if (!article || !contentRef.current) return;
    const nodes = Array.from(contentRef.current.querySelectorAll('h2'));
    const items = nodes.map((node, index) => {
      const id = `section-${index + 1}`;
      node.id = id;
      return { id, text: node.textContent || '' };
    });
    setHeadings(items);
  }, [article]);

  useEffect(() => {
    function onScroll() {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nextReads = useMemo(() => {
    if (!article) return [];
    const pool = article.related.length ? article.related : articles.filter((a) => a.slug !== article.slug);
    return pool.slice(0, 3);
  }, [article]);

  if (!article) return <NotFound />;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      push({ title: 'Link copied', tone: 'success' });
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      push({ title: 'Could not copy the link', tone: 'error' });
    }
  }

  return (
    <>
      <Seo
        title={article.metaTitle || article.title}
        description={article.metaDescription || article.excerpt}
        path={`/journal/${article.slug}`}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.title,
          description: article.excerpt,
          datePublished: article.publishedAt,
          dateModified: article.reviewedAt || article.publishedAt,
          author: { '@type': 'Organization', name: article.author },
          publisher: { '@type': 'Organization', name: 'Nayacura (development demo)' },
          isAccessibleForFree: true,
        }}
      />
      <div className="fixed inset-x-0 top-0 z-[90] h-0.5 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-rose to-lavender transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <article className="relative bg-midnight pb-20 pt-28 sm:pt-36">
        <div className="container-editorial">
          <Link
            to="/journal"
            className="inline-flex items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-mauve transition-colors hover:text-ivory"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Wellness journal
          </Link>

          <header className="mt-8 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="rose">{article.categoryName}</Badge>
              <Badge tone="muted">
                <Clock3 className="h-2.5 w-2.5" /> {article.readingMinutes} min read
              </Badge>
              <Badge tone="muted">Editorial draft</Badge>
            </div>
            <h1 className="display mt-6 text-[clamp(2.8rem,5.5vw,5.4rem)]">{article.title}</h1>
            <p className="mt-5 max-w-2xl font-body text-[15px] leading-[1.85] text-mauve">
              {article.excerpt}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-y border-white/[0.08] py-4">
              <div>
                <p className="font-sans text-[10px] font-semibold text-ivory">{article.author}</p>
                <p className="mt-0.5 font-body text-[9px] text-mauve">
                  Published {formatDate(article.publishedAt)}
                  {article.reviewedAt ? ` · Reviewed ${formatDate(article.reviewedAt)}` : ' · Not medically reviewed'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-2 font-sans text-[9px] font-semibold text-mauve transition-colors hover:border-lavender/30 hover:text-ivory"
                >
                  {copied ? <Check className="h-3 w-3 text-lavender" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
                <Link
                  to="/ai"
                  className="inline-flex items-center gap-1.5 rounded-full border border-lavender/20 bg-lavender/[0.06] px-3 py-2 font-sans text-[9px] font-semibold text-lavender"
                >
                  <Sparkles className="h-3 w-3" /> Ask Naya
                </Link>
              </div>
            </div>
          </header>

          <div className="mt-8 overflow-hidden rounded-[28px] border border-white/[0.08]">
            <img src={article.image} alt="" className="aspect-[2.1] w-full object-cover" />
          </div>

          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-16">
            <div>
              <div className="flex items-start gap-3 rounded-2xl border border-lavender/15 bg-lavender/[0.04] p-5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lavender" />
                <p className="font-body text-[10.5px] leading-relaxed text-mauve">
                  <strong className="font-semibold text-ivory">Editorial note:</strong> This article is
                  general education, not medical advice. It is not a diagnosis and does not replace a
                  consultation with a qualified professional. This demo does not claim a medical
                  reviewer.
                </p>
              </div>
              <div
                ref={contentRef}
                className="article-copy mt-8"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              <div className="mt-12 rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-lavender/20 bg-lavender/[0.07] text-lavender">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-2xl text-ivory">When to speak to someone</h2>
                    <p className="mt-2 font-body text-[11.5px] leading-[1.85] text-mauve">
                      If this article has brought up a personal concern, you can browse specialist
                      profiles or book an initial conversation. You do not need a diagnosis to seek
                      care. If you are in crisis or immediate danger, contact local emergency services
                      or Tele-MANAS on 14416.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <ButtonLink to="/doctors" size="sm" arrow>
                        Find a specialist
                      </ButtonLink>
                      <ButtonLink to="/contact" variant="secondary" size="sm">
                        Contact support
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-white/[0.08] pt-6">
                <Link
                  to="/journal"
                  className="inline-flex items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-mauve hover:text-ivory"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> More writing
                </Link>
                <span className="font-body text-[9px] text-mauve/40">
                  Nayacura editorial · development demo
                </span>
              </div>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                  <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.17em] text-mauve">
                    In this article
                  </p>
                  <nav className="mt-4 space-y-3" aria-label="Article sections">
                    {headings.map((heading, index) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className="group flex gap-2.5 font-body text-[10.5px] leading-snug text-mauve transition-colors hover:text-ivory"
                      >
                        <span className="font-sans text-[8px] text-rose/60">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </div>
                <div className="mt-3 rounded-2xl border border-lavender/15 bg-lavender/[0.04] p-5">
                  <p className="font-sans text-[10px] font-semibold text-ivory">A note on certainty</p>
                  <p className="mt-2 font-body text-[9.5px] leading-relaxed text-mauve">
                    Health information changes. A production article would carry a named medical
                    reviewer, review date and a documented editorial process.
                  </p>
                </div>
              </div>
            </aside>
          </div>

          <section className="mt-16 border-t border-white/[0.08] pt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-2">Continue reading</p>
                <h2 className="font-display text-3xl text-ivory">Related writing</h2>
              </div>
              <Link
                to="/journal"
                className="inline-flex items-center gap-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-lavender hover:text-rose"
              >
                All articles <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {nextReads.map((item) => (
                <ArticleCard key={item.slug} article={item} />
              ))}
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
