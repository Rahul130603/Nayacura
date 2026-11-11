import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  CreditCard,
  Info,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { Plan } from '@/types';
import { Seo } from '@/components/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Accordion } from '@/components/ui/Accordion';
import { DemoNotice } from '@/components/ui/DemoNotice';
import { cn, formatCurrency } from '@/lib/utils';

const fallbackPlans: Plan[] = [
  {
    code: 'first-consultation',
    name: 'First consultation',
    description:
      'A paced first conversation with a specialist, available by secure video or in person. You do not need a diagnosis.',
    pricePaise: 240000,
    taxPercent: 18,
    duration: '45–60 minutes',
    mode: 'EITHER',
    popular: true,
    includes: [
      'Private first consultation',
      'Clinician-led history and goals',
      'Discussion of appropriate next steps',
      'Secure dashboard record',
      'No guarantee of diagnosis or outcome',
    ],
  },
  {
    code: 'couples-counselling',
    name: 'Couples counselling',
    description:
      'A joint session for two people who want to understand a repeating pattern, communicate needs or prepare for a transition.',
    pricePaise: 360000,
    taxPercent: 18,
    duration: '60–75 minutes',
    mode: 'EITHER',
    includes: [
      'Joint video or in-person session',
      'Consent and safety screening',
      'Communication and pattern exploration',
      'One agreed focus for the session',
      'Individual support may be recommended',
    ],
  },
  {
    code: 'follow-up',
    name: 'Follow-up consultation',
    description:
      'A shorter session for an existing patient, where the clinician has recommended follow-up. Not unlimited.',
    pricePaise: 160000,
    taxPercent: 18,
    duration: '25–30 minutes',
    mode: 'EITHER',
    includes: [
      'Review of agreed goals',
      'Discussion of progress and barriers',
      'Updated recommended next steps',
      'Available only where clinically appropriate',
    ],
  },
  {
    code: 'online-consultation',
    name: 'Online consultation',
    description:
      'A secure video appointment from a private space. Suitable for many conversation-led concerns and follow-ups.',
    pricePaise: 220000,
    taxPercent: 18,
    duration: '45 minutes',
    mode: 'ONLINE',
    includes: [
      'Short-lived secure room access',
      'Consent before joining',
      'Device and microphone controls',
      'No recording by default',
      'In-person referral may be recommended',
    ],
  },
  {
    code: 'in-person-consultation',
    name: 'In-person consultation',
    description:
      'A clinic appointment in a listed city when a fuller clinical space or physical assessment may help.',
    pricePaise: 280000,
    taxPercent: 18,
    duration: '45–60 minutes',
    mode: 'IN_PERSON',
    includes: [
      'Clinician appointment in a listed city',
      'Examination only where appropriate and consented',
      'Coordination with tests or referrals',
      'Exact address shared after confirmation in production',
    ],
  },
];

const faqs = [
  {
    question: 'Are these prices real?',
    answer:
      'No. All prices are illustrative development data. In production, fees would be set by the operating entity and individual clinicians, displayed before payment, and reviewed for tax and consumer-law compliance.',
  },
  {
    question: 'Are taxes included?',
    answer:
      'The demo shows a configured 18% tax line at checkout. This is not a tax opinion. The appropriate GST treatment of healthcare and counselling services in India must be confirmed by a qualified tax adviser before launch.',
  },
  {
    question: 'Will I be charged if I cancel?',
    answer:
      'The draft policy allows a full refund for patient cancellations made at least 24 hours before the appointment, subject to the clinician’s disclosed window. Later cancellations may attract a fee. This demo records refunds as pending rather than processing real money.',
  },
  {
    question: 'Is a follow-up automatically included?',
    answer:
      'No. Follow-up is a separate, clinician-recommended service. Nayacura does not sell unlimited access to a clinician or imply that ongoing care is guaranteed by a package.',
  },
  {
    question: 'Can I get a refund for a clinician cancellation?',
    answer:
      'If a clinician cancels and no suitable alternative is offered, the consultation fee should be refunded in full. The production process and payment-provider timelines must be clearly disclosed.',
  },
];

