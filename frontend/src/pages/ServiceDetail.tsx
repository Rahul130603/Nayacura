import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CalendarCheck2,
  Check,
  ChevronRight,
  Clock3,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Accordion } from '@/components/ui/Accordion';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { DemoNotice } from '@/components/ui/DemoNotice';
import { Reveal } from '@/components/ui/Reveal';
import { ServiceIcon } from '@/components/ServiceIcon';
import { DoctorCard } from '@/components/cards/DoctorCard';
import { demoDoctors } from '@/data/doctors';
import { getService, serviceCategories, servicesByCategory } from '@/data/services';
import { NotFound } from './NotFound';

const categorySpecialists: Record<string, string[]> = {
  'mens-sexual-wellness': ['sexual-medicine', 'psychosexual-therapy', 'urology'],
  'womens-sexual-wellness': ['gynaecology', 'sexual-medicine', 'psychosexual-therapy'],
  'couples-relationship-counselling': ['couples-therapy', 'relationship-counselling'],
  'emotional-psychological-wellbeing': ['clinical-psychology', 'psychiatry', 'psychosexual-therapy'],
};

export default function ServiceDetail() {
  const { slug } = useParams();
  const service = getService(slug || '');
  if (!service) return <NotFound />;

  const category = serviceCategories.find((item) => item.slug === service.categorySlug);
  const related = servicesByCategory(service.categorySlug).filter((item) => item.slug !== service.slug).slice(0, 4);
  const specialistSlugs = categorySpecialists[service.categorySlug] || [];
  const specialists = demoDoctors
    .filter((doctor) => doctor.specializations.some((item) => specialistSlugs.includes(item.slug)))
    .slice(0, 3);
  const bookQuery = specialistSlugs.length ? `?specialization=${specialistSlugs[0]}` : '';

  return (
    <>
      <Seo
        title={`${service.name} — Confidential Support`}
        description={`${service.summary} Learn about common concerns, contributing factors, when to seek professional help and how confidential consultations work.`}
        path={`/services/${service.slug}`}
      />

      <PageHero
        eyebrow={service.categoryName}
        title={service.name}
        description={service.summary}
        art="veil"
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Services', to: '/services' },
          { label: category?.name || 'Care', to: `/services?category=${service.categorySlug}` },
          { label: service.name },
        ]}
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink to={`/doctors${bookQuery}`} arrow>
            Find a specialist
          </ButtonLink>
          <ButtonLink
            to="/ai"
            variant="secondary"
            icon={<Sparkles className="h-4 w-4" />}
          >
            Ask Naya
          </ButtonLink>
        </div>
      </PageHero>

      <section className="relative border-t border-white/[0.06] bg-midnight pb-20 pt-12 sm:pb-28">
        <div className="container-naya">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-16">
            <div>
              <Reveal>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="lavender">Educational information</Badge>
                  <Badge tone="muted">Not a diagnosis</Badge>
                  <Badge tone="muted">Adults 18+</Badge>
                </div>
                <h2 className="display mt-7 text-[clamp(2rem,4vw,3.3rem)]">Overview</h2>
                <p className="mt-5 max-w-3xl font-body text-[15.5px] leading-[1.9] text-ivory/65">
                  {service.overview}
                </p>
                <div className="mt-7 flex items-start gap-3 rounded-2xl border border-lavender/15 bg-lavender/[0.04] p-5">
                  <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-lavender" />
                  <p className="font-body text-[12px] leading-[1.8] text-mauve">
                    You do not need to have a diagnosis, a partner, a specific identity or a clear
                    explanation to seek support. This page is general information. A qualified
                    clinician can help you understand what applies to your situation.
                  </p>
                </div>
              </Reveal>

              <div className="mt-14 grid gap-10 md:grid-cols-2">
                <Reveal>
                  <div className="border-t border-white/[0.1] pt-6">
                    <p className="eyebrow mb-5">Common concerns</p>
                    <ul className="space-y-3">
                      {service.concerns.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose/70" />
                          <span className="font-body text-[12.5px] leading-[1.75] text-ivory/65">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
                <Reveal delay={0.08}>
                  <div className="border-t border-white/[0.1] pt-6">
                    <p className="eyebrow mb-5">Possible contributing factors</p>
                    <ul className="space-y-3">
                      {service.factors.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lavender/60" />
                          <span className="font-body text-[12.5px] leading-[1.75] text-ivory/65">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 font-body text-[9.5px] leading-relaxed text-mauve/60">
                      These are possible contributors, not causes or diagnoses. Only a qualified
                      clinician can assess your individual situation.
                    </p>
                  </div>
                </Reveal>
              </div>

              <Reveal className="mt-14">
                <div className="rounded-[26px] border border-rose/20 bg-burgundy/20 p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-rose/25 bg-rose/10 text-rose">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.17em] text-rose">
                        When to seek professional help
                      </p>
                      <h2 className="mt-1 font-display text-2xl text-ivory">Do not wait for a crisis.</h2>
                    </div>
                  </div>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {service.whenToSeek.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" />
                        <span className="font-body text-[11.5px] leading-relaxed text-ivory/65">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 border-t border-white/10 pt-4 font-body text-[10px] leading-relaxed text-mauve">
                    If you are in immediate danger, contact local emergency services. Nayacura is not
                    an emergency provider. In India, Tele-MANAS on 14416 offers mental health crisis
                    support.
                  </p>
                </div>
              </Reveal>

              <Reveal className="mt-14">
                <p className="eyebrow mb-5">How consultations work</p>
                <h2 className="display text-[clamp(2rem,3.8vw,3.1rem)]">
                  A conversation with a purpose.
                </h2>
                <div className="mt-7 space-y-0">
                  {service.consultation.map((item, index) => (
                    <div key={item} className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-white/[0.08] py-5 sm:grid-cols-[3.5rem_1fr]">
                      <span className="font-display text-xl italic text-rose/50">0{index + 1}</span>
                      <p className="font-body text-[12.5px] leading-[1.8] text-ivory/65">{item}</p>
                    </div>
                  ))}
                </div>
              </Reveal>

              <Reveal className="mt-14">
                <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-lavender/20 bg-lavender/[0.07] text-lavender">
                      <Stethoscope className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="font-display text-2xl text-ivory">Relevant specialist categories</h2>
                      <p className="mt-2 font-body text-[11.5px] leading-[1.8] text-mauve">
                        These are the kinds of professionals who may be appropriate. The right fit
                        depends on your concerns, preferences and what the clinician is qualified to
                        assess. No category guarantees a particular outcome.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {service.specialists.map((specialist) => (
                      <span
                        key={specialist}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 font-body text-[10.5px] text-ivory/60"
                      >
                        {specialist}
                      </span>
                    ))}
                  </div>
                  {specialists.length > 0 && (
                    <div className="mt-7 grid gap-3 sm:grid-cols-3">
                      {specialists.map((doctor) => (
                        <Link
                          key={doctor.id}
                          to={`/doctors/${doctor.slug}`}
                          className="group rounded-2xl border border-white/[0.08] p-3 transition-colors hover:border-lavender/25"
                        >
                          <img
                            src={doctor.photoUrl || ''}
                            alt=""
                            className="aspect-[4/3] w-full rounded-xl object-cover"
                          />
                          <p className="mt-3 font-sans text-[11.5px] font-semibold text-ivory group-hover:text-rose">
                            {doctor.name}
                          </p>
                          <p className="mt-1 line-clamp-1 font-body text-[9.5px] text-mauve">
                            {doctor.specializations[0]?.name}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>

              <Reveal className="mt-14">
                <p className="eyebrow mb-5">Frequently asked</p>
                <h2 className="display text-[clamp(2rem,3.8vw,3rem)]">Questions worth asking.</h2>
                <Accordion items={service.faqs} className="mt-5" />
              </Reveal>

              {related.length > 0 && (
                <Reveal className="mt-16 border-t border-white/[0.08] pt-10">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="eyebrow mb-2">Related care</p>
                      <h2 className="font-display text-3xl text-ivory">You may also be looking for</h2>
                    </div>
                    <Link
                      to={`/services?category=${service.categorySlug}`}
                      className="hidden font-sans text-[10px] font-semibold uppercase tracking-wider text-lavender hover:text-rose sm:block"
                    >
                      All {category?.name} →
                    </Link>
                  </div>
                  <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    {related.map((item) => (
                      <Link
                        key={item.slug}
                        to={`/services/${item.slug}`}
                        className="group flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] px-4 py-4 transition-colors hover:border-lavender/25 hover:bg-white/[0.03]"
                      >
                        <span className="font-body text-[11.5px] text-ivory/65 group-hover:text-ivory">
                          {item.name}
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-mauve group-hover:text-rose" />
                      </Link>
                    ))}
                  </div>
                </Reveal>
              )}
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-4">
                <div className="rounded-[24px] border border-lavender/15 bg-gradient-to-br from-burgundy/35 via-plum to-royal/20 p-6">
                  <span className="grid h-10 w-10 place-items-center rounded-full border border-rose/25 bg-rose/10 text-rose">
                    <ServiceIcon name={service.icon} className="h-4 w-4" />
                  </span>
                  <h2 className="mt-5 font-display text-2xl leading-tight text-ivory">
                    Begin with a private conversation.
                  </h2>
                  <p className="mt-2 font-body text-[10.5px] leading-relaxed text-mauve">
                    Choose a specialist by language, gender, experience and consultation type.
                  </p>
                  <ButtonLink to={`/doctors${bookQuery}`} size="sm" className="mt-4 w-full" arrow>
                    Find a specialist
                  </ButtonLink>
                  <ButtonLink to="/pricing" variant="ghost" size="sm" className="mt-1.5 w-full">
                    See consultation fees
                  </ButtonLink>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                  <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.17em] text-mauve">
                    On this page
                  </p>
                  <nav className="mt-4 space-y-2.5">
                    {[
                      ['Overview', '#overview'],
                      ['Common concerns', '#concerns'],
                      ['When to seek help', '#when-to-seek'],
                      ['Consultations', '#consultations'],
                      ['Specialists', '#specialists'],
                      ['FAQs', '#faqs'],
                    ].map(([label, href]) => (
                      <a
                        key={label}
                        href={href}
                        className="flex items-center gap-2 font-body text-[10.5px] text-mauve transition-colors hover:text-ivory"
                      >
                        <ChevronRight className="h-3 w-3 text-lavender/50" /> {label}
                      </a>
                    ))}
                  </nav>
                </div>

                <div className="rounded-2xl border border-white/[0.08] p-5">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-3.5 w-3.5 text-lavender" />
                    <p className="font-sans text-[10px] font-semibold text-ivory">
                      A note on time
                    </p>
                  </div>
                  <p className="mt-2 font-body text-[10px] leading-relaxed text-mauve">
                    You do not need to resolve everything in one session. A clinician can help you
                    decide what is realistic and what the next step should be.
                  </p>
                </div>

                <DemoNotice compact />
              </div>
            </aside>
          </div>

          <div className="mt-16 lg:hidden">
            <DemoNotice>
              Service descriptions are educational only and do not diagnose or promise outcomes.
              Clinician profiles are fictional.
            </DemoNotice>
          </div>

          <div className="mt-14 flex flex-col items-start justify-between gap-5 rounded-[26px] border border-lavender/15 bg-gradient-to-r from-burgundy/30 via-plum to-royal/20 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <p className="font-display text-2xl text-ivory">Your next step can be small.</p>
              <p className="mt-1 font-body text-[11px] text-mauve">
                Find a specialist, ask Naya a general question, or return to all services.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to={`/doctors${bookQuery}`} size="sm" arrow>
                Find a specialist
              </ButtonLink>
              <ButtonLink to="/services" variant="secondary" size="sm" icon={<ArrowLeft className="h-3.5 w-3.5" />}>
                All services
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
