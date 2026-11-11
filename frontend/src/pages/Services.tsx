import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { DemoNotice } from '@/components/ui/DemoNotice';
import { Reveal } from '@/components/ui/Reveal';
import { ServiceIcon } from '@/components/ServiceIcon';
import { serviceCategories, services, servicesByCategory } from '@/data/services';
import { cn } from '@/lib/utils';

export default function Services() {
  const [params, setParams] = useSearchParams();
  const activeCategory = params.get('category') || 'all';
  const search = params.get('q') || '';

  const visibleServices = useMemo(() => {
    const base =
      activeCategory === 'all' ? services : servicesByCategory(activeCategory);
    if (!search.trim()) return base;
    const query = search.toLowerCase();
    return base.filter((service) =>
      `${service.name} ${service.summary} ${service.concerns.join(' ')}`
        .toLowerCase()
        .includes(query),
    );
  }, [activeCategory, search]);

  const activeMeta = serviceCategories.find((category) => category.slug === activeCategory);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  return (
    <>
      <Seo
        title="Sexual Wellness & Relationship Services"
        description="Explore confidential care for men's and women's sexual wellness, couples counselling and emotional wellbeing. 26 specialist service pathways."
        path="/services"
      />
      <PageHero
        eyebrow="Our services"
        title="Care for the parts that are"
        accent="hard to say out loud."
        description="Twenty-six specialist pathways across sexual wellness, relationships and emotional health. Start with a concern, not a diagnosis. Every pathway can begin with a private conversation."
        art="rings"
      >
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink to="/doctors" arrow>
            Find your specialist
          </ButtonLink>
          <ButtonLink to="/ai" variant="secondary" icon={<Sparkles className="h-4 w-4" />}>
            Not sure where to start?
          </ButtonLink>
        </div>
      </PageHero>

      <section className="relative border-y border-white/[0.06] bg-plum py-8">
        <div className="container-naya grid gap-4 sm:grid-cols-3">
          {[
            [ShieldCheck, 'Consent-led care', 'You set the pace and the limits.'],
            [Clock3, 'Flexible formats', 'Video or in-person where available.'],
            [Stethoscope, 'Appropriate boundaries', 'No diagnosis by AI. No guaranteed outcomes.'],
          ].map(([Icon, title, copy]) => {
            const Component = Icon as typeof ShieldCheck;
            return (
              <div key={title as string} className="flex items-center gap-3">
                <Component className="h-4 w-4 shrink-0 text-lavender" />
                <div>
                  <p className="font-sans text-[11px] font-semibold text-ivory">{title as string}</p>
                  <p className="font-body text-[10px] text-mauve">{copy as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative bg-midnight py-14 sm:py-20">
        <div className="container-naya">
          <div className="grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-14">
            <aside className="min-w-0">
              <div className="lg:sticky lg:top-28">
                <p className="mb-4 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-mauve">
                  Browse by care area
                </p>
                <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
                  <button
                    type="button"
                    onClick={() => update('category', 'all')}
                    className={cn(
                      'shrink-0 rounded-xl border px-4 py-3 text-left transition-all lg:w-full',
                      activeCategory === 'all'
                        ? 'border-lavender/30 bg-lavender/[0.08] text-ivory'
                        : 'border-white/[0.07] text-mauve hover:border-white/15 hover:text-ivory',
                    )}
                  >
                    <span className="font-sans text-[11.5px] font-semibold">All care</span>
                    <span className="ml-2 font-body text-[9px] text-mauve/60">{services.length}</span>
                  </button>
                  {serviceCategories.map((category) => {
                    const active = activeCategory === category.slug;
                    return (
                      <button
                        key={category.slug}
                        type="button"
                        onClick={() => update('category', category.slug)}
                        className={cn(
                          'shrink-0 rounded-xl border px-4 py-3 text-left transition-all lg:w-full',
                          active
                            ? 'border-lavender/30 bg-lavender/[0.08] text-ivory'
                            : 'border-white/[0.07] text-mauve hover:border-white/15 hover:text-ivory',
                        )}
                      >
                        <span className="font-sans text-[11.5px] font-semibold">{category.name}</span>
                        <span className="ml-2 font-body text-[9px] text-mauve/60">
                          {servicesByCategory(category.slug).length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-7 hidden rounded-2xl border border-lavender/15 bg-gradient-to-br from-burgundy/30 to-royal/15 p-5 lg:block">
                  <Sparkles className="h-4 w-4 text-rose" />
                  <p className="mt-4 font-display text-xl leading-tight text-ivory">
                    Not sure which pathway fits?
                  </p>
                  <p className="mt-2 font-body text-[10.5px] leading-relaxed text-mauve">
                    Naya AI can explain general topics and suggest a specialist category — without
                    diagnosing you.
                  </p>
                  <Link
                    to="/ai"
                    className="mt-4 inline-flex items-center gap-1.5 font-sans text-[10px] font-semibold text-lavender hover:text-rose"
                  >
                    Ask Naya <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </aside>

            <div className="min-w-0">
              <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow mb-3">
                    {activeMeta ? activeMeta.name : 'All specialist care'}
                  </p>
                  <h2 className="display text-[clamp(2rem,3.6vw,3.2rem)]">
                    {activeMeta ? activeMeta.tagline : 'Start where it feels closest.'}
                  </h2>
                  {activeMeta && (
                    <p className="mt-3 max-w-2xl font-body text-[12px] leading-relaxed text-mauve">
                      {activeMeta.description}
                    </p>
                  )}
                </div>
                <div className="relative shrink-0">
                  <label htmlFor="service-search" className="sr-only">
                    Search services
                  </label>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mauve/60" />
                  <input
                    id="service-search"
                    type="search"
                    value={search}
                    onChange={(e) => update('q', e.target.value)}
                    placeholder="Search a concern…"
                    className="input-premium min-h-10 w-full rounded-full py-2.5 pl-10 pr-4 text-xs sm:w-56"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between py-3">
                <p className="font-body text-[10px] text-mauve/60">
                  {visibleServices.length} service{visibleServices.length === 1 ? '' : 's'}
                  {search ? ` matching “${search}”` : ''}
                </p>
                <p className="hidden font-body text-[9px] text-mauve/40 sm:block">
                  General information · not a diagnosis
                </p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  {visibleServices.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-16 text-center">
                      <MessageCircle className="mx-auto h-6 w-6 text-mauve" />
                      <p className="mt-4 font-display text-2xl text-ivory">No matching service.</p>
                      <p className="mt-2 font-body text-xs text-mauve">
                        Try a broader word, or ask Naya AI to help you find the right category.
                      </p>
                    </div>
                  ) : activeCategory === 'all' ? (
                    <div className="space-y-12">
                      {serviceCategories.map((category) => {
                        const items = visibleServices.filter(
                          (service) => service.categorySlug === category.slug,
                        );
                        if (!items.length) return null;
                        return (
                          <div key={category.slug}>
                            <div className="mb-4 flex items-end justify-between gap-4">
                              <div>
                                <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-rose">
                                  {category.name}
                                </p>
                                <p className="mt-1 max-w-lg font-body text-[10.5px] text-mauve">
                                  {category.tagline}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => update('category', category.slug)}
                                className="shrink-0 font-sans text-[9px] font-semibold uppercase tracking-wider text-lavender hover:text-rose"
                              >
                                View area →
                              </button>
                            </div>
                            <div className="grid gap-2">
                              {items.map((service) => (
                                <ServiceRow key={service.slug} service={service} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {visibleServices.map((service, index) => (
                        <Reveal key={service.slug} delay={index * 0.03}>
                          <Link
                            to={`/services/${service.slug}`}
                            className="group grid gap-4 rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-5 transition-all duration-300 hover:border-lavender/25 hover:bg-white/[0.045] sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"
                          >
                            <div className="flex gap-4">
                              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-lavender/15 bg-lavender/[0.06] text-lavender">
                                <ServiceIcon name={service.icon} className="h-4 w-4" />
                              </span>
                              <div>
                                <h3 className="font-display text-[23px] leading-tight text-ivory transition-colors group-hover:text-rose">
                                  {service.name}
                                </h3>
                                <p className="mt-1.5 max-w-xl font-body text-[11.5px] leading-[1.8] text-mauve">
                                  {service.summary}
                                </p>
                              </div>
                            </div>
                            <span className="flex items-center gap-2 font-sans text-[10px] font-semibold text-lavender">
                              View service
                              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </span>
                          </Link>
                        </Reveal>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-10">
                <DemoNotice>
                  Service descriptions are educational and do not diagnose or promise outcomes.
                  Clinician profiles in this demo are fictional. A real consultation would determine
                  whether a service is appropriate for you.
                </DemoNotice>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/[0.06] bg-burgundy/[0.3] py-20">
        <div className="container-naya grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="eyebrow mb-4">A gentle next step</p>
            <h2 className="display text-[clamp(2.2rem,4.2vw,3.8rem)]">
              A service page can inform. A conversation can <span className="display-soft">clarify.</span>
            </h2>
            <p className="mt-4 max-w-xl font-body text-[12.5px] leading-[1.85] text-mauve">
              If you are unsure where your concern belongs, start with Naya or book a first
              consultation. You do not have to identify the right label before asking for help.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <ButtonLink to="/ai" variant="secondary" icon={<Sparkles className="h-4 w-4" />}>
              Ask Naya
            </ButtonLink>
            <ButtonLink to="/doctors" arrow>
              Find a specialist
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

function ServiceRow({
  service,
}: {
  service: (typeof services)[number];
}) {
  return (
    <Link
      to={`/services/${service.slug}`}
      className="group flex items-center gap-4 rounded-xl border border-transparent px-3 py-3.5 transition-all hover:border-white/[0.08] hover:bg-white/[0.03] sm:gap-5"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/[0.08] text-mauve transition-colors group-hover:border-lavender/30 group-hover:text-lavender">
        <ServiceIcon name={service.icon} className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-sans text-[13.5px] font-semibold text-ivory/85 transition-colors group-hover:text-ivory">
          {service.name}
        </h3>
        <p className="mt-1 line-clamp-1 font-body text-[10.5px] text-mauve">{service.summary}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-mauve/50 transition-all group-hover:translate-x-1 group-hover:text-rose" />
    </Link>
  );
}
