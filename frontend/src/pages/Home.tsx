import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CalendarCheck2,
  Check,
  CircleHelp,
  Clock3,
  EyeOff,
  FileText,
  Heart,
  HeartHandshake,
  Languages,
  LockKeyhole,
  MapPin,
  MessageCircle,
  MonitorSmartphone,
  Quote,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  Users,
  Video,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import { Button, ButtonLink, Magnetic } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Accordion } from '@/components/ui/Accordion';
import { DoctorCard } from '@/components/cards/DoctorCard';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { ServiceIcon } from '@/components/ServiceIcon';
import { demoDoctors } from '@/data/doctors';
import { articles, featuredArticles } from '@/data/articles';
import { serviceCategories, servicesByCategory } from '@/data/services';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    question: 'Is Nayacura only for sexual problems?',
    answer:
      'No. Sexual wellbeing sits alongside emotional health, relationship quality, body image, stress and life transitions. People come to us with specific concerns, but also with questions about communication, confidence or simply wanting a private, trustworthy conversation.',
  },
  {
    question: 'How is my privacy protected?',
    answer:
      'Accounts are separated by role and access is checked on the server. Passwords are hashed, sessions are held in HTTP-only cookies, and sensitive clinical notes are not exposed to administrators by default. This is a development demo, not a certified clinical deployment; the Privacy Policy explains both the safeguards and their limits.',
  },
  {
    question: 'Can I choose a male or female doctor?',
    answer:
      'Yes. The specialist directory lets you filter by gender, specialisation, language, consultation type, city, experience and fee. You can read a full profile before booking.',
  },
  {
    question: 'Do I need to know what is wrong before booking?',
    answer:
      'No. You can book with a general description such as “something has changed” or “I would like to understand my options”. A clinician will help clarify the concern during the consultation. You never need to arrive with a diagnosis.',
  },
  {
    question: 'What happens if I need to reschedule?',
    answer:
      'Confirmed appointments show reschedule and cancellation options in your dashboard, subject to the clinician’s stated cancellation window. The demo cancellation policy is a draft and must be reviewed before a real service launches.',
  },
  {
    question: 'Is Naya AI a substitute for a doctor?',
    answer:
      'No. Naya is an AI wellness companion. It can explain general topics, help you navigate services and suggest relevant specialist categories. It cannot diagnose, prescribe, provide emergency care or guarantee outcomes. For personal medical concerns, consult a qualified professional.',
  },
  {
    question: 'Are the doctors and stories on this site real?',
    answer:
      'No. This is a development demo. Clinician profiles, credentials, availability, fees and patient stories are fictional and clearly labelled. Using a real clinician’s identity or a real patient testimonial without verification would be misleading, so we do not.',
  },
];

const benefits = [
  {
    icon: UserCheck,
    title: 'A qualified starting point',
    copy: 'Filter by the kind of professional and conversation you need, rather than guessing from a search engine.',
  },
  {
    icon: MessageCircle,
    title: 'Language that includes you',
    copy: 'Choose clinicians by spoken language, and use Naya AI in English, Tamil or Tanglish for general guidance.',
  },
  {
    icon: EyeOff,
    title: 'Discretion without mystery',
    copy: 'Clear information about what is private, what is shared and what this demo cannot yet protect.',
  },
  {
    icon: HeartHandshake,
    title: 'Consent as a practice',
    copy: 'You can pause, decline a question or stop a consultation. Care should never depend on compliance.',
  },
  {
    icon: BookOpen,
    title: 'Education, not alarm',
    copy: 'Cautious articles that acknowledge uncertainty and tell you when a personal assessment is appropriate.',
  },
  {
    icon: Clock3,
    title: 'A pace you can sustain',
    copy: 'Choose a time, prepare only what feels necessary, and return when you are ready — not because of a streak.',
  },
];

const comparison = {
  online: {
    label: 'Secure video',
    icon: Video,
    title: 'Private care, from a room you choose.',
    copy: 'A video consultation can be a comfortable first step for many sexual wellness and relationship concerns. It is especially useful for conversation-led care, initial assessment, therapy and follow-up.',
    goodFor: [
      'First conversations about desire, anxiety or communication',
      'Psychosexual and couples therapy from separate locations',
      'Follow-ups and continuity when travel is difficult',
      'Access to a language or specialisation not available locally',
    ],
    limits: [
      'No physical examination or specimen collection',
      'A clinician may still recommend an in-person visit',
      'You need a private space and a stable connection',
    ],
  },
  inPerson: {
    label: 'In person',
    icon: Stethoscope,
    title: 'A fuller clinical space when it matters.',
    copy: 'Some concerns benefit from an examination, a hands-on assessment or simply being in a clinical environment. In-person availability is shown per clinician and city; exact clinic details are shared after a confirmed booking.',
    goodFor: [
      'Pain, pelvic symptoms or concerns needing examination',
      'Medical review where a physical assessment may be required',
      'People who feel safer talking face to face',
      'Coordinated care with local tests or referrals',
    ],
    limits: [
      'Availability depends on the clinician and city',
      'Exact clinic addresses are not published in this demo',
      'Travel and waiting time may be part of the appointment',
    ],
  },
};

