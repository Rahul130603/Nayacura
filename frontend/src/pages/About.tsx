import { Link } from 'react-router-dom';
import {
  Accessibility,
  ArrowUpRight,
  BookOpen,
  Check,
  CircleCheck,
  Compass,
  Eye,
  HeartHandshake,
  HeartPulse,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import { Seo } from '@/components/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const principles = [
  {
    icon: HeartHandshake,
    title: 'Consent as clinical practice',
    copy: 'You can pause, decline a question, ask for a different approach or stop. A clinician who does not respect your limits cannot provide safe intimate healthcare.',
  },
  {
    icon: Compass,
    title: 'Context before category',
    copy: 'Desire, pain, confidence and connection are shaped by health, culture, relationships and history. We resist reducing a person to a symptom or a diagnosis.',
  },
  {
    icon: BookOpen,
    title: 'Evidence with humility',
    copy: 'We explain what is known, what is uncertain and when a personal assessment is needed. We do not use false certainty to sell care.',
  },
  {
    icon: Users,
    title: 'Care that includes',
    copy: 'Different bodies, identities, relationship structures and languages belong here. Inclusion is a design requirement, not a campaign line.',
  },
];

const conceptualTimeline = [
  {
    year: '01',
    title: 'The question',
    copy: 'Could intimate healthcare feel less like a corridor and more like a well-designed room? The project began with that question, not with a claim about a real company history.',
  },
  {
    year: '02',
    title: 'The boundaries',
    copy: 'We wrote the safety and privacy boundaries before the marketing. No diagnosis by AI. No invented clinicians. No unverified testimonials. No guarantees.',
  },
  {
    year: '03',
    title: 'The experience',
    copy: 'We designed the journey around what a person might need at each step: language, choice, clarity, a way to pause and a path to a qualified human.',
  },
  {
    year: '04',
    title: 'The work ahead',
    copy: 'Real clinical governance, primary-source credential checks, legal review, security testing, accessibility research and clinical validation must precede any live service.',
  },
];