export default function Pricing() {
  const [mode, setMode] = useState<'ALL' | 'ONLINE' | 'IN_PERSON'>('ALL');
  const { data, isError } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      try {
        return await api<{ plans: Plan[]; taxNote: string }>('/plans');
      } catch {
        return {
          plans: fallbackPlans,
          taxNote: 'Demo tax configuration only. Confirm applicable taxes with a qualified adviser.',
        };
      }
    },
    staleTime: 5 * 60_000,
  });
  const plans = data?.plans?.length ? data.plans : fallbackPlans;
  const visible = useMemo(
    () =>
      mode === 'ALL'
        ? plans
        : plans.filter((plan) => plan.mode === mode || plan.mode === 'EITHER'),
    [plans, mode],
  );
  const popular = plans.find((plan) => plan.popular) || plans[0];

  return (
    <>
      <Seo
        title="Consultation Fees & Pricing"
        description="Transparent illustrative consultation fees for individual, couples, follow-up, online and in-person care. Taxes, cancellation terms and refund eligibility explained."
        path="/pricing"
      />
      <PageHero
        eyebrow="Pricing & consultation plans"
        title="Clear fees."
        accent="No hidden access."
        description="You should know what a consultation costs, what it includes and what it does not promise before you pay. These are illustrative development prices, not a live clinical offering."
        art="veil"
      >
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          {[
            ['ALL', 'All formats'],
            ['ONLINE', 'Online'],
            ['IN_PERSON', 'In person'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value as typeof mode)}
              className={cn(
                'rounded-full px-4 py-2 font-sans text-[10px] font-semibold transition-all',
                mode === value ? 'bg-lavender/15 text-ivory' : 'text-mauve hover:text-ivory',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </PageHero>

      <section className="relative border-t border-white/[0.06] bg-midnight py-16 sm:py-24">
        <div className="container-naya">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative overflow-hidden rounded-[30px] border border-lavender/20 bg-gradient-to-br from-burgundy/40 via-plum to-royal/30 p-7 sm:p-10">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/10" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(232,160,183,0.2),transparent_55%)]" />
              <div className="relative z-10">
                <Badge tone="rose">Most chosen</Badge>
                <h2 className="display mt-5 text-[clamp(2.2rem,4vw,3.6rem)]">{popular.name}</h2>
                <p className="mt-3 max-w-lg font-body text-[12px] leading-[1.85] text-ivory/60">
                  {popular.description}
                </p>
                <div className="mt-7 flex items-end gap-3">
                  <span className="font-display text-5xl text-ivory">
                    {formatCurrency(popular.pricePaise)}
                  </span>
                  <span className="mb-2 font-body text-[10px] text-mauve">+ taxes</span>
                </div>
                <div className="mt-5 flex flex-wrap gap-4">
                  <span className="inline-flex items-center gap-2 font-body text-[10px] text-ivory/60">
                    <Clock3 className="h-3.5 w-3.5 text-lavender" /> {popular.duration}
                  </span>
                  <span className="inline-flex items-center gap-2 font-body text-[10px] text-ivory/60">
                    <Video className="h-3.5 w-3.5 text-lavender" /> Video or in person
                  </span>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink to="/doctors" arrow>
                    Choose a specialist
                  </ButtonLink>
                  <ButtonLink to="/how-it-works" variant="ghost">
                    What happens next?
                  </ButtonLink>
                </div>
              </div>
            </div>
            <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.025] p-7 sm:p-9">
              <p className="eyebrow mb-5">What this fee includes</p>
              <ul className="space-y-3">
                {popular.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" />
                    <span className="font-body text-[11.5px] leading-relaxed text-ivory/65">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-white/[0.08] pt-5">
                <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.16em] text-mauve">
                  Not included
                </p>
                <p className="mt-2 font-body text-[10.5px] leading-relaxed text-mauve">
                  Tests, procedures, medications, specialist referral fees and ongoing therapy are
                  separate and, where applicable, arranged with the relevant provider. No unlimited
                  access to a clinician is sold.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visible
              .filter((plan) => !plan.popular)
              .map((plan, index) => (
                <Reveal key={plan.code} delay={index * 0.05}>
                  <div className="card-surface flex h-full flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-2xl leading-tight text-ivory">{plan.name}</h3>
                        <p className="mt-1 font-body text-[9px] uppercase tracking-[0.14em] text-mauve/60">
                          {plan.duration} · {plan.mode === 'ONLINE' ? 'Online' : plan.mode === 'IN_PERSON' ? 'In person' : 'Either format'}
                        </p>
                      </div>
                      {plan.code === 'online-consultation' && <Video className="h-4 w-4 text-lavender" />}
                      {plan.code === 'in-person-consultation' && (
                        <MapPin className="h-4 w-4 text-rose" aria-hidden />
                      )}
                    </div>
                    <div className="mt-5 flex items-end gap-2">
                      <span className="font-display text-3xl text-ivory">{formatCurrency(plan.pricePaise)}</span>
                      <span className="mb-1 font-body text-[8.5px] text-mauve">+ taxes</span>
                    </div>
                    <p className="mt-3 font-body text-[10.5px] leading-[1.75] text-mauve">
                      {plan.description}
                    </p>
                    <ul className="mt-4 flex-1 space-y-2 border-t border-white/[0.07] pt-4">
                      {plan.includes.slice(0, 4).map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-lavender/70" />
                          <span className="font-body text-[9.5px] leading-relaxed text-ivory/55">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <ButtonLink to="/doctors" variant="secondary" size="sm" className="mt-5 w-full" arrow>
                      Book this format
                    </ButtonLink>
                  </div>
                </Reveal>
              ))}
          </div>

          <div className="mt-10">
            <DemoNotice>
              Prices are illustrative development data and are not charged in demo mode. Applicable
              taxes, cancellation terms, refund eligibility and clinician fees must be reviewed and
              disclosed accurately before any live service.
            </DemoNotice>
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/[0.06] bg-plum py-20 sm:py-28">
        <div className="container-naya">
          <SectionHeading
            eyebrow="Transparent terms"
            title={
              <>
                Know what happens <span className="display-soft">after payment.</span>
              </>
            }
            description="A price is only meaningful alongside cancellation, refund and access terms. These are the rules this demo models; the final legal wording requires review."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: RefreshCw,
                title: 'Cancellation',
                copy: 'A patient cancelling at least 24 hours before the appointment can request a full refund, subject to the clinician’s disclosed window. Later cancellations may attract a fee.',
              },
              {
                icon: CreditCard,
                title: 'Refunds',
                copy: 'Approved refunds return to the original payment method. This demo records refunds as pending and does not call a live Razorpay refund API.',
              },
              {
                icon: ShieldCheck,
                title: 'No care guarantee',
                copy: 'Paying for a consultation buys professional time and assessment. It does not guarantee a diagnosis, prescription, treatment, cure or ongoing access.',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 0.06}>
                  <div className="h-full rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-6">
                    <Icon className="h-5 w-5 text-lavender" />
                    <h3 className="mt-6 font-display text-2xl text-ivory">{item.title}</h3>
                    <p className="mt-2 font-body text-[10.5px] leading-[1.8] text-mauve">{item.copy}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink to="/legal/cancellation-refund" variant="secondary" size="sm" arrow>
              Full cancellation & refund draft
            </ButtonLink>
            <ButtonLink to="/legal/terms" variant="ghost" size="sm">
              Terms of Service
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="relative bg-midnight py-20 sm:py-28">
        <div className="container-editorial">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div>
              <p className="eyebrow mb-4">Pricing questions</p>
              <h2 className="display text-[clamp(2.3rem,4.3vw,3.8rem)]">
                What you should <span className="display-soft">ask.</span>
              </h2>
              <p className="mt-4 max-w-xs font-body text-[11.5px] leading-relaxed text-mauve">
                If a price or promise feels unclear, ask before paying. Clarity is part of ethical
                care.
              </p>
              {isError && (
                <p className="mt-4 font-body text-[9px] text-rose/80">
                  Live pricing API unavailable; showing bundled demo plans.
                </p>
              )}
            </div>
            <Accordion items={faqs} />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/[0.06] bg-ivory py-16 text-plum">
        <div className="container-naya flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-2xl text-plum">Start with the right conversation.</p>
            <p className="mt-1 font-body text-[11px] text-plum/60">
              Compare demo specialists by fee, language and format — before you decide.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink to="/doctors" arrow>
              Find a specialist
            </ButtonLink>
            <ButtonLink to="/contact" variant="secondary" className="border-plum/20 bg-plum text-ivory hover:bg-burgundy">
              Ask about fees
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
