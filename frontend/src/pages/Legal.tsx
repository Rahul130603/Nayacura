import type { ComponentProps } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, FileWarning, Scale, ShieldCheck } from 'lucide-react';
import { PageHero } from '@/components/layout/PageHero';
import { Seo } from '@/components/Seo';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { getLegalPage, legalPages } from '@/data/legal';
import { NotFound } from './NotFound';

const legalHeroImages: Partial<Record<string, ComponentProps<typeof PageHero>['backgroundImage']>> = {
  privacy: { src: '/images/art/privacy-policy-banner.png', width: 1849, height: 851 },
  terms: { src: '/images/art/terms-of-service-banner.png', width: 1848, height: 851 },
  'medical-disclaimer': { src: '/images/art/medical-disclaimer-banner.png', width: 1849, height: 851 },
  'teleconsultation-consent': { src: '/images/art/teleconsultation-consent-banner.png', width: 1848, height: 851 },
  'cancellation-refund': { src: '/images/art/cancellation-refund-banner.png', width: 1848, height: 851 },
  cookies: { src: '/images/art/cookie-policy-banner.png', width: 1846, height: 852 },
  'data-deletion': { src: '/images/art/data-deletion-banner.png', width: 1848, height: 851 },
  grievance: { src: '/images/art/grievance-support-banner.png', width: 1848, height: 851 },
};

export default function Legal() {
  const { slug } = useParams();
  if (slug === 'accessibility') {
    return <Navigate to="/legal/privacy" replace />;
  }
  const page = getLegalPage(slug || '');
  if (!page) return <NotFound />;

  const heroImage = legalHeroImages[page.slug];

  return (
    <>
      <Seo
        title={`${page.title} — Draft`}
        description={page.summary}
        path={`/legal/${page.slug}`}
        noIndex
      />
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.summary}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Legal & trust', to: '/legal/privacy' },
          { label: page.title },
        ]}
        backgroundImage={heroImage}
        art="none"
        className={heroImage ? undefined : 'pb-10 sm:pb-14'}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="rose" dot>
            Pre-launch draft
          </Badge>
          <span className="font-body text-[9.5px] text-mauve">Last updated {page.updated}</span>
        </div>
      </PageHero>

      <section className="relative border-t border-white/[0.06] bg-midnight pb-20 pt-10 sm:pb-28">
        <div className="container-naya">
          <div className="mb-8 flex items-start gap-3 rounded-[20px] border border-rose/20 bg-burgundy/20 p-5">
            <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-rose" />
            <div>
              <p className="font-sans text-[11.5px] font-semibold text-ivory">
                This document is a draft and requires legal review.
              </p>
              <p className="mt-1.5 max-w-4xl font-body text-[10.5px] leading-relaxed text-mauve">
                It is a product prototype, not legal advice or a binding policy. The future operating
                entity, jurisdiction, data practices, clinical governance and payment arrangements
                must be reviewed by qualified Indian legal, clinical, tax and privacy professionals
                before launch.
              </p>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[270px_1fr] lg:gap-16">
            <aside>
              <div className="lg:sticky lg:top-28">
                <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
                  <Scale className="h-4 w-4 text-lavender" />
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-mauve">
                    Legal & trust pages
                  </p>
                </div>
                <nav className="mt-3 space-y-1" aria-label="Legal pages">
                  {legalPages.map((item) => (
                    <Link
                      key={item.slug}
                      to={`/legal/${item.slug}`}
                      aria-current={item.slug === page.slug ? 'page' : undefined}
                      className={
                        item.slug === page.slug
                          ? 'flex items-center justify-between rounded-lg bg-lavender/[0.08] px-3 py-2.5 font-body text-[10.5px] text-ivory'
                          : 'flex items-center justify-between rounded-lg px-3 py-2.5 font-body text-[10.5px] text-mauve transition-colors hover:bg-white/[0.03] hover:text-ivory'
                      }
                    >
                      {item.title}
                      {item.slug === page.slug && (
                        <span className="h-1 w-1 rounded-full bg-rose" />
                      )}
                    </Link>
                  ))}
                </nav>
                <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                  <ShieldCheck className="h-4 w-4 text-lavender" />
                  <p className="mt-2 font-body text-[9px] leading-relaxed text-mauve">
                    No data-protection certification, medical accreditation or regulatory approval is
                    claimed.
                  </p>
                </div>
              </div>
            </aside>

            <article className="min-w-0">
              <div
                className="article-copy max-w-3xl"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />

              <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/[0.08] pt-6 sm:flex-row sm:items-center">
                <Link
                  to="/legal/privacy"
                  className="inline-flex items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-mauve hover:text-ivory"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> All legal pages
                </Link>
                <div className="flex flex-wrap gap-3">
                  <ButtonLink to="/contact" variant="secondary" size="sm">
                    Ask a question
                  </ButtonLink>
                  <ButtonLink to="/legal/data-deletion" variant="ghost" size="sm">
                    Data deletion <ArrowUpRight className="h-3 w-3" />
                  </ButtonLink>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
