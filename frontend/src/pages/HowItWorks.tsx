import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  Check,
  CreditCard,
  FileText,
  HeartHandshake,
  LockKeyhole,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  Video,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Accordion } from '@/components/ui/Accordion';
import { ServiceIcon } from '@/components/ServiceIcon';

const journey = [
  {
    title: 'Explore services',
    icon: Search,
    phase: 'Before',
    summary: 'Understand what kind of care exists before you decide to book.',
    detail:
      'Read service pages or the wellness journal without creating an account. Naya AI can explain general topics and help you identify a specialist category. You do not need to know your diagnosis.',
    need: 'Curiosity, or a concern you have been carrying.',
    control: 'Nothing is shared with a clinician until you book.',
  },
  {
    title: 'Choose a specialist',
    icon: UserCheck,
    phase: 'Before',
    summary: 'Filter by expertise, language, gender, city, fee and format.',
    detail:
      'Read how a clinician works and what they explicitly do not offer. Every demo profile is labelled. In production, profiles would require primary-source credential verification before listing.',
    need: 'A sense of what matters to you — including who you feel able to talk to.',
    control: 'You can shortlist, compare and leave without booking.',
  },
  {
    title: 'Select a consultation method',
    icon: Video,
    phase: 'Before',
    summary: 'Video or in person, where the clinician offers it.',
    detail:
      'Video suits many conversation-led concerns and follow-ups. In-person care may be needed for examination, pain, procedures or tests. The clinician can still recommend a different format after assessing your concern.',
    need: 'A private, stable space for video; time and travel for in-person.',
    control: 'You can change the format before confirming.',
  },
  {
    title: 'Book a suitable appointment',
    icon: CalendarCheck2,
    phase: 'Book',
    summary: 'Choose from real available slots, checked for conflicts.',
    detail:
      'Slots are generated from the clinician’s schedule in their timezone and displayed in yours. The server rechecks the slot when you continue so two people cannot confirm the same time.',
    need: 'Your name, email, phone and an optional short reason.',
    control: 'The slot is held for 15 minutes while you complete payment.',
  },
  {
    title: 'Complete secure payment',
    icon: CreditCard,
    phase: 'Book',
    summary: 'See the fee, tax and cancellation terms before you pay.',
    detail:
      'Razorpay is used when configured; otherwise a clearly labelled demo payment is shown. Nayacura does not store card details. A confirmation email contains booking details, not clinical information.',
    need: 'A payment method for a live deployment; none for the demo.',
    control: 'No real charge is made while demo mode is active.',
  },
  {
    title: 'Attend the consultation',
    icon: Stethoscope,
    phase: 'During',
    summary: 'A private conversation with a qualified professional.',
    detail:
      'The clinician will listen, ask relevant questions and explain what can and cannot be assessed. You can pause, decline a question or stop. Video consultations are not recorded by default and require consent before joining.',
    need: 'A private room and, for video, a working camera and microphone.',
    control: 'You remain in control of disclosure, consent and continuation.',
  },
  {
    title: 'Access follow-up care',
    icon: FileText,
    phase: 'After',
    summary: 'Notes, recommendations and clinician-approved next steps.',
    detail:
      'If your clinician adds a note or a prescription record, it appears in your dashboard with access controls. Follow-up is clinician-specific, time-limited and not automatically included. Referrals may be recommended.',
    need: 'Nothing immediately. Care should not pressure you into repeat bookings.',
    control: 'You can download documents, manage privacy settings or request deletion.',
  },
];

