import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useDoctors } from '@/hooks/useDoctors';
import { getDemoStockPortrait } from '@/data/doctors';
import { useToast } from '@/components/ui/Toast';
import { Seo } from '@/components/Seo';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DemoNotice } from '@/components/ui/DemoNotice';
import { EmptyState, PageLoader } from '@/components/ui/States';
import { cn, formatCurrency, formatDateTime, formatTime } from '@/lib/utils';
import type { Appointment, AvailabilitySlot, Doctor } from '@/types';
import { Logo } from '@/components/layout/Logo';

const steps = [
  { id: 1, label: 'Specialist' },
  { id: 2, label: 'Format' },
  { id: 3, label: 'Time' },
  { id: 4, label: 'Details' },
  { id: 5, label: 'Payment' },
  { id: 6, label: 'Confirmed' },
];

const detailsSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name.').max(80),
  email: z.string().trim().email('Please enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .min(7, 'Please enter a contact number.')
    .max(20)
    .regex(/^[+0-9()\-\s]+$/, 'Please use a valid phone number format.'),
  ageConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm that you are 18 or older.' }),
  }),
  reason: z.string().trim().max(600).optional(),
  communicationPreference: z.enum(['EMAIL', 'SMS', 'WHATSAPP']),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Please confirm your consent to continue.' }),
  }),
});

type DetailsForm = z.infer<typeof detailsSchema>;

type AvailabilityResponse = {
  days: { date: string; label: string; shortLabel: string; slots: AvailabilitySlot[] }[];
  timezone: string;
};

