import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck2,
  CalendarDays,
  ChevronRight,
  Clock3,
  GraduationCap,
  Languages,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Stethoscope,
  Video,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { AvailabilitySlot } from '@/types';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Seo } from '@/components/Seo';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Accordion } from '@/components/ui/Accordion';
import { Avatar } from '@/components/ui/Avatar';
import { DemoNotice } from '@/components/ui/DemoNotice';
import { EmptyState, PageLoader, ErrorState } from '@/components/ui/States';
import { DoctorCard } from '@/components/cards/DoctorCard';
import { useDoctor } from '@/hooks/useDoctors';
import { demoDoctors, getDemoStockPortrait } from '@/data/doctors';
import { NotFound } from './NotFound';

type AvailabilityResponse = {
  days: {
    date: string;
    label: string;
    shortLabel: string;
    slots: AvailabilitySlot[];
  }[];
  timezone: string;
  mode: string;
};

export default function DoctorProfile() {
  const { slug } = useParams();
  const { data, isLoading, isError, refetch } = useDoctor(slug);
  const doctor = data?.doctor;
  const [mode, setMode] = useState<'ONLINE' | 'IN_PERSON'>('ONLINE');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!doctor) return;
    if (!doctor.onlineEnabled && doctor.inPersonEnabled) setMode('IN_PERSON');
  }, [doctor]);

  const availabilityQuery = useQuery({
    queryKey: ['availability', slug, mode],
    enabled: Boolean(slug && doctor),
    queryFn: async () => {
      try {
        return await api<AvailabilityResponse>(
          `/doctors/${slug}/availability?mode=${mode}&days=21`,
        );
      } catch {
        return { days: [], timezone: doctor?.timezone || 'Asia/Kolkata', mode };
      }
    },
  });

  useEffect(() => {
    if (availabilityQuery.data?.days.length && !selectedDate) {
      setSelectedDate(availabilityQuery.data.days[0].date);
    }
  }, [availabilityQuery.data, selectedDate]);

  const selectedDay = availabilityQuery.data?.days.find((day) => day.date === selectedDate);
  const related = useMemo(() => {
    if (!doctor) return [];
    return demoDoctors
      .filter(
        (item) =>
          item.slug !== doctor.slug &&
          item.specializations.some((spec) =>
            doctor.specializations.some((itemSpec) => itemSpec.slug === spec.slug),
          ),
      )
      .slice(0, 3);
  }, [doctor]);

  if (isLoading) return <PageLoader label="Opening specialist profile" />;
  if (isError || !doctor) {
    return (
      <div className="container-naya pt-40">
        <ErrorState
          title="This profile could not load"
          description="The specialist may be unavailable, or the connection was interrupted."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const bookingHref = (slot?: string) =>
    `/book?doctor=${doctor.slug}&mode=${mode}${slot ? `&slot=${encodeURIComponent(slot)}` : ''}`;

  const stockPortrait = getDemoStockPortrait(doctor);
  const portraitUrl = stockPortrait?.src ?? doctor.photoUrl;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${doctor.name} — illustrative specialist profile`,
    description: doctor.bio,
    isPartOf: { '@type': 'WebSite', name: 'Nayacura' },
    about: 'Fictional development demo clinician. Not a real medical professional.',
  };

  return (
    <>
      <Seo
        title={`${doctor.name} — ${doctor.specializations[0]?.name || 'Specialist'}`}
        description={`${doctor.name} is a fictional demo clinician at Nayacura. ${doctor.bio.slice(0, 130)}…`}
        path={`/doctors/${doctor.slug}`}
        jsonLd={jsonLd}
      />

      <section className="relative overflow-hidden border-b border-white/[0.06] bg-midnight pb-12 pt-28 sm:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_10%,rgba(110,53,164,0.22),transparent_55%)]" />
        <div className="container-naya relative z-10">
          <div className="mb-7 flex items-center justify-between gap-4">
            <Link
              to="/doctors"
              className="inline-flex items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-mauve transition-colors hover:text-ivory"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All specialists
            </Link>
            <Badge tone="muted" dot>
              Illustrative profile
            </Badge>
          </div>

          <div className="grid gap-8 lg:grid-cols-[340px_1fr] lg:gap-12">
            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-gradient-to-br from-plum to-burgundy/40">
              {portraitUrl ? (
                <img
                  src={portraitUrl}
                  alt={stockPortrait ? 'Stock portrait for a fictional profile' : ''}
                  style={{ objectPosition: stockPortrait?.position }}
                  className="aspect-[4/4.3] w-full object-cover object-top"
                />
              ) : (
                <div className="grid aspect-[4/4.3] place-items-center">
                  <Avatar name={doctor.name} size="xl" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-midnight via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-1.5">
                {doctor.onlineEnabled && <Badge tone="lavender" dot>Video</Badge>}
                {doctor.inPersonEnabled && <Badge tone="muted">In person</Badge>}
                <Badge tone="rose">Demo</Badge>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-rose">
                  {doctor.specializations.map((item) => item.name).join(' · ')}
                </span>
              </div>
              <h1 className="display mt-4 text-[clamp(2.8rem,5vw,4.7rem)]">{doctor.name}</h1>
              <p className="mt-3 font-sans text-[14px] text-ivory/60">{doctor.title}</p>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                <span className="inline-flex items-center gap-2 font-body text-[11px] text-ivory/60">
                  <CalendarCheck2 className="h-3.5 w-3.5 text-lavender" />
                  {doctor.experienceYears} years experience
                </span>
                <span className="inline-flex items-center gap-2 font-body text-[11px] text-ivory/60">
                  <Languages className="h-3.5 w-3.5 text-lavender" />
                  {doctor.languages.join(', ')}
                </span>
                <span className="inline-flex items-center gap-2 font-body text-[11px] text-ivory/60">
                  <MapPin className="h-3.5 w-3.5 text-lavender" />
                  {doctor.inPersonEnabled ? doctor.city : 'Online consultations'}
                </span>
              </div>

              <p className="mt-5 max-w-2xl font-body text-[13px] leading-[1.85] text-mauve">
                {doctor.bio}
              </p>

              <div className="mt-7 flex flex-wrap items-end gap-x-8 gap-y-4 border-t border-white/[0.08] pt-5">
                <div>
                  <p className="font-body text-[9px] uppercase tracking-[0.16em] text-mauve/60">
                    Consultation fee
                  </p>
                  <p className="mt-1 font-display text-3xl text-ivory">
                    {formatCurrency(doctor.feePaise)}
                  </p>
                </div>
                <div>
                  <p className="font-body text-[9px] uppercase tracking-[0.16em] text-mauve/60">
                    Next availability
                  </p>
                  <p className="mt-1.5 font-sans text-[12px] font-semibold text-lavender">
                    {doctor.nextAvailable
                      ? formatDate(doctor.nextAvailable, { weekday: 'short' })
                      : 'Select a mode below'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ButtonLink to={bookingHref()} arrow>
                    Book consultation
                  </ButtonLink>
                  <ButtonLink to="/ai" variant="secondary" size="md" icon={<MessageCircle className="h-4 w-4" />}>
                    Ask Naya
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-midnight py-14 sm:py-20">
        <div className="container-naya">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
            <div className="space-y-14">
              <div id="overview">
                <p className="eyebrow mb-4">Professional overview</p>
                <h2 className="display text-[clamp(2rem,3.6vw,3rem)]">How this clinician works.</h2>
                <p className="mt-5 font-body text-[13.5px] leading-[1.9] text-ivory/65">
                  {doctor.approach}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    [ShieldCheck, 'Consent-led', 'You can pause or decline'],
                    [Video, 'Video or in person', 'Where the profile permits'],
                    [Clock3, '45–60 minutes', 'First consultation'],
                  ].map(([Icon, title, copy]) => {
                    const Component = Icon as typeof ShieldCheck;
                    return (
                      <div key={title as string} className="rounded-2xl border border-white/[0.07] p-4">
                        <Component className="h-4 w-4 text-lavender" />
                        <p className="mt-3 font-sans text-[11px] font-semibold text-ivory">
                          {title as string}
                        </p>
                        <p className="mt-1 font-body text-[9.5px] text-mauve">{copy as string}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div id="expertise">
                <p className="eyebrow mb-4">Areas of expertise</p>
                <h2 className="font-display text-3xl text-ivory">What this profile covers</h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  {doctor.specializations.map((item) => (
                    <span
                      key={item.slug}
                      className="rounded-full border border-lavender/20 bg-lavender/[0.05] px-3.5 py-2 font-body text-[10.5px] text-lavender"
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {[
                    'Initial assessment and care planning',
                    'Psychosexual and communication support',
                    'Medication and health-context review where qualified',
                    'Referral and coordination with other professionals',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] px-3.5 py-3">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" />
                      <span className="font-body text-[10.5px] leading-relaxed text-ivory/55">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div id="credentials">
                <p className="eyebrow mb-4">Qualifications & registration</p>
                <h2 className="font-display text-3xl text-ivory">Credentials, clearly labelled</h2>
                <div className="mt-5 rounded-2xl border border-rose/15 bg-rose/[0.035] p-4">
                  <p className="font-body text-[10px] leading-relaxed text-mauve">
                    <strong className="text-rose">Demo credential record.</strong> The qualifications,
                    registration numbers and council shown below are fictional. They have not been
                    independently verified. A production platform must verify credentials at source
                    with the relevant council before a clinician is listed.
                  </p>
                </div>
                <div className="mt-4 divide-y divide-white/[0.08]">
                  {doctor.qualifications.map((qualification) => (
                    <div key={qualification} className="flex items-start gap-3 py-4">
                      <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-lavender" />
                      <p className="font-body text-[12px] leading-relaxed text-ivory/65">{qualification}</p>
                    </div>
                  ))}
                  <div className="grid gap-3 py-4 sm:grid-cols-2">
                    {[
                      ['Registration number', doctor.registrationNumber || 'Not provided'],
                      ['Council / body', doctor.registrationCouncil || 'Not provided'],
                      ['Registration year', doctor.registrationYear || 'Not provided'],
                      ['Status', 'Illustrative verification only'],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <p className="font-body text-[9px] uppercase tracking-[0.14em] text-mauve/60">
                          {label}
                        </p>
                        <p className="mt-1 font-sans text-[11.5px] text-ivory/70">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div id="availability">
                <p className="eyebrow mb-4">Availability</p>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <h2 className="font-display text-3xl text-ivory">Choose a first step</h2>
                  <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
                    {doctor.onlineEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('ONLINE');
                          setSelectedDate(null);
                        }}
                        className={cn(
                          'rounded-full px-3.5 py-1.5 font-sans text-[10px] font-semibold transition-colors',
                          mode === 'ONLINE' ? 'bg-lavender/15 text-ivory' : 'text-mauve',
                        )}
                      >
                        Video
                      </button>
                    )}
                    {doctor.inPersonEnabled && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('IN_PERSON');
                          setSelectedDate(null);
                        }}
                        className={cn(
                          'rounded-full px-3.5 py-1.5 font-sans text-[10px] font-semibold transition-colors',
                          mode === 'IN_PERSON' ? 'bg-lavender/15 text-ivory' : 'text-mauve',
                        )}
                      >
                        In person
                      </button>
                    )}
                  </div>
                </div>

                {availabilityQuery.isLoading ? (
                  <div className="mt-5 skeleton h-48 rounded-2xl" />
                ) : !availabilityQuery.data?.days.length ? (
                  <EmptyState
                    className="mt-5"
                    icon={<CalendarDays className="h-5 w-5" />}
                    title="No demo slots in the next 21 days"
                    description="Try another consultation mode or contact support. A real service would show updated availability from the clinician’s schedule."
                    action={
                      <ButtonLink to="/doctors" variant="secondary" size="sm">
                        Browse other specialists
                      </ButtonLink>
                    }
                  />
                ) : (
                  <div className="mt-5 rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-4">
                    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                      {availabilityQuery.data.days.map((day) => (
                        <button
                          key={day.date}
                          type="button"
                          onClick={() => setSelectedDate(day.date)}
                          aria-pressed={selectedDate === day.date}
                          className={cn(
                            'min-w-[92px] shrink-0 rounded-xl border px-3 py-3 text-center transition-all',
                            selectedDate === day.date
                              ? 'border-lavender/40 bg-lavender/[0.09] text-ivory'
                              : 'border-white/[0.07] text-mauve hover:border-white/20 hover:text-ivory',
                          )}
                        >
                          <span className="block font-sans text-[10px] font-semibold">
                            {day.shortLabel.split(' ')[0]}
                          </span>
                          <span className="mt-0.5 block font-display text-xl">
                            {day.shortLabel.split(' ')[1]}
                          </span>
                          <span className="mt-0.5 block font-body text-[8.5px]">
                            {day.slots.length} slots
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 border-t border-white/[0.08] pt-4">
                      <p className="font-body text-[9px] uppercase tracking-[0.15em] text-mauve">
                        {selectedDay?.label} · {availabilityQuery.data.timezone}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedDay?.slots.map((slot) => (
                          <Link
                            key={slot.startAt}
                            to={bookingHref(slot.startAt)}
                            className="rounded-full border border-white/12 px-3.5 py-2 font-sans text-[10px] text-ivory/75 transition-all hover:border-rose/35 hover:bg-rose/10 hover:text-rose"
                          >
                            {slot.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <p className="mt-4 font-body text-[8.5px] leading-relaxed text-mauve/50">
                      Demo slots generated from the clinician’s weekly schedule. All times are shown
                      in your device timezone; the booking server checks again for conflicts.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="eyebrow mb-4">Consultation pricing</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/[0.08] p-5">
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-mauve">
                      First consultation
                    </p>
                    <p className="mt-2 font-display text-3xl text-ivory">{formatCurrency(doctor.feePaise)}</p>
                    <p className="mt-2 font-body text-[10px] leading-relaxed text-mauve">
                      Plus applicable taxes at checkout. Includes the consultation outlined in the
                      booking flow; no treatment guarantee.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] p-5">
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-mauve">
                      Follow-up
                    </p>
                    <p className="mt-2 font-display text-3xl text-ivory">
                      {doctor.followUpFeePaise
                        ? formatCurrency(doctor.followUpFeePaise)
                        : 'Discussed with clinician'}
                    </p>
                    <p className="mt-2 font-body text-[10px] leading-relaxed text-mauve">
                      Only when clinically appropriate. Follow-up is not automatic or unlimited.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="eyebrow mb-4">Clinic information</p>
                {doctor.clinic ? (
                  <div className="rounded-2xl border border-white/[0.08] p-5">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose" />
                      <div>
                        <p className="font-sans text-[12px] font-semibold text-ivory">
                          {doctor.clinic.name}
                        </p>
                        <p className="mt-1 font-body text-[10.5px] text-mauve">{doctor.clinic.city}</p>
                        <p className="mt-2 font-body text-[10px] leading-relaxed text-mauve/70">
                          {doctor.clinic.addressNote}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="font-body text-[11.5px] text-mauve">
                    This demo clinician offers online consultations only. No physical clinic is
                    represented.
                  </p>
                )}
              </div>

              <div id="reviews">
                <p className="eyebrow mb-4">Patient reviews</p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-3xl text-ivory">Verified reviews only</h2>
                  {doctor.reviewCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 font-sans text-xs text-rose">
                      <Star className="h-4 w-4 fill-rose" /> {doctor.rating} · {doctor.reviewCount} reviews
                    </span>
                  )}
                </div>
                <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                  {doctor.reviews.length === 0 ? (
                    <div className="flex items-start gap-3">
                      <Star className="mt-0.5 h-4 w-4 shrink-0 text-mauve/50" />
                      <div>
                        <p className="font-sans text-[12px] font-semibold text-ivory">
                          No verified reviews yet
                        </p>
                        <p className="mt-1 font-body text-[10.5px] leading-relaxed text-mauve">
                          Reviews would be collected only after a completed consultation, moderated
                          for safety and displayed with a verified-patient label. This demo does not
                          fabricate testimonials or ratings.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {doctor.reviews.map((review) => (
                        <div key={review.id} className="border-b border-white/[0.07] pb-4 last:border-b-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <span className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <Star
                                  key={index}
                                  className={cn(
                                    'h-3 w-3',
                                    index < review.rating ? 'fill-rose text-rose' : 'text-white/15',
                                  )}
                                />
                              ))}
                            </span>
                            <span className="font-body text-[9px] text-mauve">{review.reviewerLabel}</span>
                          </div>
                          <p className="mt-2 font-body text-[11px] leading-relaxed text-ivory/60">{review.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div id="faq">
                <p className="eyebrow mb-4">Frequently asked</p>
                <h2 className="font-display text-3xl text-ivory">Before you book</h2>
                <Accordion items={doctor.faqs} className="mt-4" />
              </div>

              <div>
                <p className="eyebrow mb-4">Related specialists</p>
                <h2 className="font-display text-3xl text-ivory">You may also consider</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {related.map((item) => (
                    <DoctorCard key={item.id} doctor={item} />
                  ))}
                </div>
              </div>

              <DemoNotice />
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-3">
                <div className="rounded-[26px] border border-lavender/15 bg-gradient-to-br from-burgundy/35 via-plum to-royal/20 p-6">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="lavender" dot>
                      Booking open
                    </Badge>
                    <span className="font-body text-[9px] text-mauve">Demo availability</span>
                  </div>
                  <h2 className="mt-5 font-display text-[28px] leading-tight text-ivory">
                    Begin with {doctor.name.split(' ').slice(0, 2).join(' ')}.
                  </h2>
                  <div className="mt-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-[10.5px] text-mauve">Consultation</span>
                      <span className="font-sans text-[12px] font-semibold text-ivory">
                        {formatCurrency(doctor.feePaise)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-[10.5px] text-mauve">Next available</span>
                      <span className="font-sans text-[10.5px] text-lavender">
                        {doctor.nextAvailable ? formatDate(doctor.nextAvailable) : 'See calendar'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-[10.5px] text-mauve">Languages</span>
                      <span className="max-w-[160px] text-right font-sans text-[10px] text-ivory/70">
                        {doctor.languages.join(', ')}
                      </span>
                    </div>
                  </div>
                  <ButtonLink to={bookingHref()} className="mt-5 w-full" arrow>
                    Book a consultation
                  </ButtonLink>
                  <ButtonLink to="/ai" variant="ghost" size="sm" className="mt-1.5 w-full">
                    Ask Naya a question
                  </ButtonLink>
                  <p className="mt-4 border-t border-white/10 pt-4 font-body text-[8.5px] leading-relaxed text-mauve/60">
                    No charge is made until payment is completed. Demo payment is simulated. The
                    production cancellation policy requires legal review.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.07] p-5">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-3.5 w-3.5 text-lavender" />
                    <p className="font-sans text-[10px] font-semibold text-ivory">Need a different fit?</p>
                  </div>
                  <p className="mt-2 font-body text-[9.5px] leading-relaxed text-mauve">
                    You can filter by language, gender, specialisation and consultation type.
                  </p>
                  <Link
                    to="/doctors"
                    className="mt-3 inline-flex items-center gap-1.5 font-sans text-[9.5px] font-semibold text-lavender hover:text-rose"
                  >
                    Browse all specialists <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
