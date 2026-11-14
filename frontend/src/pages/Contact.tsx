import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowUpRight,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  CreditCard,
  LifeBuoy,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Seo } from '@/components/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Accordion } from '@/components/ui/Accordion';
import { DemoNotice } from '@/components/ui/DemoNotice';
import { Reveal } from '@/components/ui/Reveal';
import { supportEmail } from '@/lib/support';

const categories = [
  {
    value: 'GENERAL',
    label: 'General support',
    icon: LifeBuoy,
    description: 'Questions about the platform, services or how to begin.',
  },
  {
    value: 'APPOINTMENT',
    label: 'Appointment support',
    icon: CalendarCheck2,
    description: 'Booking, rescheduling, cancellation or video room access.',
  },
  {
    value: 'BILLING',
    label: 'Billing support',
    icon: CreditCard,
    description: 'Payments, receipts, refunds or pricing questions.',
  },
  {
    value: 'DOCTOR_ONBOARDING',
    label: 'Clinician onboarding',
    icon: Stethoscope,
    description: 'Credential review and professional access enquiries.',
  },
] as const;

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(80),
  email: z.string().trim().email('Please enter a valid email address.'),
  category: z.enum(['GENERAL', 'APPOINTMENT', 'BILLING', 'DOCTOR_ONBOARDING', 'PRIVACY', 'ACCESSIBILITY', 'TECHNICAL']),
  subject: z.string().trim().min(5, 'Please add a short subject.').max(140),
  message: z.string().trim().min(10, 'Please add a little more detail.').max(3000),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
});
type FormValues = z.infer<typeof schema>;

const faqs = [
  {
    question: 'Can I contact Nayacura for medical advice?',
    answer:
      'No. Support cannot provide clinical advice. For personal medical concerns, book a consultation with a qualified clinician. In an emergency, contact local emergency services (112 in India).',
  },
  {
    question: 'Should I include medical details in a support message?',
    answer:
      'Please do not include clinical records, test results, prescriptions or identity documents. Support only needs enough information to understand the platform or booking issue.',
  },
  {
    question: 'How do I report a privacy concern?',
    answer:
      'Select the privacy category in the form, or use the grievance page. Do not include unnecessary personal information. A production service must name a grievance officer and response timeline.',
  },
  {
    question: 'Are there real clinic locations or phone numbers?',
    answer:
      'No. This development demo does not publish fabricated addresses or phone numbers. Production clinic details would be shared only after a confirmed booking.',
  },
];