type PaymentIntent = {
  provider: 'RAZORPAY' | 'DEMO';
  providerOrderId: string | null;
  keyId: string | null;
  amountPaise: number;
  mode: 'live' | 'demo';
  holdExpiresAt?: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function BookingDoctorAvatar({ doctor }: { doctor: Doctor }) {
  const portrait = getDemoStockPortrait(doctor);
  return (
    <Avatar
      name={doctor.name}
      src={portrait?.src ?? doctor.photoUrl}
      objectPosition={portrait?.position}
    />
  );
}

function Summary({
  doctor,
  mode,
  slot,
  step,
}: {
  doctor: Doctor | null;
  mode: 'ONLINE' | 'IN_PERSON';
  slot: AvailabilitySlot | null;
  step: number;
}) {
  return (
    <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-5">
      <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-mauve">
        Your selection
      </p>
      {doctor ? (
        <>
          <div className="mt-4 flex items-center gap-3">
            <BookingDoctorAvatar doctor={doctor} />
            <div className="min-w-0">
              <p className="truncate font-sans text-[12px] font-semibold text-ivory">{doctor.name}</p>
              <p className="truncate font-body text-[9.5px] text-mauve">
                {doctor.specializations[0]?.name}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2.5 border-t border-white/[0.07] pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-body text-[10px] text-mauve">Format</span>
              <span className="inline-flex items-center gap-1 font-sans text-[10px] text-ivory/70">
                {mode === 'ONLINE' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                {mode === 'ONLINE' ? 'Video' : 'In person'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-body text-[10px] text-mauve">When</span>
              <span className="text-right font-sans text-[10px] text-ivory/70">
                {slot ? formatTime(slot.startAt) : 'Not selected'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-body text-[10px] text-mauve">Consultation fee</span>
              <span className="font-sans text-[11px] font-semibold text-ivory">
                {formatCurrency(doctor.feePaise)}
              </span>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-white/[0.07] bg-midnight/30 p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-lavender" />
              <p className="font-body text-[8.5px] leading-relaxed text-mauve">
                No charge until payment. Your slot is held for 15 minutes while you complete the
                booking.
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-4 font-body text-[11px] leading-relaxed text-mauve">
          Choose a specialist to see your booking summary.
        </p>
      )}
      <div className="mt-4 flex items-center gap-1">
        {steps.slice(0, 5).map((item) => (
          <span
            key={item.id}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              step >= item.id ? 'bg-lavender/60' : 'bg-white/10',
            )}
          />
        ))}
      </div>
    </div>
  );
}

export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { push } = useToast();
  const initialDoctor = params.get('doctor') || '';
  const initialMode = params.get('mode') === 'IN_PERSON' ? 'IN_PERSON' : 'ONLINE';
  const initialSlot = params.get('slot') || '';

  const [step, setStep] = useState(1);
  const [doctorSlug, setDoctorSlug] = useState(initialDoctor);
  const [mode, setMode] = useState<'ONLINE' | 'IN_PERSON'>(initialMode);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [search, setSearch] = useState('');

  const { data: doctorData, isLoading: doctorsLoading } = useDoctors({ limit: 50 });
  const doctors = doctorData?.doctors || [];
  const doctor = doctors.find((item) => item.slug === doctorSlug) || null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: '',
      communicationPreference: 'EMAIL',
    },
  });

  useEffect(() => {
    if (user) {
      reset((prev) => ({ ...prev, fullName: user.name, email: user.email }));
    }
  }, [user, reset]);

  const availabilityQuery = useQuery({
    queryKey: ['booking-availability', doctorSlug, mode],
    enabled: Boolean(doctorSlug && doctor),
    queryFn: async () => {
      try {
        return await api<AvailabilityResponse>(
          `/doctors/${doctorSlug}/availability?mode=${mode}&days=21`,
        );
      } catch {
        return { days: [], timezone: 'Asia/Kolkata' };
      }
    },
  });

  useEffect(() => {
    if (!availabilityQuery.data?.days.length) return;
    if (!selectedDate) setSelectedDate(availabilityQuery.data.days[0].date);
    if (initialSlot) {
      const found = availabilityQuery.data.days
        .flatMap((day) => day.slots)
        .find((item) => item.startAt === initialSlot);
      if (found) {
        setSlot(found);
        const day = availabilityQuery.data.days.find((item) =>
          item.slots.some((s) => s.startAt === initialSlot),
        );
        if (day) setSelectedDate(day.date);
      }
    }
  }, [availabilityQuery.data, initialSlot, selectedDate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const selectedDay = availabilityQuery.data?.days.find((day) => day.date === selectedDate);
  const selectedDoctor = doctor;

  const filteredDoctors = useMemo(() => {
    if (!search.trim()) return doctors;
    const query = search.toLowerCase();
    return doctors.filter((item) =>
      `${item.name} ${item.specializations.map((s) => s.name).join(' ')} ${item.city}`
        .toLowerCase()
        .includes(query),
    );
  }, [doctors, search]);

  function chooseDoctor(next: Doctor) {
    setDoctorSlug(next.slug);
    setMode(next.onlineEnabled ? 'ONLINE' : 'IN_PERSON');
    setSlot(null);
    setSelectedDate(null);
    const nextParams = new URLSearchParams(params);
    nextParams.set('doctor', next.slug);
    nextParams.delete('slot');
    nextParams.set('mode', next.onlineEnabled ? 'ONLINE' : 'IN_PERSON');
    navigate(`/book?${nextParams.toString()}`, { replace: true });
  }

  async function onDetails(data: DetailsForm) {
    if (!user) {
      push({ title: 'Please sign in to continue', tone: 'error' });
      return;
    }
    if (!doctor || !slot) return;
    setCreating(true);
    try {
      const response = await api<{
        appointment: Appointment;
        payment: PaymentIntent;
        message: string;
      }>('/appointments', {
        method: 'POST',
        body: {
          doctorSlug: doctor.slug,
          mode,
          startAt: slot.startAt,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          ageConfirmed: data.ageConfirmed,
          reason: data.reason || undefined,
          communicationPreference: data.communicationPreference,
          consent: data.consent,
        },
      });
      setAppointment(response.appointment);
      setPaymentIntent(response.payment);
      setStep(5);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        push({
          title: 'That time was just taken',
          description: 'Please choose another slot. No payment has been taken.',
          tone: 'error',
        });
        setSlot(null);
        setStep(3);
        void availabilityQuery.refetch();
      } else {
        push({
          title: 'We could not hold that booking',
          description: error instanceof Error ? error.message : 'Please try again.',
          tone: 'error',
        });
      }
    } finally {
      setCreating(false);
    }
  }

  async function completeDemoPayment() {
    if (!appointment) return;
    setPaying(true);
    try {
      const response = await api<{ appointment: Appointment; payment: { status: string } }>(
        `/appointments/${appointment.id}/payment/verify`,
        { method: 'POST', body: { demo: true } },
      );
      setAppointment(response.appointment);
      setPaymentDone(true);
      setStep(6);
      push({ title: 'Demo payment recorded', description: 'No real money was charged.', tone: 'success' });
    } catch (error) {
      push({
        title: 'Payment could not be verified',
        description: error instanceof Error ? error.message : 'Please try again.',
        tone: 'error',
      });
    } finally {
      setPaying(false);
    }
  }

  async function verifyLivePayment(response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    if (!appointment) return;
    setPaying(true);
    try {
      const result = await api<{ appointment: Appointment; payment: { status: string } }>(
        `/appointments/${appointment.id}/payment/verify`,
        { method: 'POST', body: response },
      );
      setAppointment(result.appointment);
      setPaymentDone(true);
      setStep(6);
    } catch (error) {
      push({
        title: 'Payment verification failed',
        description: error instanceof Error ? error.message : 'Please contact support with your booking ID.',
        tone: 'error',
      });
    } finally {
      setPaying(false);
    }
  }

  async function openRazorpay() {
    if (!paymentIntent || !paymentIntent.keyId || !appointment) return;
    if (!document.getElementById('razorpay-checkout-js')) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'razorpay-checkout-js';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Could not load the secure payment window.'));
        document.body.appendChild(script);
      }).catch((error) => {
        push({ title: 'Payment window unavailable', description: error.message, tone: 'error' });
        throw error;
      });
    }
    if (!window.Razorpay) throw new Error('Razorpay is unavailable.');
    const checkout = new window.Razorpay({
      key: paymentIntent.keyId,
      amount: paymentIntent.amountPaise,
      currency: 'INR',
      name: 'Nayacura',
      description: `Consultation ${appointment.bookingId}`,
      order_id: paymentIntent.providerOrderId,
      theme: { color: '#6E35A4' },
      modal: {
        ondismiss: () => push({ title: 'Payment window closed', description: 'Your slot is held for a short time.', tone: 'info' }),
      },
      handler: (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => void verifyLivePayment(response),
    });
    checkout.open();
  }

  function next() {
    if (step === 1 && !doctor) {
      push({ title: 'Choose a specialist first', tone: 'error' });
      return;
    }
    if (step === 3 && !slot) {
      push({ title: 'Choose a time first', tone: 'error' });
      return;
    }
    setStep((current) => Math.min(5, current + 1));
  }

  function back() {
    if (step > 1 && step < 5) setStep((current) => current - 1);
  }

  if (loading) return <PageLoader label="Preparing private booking" />;

  return (
    <>
      <Seo
        title="Book a Confidential Consultation"
        description="A secure, six-step consultation booking experience. Choose a specialist, format, time, provide minimal details and complete payment."
        path="/book"
        noIndex
      />
      <div className="min-h-screen bg-midnight pb-20 pt-24 sm:pt-28">
        <div className="container-editorial">
          <div className="flex items-center justify-between gap-4">
            <Logo />
            <div className="hidden items-center gap-2 rounded-full border border-lavender/15 bg-lavender/[0.04] px-3 py-1.5 sm:flex">
              <LockKeyhole className="h-3 w-3 text-lavender" />
              <span className="font-body text-[9px] text-mauve">Secure booking · demo</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow mb-3">Private consultation</p>
              <h1 className="display text-[clamp(2.5rem,5vw,4.2rem)]">Book your appointment.</h1>
            </div>
            <p className="max-w-xs font-body text-[10px] leading-relaxed text-mauve">
              This is a development demo. No real clinician, payment or clinical record is involved.
            </p>
          </div>

          <nav aria-label="Booking progress" className="mt-8 min-w-0 border-y border-white/[0.08] py-4">
            <ol className="no-scrollbar flex w-full items-center gap-1 overflow-x-auto sm:gap-3">
              {steps.map((item) => (
                <li key={item.id} className="flex shrink-0 items-center gap-1 sm:gap-3">
                  <span
                    className={cn(
                      'grid h-7 w-7 place-items-center rounded-full border font-sans text-[9px] font-semibold transition-colors',
                      step === item.id
                        ? 'border-rose/40 bg-rose/15 text-rose'
                        : step > item.id
                          ? 'border-lavender/20 bg-lavender/10 text-lavender'
                          : 'border-white/10 text-mauve/50',
                    )}
                    aria-current={step === item.id ? 'step' : undefined}
                  >
                    {step > item.id ? <Check className="h-3 w-3" /> : item.id}
                  </span>
                  <span
                    className={cn(
                      'font-sans text-[9.5px] font-medium uppercase tracking-wider',
                      step === item.id ? 'text-ivory' : 'text-mauve/50',
                    )}
                  >
                    {item.label}
                  </span>
                  {item.id < steps.length && (
                    <span className="ml-1 hidden h-px w-6 bg-white/10 sm:block" />
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px] lg:gap-12">
            <div className="min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                >
                  {step === 1 && (
                    <div>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-rose">
                            Step 1 · Choose specialist
                          </p>
                          <h2 className="display mt-3 text-3xl sm:text-4xl">Who would you like to see?</h2>
                          <p className="mt-2 font-body text-[11.5px] text-mauve">
                            All profiles are fictional demo data. You can change your choice below.
                          </p>
                        </div>
                        <label htmlFor="booking-search" className="sr-only">
                          Search specialists
                        </label>
                        <input
                          id="booking-search"
                          type="search"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search specialists…"
                          className="input-premium min-h-10 w-full rounded-full py-2.5 text-xs sm:w-60"
                        />
                      </div>

                      {doctorsLoading ? (
                        <div className="mt-6 skeleton h-64 rounded-2xl" />
                      ) : (
                        <div className="mt-6 grid gap-2">
                          {filteredDoctors.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => chooseDoctor(item)}
                              className={cn(
                                'flex min-w-0 items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all',
                                doctorSlug === item.slug
                                  ? 'border-lavender/40 bg-lavender/[0.07]'
                                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]',
                              )}
                            >
                              <BookingDoctorAvatar doctor={item} />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-sans text-[12.5px] font-semibold text-ivory">
                                    {item.name}
                                  </p>
                                  <span className="rounded-full border border-white/10 px-1.5 py-0.5 font-sans text-[7px] uppercase tracking-wider text-mauve">
                                    Demo
                                  </span>
                                </div>
                                <p className="mt-0.5 truncate font-body text-[10px] text-mauve">
                                  {item.specializations.map((s) => s.name).join(' · ')} ·{' '}
                                  {item.languages.slice(0, 2).join(', ')}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="font-sans text-[11.5px] font-semibold text-ivory">
                                  {formatCurrency(item.feePaise)}
                                </p>
                                <p className="mt-0.5 flex items-center justify-end gap-1 font-body text-[8.5px] text-mauve">
                                  {item.onlineEnabled ? <Video className="h-2.5 w-2.5" /> : <MapPin className="h-2.5 w-2.5" />}
                                  {item.onlineEnabled ? 'Video' : 'In person'}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  'grid h-6 w-6 shrink-0 place-items-center rounded-full border',
                                  doctorSlug === item.slug
                                    ? 'border-rose bg-rose text-midnight'
                                    : 'border-white/15 text-transparent',
                                )}
                              >
                                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {step === 2 && selectedDoctor && (
                    <div>
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-rose">
                        Step 2 · Consultation format
                      </p>
                      <h2 className="display mt-3 text-3xl sm:text-4xl">How would you like to meet?</h2>
                      <p className="mt-2 font-body text-[11.5px] text-mauve">
                        Both formats have clinical limits. A clinician may still recommend an
                        in-person assessment.
                      </p>
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {[
                          {
                            value: 'ONLINE' as const,
                            icon: Video,
                            title: 'Secure video',
                            copy: 'From a private space you choose. Best for conversation-led care and follow-ups.',
                            disabled: !selectedDoctor.onlineEnabled,
                          },
                          {
                            value: 'IN_PERSON' as const,
                            icon: MapPin,
                            title: 'In person',
                            copy: 'A fuller clinical space when an examination might be needed. Exact clinic details after booking.',
                            disabled: !selectedDoctor.inPersonEnabled,
                          },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.value}
                              type="button"
                              disabled={item.disabled}
                              onClick={() => {
                                setMode(item.value);
                                setSlot(null);
                                setSelectedDate(null);
                              }}
                              className={cn(
                                'rounded-[22px] border p-5 text-left transition-all',
                                mode === item.value
                                  ? 'border-lavender/40 bg-lavender/[0.07]'
                                  : 'border-white/[0.08] hover:border-white/20',
                                item.disabled && 'cursor-not-allowed opacity-40',
                              )}
                            >
                              <Icon className={cn('h-5 w-5', mode === item.value ? 'text-lavender' : 'text-mauve')} />
                              <h3 className="mt-5 font-display text-2xl text-ivory">{item.title}</h3>
                              <p className="mt-2 font-body text-[10.5px] leading-relaxed text-mauve">
                                {item.copy}
                              </p>
                              {item.disabled && (
                                <p className="mt-3 font-body text-[9px] text-rose/80">
                                  Not offered by this demo clinician.
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {mode === 'IN_PERSON' && (
                        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose" />
                          <p className="font-body text-[10px] leading-relaxed text-mauve">
                            No real clinic address or phone number is published in this demo. The
                            listed location is a city and a clearly labelled demo care-space name.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-rose">
                            Step 3 · Date & time
                          </p>
                          <h2 className="display mt-3 text-3xl sm:text-4xl">Choose a time that works.</h2>
                          <p className="mt-2 font-body text-[11.5px] text-mauve">
                            Slots are generated from the demo schedule. Times are shown in your
                            device timezone.
                          </p>
                        </div>
                        <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1">
                          {selectedDoctor?.onlineEnabled && (
                            <button
                              type="button"
                              onClick={() => {
                                setMode('ONLINE');
                                setSlot(null);
                                setSelectedDate(null);
                              }}
                              className={cn(
                                'rounded-full px-3 py-1.5 font-sans text-[9px] font-semibold',
                                mode === 'ONLINE' ? 'bg-lavender/15 text-ivory' : 'text-mauve',
                              )}
                            >
                              Video
                            </button>
                          )}
                          {selectedDoctor?.inPersonEnabled && (
                            <button
                              type="button"
                              onClick={() => {
                                setMode('IN_PERSON');
                                setSlot(null);
                                setSelectedDate(null);
                              }}
                              className={cn(
                                'rounded-full px-3 py-1.5 font-sans text-[9px] font-semibold',
                                mode === 'IN_PERSON' ? 'bg-lavender/15 text-ivory' : 'text-mauve',
                              )}
                            >
                              In person
                            </button>
                          )}
                        </div>
                      </div>

                      {availabilityQuery.isLoading ? (
                        <div className="mt-6 skeleton h-64 rounded-2xl" />
                      ) : !availabilityQuery.data?.days.length ? (
                        <EmptyState
                          className="mt-6"
                          icon={<CalendarDays className="h-5 w-5" />}
                          title="No demo slots available"
                          description="Try the other consultation format, another specialist, or check back later."
                          action={
                            <Button variant="secondary" onClick={() => setStep(2)}>
                              Change format
                            </Button>
                          }
                        />
                      ) : (
                        <div className="mt-6 rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-4">
                          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
                            {availabilityQuery.data.days.map((day) => (
                              <button
                                key={day.date}
                                type="button"
                                onClick={() => setSelectedDate(day.date)}
                                aria-pressed={selectedDate === day.date}
                                className={cn(
                                  'min-w-[100px] shrink-0 rounded-xl border px-3 py-3 text-left',
                                  selectedDate === day.date
                                    ? 'border-lavender/40 bg-lavender/[0.09]'
                                    : 'border-white/[0.07] hover:border-white/20',
                                )}
                              >
                                <span className="block font-sans text-[9px] text-mauve">
                                  {day.shortLabel.split(' ')[0]}
                                </span>
                                <span className="mt-0.5 block font-display text-2xl text-ivory">
                                  {day.shortLabel.split(' ')[1]}
                                </span>
                                <span className="mt-0.5 block font-body text-[8px] text-mauve/70">
                                  {day.slots.length} times
                                </span>
                              </button>
                            ))}
                          </div>
                          <div className="mt-4 border-t border-white/[0.08] pt-4">
                            <p className="font-body text-[9px] uppercase tracking-[0.15em] text-mauve">
                              {selectedDay?.label} · {availabilityQuery.data.timezone}
                            </p>
                            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                              {selectedDay?.slots.map((item) => (
                                <button
                                  key={item.startAt}
                                  type="button"
                                  onClick={() => setSlot(item)}
                                  aria-pressed={slot?.startAt === item.startAt}
                                  className={cn(
                                    'rounded-xl border px-2 py-2.5 font-sans text-[10px] transition-all',
                                    slot?.startAt === item.startAt
                                      ? 'border-rose/40 bg-rose/15 text-rose'
                                      : 'border-white/10 text-ivory/70 hover:border-lavender/30 hover:text-ivory',
                                  )}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {step === 4 && (
                    <div>
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-rose">
                        Step 4 · Patient details
                      </p>
                      <h2 className="display mt-3 text-3xl sm:text-4xl">Only what is necessary.</h2>
                      <p className="mt-2 max-w-xl font-body text-[11.5px] leading-relaxed text-mauve">
                        Your reason for consultation is optional. Please do not include detailed
                        medical records here; those can be shared securely later if appropriate.
                      </p>

                      {!user ? (
                        <div className="mt-6 rounded-[24px] border border-lavender/20 bg-lavender/[0.05] p-6">
                          <LockKeyhole className="h-5 w-5 text-lavender" />
                          <h3 className="mt-4 font-display text-2xl text-ivory">Sign in to hold a slot.</h3>
                          <p className="mt-2 max-w-md font-body text-[11.5px] leading-relaxed text-mauve">
                            A private account is required so only you can see your appointment,
                            payments and documents. You can create one in a minute.
                          </p>
                          <div className="mt-5 flex flex-wrap gap-3">
                            <ButtonLink
                              to={`/login?next=${encodeURIComponent(`/book?doctor=${doctorSlug}&mode=${mode}${slot ? `&slot=${encodeURIComponent(slot.startAt)}` : ''}`)}`}
                              size="md"
                              arrow
                            >
                              Sign in
                            </ButtonLink>
                            <ButtonLink to="/register" variant="secondary" size="md">
                              Create an account
                            </ButtonLink>
                          </div>
                        </div>
                      ) : user.role !== 'PATIENT' ? (
                        <div className="mt-6 rounded-2xl border border-rose/20 bg-burgundy/20 p-5">
                          <p className="font-body text-[11.5px] leading-relaxed text-ivory/65">
                            This account is a {user.role.toLowerCase()} account. Booking is available
                            only to patient accounts. Please sign out and create a patient account, or
                            return to your dashboard.
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit(onDetails)} className="mt-6 space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="label-premium" htmlFor="fullName">Full name</label>
                              <input id="fullName" className="input-premium opacity-60" autoComplete="name" readOnly {...register('fullName')} />
                              <p className="mt-1.5 font-body text-[8px] text-mauve/60">
                                Taken from your verified patient profile.
                              </p>
                            </div>
                            <div>
                              <label className="label-premium" htmlFor="email">Email</label>
                              <input id="email" type="email" className="input-premium opacity-60" autoComplete="email" readOnly {...register('email')} />
                              <p className="mt-1.5 font-body text-[8px] text-mauve/60">
                                Appointment emails go to your account address.
                              </p>
                            </div>
                            <div>
                              <label className="label-premium" htmlFor="phone">Phone</label>
                              <input id="phone" className="input-premium" autoComplete="tel" placeholder="+91" {...register('phone')} />
                              {errors.phone && <p className="mt-1.5 font-body text-[10px] text-rose">{errors.phone.message}</p>}
                            </div>
                            <div>
                              <label className="label-premium" htmlFor="communicationPreference">
                                Communication preference
                              </label>
                              <select id="communicationPreference" className="input-premium" {...register('communicationPreference')}>
                                <option value="EMAIL">Email</option>
                                <option value="SMS">SMS</option>
                                <option value="WHATSAPP">WhatsApp</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="label-premium" htmlFor="reason">
                              Reason for consultation <span className="normal-case tracking-normal text-mauve/50">(optional)</span>
                            </label>
                            <textarea
                              id="reason"
                              rows={3}
                              className="input-premium resize-none"
                              placeholder="A short note, only if you want to. You can leave this blank."
                              {...register('reason')}
                            />
                            {errors.reason && <p className="mt-1.5 font-body text-[10px] text-rose">{errors.reason.message}</p>}
                          </div>
                          <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                            <label className="flex cursor-pointer items-start gap-3">
                              <input type="checkbox" className="mt-1 h-4 w-4 accent-[#C9A7F5]" {...register('ageConfirmed')} />
                              <span className="font-body text-[10.5px] leading-relaxed text-mauve">
                                I confirm I am 18 years or older.
                              </span>
                            </label>
                            {errors.ageConfirmed && <p className="font-body text-[10px] text-rose">{errors.ageConfirmed.message}</p>}
                            <label className="flex cursor-pointer items-start gap-3">
                              <input type="checkbox" className="mt-1 h-4 w-4 accent-[#C9A7F5]" {...register('consent')} />
                              <span className="font-body text-[10.5px] leading-relaxed text-mauve">
                                I consent to Nayacura processing this information to arrange the
                                appointment, and I have read the{' '}
                                <Link to="/legal/privacy" className="text-lavender underline">Privacy Policy</Link>,{' '}
                                <Link to="/legal/terms" className="text-lavender underline">Terms</Link> and{' '}
                                <Link to="/legal/teleconsultation-consent" className="text-lavender underline">Teleconsultation Consent</Link>.
                              </span>
                            </label>
                            {errors.consent && <p className="font-body text-[10px] text-rose">{errors.consent.message}</p>}
                          </div>
                          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                            <Button type="button" variant="ghost" onClick={back} icon={<ArrowLeft className="h-4 w-4" />}>
                              Back
                            </Button>
                            <Button type="submit" loading={creating} arrow>
                              Hold this slot & continue
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {step === 5 && appointment && paymentIntent && (
                    <div>
                      <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-rose">
                        Step 5 · Secure payment
                      </p>
                      <h2 className="display mt-3 text-3xl sm:text-4xl">Review and pay.</h2>
                      <p className="mt-2 font-body text-[11.5px] text-mauve">
                        Your slot is held for 15 minutes. No clinical details are sent to the payment
                        provider.
                      </p>

                      <div className="mt-6 rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                          <div>
                            <p className="font-sans text-[11px] font-semibold text-ivory">{appointment.doctor.name}</p>
                            <p className="mt-0.5 font-body text-[9.5px] text-mauve">
                              {formatDateTime(appointment.startAt, appointment.timezone)} ·{' '}
                              {appointment.mode === 'ONLINE' ? 'Video' : 'In person'}
                            </p>
                          </div>
                          <Badge tone="lavender">Held</Badge>
                        </div>
                        <div className="mt-4 space-y-2.5">
                          <div className="flex justify-between font-body text-[11px]">
                            <span className="text-mauve">Consultation fee</span>
                            <span className="text-ivory">{formatCurrency(paymentIntent.amountPaise - Math.round((paymentIntent.amountPaise * 18) / 118))}</span>
                          </div>
                          <div className="flex justify-between font-body text-[11px]">
                            <span className="text-mauve">Taxes (18% demo config)</span>
                            <span className="text-ivory">{formatCurrency(Math.round((paymentIntent.amountPaise * 18) / 118))}</span>
                          </div>
                          <div className="flex justify-between border-t border-white/[0.08] pt-3 font-sans text-sm font-semibold">
                            <span className="text-ivory">Total</span>
                            <span className="text-rose">{formatCurrency(paymentIntent.amountPaise)}</span>
                          </div>
                        </div>
                        <p className="mt-3 font-body text-[8.5px] leading-relaxed text-mauve/60">
                          Demo tax configuration. Applicable taxes and healthcare GST treatment must
                          be confirmed by a qualified Indian tax adviser. No card details are stored by
                          Nayacura.
                        </p>
                      </div>

                      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-lavender/15 bg-lavender/[0.04] p-4">
                        <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-lavender" />
                        <p className="font-body text-[10px] leading-relaxed text-mauve">
                          {paymentIntent.mode === 'demo'
                            ? 'Demo payment mode is active because Razorpay is not configured. No real money will be charged. This is not a live payment gateway.'
                            : 'Payment is processed by Razorpay. Nayacura verifies the signature and amount on the server before confirming the appointment.'}
                        </p>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
                        <ButtonLink
                          to="/dashboard?section=appointments"
                          variant="ghost"
                          icon={<ArrowLeft className="h-4 w-4" />}
                        >
                          Go to dashboard
                        </ButtonLink>
                        {paymentIntent.mode === 'demo' ? (
                          <Button
                            type="button"
                            onClick={() => void completeDemoPayment()}
                            loading={paying}
                            icon={<CreditCard className="h-4 w-4" />}
                          >
                            Complete demo payment
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => void openRazorpay()}
                            loading={paying}
                            icon={<CreditCard className="h-4 w-4" />}
                          >
                            Pay securely
                          </Button>
                        )}
                      </div>
                      <p className="mt-3 text-right font-body text-[8.5px] text-mauve/50">
                        By paying you agree to the{' '}
                        <Link to="/legal/cancellation-refund" className="underline">
                          cancellation and refund terms
                        </Link>
                        .
                      </p>
                    </div>
                  )}

                  {step === 6 && appointment && (
                    <div>
                      <div className="rounded-[28px] border border-lavender/20 bg-gradient-to-br from-burgundy/25 via-plum to-royal/15 p-6 sm:p-9">
                        <div className="grid h-14 w-14 place-items-center rounded-full border border-rose/25 bg-rose/10">
                          <CheckCircle2 className="h-7 w-7 text-rose" />
                        </div>
                        <p className="mt-6 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-rose">
                          Booking confirmed · demo
                        </p>
                        <h2 className="display mt-3 text-3xl sm:text-5xl">
                          {paymentDone ? 'Your appointment is confirmed.' : 'Your booking is created.'}
                        </h2>
                        <p className="mt-3 max-w-lg font-body text-[12px] leading-relaxed text-mauve">
                          A transactional email would be sent if SMTP is configured. The message
                          intentionally contains no clinical details. This demo does not deliver a
                          real clinical service.
                        </p>
                        <div className="mt-7 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-midnight/30 p-4">
                            <p className="font-body text-[8.5px] uppercase tracking-[0.15em] text-mauve">Booking ID</p>
                            <p className="mt-1 font-mono text-[13px] text-ivory">{appointment.bookingId}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-midnight/30 p-4">
                            <p className="font-body text-[8.5px] uppercase tracking-[0.15em] text-mauve">Payment status</p>
                            <p className="mt-1 font-sans text-[12px] font-semibold text-lavender">
                              {appointment.payment?.status === 'DEMO_PAID' ? 'Demo paid · no charge' : appointment.payment?.status || 'Pending'}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-midnight/30 p-4">
                            <p className="font-body text-[8.5px] uppercase tracking-[0.15em] text-mauve">Clinician</p>
                            <p className="mt-1 font-sans text-[12px] text-ivory">{appointment.doctor.name}</p>
                            <p className="font-body text-[9px] text-mauve">{appointment.doctor.title}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-midnight/30 p-4">
                            <p className="font-body text-[8.5px] uppercase tracking-[0.15em] text-mauve">Date & time</p>
                            <p className="mt-1 font-sans text-[11px] text-ivory">
                              {formatDateTime(appointment.startAt, appointment.timezone)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/10 bg-midnight/25 p-4">
                          <p className="font-sans text-[10px] font-semibold text-ivory">
                            {appointment.mode === 'ONLINE' ? 'Joining instructions' : 'Clinic details'}
                          </p>
                          <p className="mt-2 font-body text-[10px] leading-relaxed text-mauve">
                            {appointment.mode === 'ONLINE'
                              ? 'The secure video room opens 15 minutes before your appointment. Join from your dashboard after reading and accepting the teleconsultation consent. The room is not a public link.'
                              : 'Exact clinic details are not published in this demo. A production service would share the confirmed address through the account and appointment email.'}
                          </p>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <ButtonLink to="/dashboard?section=appointments" arrow>
                            Go to my appointments
                          </ButtonLink>
                          {appointment.mode === 'ONLINE' && (
                            <ButtonLink
                              to={`/consult/${appointment.id}`}
                              variant="secondary"
                              icon={<Video className="h-4 w-4" />}
                            >
                              Consultation room
                            </ButtonLink>
                          )}
                          <ButtonLink to="/doctors" variant="ghost">
                            Back to specialists
                          </ButtonLink>
                        </div>
                        <p className="mt-4 font-body text-[8.5px] leading-relaxed text-mauve/50">
                          A development demo does not create a real appointment. Reschedule and
                          cancellation options are in your dashboard.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {step === 1 || step === 2 || step === 3 ? (
                <div className="mt-8 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={back}
                    disabled={step === 1}
                    icon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Back
                  </Button>
                  {step < 3 ? (
                    <Button type="button" onClick={next} disabled={!doctor}>
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="button" onClick={next} disabled={!slot}>
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : null}
            </div>

            <aside className="min-w-0">
              <div className="sticky top-28">
                <Summary doctor={selectedDoctor} mode={mode} slot={slot} step={step} />
                <div className="mt-3 rounded-2xl border border-white/[0.07] p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-rose" />
                    <p className="font-sans text-[10px] font-semibold text-ivory">Need help choosing?</p>
                  </div>
                  <p className="mt-1.5 font-body text-[9.5px] leading-relaxed text-mauve">
                    Naya can explain specialist categories without diagnosing you.
                  </p>
                  <Link to="/ai" className="mt-3 inline-flex items-center gap-1 font-sans text-[9.5px] font-semibold text-lavender">
                    Ask Naya <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="mt-3">
                  <DemoNotice compact />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