export default function About() {
  return (
    <>
      <Seo
        title="About Nayacura — Intimate healthcare, designed differently"
        description="Our approach to confidential, compassionate sexual wellness and relationship care. A development demo with clear boundaries, not a real clinical provider."
        path="/about"
      />
      <PageHero
        eyebrow="About Nayacura"
        title="A quieter kind of"
        accent="intimate healthcare."
        description="Nayacura is a design-led concept for confidential sexual wellness, relationship counselling and emotional care. It begins with a simple belief: people are more honest when they do not feel judged."
        className="pb-[80vw] sm:pb-[65vw] lg:pb-[65vw] xl:pb-24"
        backgroundImage={{ src: '/images/art/about-nayacura-consultation.png', width: 1671, height: 941 }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink to="/services" arrow>
            Explore our approach
          </ButtonLink>
          <ButtonLink to="/doctors" variant="secondary">
            Meet demo specialists
          </ButtonLink>
        </div>
      </PageHero>

      <section className="relative overflow-hidden border-y border-white/[0.06] bg-plum py-20 sm:py-28">
        <div className="container-naya">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <Reveal>
              <p className="eyebrow mb-6">The Nayacura story</p>
              <h2 className="display text-[clamp(2.6rem,5vw,4.8rem)]">
                We started with the silence, <span className="display-soft">not the solution.</span>
              </h2>
              <p className="mt-6 max-w-xl font-body text-[14px] leading-[1.9] text-ivory/60">
                Many people carry an intimate question for years. They search privately, read
                contradictory advice, and eventually decide the safest option is to say nothing.
                That silence is not evidence that nothing is wrong. It is evidence that the room
                never felt safe.
              </p>
              <p className="mt-4 max-w-xl font-body text-[13px] leading-[1.9] text-mauve">
                Nayacura is an original development concept that imagines a different room: warm
                enough to be honest in, rigorous enough to be trustworthy, and explicit about what
                it does not know. It is not a real clinic and does not claim a real founding history,
                accreditation, partnership or patient community.
              </p>
              <div className="mt-8 rounded-2xl border border-rose/15 bg-rose/[0.045] p-5">
                <p className="font-display text-xl italic leading-snug text-ivory/80">
                  “The opposite of shame is not confidence. It is being heard without a verdict.”
                </p>
                <p className="mt-3 font-body text-[9px] uppercase tracking-[0.16em] text-mauve">
                  Nayacura editorial principle
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="relative aspect-[4/4.4] overflow-hidden rounded-[30px] border border-white/[0.08]">
                <img
                  src="/images/art/nayacura-story-reading-nook.png"
                  alt="A quiet reading nook with a plum armchair beside an arched window at sunrise"
                  className="h-full w-full object-cover object-right"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-plum via-transparent to-plum/10" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="font-body text-[9px] uppercase tracking-[0.2em] text-lavender">
                    Original artwork · concept study
                  </p>
                  <p className="mt-2 max-w-xs font-display text-2xl leading-tight text-ivory">
                    A room with a door you can close.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative bg-midnight py-20 sm:py-28">
        <div className="container-naya">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div>
              <p className="eyebrow mb-5">Our purpose</p>
              <h2 className="display text-[clamp(2.4rem,4.6vw,4.2rem)]">
                Make the first honest conversation <span className="display-soft">easier to reach.</span>
              </h2>
            </div>
            <div>
              <p className="font-body text-[15px] leading-[1.9] text-ivory/65">
                Our purpose is to reduce the distance between a private concern and appropriate,
                respectful care. That means designing for the moments before a consultation as
                carefully as the consultation itself: the language people read, the questions they
                are afraid to ask, the choices they need to understand and the privacy they deserve.
              </p>
              <p className="mt-5 font-body text-[13px] leading-[1.9] text-mauve">
                We are not trying to make intimacy clinical. We are trying to make clinical care
                human enough for intimacy to be discussed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/[0.06] bg-ivory py-20 text-plum sm:py-28">
        <div className="container-naya">
          <div className="grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-[28px] border border-plum/10 bg-white/50 p-7 sm:p-10">
                <Badge tone="burgundy">Vision</Badge>
                <h2 className="display mt-7 text-[clamp(2.2rem,4vw,3.6rem)] text-plum">
                  A trusted, private place to begin.
                </h2>
                <p className="mt-5 font-body text-[13.5px] leading-[1.9] text-plum/65">
                  A future in which sexual wellness and relationship care are discussed with the same
                  dignity as any other part of health — without sensationalism, moral judgment or the
                  assumption that seeking help is a failure.
                </p>
                <p className="mt-4 font-body text-[11px] leading-relaxed text-plum/45">
                  This is an aspiration for the concept, not a claim that the current demo delivers
                  a live, accredited service.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="h-full rounded-[28px] border border-plum/10 bg-plum p-7 text-ivory sm:p-10">
                <Badge tone="lavender">Mission</Badge>
                <h2 className="display mt-7 text-[clamp(2.2rem,4vw,3.6rem)]">
                  Build care that is easy to enter, hard to misuse.
                </h2>
                <p className="mt-5 font-body text-[13.5px] leading-[1.9] text-ivory/60">
                  Provide clear educational pathways, a credential-verified specialist directory,
                  consent-led consultations and private digital records — while refusing to
                  diagnose, promise outcomes, exploit shame or trade in unverified authority.
                </p>
                <p className="mt-4 font-body text-[11px] leading-relaxed text-mauve">
                  The demo implements the workflow and safety boundaries; it does not constitute a
                  real clinical service.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="approach" className="relative bg-midnight py-20 sm:py-28">
        <div className="container-naya">
          <SectionHeading
            eyebrow="Our approach"
            title={
              <>
                Four principles that come <span className="display-soft">before the interface.</span>
              </>
            }
            description="Design decisions are downstream of ethical ones. These principles shape what we build, what we refuse to build and how we describe care."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-[26px] border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2">
            {principles.map((principle, index) => {
              const Icon = principle.icon;
              return (
                <Reveal key={principle.title} delay={index * 0.06}>
                  <div className="h-full bg-midnight p-6 sm:p-8">
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-full border border-lavender/20 bg-lavender/[0.07] text-lavender">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-sans text-[9px] font-semibold text-mauve/40">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-8 font-display text-[25px] text-ivory">{principle.title}</h3>
                    <p className="mt-3 font-body text-[12px] leading-[1.85] text-mauve">
                      {principle.copy}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-burgundy py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(232,160,183,0.15),transparent_50%)]" />
        <div className="container-naya relative z-10">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <p className="eyebrow mb-5">Why confidentiality matters</p>
              <h2 className="display text-[clamp(2.5rem,4.8vw,4.4rem)]">
                Privacy is not hiding. It is <span className="display-soft">conditions for honesty.</span>
              </h2>
              <p className="mt-6 max-w-md font-body text-[13px] leading-[1.9] text-ivory/65">
                When a concern carries stigma, the fear of being recognised can be more powerful than
                the concern itself. Confidentiality is what allows a person to say the real sentence
                — the one they have never said aloud.
              </p>
            </div>
            <div className="space-y-4">
              {[
                {
                  icon: Eye,
                  title: 'Data minimisation',
                  copy: 'We collect only what the workflow needs. A reason for consultation is optional. Support messages explicitly ask you not to include clinical records.',
                },
                {
                  icon: LockKeyhole,
                  title: 'Least privilege',
                  copy: 'Patients see their own records. Clinicians see their own patients. Administrators do not automatically receive clinical notes or AI conversations.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Honest limits',
                  copy: 'This demo implements security-minded defaults but is not certified, independently audited or suitable for real clinical use without substantial additional work.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex gap-4 rounded-2xl border border-white/10 bg-midnight/25 p-5 backdrop-blur-sm"
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-rose" />
                    <div>
                      <h3 className="font-sans text-[13px] font-semibold text-ivory">{item.title}</h3>
                      <p className="mt-1.5 font-body text-[11.5px] leading-relaxed text-ivory/55">
                        {item.copy}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-plum py-20 sm:py-28">
        <div className="container-naya">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <p className="eyebrow mb-5">Compassionate, nonjudgmental care</p>
              <h2 className="display text-[clamp(2.4rem,4.5vw,4rem)]">
                You should not have to become a different person to receive care.
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="font-body text-[13.5px] leading-[1.9] text-ivory/60">
                Nonjudgmental care does not mean agreement with everything. It means a clinician can
                hear a difficult disclosure without moralising, and can respond with curiosity rather
                than shame. It means your relationship structure, identity, sexual history and
                cultural context are treated as part of your life, not as evidence against you.
              </p>
              <p className="mt-5 font-body text-[13px] leading-[1.9] text-mauve">
                It also means being honest when a concern needs a different kind of professional, an
                in-person assessment or emergency support. Compassion is not the same as telling
                people what they want to hear.
              </p>
              <div className="mt-7 grid gap-2 sm:grid-cols-2">
                {[
                  'No shaming language',
                  'No assumed relationship model',
                  'No pathologising normal variation',
                  'No pressure to disclose',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-white/[0.07] px-3.5 py-3">
                    <CircleCheck className="h-3.5 w-3.5 shrink-0 text-rose" />
                    <span className="font-body text-[10.5px] text-ivory/60">{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/[0.06] bg-midnight py-20 sm:py-28">
        <div className="container-naya">
          <SectionHeading
            eyebrow="Patient-first philosophy"
            title={
              <>
                The person is not a booking. <span className="display-soft">The booking serves the person.</span>
              </>
            }
            description="Patient-first is a practical test: does this decision make it easier for someone to understand their options, protect their privacy and choose care without coercion?"
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: MessageCircle,
                title: 'A conversation, not a funnel',
                copy: 'You can browse, read and ask Naya general questions without creating an account. Booking is an option, not the only path through the site.',
              },
              {
                icon: Stethoscope,
                title: 'A clinician, not an algorithm',
                copy: 'Clinical decisions belong to qualified professionals. Naya AI helps navigate information but cannot diagnose, prescribe or replace a consultation.',
              },
              {
                icon: HeartPulse,
                title: 'Follow-up, not lock-in',
                copy: 'Follow-up is discussed with your clinician. We do not sell unlimited access or imply that ongoing care is guaranteed by a package.',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 0.06}>
                  <div className="card-surface h-full p-6">
                    <Icon className="h-5 w-5 text-lavender" />
                    <h3 className="mt-7 font-display text-2xl text-ivory">{item.title}</h3>
                    <p className="mt-3 font-body text-[11.5px] leading-[1.8] text-mauve">{item.copy}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-ivory py-20 text-plum sm:py-28">
        <div className="container-naya">
          <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
            <Reveal>
              <div className="relative aspect-[4/3.4] overflow-hidden rounded-[30px]">
                <img
                  src="/images/art/about-specialists-support.png"
                  alt="A doctor listening to a patient during a consultation"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-plum/30 to-transparent" />
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="eyebrow mb-5 text-burgundy">How specialists support patients</p>
              <h2 className="display text-[clamp(2.3rem,4.2vw,3.8rem)] text-plum">
                Good care makes the next step <span className="font-display italic text-burgundy">clearer.</span>
              </h2>
              <div className="mt-7 space-y-5">
                {[
                  ['Listen and clarify', 'Understand the concern, the context and what the person wants to change — without rushing to a label.'],
                  ['Assess what is appropriate', 'Determine whether remote care is suitable, whether an examination or test is needed, and what falls outside their competence.'],
                  ['Explain options and limits', 'Discuss evidence, benefits, risks, alternatives and uncertainty. No guaranteed outcomes.'],
                  ['Coordinate and refer', 'Work with other professionals where needed, and provide a clear next step rather than a dead end.'],
                ].map(([title, copy], index) => (
                  <div key={title} className="flex gap-4 border-t border-plum/10 pt-5">
                    <span className="font-sans text-[9px] font-semibold text-burgundy/60">0{index + 1}</span>
                    <div>
                      <h3 className="font-sans text-[13px] font-semibold text-plum">{title}</h3>
                      <p className="mt-1.5 font-body text-[11.5px] leading-relaxed text-plum/60">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative bg-plum py-20 sm:py-28">
        <div className="container-naya">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="eyebrow mb-5">Ethical practice</p>
              <h2 className="display text-[clamp(2.4rem,4.5vw,4rem)]">
                Boundaries are part of the <span className="display-soft">care.</span>
              </h2>
              <p className="mt-5 max-w-sm font-body text-[12.5px] leading-[1.85] text-mauve">
                The following are commitments for the concept, not claims of completed
                certification. Each would require independent verification before launch.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2">
              {[
                ['No diagnosis by AI', 'Naya is clearly identified as AI and instructed not to diagnose, prescribe or guarantee outcomes.'],
                ['No invented credentials', 'Fictional demo profiles are labelled. Production clinicians would require primary-source credential verification and registration checks.'],
                ['No unverified testimonials', 'Patient stories on this demo are explicitly labelled composites, not real testimonials or outcome claims.'],
                ['No recording by default', 'Video consultations are not recorded. Any future recording requires explicit informed consent and access controls.'],
                ['No card data storage', 'Payments use a provider; Nayacura does not store full card details. Demo payments are simulated.'],
                ['No hidden clinical access', 'Administrators do not automatically see clinical notes. Access is role-based and audited.'],
              ].map(([title, copy]) => (
                <div key={title} className="bg-plum p-5 sm:p-6">
                  <Check className="h-4 w-4 text-rose" />
                  <h3 className="mt-5 font-sans text-[12.5px] font-semibold text-ivory">{title}</h3>
                  <p className="mt-2 font-body text-[10.5px] leading-relaxed text-mauve">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/[0.06] bg-midnight py-20 sm:py-28">
        <div className="container-naya">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="eyebrow mb-5">Privacy and data protection</p>
              <h2 className="display text-[clamp(2.4rem,4.5vw,4rem)]">
                Built with privacy-minded defaults. <span className="display-soft">Honest about the gaps.</span>
              </h2>
              <p className="mt-5 font-body text-[13px] leading-[1.9] text-mauve">
                The demo implements hashed passwords, HTTP-only sessions, CSRF checks, rate limits,
                RBAC, encrypted clinical notes and audit events. It does not yet have independent
                penetration testing, a DPDP compliance audit, a formal retention schedule or a live
                grievance process.
              </p>
              <ButtonLink to="/legal/privacy" variant="secondary" className="mt-7" arrow>
                Read the privacy draft
              </ButtonLink>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Hashed passwords', 'bcrypt'],
                ['Session cookies', 'HTTP-only'],
                ['Clinical notes', 'AES-GCM at rest'],
                ['Admin clinical access', 'Restricted'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                  <p className="font-body text-[9px] uppercase tracking-[0.14em] text-mauve/60">{label}</p>
                  <p className="mt-2 font-sans text-sm font-semibold text-ivory">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-plum py-20 sm:py-28">
        <div className="container-naya">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div>
              <p className="eyebrow mb-5">Accessible and inclusive</p>
              <h2 className="display text-[clamp(2.4rem,4.5vw,4rem)]">
                Intimacy is diverse. <span className="display-soft">Care should be too.</span>
              </h2>
              <p className="mt-5 font-body text-[13px] leading-[1.9] text-mauve">
                Nayacura is designed for adults across gender identities, relationship structures,
                languages, bodies and abilities. The demo includes English and Tamil AI support,
                language filters, reduced-motion alternatives and keyboard-accessible controls.
              </p>
              <p className="mt-4 font-body text-[12px] leading-[1.85] text-mauve/80">
                This is an intention, not a completed conformance claim. The demo has not yet had an
                independent WCAG 2.2 AA audit. We would publish a conformance report only after
                evidence-based testing.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                [Accessibility, 'Reduced-motion 3D fallback and keyboard-operable controls'],
                [BookOpen, 'Plain-language education in English and Tamil AI support'],
                [Users, 'Gender, language and consultation-type filters'],
                [ShieldCheck, 'Consent-led teleconsultation and document access'],
              ].map(([Icon, label]) => {
                const Component = Icon as typeof Accessibility;
                return (
                  <div key={label as string} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] px-5 py-4">
                    <Component className="h-4 w-4 shrink-0 text-lavender" />
                    <span className="font-body text-[11.5px] text-ivory/65">{label as string}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-midnight py-20 sm:py-28">
        <div className="container-naya">
          <SectionHeading
            eyebrow="Continuous improvement"
            title={
              <>
                A concept is a promise to <span className="display-soft">keep testing.</span>
              </>
            }
            description="This is a conceptual roadmap, not a real company history. Dates and milestones are intentionally not fabricated."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {conceptualTimeline.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.06}>
                <div className="relative h-full border-t border-white/[0.12] pt-6">
                  <span className="font-display text-3xl italic text-rose/50">{item.year}</span>
                  <h3 className="mt-5 font-sans text-[13px] font-semibold text-ivory">{item.title}</h3>
                  <p className="mt-2 font-body text-[10.5px] leading-[1.8] text-mauve">{item.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-14 flex flex-col items-start justify-between gap-5 rounded-[26px] border border-lavender/15 bg-gradient-to-r from-burgundy/30 via-plum to-royal/20 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <p className="font-display text-2xl text-ivory">Care that begins with being heard.</p>
              <p className="mt-2 font-body text-[11px] text-mauve">
                Explore the demo with the boundaries clearly in view.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to="/doctors" arrow>
                Find a specialist
              </ButtonLink>
              <ButtonLink to="/contact" variant="secondary">
                Ask a question
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/[0.06] bg-plum py-16">
        <div className="container-naya flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-rose">
              A note on honesty
            </p>
            <p className="mt-2 max-w-2xl font-body text-[11px] leading-relaxed text-mauve">
              Nayacura does not invent company history, medical accreditations, patient numbers,
              clinical outcomes or partnerships. All clinicians, reviews, clinic locations and
              availability in this demo are fictional and labelled as such.
            </p>
          </div>
          <Link
            to="/legal/medical-disclaimer"
            className="inline-flex shrink-0 items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.15em] text-lavender hover:text-rose"
          >
            Medical disclaimer <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </>
  );
}