export default function Contact() {
  const { user } = useAuth();
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      category: 'GENERAL',
      priority: 'NORMAL',
    },
  });

  useEffect(() => {
    if (!user) return;
    setValue('name', user.name);
    setValue('email', user.email);
  }, [user, setValue]);

  async function submit(values: FormValues) {
    setError(null);
    try {
      const response = await api<{ ticket: { reference: string }; message: string }>(
        '/support/tickets',
        { method: 'POST', body: values },
      );
      setReference(response.ticket.reference);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Your request could not be submitted.');
    }
  }

  function chooseCategory(category: string) {
    setValue('category', category as FormValues['category']);
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <Seo
        title="Contact & Support"
        description="Contact Nayacura support for appointment, billing, privacy, accessibility or clinician onboarding enquiries. No real clinic phone numbers or addresses are published."
        path="/contact"
      />
      <PageHero
        eyebrow="Contact & support"
        title="A question is a"
        accent="reasonable place to start."
        description="For platform, booking or billing support, write to us below. Please do not include clinical details in a support request. Clinical questions belong in a consultation with a qualified professional."
        backgroundImage={{ src: '/images/art/contact-hero-banner.png', width: 1855, height: 848 }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.03] px-3.5 py-2 font-body text-[10px] text-mauve">
            <Clock3 className="h-3.5 w-3.5 text-lavender" /> Mon–Sat, 09:00–19:00 IST (illustrative)
          </span>
          <span className="inline-flex items-center gap-2 font-body text-[10px] text-mauve/60">
            <ShieldAlert className="h-3.5 w-3.5 text-rose" /> Not an emergency channel
          </span>
        </div>
      </PageHero>

      <section className="relative border-t border-white/[0.06] bg-midnight py-12 sm:py-16">
        <div className="container-naya">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => chooseCategory(category.value)}
                  className="group rounded-[20px] border border-white/[0.08] bg-white/[0.02] p-5 text-left transition-all hover:border-lavender/25 hover:bg-white/[0.04]"
                >
                  <Icon className="h-5 w-5 text-lavender" />
                  <h2 className="mt-5 font-sans text-[12px] font-semibold text-ivory">
                    {category.label}
                  </h2>
                  <p className="mt-1.5 font-body text-[10px] leading-relaxed text-mauve">
                    {category.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 font-sans text-[8.5px] uppercase tracking-wider text-lavender/80">
                    Write to us <ArrowUpRight className="h-2.5 w-2.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/[0.06] bg-plum py-16 sm:py-24">
        <div className="container-naya">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="eyebrow mb-5">Support request</p>
              <h2 className="display text-[clamp(2.4rem,4.5vw,4rem)]">
                Tell us what <span className="display-soft">went wrong.</span>
              </h2>
              <p className="mt-4 max-w-sm font-body text-[12px] leading-[1.85] text-mauve">
                We will use your message to understand the support issue. This demo stores the
                request in its local database and sends an acknowledgement only if SMTP is
                configured.
              </p>
              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}`}
                  className="mt-4 inline-flex items-center gap-2 font-sans text-[11px] font-semibold text-lavender hover:text-rose"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {supportEmail}
                </a>
              )}
              <div className="mt-7 space-y-3">
                {[
                  [LockKeyhole, 'Do not send clinical records or ID documents'],
                  [ShieldCheck, 'Your request is visible only to you and support'],
                  [LifeBuoy, 'Use your reference to follow up'],
                ].map(([Icon, text]) => {
                  const Component = Icon as typeof LockKeyhole;
                  return (
                    <div key={text as string} className="flex items-start gap-2.5">
                      <Component className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lavender" />
                      <span className="font-body text-[10px] leading-relaxed text-mauve">
                        {text as string}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-2xl border border-rose/20 bg-burgundy/20 p-5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose" />
                  <p className="font-sans text-[10.5px] font-semibold text-ivory">
                    If this is an emergency
                  </p>
                </div>
                <p className="mt-2 font-body text-[10px] leading-relaxed text-mauve">
                  Do not use this form. Contact local emergency services (112 in India), go to the
                  nearest emergency department, or call Tele-MANAS on{' '}
                  <a href="tel:14416" className="text-lavender underline">14416</a> for mental health
                  crisis support.
                </p>
              </div>

              <div className="mt-5">
                <DemoNotice compact />
              </div>
            </div>

            <div id="contact-form">
              {reference ? (
                <div className="rounded-[28px] border border-lavender/20 bg-gradient-to-br from-burgundy/25 via-plum to-royal/15 p-7 sm:p-9">
                  <div className="grid h-14 w-14 place-items-center rounded-full border border-rose/25 bg-rose/10">
                    <CheckCircle2 className="h-6 w-6 text-rose" />
                  </div>
                  <h2 className="display mt-6 text-4xl">Request received.</h2>
                  <p className="mt-3 font-body text-[12px] leading-relaxed text-mauve">
                    Your support request has been logged. A production support desk would respond
                    within its published timeline. This demo does not operate a live desk.
                  </p>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-midnight/30 p-4">
                    <p className="font-body text-[8.5px] uppercase tracking-[0.15em] text-mauve">
                      Reference
                    </p>
                    <p className="mt-1 font-mono text-sm text-ivory">{reference}</p>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={() => setReference(null)}>
                      Send another request
                    </Button>
                    <ButtonLink to="/dashboard?section=support" variant="ghost">
                      View my support requests
                    </ButtonLink>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit(submit)}
                  className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8"
                  noValidate
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="contact-name" className="label-premium">Your name</label>
                      <input id="contact-name" className="input-premium" autoComplete="name" {...register('name')} />
                      {errors.name && <p className="mt-1.5 font-body text-[10px] text-rose">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="label-premium">Email</label>
                      <input id="contact-email" type="email" className="input-premium" autoComplete="email" {...register('email')} />
                      {errors.email && <p className="mt-1.5 font-body text-[10px] text-rose">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="contact-category" className="label-premium">What is this about?</label>
                    <select id="contact-category" className="input-premium" {...register('category')}>
                      <option value="GENERAL">General support</option>
                      <option value="APPOINTMENT">Appointment support</option>
                      <option value="BILLING">Billing support</option>
                      <option value="DOCTOR_ONBOARDING">Clinician onboarding</option>
                      <option value="PRIVACY">Privacy or data request</option>
                      <option value="ACCESSIBILITY">Accessibility feedback</option>
                      <option value="TECHNICAL">Technical issue</option>
                    </select>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="contact-subject" className="label-premium">Subject</label>
                    <input id="contact-subject" className="input-premium" placeholder="A short summary" {...register('subject')} />
                    {errors.subject && <p className="mt-1.5 font-body text-[10px] text-rose">{errors.subject.message}</p>}
                  </div>

                  <div className="mt-4">
                    <label htmlFor="contact-message" className="label-premium">Message</label>
                    <textarea
                      id="contact-message"
                      rows={6}
                      className="input-premium resize-none"
                      placeholder="Please describe the support issue. Do not include clinical details."
                      {...register('message')}
                    />
                    {errors.message && <p className="mt-1.5 font-body text-[10px] text-rose">{errors.message.message}</p>}
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_160px]">
                    <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-midnight/30 p-3.5">
                      <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lavender" />
                      <p className="font-body text-[9px] leading-relaxed text-mauve">
                        Never include medical records, prescriptions, identity documents or card
                        numbers in support messages.
                      </p>
                    </div>
                    <div>
                      <label htmlFor="contact-priority" className="label-premium">Priority</label>
                      <select id="contact-priority" className="input-premium py-3" {...register('priority')}>
                        <option value="LOW">Low</option>
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                  </div>

                  {error && (
                    <div role="alert" className="mt-4 rounded-xl border border-rose/25 bg-burgundy/25 px-4 py-3">
                      <p className="font-body text-[11px] text-ivory/75">{error}</p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <p className="max-w-xs font-body text-[8.5px] leading-relaxed text-mauve/50">
                      By submitting, you agree to our{' '}
                      <Link to="/legal/privacy" className="text-lavender underline">Privacy Policy</Link>.
                      This demo does not operate a live support service.
                    </p>
                    <Button type="submit" loading={isSubmitting} arrow>
                      Send support request
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/[0.06] bg-midnight py-20 sm:py-28">
        <div className="container-naya">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div>
              <p className="eyebrow mb-5">Other routes</p>
              <h2 className="display text-[clamp(2.3rem,4.2vw,3.7rem)]">
                The right door for the <span className="display-soft">right question.</span>
              </h2>
            </div>
            <div className="space-y-2">
              {[
                { icon: Sparkles, label: 'General wellness questions', to: '/ai', detail: 'Naya AI · general information only' },
                { icon: CalendarCheck2, label: 'Appointment support', to: '/dashboard?section=support', detail: 'Sign in to view your requests' },
                { icon: Building2, label: 'Clinician onboarding', to: '/doctor/login', detail: 'Professional access · demo credentials' },
                { icon: ShieldCheck, label: 'Privacy & data requests', to: '/legal/data-deletion', detail: 'Draft deletion process and limitations' },
                { icon: MessageCircle, label: 'Grievance route', to: '/legal/grievance', detail: 'Pre-launch draft · no live officer' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] px-4 py-4 transition-colors hover:border-lavender/25 hover:bg-white/[0.03]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-lavender">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-[11.5px] font-semibold text-ivory">{item.label}</p>
                      <p className="mt-0.5 font-body text-[9px] text-mauve">{item.detail}</p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-mauve transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-rose" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="eyebrow mb-4">Support questions</p>
              <h2 className="display text-3xl">Before you write.</h2>
              <p className="mt-3 font-body text-[11px] leading-relaxed text-mauve">
                We do not publish a real phone number, address or live-chat promise because none of
                those services operate in this demo.
              </p>
            </div>
            <Accordion items={faqs} />
          </div>
        </div>
      </section>
    </>
  );
}
