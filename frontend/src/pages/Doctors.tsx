import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronDown,
  Filter,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { DoctorCard, DoctorSkeleton } from '@/components/cards/DoctorCard';
import { Button, ButtonLink } from '@/components/ui/Button';
import { DemoNotice } from '@/components/ui/DemoNotice';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { getDemoStockPortrait } from '@/data/doctors';
import { useDoctorFilters, useDoctors } from '@/hooks/useDoctors';
import type { DoctorFilters } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';

type FilterKey = keyof Pick<
  DoctorFilters,
  | 'gender'
  | 'specialization'
  | 'mode'
  | 'language'
  | 'city'
  | 'minExperience'
  | 'maxFee'
  | 'availability'
  | 'search'
  | 'sort'
>;

const experienceOptions = [
  { label: 'Any experience', value: undefined },
  { label: '5+ years', value: 5 },
  { label: '10+ years', value: 10 },
  { label: '15+ years', value: 15 },
];

function FilterPanel({
  filters,
  onChange,
  onClear,
  meta,
  mobile,
  onClose,
}: {
  filters: DoctorFilters;
  onChange: (key: FilterKey, value: string | number | undefined) => void;
  onClear: () => void;
  meta:
    | {
        specializations: { slug: string; name: string }[];
        languages: string[];
        cities: string[];
        feeRangePaise: { min: number; max: number };
      }
    | undefined;
  mobile?: boolean;
  onClose?: () => void;
}) {
  const activeCount = [
    filters.gender,
    filters.specialization,
    filters.mode,
    filters.language,
    filters.city,
    filters.minExperience,
    filters.maxFee,
    filters.availability,
  ].filter(Boolean).length;

  return (
    <div className={cn(mobile && 'flex h-full flex-col')}>
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-lavender" />
          <p className="font-sans text-[12px] font-semibold text-ivory">Refine your search</p>
          {activeCount > 0 && (
            <span className="rounded-full bg-rose/15 px-1.5 py-0.5 font-sans text-[8px] font-semibold text-rose">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 font-sans text-[9px] font-semibold uppercase tracking-wider text-mauve transition-colors hover:text-ivory"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-mauve"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className={cn('space-y-7 pt-5', mobile && 'flex-1 overflow-y-auto pb-4')}>
        <FilterBlock label="Consultation type">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              ['Any', undefined],
              ['Video', 'ONLINE'],
              ['In person', 'IN_PERSON'],
            ].map(([label, value]) => (
              <button
                key={label}
                type="button"
                onClick={() => onChange('mode', value as string | undefined)}
                className={cn(
                  'rounded-xl border px-2 py-2.5 font-sans text-[9.5px] font-medium transition-all',
                  filters.mode === value
                    ? 'border-lavender/35 bg-lavender/[0.09] text-ivory'
                    : 'border-white/[0.08] text-mauve hover:border-white/20 hover:text-ivory',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </FilterBlock>

        <FilterBlock label="Clinician gender">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              ['Any', undefined],
              ['Female', 'FEMALE'],
              ['Male', 'MALE'],
            ].map(([label, value]) => (
              <button
                key={label}
                type="button"
                onClick={() => onChange('gender', value as string | undefined)}
                className={cn(
                  'rounded-xl border px-2 py-2.5 font-sans text-[9.5px] font-medium transition-all',
                  filters.gender === value
                    ? 'border-lavender/35 bg-lavender/[0.09] text-ivory'
                    : 'border-white/[0.08] text-mauve hover:border-white/20 hover:text-ivory',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </FilterBlock>

        <FilterBlock label="Specialisation">
          <div className="relative">
            <select
              value={filters.specialization || ''}
              onChange={(e) => onChange('specialization', e.target.value || undefined)}
              className="input-premium appearance-none py-3 pr-9 text-xs"
            >
              <option value="">All specialisations</option>
              {meta?.specializations.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mauve" />
          </div>
        </FilterBlock>

        <div className="grid grid-cols-2 gap-3">
          <FilterBlock label="Language">
            <div className="relative">
              <select
                value={filters.language || ''}
                onChange={(e) => onChange('language', e.target.value || undefined)}
                className="input-premium appearance-none py-3 pr-8 text-xs"
              >
                <option value="">Any</option>
                {meta?.languages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-mauve" />
            </div>
          </FilterBlock>
          <FilterBlock label="City">
            <div className="relative">
              <select
                value={filters.city || ''}
                onChange={(e) => onChange('city', e.target.value || undefined)}
                className="input-premium appearance-none py-3 pr-8 text-xs"
              >
                <option value="">Any</option>
                {meta?.cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-mauve" />
            </div>
          </FilterBlock>
        </div>

        <FilterBlock label="Experience">
          <div className="space-y-1.5">
            {experienceOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => onChange('minExperience', option.value)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left font-body text-[10.5px] transition-colors',
                  filters.minExperience === option.value
                    ? 'bg-white/[0.06] text-ivory'
                    : 'text-mauve hover:bg-white/[0.03] hover:text-ivory',
                )}
              >
                {option.label}
                <span
                  className={cn(
                    'h-2 w-2 rounded-full border',
                    filters.minExperience === option.value
                      ? 'border-rose bg-rose'
                      : 'border-white/20',
                  )}
                />
              </button>
            ))}
          </div>
        </FilterBlock>

        <FilterBlock label="Consultation fee">
          <div className="flex items-center justify-between">
            <span className="font-body text-[10px] text-mauve">Up to</span>
            <span className="font-sans text-[11px] font-semibold text-ivory">
              {formatCurrency((filters.maxFee || 4000) * 100)}
            </span>
          </div>
          <input
            type="range"
            min={1500}
            max={4000}
            step={250}
            value={filters.maxFee || 4000}
            onChange={(e) => onChange('maxFee', Number(e.target.value))}
            className="mt-3 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#C9A7F5]"
            aria-label="Maximum consultation fee"
          />
          <div className="mt-2 flex justify-between font-body text-[8px] text-mauve/50">
            <span>₹1,500</span>
            <span>₹4,000</span>
          </div>
        </FilterBlock>

        <FilterBlock label="Availability">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              ['Any', 'ANY'],
              ['Today', 'TODAY'],
              ['This week', 'THIS_WEEK'],
            ].map(([label, value]) => (
              <button
                key={label}
                type="button"
                onClick={() => onChange('availability', value === 'ANY' ? undefined : value)}
                className={cn(
                  'rounded-xl border px-1.5 py-2.5 font-sans text-[9px] font-medium transition-all',
                  (filters.availability || 'ANY') === value
                    ? 'border-lavender/35 bg-lavender/[0.09] text-ivory'
                    : 'border-white/[0.08] text-mauve hover:border-white/20 hover:text-ivory',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </FilterBlock>
      </div>

      {mobile && (
        <div className="border-t border-white/[0.08] pt-4">
          <Button onClick={onClose} className="w-full">
            Show specialists
          </Button>
        </div>
      )}
    </div>
  );
}

function FilterBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 font-sans text-[9px] font-semibold uppercase tracking-[0.15em] text-mauve">
        {label}
      </p>
      {children}
    </div>
  );
}

export default function Doctors() {
  const [params] = useSearchParams();
  const [filters, setFilters] = useState<DoctorFilters>(() => ({
    gender: params.get('gender') || undefined,
    specialization: params.get('specialization') || undefined,
    mode: params.get('mode') || undefined,
    language: params.get('language') || undefined,
    city: params.get('city') || undefined,
    availability: params.get('availability') || undefined,
    sort: params.get('sort') || 'recommended',
  }));
  const [searchInput, setSearchInput] = useState(params.get('search') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useDoctors(filters);
  const { data: meta } = useDoctorFilters();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((prev) => (prev.search === searchInput ? prev : { ...prev, search: searchInput }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (filtersOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [filtersOpen]);

  const activeChips = useMemo(() => {
    const chips: { label: string; key: FilterKey; value?: string | number }[] = [];
    if (filters.gender)
      chips.push({
        label: filters.gender === 'FEMALE' ? 'Female clinicians' : 'Male clinicians',
        key: 'gender',
      });
    if (filters.mode)
      chips.push({
        label: filters.mode === 'ONLINE' ? 'Video consultation' : 'In person',
        key: 'mode',
      });
    if (filters.language) chips.push({ label: filters.language, key: 'language' });
    if (filters.city) chips.push({ label: filters.city, key: 'city' });
    if (filters.minExperience)
      chips.push({ label: `${filters.minExperience}+ years`, key: 'minExperience' });
    if (filters.maxFee) chips.push({ label: `Up to ₹${filters.maxFee.toLocaleString('en-IN')}`, key: 'maxFee' });
    if (filters.specialization) {
      const label = meta?.specializations.find((item) => item.slug === filters.specialization)?.name;
      chips.push({ label: label || filters.specialization, key: 'specialization' });
    }
    if (filters.availability)
      chips.push({
        label: filters.availability === 'TODAY' ? 'Available today' : 'Available this week',
        key: 'availability',
      });
    return chips;
  }, [filters, meta]);

  function onChange(key: FilterKey, value: string | number | undefined) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters({ sort: filters.sort });
    setSearchInput('');
  }

  const offline = data?.offline;
  const doctors = data?.doctors || [];

  return (
    <>
      <Seo
        title="Find a Sexual Wellness or Relationship Specialist"
        description="Filter demo specialists by gender, specialisation, language, city, experience, consultation fee and availability. All profiles are fictional development data."
        path="/doctors"
      />
      <PageHero
        eyebrow="Find a specialist"
        title="The right conversation,"
        accent="with the right person."
        description="Filter by what matters to you — expertise, language, gender, format, city or fee. Read how a clinician works before you decide. All profiles in this demo are fictional."
        backgroundImage={{ src: '/images/art/doctor-directory-telehealth.png', width: 1846, height: 852 }}
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/ai" variant="secondary" icon={<Sparkles className="h-4 w-4" />}>
            Ask Naya who to see
          </ButtonLink>
          <ButtonLink to="/how-it-works" variant="ghost" arrow>
            How consultations work
          </ButtonLink>
        </div>
      </PageHero>

      <section className="relative border-t border-white/[0.06] bg-midnight pb-20 pt-8">
        <div className="container-naya">
          <div className="mb-6 flex flex-col gap-4 rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <label htmlFor="doctor-search" className="sr-only">
                Search by clinician name or specialisation
              </label>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mauve" />
              <input
                id="doctor-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, specialisation or city…"
                className="input-premium min-h-12 rounded-full py-3 pl-11 text-[13px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 px-4 font-sans text-[11px] font-semibold text-ivory lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 text-lavender" /> Filters
                {activeChips.length > 0 && (
                  <span className="rounded-full bg-rose/15 px-1.5 py-0.5 text-[8px] text-rose">
                    {activeChips.length}
                  </span>
                )}
              </button>
              <div className="relative">
                <label htmlFor="doctor-sort" className="sr-only">
                  Sort specialists
                </label>
                <select
                  id="doctor-sort"
                  value={filters.sort || 'recommended'}
                  onChange={(e) => onChange('sort', e.target.value)}
                  className="input-premium min-h-11 appearance-none rounded-full py-2.5 pl-4 pr-9 text-[11px] sm:min-w-[170px]"
                >
                  <option value="recommended">Recommended</option>
                  <option value="earliest">Earliest available</option>
                  <option value="experience">Most experience</option>
                  <option value="fee_low">Fee: low to high</option>
                  <option value="fee_high">Fee: high to low</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mauve" />
              </div>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-body text-[10.5px] text-mauve">
                {isLoading ? 'Finding specialists…' : `${data?.total ?? 0} demo specialists`}
              </span>
              {activeChips.map((chip) => (
                <button
                  key={`${chip.key}-${chip.label}`}
                  type="button"
                  onClick={() => onChange(chip.key, undefined)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-lavender/20 bg-lavender/[0.06] px-2.5 py-1 font-body text-[9px] text-lavender transition-colors hover:border-rose/30 hover:text-rose"
                >
                  {chip.label}
                  <X className="h-2.5 w-2.5" />
                </button>
              ))}
            </div>
            {activeChips.length > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="font-sans text-[9px] font-semibold uppercase tracking-wider text-mauve hover:text-ivory"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-10">
            <aside className="hidden lg:block">
              <div className="sticky top-28 rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
                <FilterPanel
                  filters={filters}
                  onChange={onChange}
                  onClear={clearFilters}
                  meta={meta}
                />
                <div className="mt-6 rounded-xl border border-white/[0.07] bg-midnight/40 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lavender" />
                    <p className="font-body text-[9px] leading-relaxed text-mauve">
                      This is a demo directory. No clinician is real and no credential has been
                      independently verified.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <div>
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <DoctorSkeleton key={index} />
                  ))}
                </div>
              ) : isError ? (
                <ErrorState
                  title="We could not load the directory"
                  description="Please check your connection and try again. Your filters have been kept."
                  onRetry={() => void refetch()}
                />
              ) : doctors.length === 0 ? (
                <EmptyState
                  icon={<Search className="h-6 w-6" />}
                  title="No specialists match those filters"
                  description="Try removing a filter or broadening your fee or experience range. You can also ask Naya AI to suggest a different kind of professional."
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button variant="secondary" onClick={clearFilters}>
                        Clear filters
                      </Button>
                      <ButtonLink to="/ai" size="sm" icon={<Sparkles className="h-4 w-4" />}>
                        Ask Naya
                      </ButtonLink>
                    </div>
                  }
                />
              ) : (
                <>
                  {offline && (
                    <div className="mb-4 rounded-xl border border-lavender/15 bg-lavender/[0.04] px-4 py-2.5">
                      <p className="font-body text-[10px] text-mauve">
                        API unavailable — showing bundled demo directory data. Start the backend for
                        live availability and filtering.
                      </p>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  >
                    {doctors.map((doctor) => (
                      <DoctorCard key={doctor.id} doctor={doctor} stockPortrait={getDemoStockPortrait(doctor)} />
                    ))}
                  </motion.div>
                </>
              )}

              <div className="mt-7">
                <DemoNotice>
                  Clinician names, qualifications, registration details, fees, availability and
                  reviews are fictional demo data. Photos show stock models.
                </DemoNotice>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.07] p-5">
                  <Video className="h-4 w-4 text-lavender" />
                  <h3 className="mt-4 font-display text-xl text-ivory">Video or in person</h3>
                  <p className="mt-2 font-body text-[10.5px] leading-relaxed text-mauve">
                    Both options are labelled on every profile. Some concerns need a physical
                    assessment; a clinician will tell you if that applies.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.07] p-5">
                  <MapPin className="h-4 w-4 text-rose" />
                  <h3 className="mt-4 font-display text-xl text-ivory">Clinic details after booking</h3>
                  <p className="mt-2 font-body text-[10.5px] leading-relaxed text-mauve">
                    This demo does not publish real clinic addresses or phone numbers. Production
                    details would be shared only after a confirmed appointment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] bg-midnight/75 backdrop-blur-md lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Filter specialists"
          >
            <button
              type="button"
              className="absolute inset-0 h-full w-full cursor-default"
              onClick={() => setFiltersOpen(false)}
              aria-label="Close filters"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="glass-strong absolute inset-x-0 bottom-0 max-h-[88vh] overflow-hidden rounded-t-[28px] p-5 pb-safe"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
              <FilterPanel
                filters={filters}
                onChange={onChange}
                onClear={clearFilters}
                meta={meta}
                mobile
                onClose={() => setFiltersOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative overflow-hidden border-t border-white/[0.06] bg-plum py-16">
        <div className="container-naya flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <Badge tone="rose">Unsure?</Badge>
            <div>
              <p className="font-display text-2xl text-ivory">You can ask before you book.</p>
              <p className="mt-1 max-w-lg font-body text-[11px] leading-relaxed text-mauve">
                Naya AI can explain the difference between specialisations or help you prepare a
                first question. It cannot diagnose or recommend a specific treatment.
              </p>
            </div>
          </div>
          <ButtonLink to="/ai" variant="secondary" arrow>
            Ask Naya
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