const faqs = [
  {
    question: 'Do I need a diagnosis before booking?',
    answer:
      'No. You can book with a concern, a question or a general sense that something has changed. A clinician helps clarify the issue. In this demo, no real appointment takes place.',
  },
  {
    question: 'Can I stay anonymous?',
    answer:
      'You need an account so only you can access your records. You do not need to use a reason for consultation, and support messages should never include clinical details. In a real clinical service, identity verification is required for safe care and legal record-keeping.',
  },
  {
    question: 'What happens if I need to reschedule?',
    answer:
      'Confirmed appointments show reschedule or cancel options in your dashboard, subject to the disclosed cancellation window. The demo policy is a draft and requires legal review.',
  },
  {
    question: 'Is the video room recorded?',
    answer:
      'No. Recording is off by default and this demo does not support recording. Any future recording feature would require explicit informed consent and strict access controls.',
  },
];

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const step = journey[active];
  const Icon = step.icon;

  return (
    <>
      <Seo
        title="How Nayacura Consultations Work"
        description="A transparent seven-step journey from exploring services to follow-up care. Understand consent, payment, video limits and what remains in your control."
        path="/how-it-works"
      />
      <PageHero
        eyebrow="How it works"
        title="Seven steps. No"
        accent="performance required."
        description="A clear path from a private question to a confidential conversation. You can stop at any point, change your mind or choose a different specialist. Here is exactly what happens."
        backgroundImage={{ src: '/images/art/how-it-works-consultation.png', width: 1867, height: 842 }}
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/doctors" arrow>
            Find a specialist
          </ButtonLink>
          <ButtonLink to="/pricing" variant="secondary">
            See consultation fees
          </ButtonLink>
        </div>
      </PageHero>

      <section className="relative border-t border-white/[0.06] bg-midnight py-16 sm:py-24">
        <div className="container-naya">
          <div className="grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-16">
            <div>
              <p className="eyebrow mb-4">The journey</p>
              <h2 className="display text-3xl sm:text-4xl">Choose a stage to explore.</h2>
              <div className="mt-7 space-y-1">
                {journey.map((item, index) => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setActive(index)}
                      aria-pressed={active === index}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
                        active === index
                          ? 'border-lavender/30 bg-lavender/[0.07]'
                          : 'border-transparent hover:border-white/[0.08] hover:bg-white/[0.025]'
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border font-sans text-[9px] font-semibold ${
                          active === index
                            ? 'border-rose/35 bg-rose/10 text-rose'
                            : 'border-white/12 text-mauve'
                        }`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate font-sans text-[11.5px] font-semibold ${
                            active === index ? 'text-ivory' : 'text-ivory/60'
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="font-body text-[8.5px] text-mauve/60">{item.phase}</p>
                      </div>
                      <ItemIcon
                        className={`h-3.5 w-3.5 ${
                          active === index ? 'text-lavender' : 'text-mauve/40'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-gradient-to-br from-burgundy/20 via-plum to-royal/[0.12] p-6 sm:p-9 lg:p-12"
            >
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-lavender/10" />
              <div className="absolute -bottom-10 right-20 h-40 w-40 rounded-full bg-royal/20 blur-[80px]" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <Badge tone="lavender">{step.phase}</Badge>
                  <span className="font-display text-[64px] italic leading-none text-ivory/[0.08] sm:text-[100px]">
                    {String(active + 1).padStart(2, '0')}
                  </span>
                </div>
                <span className="mt-6 grid h-14 w-14 place-items-center rounded-2xl border border-rose/20 bg-rose/[0.08] text-rose">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="display mt-7 text-[clamp(2.2rem,4vw,3.5rem)]">{step.title}</h3>
                <p className="mt-4 max-w-2xl font-body text-[14px] leading-[1.9] text-ivory/65">
                  {step.detail}
                </p>
                <div className="mt-8 grid gap-4 border-t border-white/[0.1] pt-6 sm:grid-cols-2">
                  <div>
                    <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.16em] text-lavender">
                      What you need
                    </p>
                    <p className="mt-2 font-body text-[11.5px] leading-relaxed text-mauve">{step.need}</p>
                  </div>
                  <div>
                    <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.16em] text-rose">
                      What stays in your control
                    </p>
                    <p className="mt-2 font-body text-[11.5px] leading-relaxed text-mauve">
                      {step.control}
                    </p>
                  </div>
                </div>
                <div className="mt-7 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActive((value) => Math.max(0, value - 1))}
                    disabled={active === 0}
                    className="inline-flex items-center gap-2 font-sans text-[10px] text-mauve disabled:opacity-30"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setActive((value) => Math.min(journey.length - 1, value + 1))}
                    disabled={active === journey.length - 1}
                    className="inline-flex items-center gap-2 font-sans text-[10px] font-semibold text-lavender disabled:opacity-30"
                  >
                    Next stage <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/[0.06] bg-ivory py-20 text-plum sm:py-28">
        <div className="container-naya">
          <SectionHeading
            tone="light"
            eyebrow="Before, during, after"
            title={
              <>
                Care is a relationship, not a <span className="font-display italic text-burgundy">transaction.</span>
              </>
            }
            description="The platform handles logistics so the consultation can focus on you. But the clinician’s judgment, your consent and safety come before any workflow."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                phase: 'Before',
                icon: CalendarCheck2,
                title: 'Prepare lightly',
                copy: 'Note what you want to discuss, any medications, and whether you need a private space. You do not need to write a history or arrive with a diagnosis.',
              },
              {
                phase: 'During',
                icon: HeartHandshake,
                title: 'Stay in the conversation',
                copy: 'You can ask what is happening, decline a question, request a pause or end the consultation. A good clinician will make room for that.',
              },
              {
                phase: 'After',
                icon: FileText,
                title: 'Leave with clarity',
                copy: 'You should understand the next step, the limits of what was assessed and when to return. You can download your own records or ask for correction.',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.phase} delay={index * 0.07}>
                  <div className="h-full rounded-[24px] border border-plum/10 bg-white/45 p-6">
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-burgundy" />
                      <span className="font-sans text-[8px] font-semibold uppercase tracking-[0.16em] text-burgundy/60">
                        {item.phase}
                      </span>
                    </div>
                    <h3 className="mt-7 font-display text-2xl text-plum">{item.title}</h3>
                    <p className="mt-2 font-body text-[11.5px] leading-[1.8] text-plum/60">{item.copy}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative bg-midnight py-20 sm:py-28">
        <div className="container-naya">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
            <div>
              <p className="eyebrow mb-5">What this demo does not do</p>
              <h2 className="display text-[clamp(2.4rem,4.6vw,4.2rem)]">
                The boundaries are part of the <span className="display-soft">promise.</span>
              </h2>
              <p className="mt-5 font-body text-[13px] leading-[1.9] text-mauve">
                A cinematic interface can make a system feel finished. It is more useful to say
                clearly what is not yet real.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                'No real clinicians are connected',
                'No real payment is collected in demo mode',
                'No diagnosis or prescription by AI',
                'No regulatory certification is claimed',
                'No recording by default',
                'No guarantee of a clinical outcome',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5 rounded-xl border border-white/[0.08] px-3.5 py-3.5">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" />
                  <span className="font-body text-[10.5px] leading-relaxed text-ivory/60">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/[0.06] bg-plum pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="container-naya">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="eyebrow mb-4">Common questions</p>
              <h2 className="display text-[clamp(2.3rem,4.3vw,3.8rem)]">
                Clarity before <span className="display-soft">commitment.</span>
              </h2>
              <div className="mt-6 flex flex-col gap-2">
                <Link to="/ai" className="inline-flex items-center gap-2 font-sans text-[10.5px] font-semibold text-lavender hover:text-rose">
                  <Sparkles className="h-3.5 w-3.5" /> Ask Naya a general question
                </Link>
                <Link to="/contact" className="inline-flex items-center gap-2 font-sans text-[10.5px] font-semibold text-lavender hover:text-rose">
                  <MessageCircle className="h-3.5 w-3.5" /> Contact support
                </Link>
              </div>
            </div>
            <Accordion items={faqs} />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-midnight pt-4 pb-16 sm:pt-6 sm:pb-20">
        <div className="container-naya">
          <div className="flex flex-col items-start justify-between gap-5 rounded-[28px] border border-lavender/15 bg-gradient-to-r from-burgundy/30 via-plum to-royal/20 p-7 sm:flex-row sm:items-center sm:p-9">
            <div>
              <p className="font-display text-[clamp(1.8rem,3.2vw,2.8rem)] text-ivory">
                You can begin with one quiet question.
              </p>
              <p className="mt-2 font-body text-[11px] text-mauve">
                Explore the demo journey without sharing a diagnosis or making a payment.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to="/doctors" arrow>
                Find a specialist
              </ButtonLink>
              <ButtonLink to="/ai" variant="secondary" icon={<Sparkles className="h-4 w-4" />}>
                Ask Naya
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