function OnlineInPerson() {
  const [mode, setMode] = useState<'online' | 'inPerson'>('online');
  const data = comparison[mode];
  const Icon = data.icon;

  return (
    <div className="mt-12 overflow-hidden rounded-[30px] border border-white/[0.08] bg-white/[0.025]">
      <div className="flex border-b border-white/[0.08]" role="tablist" aria-label="Consultation type">
        {(['online', 'inPerson'] as const).map((key) => {
          const item = comparison[key];
          const TabIcon = item.icon;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              onClick={() => setMode(key)}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-4 font-sans text-[11px] font-semibold transition-colors sm:text-xs ${
                mode === key
                  ? 'bg-lavender/[0.08] text-ivory'
                  : 'text-mauve hover:bg-white/[0.02] hover:text-ivory'
              }`}
            >
              <TabIcon className={`h-4 w-4 ${mode === key ? 'text-lavender' : ''}`} />
              {item.label}
            </button>
          );
        })}
      </div>
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr] lg:p-10"
      >
        <div>
          <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-lavender/20 bg-lavender/[0.08] text-lavender">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="max-w-md font-display text-[28px] leading-tight text-ivory sm:text-4xl">
            {data.title}
          </h3>
          <p className="mt-4 max-w-xl font-body text-[13px] leading-[1.85] text-mauve">{data.copy}</p>
          <div className="mt-6 grid gap-2">
            {data.goodFor.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" />
                <span className="font-body text-[11.5px] leading-relaxed text-ivory/65">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-midnight/35 p-5 sm:p-6">
          <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-mauve">
            Good to know
          </p>
          <ul className="mt-4 space-y-3">
            {data.limits.map((item) => (
              <li key={item} className="flex items-start gap-2.5 font-body text-[11.5px] leading-relaxed text-mauve">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-lavender" />
                {item}
              </li>
            ))}
          </ul>
          <ButtonLink
            to="/doctors"
            variant="secondary"
            size="sm"
            className="mt-6 w-full"
            arrow
          >
            See specialist availability
          </ButtonLink>
        </div>
      </motion.div>
    </div>
  );
}

function AiPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 rounded-[40px] bg-royal/20 blur-[60px]" />
      <div className="glass-strong relative overflow-hidden rounded-[28px] border-lavender/20">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="relative grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-royal to-burgundy">
              <Sparkles className="h-3.5 w-3.5 text-rose" />
            </span>
            <div>
              <p className="font-sans text-[11px] font-semibold text-ivory">Naya AI</p>
              <p className="font-body text-[8.5px] text-mauve">Private wellness companion · AI</p>
            </div>
          </div>
          <Badge tone="lavender">Online</Badge>
        </div>
        <div className="space-y-3.5 p-4">
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-burgundy/60 px-3.5 py-2.5">
            <p className="font-body text-[11px] leading-relaxed text-ivory/85">
              I feel anxious about intimacy. I don&apos;t know if I need a doctor or a therapist.
            </p>
          </div>
          <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-white/[0.07] bg-white/[0.045] px-3.5 py-2.5">
            <p className="font-body text-[11px] leading-relaxed text-ivory/75">
              That sounds like a lot to carry. Anxiety can affect intimacy in ways that are emotional,
              physical or both. A sexual medicine clinician can assess physical contributors, while a
              psychosexual therapist can help with anxiety and pressure. You don&apos;t have to know
              which one you need before asking.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full border border-white/10 px-3 py-1.5 font-body text-[9px] text-mauve">
              Find a specialist
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1.5 font-body text-[9px] text-mauve">
              Tell me more
            </span>
          </div>
          <div className="flex items-center gap-2 border-t border-white/[0.07] pt-3">
            <span className="flex-1 rounded-full border border-white/10 px-3 py-2 font-body text-[9px] text-mauve/60">
              Ask something private…
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-rose to-lavender">
              <ArrowRight className="h-3 w-3 text-midnight" />
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center font-body text-[8.5px] text-mauve/55">
        Illustrative interface. Naya is AI, not a doctor.
      </p>
    </div>
  );
}

export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  useEffect(() => {
    if (reduce || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.privacy-line',
        { scaleX: 0, transformOrigin: 'left center' },
        {
          scaleX: 1,
          duration: 1.2,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: '.privacy-section', start: 'top 70%' },
        },
      );
    }, root);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div ref={root} id="top">
      <Seo
        title="Nayacura — Confidential Sexual Wellness & Relationship Care"
        description="A private, judgment-free space for sexual wellness, intimacy and relationship care. Consult qualified specialists online or in person."
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'MedicalBusiness',
          name: 'Nayacura',
          description:
            'A development demo for a confidential sexual wellness and relationship healthcare platform.',
          slogan: 'Your Wellness. Your Confidence. Your Private Space.',
          areaServed: 'IN',
          availableService: serviceCategories.map((category) => ({
            '@type': 'MedicalTherapy',
            name: category.name,
          })),
        }}
      />

      {/* 1 — Cinematic hero */}
      <section className="hero-section relative min-h-[100svh] overflow-hidden bg-midnight pb-[64vw] pt-24 sm:pb-0 sm:pt-36">
        <img
          src="/images/art/home-hero-heartbound-couple.png"
          alt=""
          width={1672}
          height={941}
          fetchPriority="high"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[70vw] w-full object-cover object-right sm:top-0 sm:h-full"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70vw] bg-gradient-to-b from-midnight via-transparent to-transparent sm:inset-0 sm:h-auto sm:bg-gradient-to-r sm:from-midnight/75 sm:via-midnight/25" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-midnight/35 via-transparent to-midnight/25" />
        <div className="pointer-events-none absolute -left-40 top-1/3 h-[500px] w-[500px] rounded-full bg-burgundy/20 blur-[130px]" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-[55%] bg-[radial-gradient(ellipse_at_60%_40%,rgba(110,53,164,0.18),transparent_65%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-midnight to-transparent z-10" />

        <div className="container-naya relative z-20">
          <div className="hero-section__layout grid items-center gap-6 sm:min-h-[calc(100svh-9rem)] lg:grid-cols-[1.02fr_0.98fr] lg:gap-0">
            <div className="relative z-20 pb-8 pt-6 lg:pb-20">
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 backdrop-blur-md"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose" />
                <span className="font-sans text-[9px] font-semibold uppercase tracking-[0.17em] text-ivory/60">
                  Confidential sexual wellness & relationship care
                </span>
              </motion.div>

              <h1 className="display max-w-[740px] text-[clamp(2.65rem,calc(4.9vw/var(--desktop-scale,1)),5.4rem)]">
                {['Rediscover', 'Confidence.'].map((line, i) => (
                  <span key={line} className="block overflow-hidden">
                    <motion.span
                      className="block"
                      initial={reduce ? false : { y: '110%' }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.9, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {line}
                    </motion.span>
                  </span>
                ))}
                <span className="block overflow-hidden">
                  <motion.span
                    className="display-soft block text-[clamp(2.5rem,calc(4.6vw/var(--desktop-scale,1)),5.1rem)]"
                    initial={reduce ? false : { y: '110%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Reconnect With Yourself.
                  </motion.span>
                </span>
              </h1>

              <motion.p
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.75 }}
                className="mt-5 max-w-xl font-body text-[14px] leading-[1.85] text-ivory/55 sm:text-[15.5px]"
              >
                Confidential, compassionate sexual wellness and relationship healthcare,
                thoughtfully designed around your comfort, privacy, and wellbeing.
              </motion.p>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="mt-7 flex flex-wrap items-center gap-3"
              >
                <Magnetic>
                  <ButtonLink to="/doctors" size="lg" arrow>
                    Find Your Specialist
                  </ButtonLink>
                </Magnetic>
                <ButtonLink to="/services" size="lg" variant="secondary">
                  Explore Our Care
                </ButtonLink>
              </motion.div>

              <motion.div
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.1 }}
                className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/[0.07] pt-5"
              >
                {[
                  [LockKeyhole, 'Privacy-minded design'],
                  [BadgeCheck, 'Demo specialist credentials'],
                  [HeartHandshake, 'Consent-first care'],
                ].map(([Icon, label]) => {
                  const IconComponent = Icon as typeof LockKeyhole;
                  return (
                    <span
                      key={label as string}
                      className="inline-flex items-center gap-2 font-body text-[10px] text-mauve"
                    >
                      <IconComponent className="h-3.5 w-3.5 text-lavender/70" />
                      {label as string}
                    </span>
                  );
                })}
              </motion.div>
            </div>


          </div>

          <div className="relative z-20 flex justify-end pb-6 pt-1">
            <span className="font-body text-[8.5px] uppercase tracking-[0.2em] text-mauve/50">
              Adults 18+
            </span>
          </div>
        </div>
      </section>

      {/* 2 — Brand introduction */}
      <section className="relative overflow-hidden border-t border-white/[0.06] bg-midnight py-14 sm:py-20 lg:py-24">
        <div className="container-naya">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24">
            <div>
              <Reveal>
                <p className="eyebrow mb-6">The Nayacura idea</p>
                <h2 className="display max-w-2xl text-[clamp(2.6rem,5.8vw,5.8rem)]">
                  Intimate healthcare, <span className="display-soft">without the whisper.</span>
                </h2>
              </Reveal>
            </div>
            <div className="flex flex-col justify-end">
              <Reveal delay={0.1}>
                <p className="font-body text-[15px] leading-[1.9] text-ivory/60">
                  Most people have carried a question about their body, desire or relationship for
                  years without saying it aloud. Not because it is unusual — because the room never
                  felt safe enough.
                </p>
                <p className="mt-5 font-body text-[13.5px] leading-[1.9] text-mauve">
                  Nayacura is a differently imagined space: editorial in its calm, clinical in its
                  boundaries, and human in its language. No shame-based marketing. No promises of a
                  quick fix. Just qualified pathways, clear information and the freedom to go at your
                  pace.
                </p>
                <Link
                  to="/about"
                  className="mt-7 inline-flex items-center gap-2 border-b border-lavender/25 pb-1 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-lavender transition-colors hover:border-rose hover:text-rose"
                >
                  Why we exist <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Reveal>
            </div>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-3">
            {[
              ['Not a symptom checklist', 'A conversation that considers your body, history, relationships and goals.'],
              ['Not a rushed prescription', 'Assessment before advice. Options explained with benefits, risks and limits.'],
              ['Not a place for shame', 'Language that respects identity, culture, consent and the right to privacy.'],
            ].map(([title, copy], index) => (
              <div key={title} className="bg-midnight p-6 sm:p-7">
                <p className="font-sans text-[9px] font-semibold tracking-[0.18em] text-rose/70">
                  0{index + 1}
                </p>
                <h3 className="mt-5 font-display text-xl text-ivory">{title}</h3>
                <p className="mt-2 font-body text-[11.5px] leading-relaxed text-mauve">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — Trust and privacy promise */}
      <section className="privacy-section relative overflow-hidden bg-ivory py-14 text-plum sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(232,160,183,0.28),transparent_42%)]" />
        <div className="container-naya relative z-10">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <Reveal>
              <p className="eyebrow mb-6 text-burgundy">Our privacy promise</p>
              <h2 className="display text-[clamp(2.6rem,5vw,4.8rem)] text-plum">
                Your story stays <span className="font-display italic text-burgundy">yours.</span>
              </h2>
              <p className="mt-6 max-w-md font-body text-[14px] leading-[1.9] text-plum/65">
                Sexual health information is among the most personal data a person can share. Privacy
                is not a footer link here. It shapes what we collect, who can see it and what we
                refuse to do with it.
              </p>
              <div className="mt-7 h-px w-full bg-plum/15 overflow-hidden">
                <div className="privacy-line h-px w-full bg-burgundy" />
              </div>
              <p className="mt-4 font-body text-[10.5px] leading-relaxed text-plum/45">
                This is a development demo. We describe the architecture we have built and the
                protections still required before real clinical use. We do not claim regulatory
                certification or absolute security.
              </p>
            </Reveal>

            <div className="grid gap-5 sm:grid-cols-2">
              {[
                {
                  icon: EyeOff,
                  title: 'Data minimisation',
                  copy: 'We ask only for what the workflow needs. A reason for consultation is optional. Clinical notes require a signed-in clinician with a care relationship.',
                },
                {
                  icon: LockKeyhole,
                  title: 'Access, not curiosity',
                  copy: 'Patients see only their own records. Doctors see their own patients. Administrators do not automatically receive confidential clinical notes.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Security-minded defaults',
                  copy: 'Hashed passwords, HTTP-only sessions, CSRF checks, rate limits, role-based authorisation and audit events are implemented in this demo.',
                },
                {
                  icon: FileText,
                  title: 'Clear consent',
                  copy: 'AI storage, teleconsultation and sensitive document handling each require their own consent. You can withdraw and request deletion.',
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.title} delay={index * 0.08}>
                    <div className="h-full rounded-[22px] border border-plum/10 bg-white/45 p-6 backdrop-blur-sm">
                      <Icon className="h-5 w-5 text-burgundy" />
                      <h3 className="mt-8 font-display text-[22px] text-plum">{item.title}</h3>
                      <p className="mt-2 font-body text-[11.5px] leading-[1.8] text-plum/60">
                        {item.copy}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4 — About Nayacura */}
      <section className="relative overflow-hidden bg-plum py-14 sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute -right-40 top-10 h-[500px] w-[500px] rounded-full bg-royal/15 blur-[130px]" />
        <div className="container-naya relative z-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <Reveal className="relative">
              <div className="relative aspect-[4/4.25] overflow-hidden rounded-[30px] border border-white/[0.08] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.6)] sm:aspect-[4/4.1]">
                <img
                  src="/images/art/connection-two-people.jpg"
                  alt="Ethereal glass ribbon couple with glowing lotus and water ripples"
                  className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-plum via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-10">
                  <p className="font-body text-[9px] uppercase tracking-[0.2em] text-lavender/90">
                    Original artwork · Nayacura
                  </p>
                  <p className="mt-2.5 max-w-sm font-display text-[26px] leading-tight text-ivory">
                    Two people. One conversation.<br />No script.
                  </p>
                </div>
              </div>
              <div className="glass absolute right-4 top-4 sm:right-6 sm:top-6 hidden rounded-2xl p-4 sm:block z-20">
                <p className="font-display text-3xl text-ivory">18+</p>
                <p className="mt-1 max-w-[110px] font-body text-[9px] leading-relaxed text-mauve">
                  A space designed for adults, with age confirmation at booking.
                </p>
              </div>
            </Reveal>

            <div>
              <Reveal>
                <p className="eyebrow mb-6">About Nayacura</p>
                <h2 className="display text-[clamp(2.5rem,4.8vw,4.5rem)]">
                  Care that begins with <span className="display-soft">being heard.</span>
                </h2>
                <p className="mt-6 font-body text-[14.5px] leading-[1.9] text-ivory/60">
                  Nayacura is built around a simple observation: people are more honest when they do
                  not feel judged. That honesty is clinically useful. It helps a professional
                  understand context, avoid assumptions and offer care that fits a real life.
                </p>
                <p className="mt-4 font-body text-[13px] leading-[1.9] text-mauve">
                  We bring together sexual wellness, relationship counselling and emotional support
                  in one coherent experience — with a respectful editorial voice and a refusal to
                  sensationalise.
                </p>
              </Reveal>
              <div className="mt-8 space-y-5">
                {[
                  ['Consent is clinical', 'You can pause, decline or stop. Comfort is not a luxury; it is part of safe care.'],
                  ['Context over labels', 'Desire, pain and connection do not exist in isolation from health, culture or relationship.'],
                  ['Evidence with humility', 'We explain what is known, what is uncertain and when a personal assessment is needed.'],
                ].map(([title, copy], index) => (
                  <Reveal key={title} delay={index * 0.07}>
                    <div className="flex gap-4 border-t border-white/[0.08] pt-5">
                      <span className="mt-0.5 font-sans text-[10px] font-semibold text-rose/70">
                        0{index + 1}
                      </span>
                      <div>
                        <h3 className="font-sans text-[13px] font-semibold text-ivory">{title}</h3>
                        <p className="mt-1.5 font-body text-[11.5px] leading-relaxed text-mauve">{copy}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.2}>
                <ButtonLink to="/about" variant="secondary" size="md" className="mt-8" arrow>
                  Read our story
                </ButtonLink>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 5 — Sexual wellness awareness */}
      <section className="awareness-section relative overflow-hidden border-y border-white/[0.06] bg-[#551732] bg-[linear-gradient(90deg,#551732_34%,#501530_54%,#48132c_74%,#3d0f27_88%)] py-14 sm:py-20">
        <div className="container-naya relative z-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2.45fr)] lg:items-center lg:gap-8 xl:gap-12">
            <div>
              <p className="eyebrow mb-6">Awareness, not alarm</p>
              <h2 className="display text-[clamp(2.6rem,5vw,4.7rem)]">
                The silence is often <span className="display-soft">the problem.</span>
              </h2>
              <p className="mt-6 max-w-md font-body text-[13.5px] leading-[1.9] text-ivory/85">
                Sexual health is health. Relationship health is health. Emotional health is health.
                Yet these conversations are still met with embarrassment, misinformation or moral
                judgment. Nayacura exists to replace that noise with calm, accurate information and
                a route to qualified support.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink to="/journal" variant="secondary" size="sm" arrow>
                  Read the journal
                </ButtonLink>
                <ButtonLink to="/services" variant="ghost" size="sm">
                  Explore concerns
                </ButtonLink>
              </div>
            </div>
            <div className="min-w-0 lg:-mr-6 xl:-mr-10">
              <img
                src="/images/art/awareness-wellness-couple.png?v=2"
                alt="A couple surrounded by six cards about sexual wellness, relationship support, emotional balance, men’s and women’s wellness, and private, judgment-free care"
                width={1848}
                height={851}
                loading="lazy"
                className="block h-auto w-full [mask-image:linear-gradient(to_right,transparent,black_8%,black_94%,transparent),linear-gradient(to_bottom,transparent,black_9%,black_82%,transparent)] [mask-composite:intersect]"
              />
              <div className="border-t border-rose/25 py-5 [container-type:inline-size] sm:py-7">
                <p className="flex flex-wrap items-center justify-center gap-x-[1.6cqw] gap-y-1 px-1 font-display text-[clamp(1rem,6.8cqw,5rem)] italic leading-[1.12] text-rose/75">
                  <span>Desire</span>
                  <span aria-hidden="true">·</span>
                  <span>Confidence</span>
                  <span aria-hidden="true">·</span>
                  <span>Connection</span>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              ['Information', 'Cautious, jargon-aware education that does not pretend certainty where none exists.'],
              ['Access', 'Specialist discovery by language, concern and consultation type, from wherever you are.'],
              ['Dignity', 'A tone that never treats desire, identity or relationship structure as a defect.'],
            ].map(([title, copy]) => (
              <div key={title} className="border-t border-white/15 pt-5">
                <h3 className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-rose">
                  {title}
                </h3>
                <p className="mt-2 font-body text-[11.5px] leading-relaxed text-ivory/55">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — Specialized services */}
      <section className="relative bg-midnight py-14 sm:py-20 lg:py-24">
        <div className="container-naya">
          <SectionHeading
            eyebrow="Our specialised care"
            title={
              <>
                Four ways in. <span className="display-soft">One considered space.</span>
              </>
            }
            description="Start with the area that feels closest to your concern. Each pathway has its own specialist categories, consultation options and boundaries — because intimate health is not one conversation."
            action={
              <ButtonLink to="/services" variant="secondary" arrow>
                View all 26 services
              </ButtonLink>
            }
          />
          <div className="mt-14 grid gap-4 lg:grid-cols-12">
            {serviceCategories.map((category, index) => {
              const categoryServices = servicesByCategory(category.slug);
              const wide = index === 0 || index === 3;
              return (
                <Reveal
                  key={category.slug}
                  delay={index * 0.06}
                  className={wide ? 'lg:col-span-7' : 'lg:col-span-5'}
                >
                  <div
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('a, button')) return;
                      navigate(`/services?category=${category.slug}`);
                    }}
                    className="group relative flex h-full min-h-[330px] cursor-pointer flex-col justify-between overflow-hidden rounded-[26px] border border-white/[0.075] bg-gradient-to-br from-white/[0.045] via-white/[0.015] to-transparent p-6 transition-all duration-500 hover:border-lavender/25 hover:from-white/[0.065] sm:p-8"
                  >
                    <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full border border-lavender/[0.08] transition-transform duration-700 group-hover:scale-110" />
                    <div className="relative z-10 flex items-start justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-full border border-lavender/20 bg-lavender/[0.07] text-lavender">
                            <ServiceIcon name={index === 0 ? 'shield' : index === 1 ? 'flower' : index === 2 ? 'users' : 'heart'} />
                          </span>
                          <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-rose/80">
                            0{index + 1} / 04
                          </p>
                        </div>
                        <h3 className="mt-6 max-w-sm font-display text-[28px] leading-tight text-ivory sm:text-[33px]">
                          <Link
                            to={`/services?category=${category.slug}`}
                            className="transition-colors hover:text-rose"
                          >
                            {category.name}
                          </Link>
                        </h3>
                        <p className="mt-3 max-w-md font-body text-[12px] leading-relaxed text-mauve">
                          {category.tagline}
                        </p>
                      </div>
                      <Link
                        to={`/services?category=${category.slug}`}
                        aria-label={`View ${category.name}`}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-mauve transition-all duration-300 group-hover:border-rose/40 group-hover:bg-rose/10 group-hover:text-rose"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                    <div className="relative z-10 mt-8 flex flex-wrap gap-1.5">
                      {categoryServices.slice(0, wide ? 5 : 4).map((service) => (
                        <Link
                          key={service.slug}
                          to={`/services/${service.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-full border border-white/[0.09] bg-white/[0.025] px-2.5 py-1 font-body text-[9px] text-ivory/60 transition-all hover:border-rose/40 hover:bg-rose/10 hover:text-ivory"
                        >
                          {service.name}
                        </Link>
                      ))}
                      {categoryServices.length > (wide ? 5 : 4) && (
                        <Link
                          to={`/services?category=${category.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-full border border-lavender/15 bg-lavender/[0.04] px-2.5 py-1 font-body text-[9px] text-lavender/80 transition-all hover:border-lavender/35 hover:bg-lavender/10 hover:text-rose"
                        >
                          +{categoryServices.length - (wide ? 5 : 4)} more
                        </Link>
                      )}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7 — Men's wellness */}
      <section className="relative overflow-hidden bg-plum py-14 sm:py-20">
        <div className="container-naya">
          <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
            <Reveal className="order-2 lg:order-1">
              <p className="eyebrow mb-6">Men&apos;s sexual wellness</p>
              <h2 className="display text-[clamp(2.5rem,5vw,4.6rem)]">
                Performance pressure is not <span className="display-soft">a diagnosis.</span>
              </h2>
              <p className="mt-5 font-body text-[14px] leading-[1.9] text-ivory/60">
                Erection difficulties, ejaculation concerns, low desire and performance anxiety can
                feel like a verdict on who you are. They are health concerns, often influenced by a
                mix of physical and emotional factors. Care starts by removing the shame long enough
                to understand what is actually happening.
              </p>
              <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                {servicesByCategory('mens-sexual-wellness')
                  .slice(0, 6)
                  .map((service) => (
                    <Link
                      key={service.slug}
                      to={`/services/${service.slug}`}
                      className="group flex items-center gap-2.5 rounded-xl border border-white/[0.07] px-3.5 py-3 transition-colors hover:border-lavender/25 hover:bg-white/[0.035]"
                    >
                      <span className="h-1 w-1 shrink-0 rounded-full bg-rose/70" />
                      <span className="font-body text-[11px] text-ivory/65 transition-colors group-hover:text-ivory">
                        {service.name}
                      </span>
                    </Link>
                  ))}
              </div>
              <ButtonLink to="/services?category=mens-sexual-wellness" variant="secondary" className="mt-7" arrow>
                Explore men&apos;s wellness
              </ButtonLink>
            </Reveal>
            <Reveal delay={0.1} className="order-1 min-w-0 lg:order-2">
              <div className="relative aspect-[915/590] overflow-hidden rounded-[30px] border border-white/[0.09] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.6)] 2xl:-ml-[72px] 2xl:w-[min(47.9vw,915px)]">
                <img
                  src="/images/art/mens-wellness.jpg"
                  alt="Men's sexual wellness illustration showing mindful calm, clinical themes and intimacy support"
                  className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 rounded-[30px] ring-1 ring-inset ring-white/10" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 8 — Women's wellness */}
      <section className="relative overflow-hidden bg-ivory py-14 text-plum sm:py-20">
        <div className="pointer-events-none absolute -left-32 top-1/3 h-[440px] w-[440px] rounded-full bg-rose/20 blur-[110px]" />
        <div className="container-naya relative z-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <Reveal>
              <div className="relative aspect-[4/3.6] overflow-hidden rounded-[30px]">
                <img
                  src="/images/art/womens-wellness.png"
                  alt="A woman framed by a glowing arch with icons for hormonal balance, sexual wellness, stress relief, body confidence, and emotional wellbeing"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="eyebrow mb-6 text-burgundy">Women&apos;s sexual wellness</p>
              <h2 className="display text-[clamp(2.5rem,5vw,4.6rem)] text-plum">
                Your body is not a problem to be <span className="font-display italic text-burgundy">solved.</span>
              </h2>
              <p className="mt-5 font-body text-[14px] leading-[1.9] text-plum/65">
                Pain, dryness, desire changes, menopause and anxiety are not things to push through
                in silence. They deserve a proper assessment, clear explanations and options that
                respect your history and your consent.
              </p>
              <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                {servicesByCategory('womens-sexual-wellness')
                  .slice(0, 6)
                  .map((service) => (
                    <Link
                      key={service.slug}
                      to={`/services/${service.slug}`}
                      className="group flex items-center gap-2.5 border-b border-plum/10 py-2.5 transition-colors hover:border-burgundy/40"
                    >
                      <ArrowUpRight className="h-3 w-3 shrink-0 text-burgundy/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      <span className="font-body text-[11.5px] text-plum/70 transition-colors group-hover:text-plum">
                        {service.name}
                      </span>
                    </Link>
                  ))}
              </div>
              <ButtonLink
                to="/services?category=womens-sexual-wellness"
                variant="secondary"
                className="mt-7 border-plum/20 bg-plum text-ivory hover:bg-burgundy"
                arrow
              >
                Explore women&apos;s wellness
              </ButtonLink>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 9 — Couples and relationship counselling */}
      <section className="relative min-h-[640px] overflow-hidden bg-midnight">
        <img
          src="/images/art/couples-counselling-lounge.png"
          alt=""
          width={1857}
          height={847}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[300px] w-full object-cover object-right lg:inset-0 lg:h-full lg:object-[right_65%]"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[300px] bg-gradient-to-b from-midnight via-transparent to-midnight/45 lg:inset-0 lg:h-auto lg:bg-gradient-to-r lg:from-midnight/90 lg:via-midnight/40 lg:to-transparent" />
        <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-midnight/80 via-transparent to-midnight/25 lg:block" />
        <div className="container-naya relative z-10 flex min-h-[640px] items-center pb-64 pt-20 lg:py-20">
          <div className="max-w-2xl">
            <Reveal>
              <p className="eyebrow mb-6">Couples & relationship counselling</p>
              <h2 className="display text-[clamp(2.7rem,5.4vw,5.2rem)]">
                A structured space for two people to be <span className="display-soft">heard.</span>
              </h2>
              <p className="mt-6 max-w-xl font-body text-[14px] leading-[1.9] text-ivory/60">
                The relationship is the client. Counselling is not a courtroom, and no one is put on
                trial. It is a place to slow down the cycle, understand what each person is trying to
                protect, and decide what kind of relationship you want to build.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {servicesByCategory('couples-relationship-counselling')
                  .slice(0, 5)
                  .map((service) => (
                    <Link
                      key={service.slug}
                      to={`/services/${service.slug}`}
                      className="rounded-full border border-white/15 bg-midnight/30 px-3.5 py-2 font-body text-[10px] text-ivory/65 backdrop-blur-md transition-colors hover:border-rose/35 hover:text-ivory"
                    >
                      {service.name}
                    </Link>
                  ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink to="/services?category=couples-relationship-counselling" arrow>
                  Explore couples care
                </ButtonLink>
                <ButtonLink to="/doctors?mode=IN_PERSON" variant="secondary">
                  Find a couples therapist
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 10 — Meet our specialists */}
      <section className="relative bg-midnight py-14 sm:py-20 lg:py-24">
        <div className="container-naya">
          <SectionHeading
            eyebrow="Meet our demo specialists"
            title={
              <>
                Different expertise. <span className="display-soft">A shared standard of care.</span>
              </>
            }
            description="Filter by gender, specialisation, language, city and consultation type. Every profile here is fictional and clearly labelled — designed to show how a real, credential-verified directory would work."
            action={<ButtonLink to="/doctors" variant="secondary" arrow>View all specialists</ButtonLink>}
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {demoDoctors.slice(0, 4).map((doctor, index) => (
              <Reveal key={doctor.id} delay={index * 0.06}>
                <DoctorCard doctor={doctor} />
              </Reveal>
            ))}
          </div>
          <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-4 sm:flex-row sm:items-center">
            <p className="font-body text-[10.5px] leading-relaxed text-mauve">
              <strong className="font-semibold text-ivory/80">Demonstration notice:</strong> these
              profiles and credentials are fictional. The portraits show stock photo models.
            </p>
            <Link
              to="/contact"
              className="shrink-0 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-lavender hover:text-rose"
            >
              Credential verification approach →
            </Link>
          </div>
        </div>
      </section>

      {/* 11 — How consultations work */}
      <section className="relative overflow-hidden border-y border-white/[0.06] bg-plum py-14 sm:py-20">
        <div className="container-naya">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <Reveal>
                <p className="eyebrow mb-6">How consultations work</p>
                <h2 className="display text-[clamp(2.6rem,4.8vw,4.5rem)]">
                  Clear steps. <span className="display-soft">No performance required.</span>
                </h2>
                <p className="mt-6 max-w-sm font-body text-[13px] leading-[1.9] text-mauve">
                  A good care experience is predictable enough to feel safe and flexible enough to
                  fit your life. Here is the intended journey, from first curiosity to follow-up.
                </p>
                <div className="mt-7 space-y-3">
                  {[
                    [CalendarCheck2, 'Choose video or in person'],
                    [Languages, 'Consult in a language you prefer'],
                    [Clock3, 'See fees and cancellation terms upfront'],
                  ].map(([Icon, label]) => {
                    const Component = Icon as typeof CalendarCheck2;
                    return (
                      <div key={label as string} className="flex items-center gap-2.5">
                        <Component className="h-3.5 w-3.5 text-lavender" />
                        <span className="font-body text-[11px] text-ivory/60">{label as string}</span>
                      </div>
                    );
                  })}
                </div>
                <ButtonLink to="/how-it-works" variant="secondary" size="sm" className="mt-7" arrow>
                  Full journey
                </ButtonLink>
              </Reveal>
            </div>
            <div>
              {[
                ['01', 'Tell us what you are looking for', 'Browse by concern or start with a specialist. You do not need a diagnosis. Naya AI can help you identify the right category if you are unsure.'],
                ['02', 'Choose your clinician and format', 'Review expertise, language, consultation type and demo availability. Video and in-person options are labelled clearly.'],
                ['03', 'Book a real time slot', 'Choose an available time in your timezone. The server reserves the slot and prevents overlapping confirmed bookings.'],
                ['04', 'Prepare, then talk', 'Share only what you choose. A clinician will listen, ask relevant questions and discuss possible next steps, including referral.'],
                ['05', 'Continue with a plan', 'Follow-up is not automatic or unlimited. Your clinician will discuss whether it is useful and what it would involve.'],
              ].map(([num, title, copy], index) => (
                <Reveal key={num} delay={index * 0.04}>
                  <div className="grid grid-cols-[3rem_1fr] gap-4 border-t border-white/[0.08] py-6 sm:grid-cols-[4rem_1fr] sm:gap-6">
                    <span className="font-display text-2xl italic text-rose/50">{num}</span>
                    <div>
                      <h3 className="font-sans text-[15px] font-semibold text-ivory">{title}</h3>
                      <p className="mt-2 max-w-xl font-body text-[11.5px] leading-[1.8] text-mauve">{copy}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 12 — Online vs in-person */}
      <section className="relative bg-midnight py-14 sm:py-20">
        <div className="container-naya">
          <SectionHeading
            eyebrow="Choose your setting"
            title={
              <>
                The same care, <span className="display-soft">a different room.</span>
              </>
            }
            description="Neither format is universally better. What matters is whether the clinician can assess your concern safely and whether you feel able to speak freely."
          />
          <OnlineInPerson />
        </div>
      </section>

      {/* 14 — Benefits of professional support */}
      <section className="relative bg-midnight py-14 sm:py-20 lg:py-24">
        <div className="container-naya">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <Reveal>
                <p className="eyebrow mb-6">Why professional support</p>
                <h2 className="display text-[clamp(2.6rem,4.8vw,4.5rem)]">
                  Not because you are broken. Because you are <span className="display-soft">carrying something.</span>
                </h2>
                <p className="mt-6 max-w-sm font-body text-[13px] leading-[1.9] text-mauve">
                  Professional care is not a last resort. It is a structured way to understand a
                  concern, reduce isolation and make an informed choice. No clinician can promise a
                  particular outcome, but good care can widen the options available to you.
                </p>
                <div className="mt-8 rounded-2xl border border-lavender/15 bg-lavender/[0.04] p-5">
                  <Quote className="h-4 w-4 text-rose" />
                  <p className="mt-3 font-display text-xl italic leading-snug text-ivory/80">
                    “The first useful thing was saying it out loud to someone who did not flinch.”
                  </p>
                  <p className="mt-3 font-body text-[8.5px] uppercase tracking-[0.15em] text-mauve">
                    Illustrative composite · not a real testimonial
                  </p>
                </div>
              </Reveal>
            </div>
            <div className="grid gap-x-8 sm:grid-cols-2">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <Reveal key={benefit.title} delay={index * 0.05}>
                    <div className="border-t border-white/[0.09] py-6">
                      <div className="flex items-start justify-between gap-4">
                        <Icon className="h-5 w-5 text-lavender" />
                        <span className="font-sans text-[9px] font-semibold text-mauve/40">
                          0{index + 1}
                        </span>
                      </div>
                      <h3 className="mt-5 font-display text-[21px] text-ivory">{benefit.title}</h3>
                      <p className="mt-2 font-body text-[11px] leading-[1.8] text-mauve">{benefit.copy}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 15 — AI wellness assistant introduction */}
      <section className="relative overflow-hidden bg-plum py-14 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(110,53,164,0.2),transparent_50%)]" />
        <div className="container-naya relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <div className="flex items-center gap-2">
                <Badge tone="lavender" dot>
                  AI companion
                </Badge>
                <span className="font-body text-[9.5px] text-mauve">English · தமிழ் · Tanglish</span>
              </div>
              <h2 className="display mt-6 text-[clamp(2.5rem,5vw,4.6rem)]">
                Meet Naya. <span className="display-soft">A quieter place to start.</span>
              </h2>
              <p className="mt-5 font-body text-[14px] leading-[1.9] text-ivory/60">
                Naya AI is a private wellness companion for the questions that feel too small for a
                clinic and too heavy to keep carrying. It can explain general topics, help you
                navigate services and suggest the kind of specialist you might want — without
                pretending to be one.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  [MessageCircle, 'General wellbeing education'],
                  [Stethoscope, 'Specialist category guidance'],
                  [LockKeyhole, 'Consent before storage'],
                  [Users, 'Relationship communication basics'],
                ].map(([Icon, label]) => {
                  const Component = Icon as typeof MessageCircle;
                  return (
                    <div key={label as string} className="flex items-center gap-2.5">
                      <Component className="h-3.5 w-3.5 shrink-0 text-lavender" />
                      <span className="font-body text-[10.5px] text-ivory/60">{label as string}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink to="/ai" arrow>
                  Talk to Naya
                </ButtonLink>
                <ButtonLink to="/legal/medical-disclaimer" variant="ghost" size="md">
                  Read AI boundaries
                </ButtonLink>
              </div>
              <p className="mt-5 max-w-md font-body text-[9px] leading-relaxed text-mauve/60">
                Naya is not a doctor and cannot diagnose, prescribe or handle emergencies. For
                urgent concerns, contact local emergency services or Tele-MANAS on 14416.
              </p>
            </Reveal>
            <Reveal delay={0.12}>
              <AiPreview />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 16 — Educational resources */}
      <section className="relative bg-midnight py-14 sm:py-20">
        <div className="container-naya">
          <SectionHeading
            eyebrow="The wellness journal"
            title={
              <>
                Read before you <span className="display-soft">decide.</span>
              </>
            }
            description="Cautious, original education on intimacy, relationships and emotional health. Each article names its limits and encourages professional assessment where a personal concern needs it."
            action={<ButtonLink to="/journal" variant="secondary" arrow>Browse all articles</ButtonLink>}
          />
          <div className="mt-12 grid gap-4 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <ArticleCard article={featuredArticles[0]} variant="featured" />
            </Reveal>
            <div className="grid gap-4 lg:col-span-5">
              {articles.slice(1, 4).map((article, index) => (
                <Reveal key={article.slug} delay={index * 0.06}>
                  <Link
                    to={`/journal/${article.slug}`}
                    className="group flex h-full gap-4 rounded-3xl border border-white/[0.075] bg-white/[0.025] p-4 transition-all hover:border-lavender/25 hover:bg-white/[0.04]"
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-28">
                      <img
                        src={article.image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col py-1">
                      <p className="font-body text-[8.5px] uppercase tracking-[0.15em] text-rose">
                        {article.categoryName}
                      </p>
                      <h3 className="mt-2 line-clamp-2 font-display text-[19px] leading-tight text-ivory group-hover:text-rose">
                        {article.title}
                      </h3>
                      <p className="mt-auto font-body text-[9px] text-mauve">
                        {article.readingMinutes} min read
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 17 — Illustrative stories */}
      <section className="relative overflow-hidden border-y border-white/[0.06] bg-burgundy/[0.35] py-14 sm:py-20">
        <div className="container-naya">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <Reveal>
              <p className="eyebrow mb-5">Illustrative patient stories</p>
              <h2 className="display max-w-2xl text-[clamp(2.5rem,4.8vw,4.4rem)]">
                The kinds of conversations people bring. <span className="display-soft">Not real testimonials.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="max-w-xs rounded-xl border border-white/[0.08] bg-midnight/30 p-3">
                <p className="font-body text-[9.5px] leading-relaxed text-mauve">
                  These are clearly labelled illustrative composites, written to demonstrate tone.
                  They are not real patients, outcomes or endorsements.
                </p>
              </div>
            </Reveal>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                quote:
                  '“I kept looking for a reason to justify the appointment. Eventually I realised not knowing was the reason.”',
                context: 'A composite illustration of a first conversation about low desire.',
                tag: 'Desire',
              },
              {
                quote:
                  '“We did not need a verdict on who was right. We needed to stop having the same fight in different words.”',
                context: 'A composite illustration of couples counselling around communication.',
                tag: 'Relationship',
              },
              {
                quote:
                  '“The therapist did not ask me to describe everything. She asked what I wanted to be different.”',
                context: 'A composite illustration of psychosexual therapy after anxiety.',
                tag: 'Anxiety',
              },
            ].map((story, index) => (
              <Reveal key={story.tag} delay={index * 0.07}>
                <figure className="flex h-full flex-col rounded-[24px] border border-white/[0.08] bg-midnight/30 p-6 sm:p-7">
                  <Quote className="h-5 w-5 text-rose/60" />
                  <blockquote className="mt-5 flex-1 font-display text-[22px] leading-[1.4] text-ivory/85">
                    {story.quote}
                  </blockquote>
                  <figcaption className="mt-6 border-t border-white/[0.08] pt-4">
                    <p className="font-body text-[10px] leading-relaxed text-mauve">{story.context}</p>
                    <p className="mt-2 font-sans text-[8px] font-semibold uppercase tracking-[0.16em] text-rose/70">
                      Illustrative composite · {story.tag}
                    </p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 18 — FAQ */}
      <section className="relative bg-midnight py-14 sm:py-20 lg:py-24">
        <div className="container-editorial">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <Reveal>
                <p className="eyebrow mb-5">Questions, answered</p>
                <h2 className="display text-[clamp(2.5rem,4.6vw,4.2rem)]">
                  Before you <span className="display-soft">ask.</span>
                </h2>
                <p className="mt-5 max-w-sm font-body text-[12.5px] leading-[1.85] text-mauve">
                  Still uncertain? Naya AI can answer general questions, or you can send a private
                  support request without sharing clinical details.
                </p>
                <div className="mt-6 flex flex-col gap-2.5">
                  <Link
                    to="/ai"
                    className="inline-flex items-center gap-2 font-sans text-[11px] font-semibold text-lavender hover:text-rose"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Ask Naya AI
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 font-sans text-[11px] font-semibold text-lavender hover:text-rose"
                  >
                    <CircleHelp className="h-3.5 w-3.5" /> Contact support
                  </Link>
                </div>
              </Reveal>
            </div>
            <Reveal>
              <Accordion items={faqs} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 19 — Final booking CTA */}
      <section className="relative overflow-hidden bg-midnight pb-14 sm:pb-20">
        <div className="container-naya">
          <div className="relative overflow-hidden rounded-[34px] border border-lavender/15 bg-gradient-to-br from-burgundy via-plum to-royal/70 px-6 py-16 text-center sm:px-12 sm:py-24">
            <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(232,160,183,0.22),transparent_55%)]" />
            <div className="relative z-10 mx-auto max-w-3xl">
              <p className="eyebrow mb-6 justify-center">Your next step</p>
              <h2 className="display text-[clamp(2.8rem,6vw,5.6rem)]">
                You do not have to have the words <span className="display-soft">ready.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-xl font-body text-[14px] leading-[1.9] text-ivory/65">
                Start with a service, a specialist, or one quiet question. Nayacura is designed to
                meet you before the explanation.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink to="/doctors" size="lg" arrow>
                  Find your specialist
                </ButtonLink>
                <ButtonLink to="/contact" variant="secondary" size="lg">
                  Talk to support
                </ButtonLink>
              </div>
              <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2">
                {[
                  [ShieldCheck, 'Privacy-minded'],
                  [BadgeCheck, 'Demo credentials labelled'],
                  [Heart, 'Consent-first'],
                  [Languages, 'English, Tamil & Tanglish'],
                ].map(([Icon, label]) => {
                  const Component = Icon as typeof ShieldCheck;
                  return (
                    <span key={label as string} className="inline-flex items-center gap-1.5 font-body text-[9px] text-ivory/45">
                      <Component className="h-3 w-3" /> {label as string}
                    </span>
                  );
                })}
              </div>
              <p className="mt-5 font-body text-[8.5px] leading-relaxed text-ivory/30">
                Development demo. No real clinical service is provided. Emergency? Contact local
                emergency services.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
