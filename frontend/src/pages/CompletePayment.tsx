import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Seo } from '@/components/Seo';
import { Badge } from '@/components/ui/Badge';
import { DoctorAvatar } from '@/components/ui/DoctorAvatar';
import { Button, ButtonLink } from '@/components/ui/Button';
import { PageLoader, ErrorState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Appointment } from '@/types';

type PaymentIntent = {
  provider: 'RAZORPAY' | 'DEMO';
  providerOrderId: string | null;
  keyId: string | null;
  amountPaise: number;
  mode: 'live' | 'demo';
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CompletePayment() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const { push } = useToast();
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [starting, setStarting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const appointmentQuery = useQuery({
    queryKey: ['payment-appointment', id],
    enabled: Boolean(user && id),
    queryFn: () => api<{ appointment: Appointment }>(`/appointments/${id}`),
  });

  if (loading) return <PageLoader label="Opening secure payment" />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(`/payment/${id}`)}`} replace />;
  if (appointmentQuery.isLoading) return <PageLoader label="Loading booking" />;
  if (appointmentQuery.isError || !appointmentQuery.data) {
    return (
      <div className="container-naya pb-20 pt-36">
        <ErrorState
          title="Payment could not load"
          description="The appointment may not exist or may not belong to your account."
          onRetry={() => void appointmentQuery.refetch()}
        />
      </div>
    );
  }

  const appointment = appointmentQuery.data.appointment;
  const alreadyPaid = ['PAID', 'DEMO_PAID'].includes(appointment.payment?.status || '');

  async function startPayment() {
    setStarting(true);
    try {
      const result = await api<{ payment: PaymentIntent }>(
        `/appointments/${appointment.id}/payment/order`,
        { method: 'POST' },
      );
      setIntent(result.payment);
    } catch (error) {
      push({
        title: 'Could not start payment',
        description: error instanceof Error ? error.message : 'The hold may have expired.',
        tone: 'error',
      });
    } finally {
      setStarting(false);
    }
  }

  async function verifyDemo() {
    setPaying(true);
    try {
      await api(`/appointments/${appointment.id}/payment/verify`, {
        method: 'POST',
        body: { demo: true },
      });
      setConfirmed(true);
      push({ title: 'Demo payment recorded', description: 'No real money was charged.', tone: 'success' });
      await appointmentQuery.refetch();
    } catch (error) {
      push({
        title: 'Payment could not be verified',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      });
    } finally {
      setPaying(false);
    }
  }

  async function openRazorpay() {
    if (!intent?.keyId || !intent.providerOrderId) return;
    if (!document.getElementById('razorpay-checkout-js')) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.id = 'razorpay-checkout-js';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Could not load the payment window.'));
        document.body.appendChild(script);
      }).catch((error) => {
        push({ title: 'Payment window unavailable', description: error.message, tone: 'error' });
        throw error;
      });
    }
    if (!window.Razorpay) return;
    new window.Razorpay({
      key: intent.keyId,
      amount: intent.amountPaise,
      currency: 'INR',
      name: 'Nayacura',
      description: `Consultation ${appointment.bookingId}`,
      order_id: intent.providerOrderId,
      theme: { color: '#6E35A4' },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        setPaying(true);
        try {
          await api(`/appointments/${appointment.id}/payment/verify`, {
            method: 'POST',
            body: response,
          });
          setConfirmed(true);
          await appointmentQuery.refetch();
        } catch (error) {
          push({
            title: 'Payment verification failed',
            description: error instanceof Error ? error.message : undefined,
            tone: 'error',
          });
        } finally {
          setPaying(false);
        }
      },
    }).open();
  }

  if (confirmed || alreadyPaid) {
    return (
      <>
        <Seo title="Payment Confirmed" description="Consultation payment confirmation." path={`/payment/${id}`} noIndex />
        <section className="relative bg-midnight pb-20 pt-36">
          <div className="container-editorial">
            <div className="mx-auto max-w-xl rounded-[28px] border border-lavender/20 bg-gradient-to-br from-burgundy/25 via-plum to-royal/15 p-7 text-center sm:p-10">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-rose/25 bg-rose/10">
                <CheckCircle2 className="h-6 w-6 text-rose" />
              </div>
              <p className="mt-6 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-rose">
                Payment {appointment.payment?.status === 'DEMO_PAID' ? 'recorded (demo)' : 'confirmed'}
              </p>
              <h1 className="display mt-3 text-4xl">The slot is yours.</h1>
              <div className="mt-3 flex items-center justify-center gap-2.5">
                <DoctorAvatar doctor={appointment.doctor} size="sm" />
                <p className="font-body text-[12px] leading-relaxed text-mauve">
                  {appointment.doctor.name} · {formatDateTime(appointment.startAt, appointment.timezone)}
                </p>
              </div>
              <div className="mt-5 rounded-xl border border-white/10 bg-midnight/30 p-4 text-left">
                <p className="font-body text-[8px] uppercase tracking-[0.15em] text-mauve">Booking ID</p>
                <p className="mt-1 font-mono text-sm text-ivory">{appointment.bookingId}</p>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <ButtonLink to="/dashboard?section=appointments" arrow>
                  Go to my appointments
                </ButtonLink>
                {appointment.mode === 'ONLINE' && (
                  <ButtonLink to={`/consult/${appointment.id}`} variant="secondary" icon={<Video className="h-4 w-4" />}>
                    Consultation room
                  </ButtonLink>
                )}
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (appointment.status !== 'PENDING_PAYMENT') {
    return (
      <>
        <Seo title="Payment Unavailable" description="This consultation payment can no longer be completed." path={`/payment/${id}`} noIndex />
        <section className="relative bg-midnight pb-20 pt-36">
          <div className="container-editorial">
            <div className="mx-auto max-w-xl rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-8 text-center">
              <ShieldAlert className="mx-auto h-6 w-6 text-rose" />
              <h1 className="display mt-5 text-4xl">This payment can no longer be completed.</h1>
              <p className="mt-3 font-body text-[12px] leading-relaxed text-mauve">
                The appointment status is {appointment.status.replace(/_/g, ' ').toLowerCase()}. The
                payment hold may have expired, or the booking may already be confirmed.
              </p>
              <ButtonLink to="/doctors" className="mt-6" arrow>
                Choose another time
              </ButtonLink>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Seo title="Complete Your Payment" description="Complete secure payment for a held consultation slot." path={`/payment/${id}`} noIndex />
      <section className="relative bg-midnight pb-20 pt-36">
        <div className="container-editorial">
          <div className="mx-auto max-w-2xl">
            <p className="eyebrow mb-4">Held appointment</p>
            <h1 className="display text-[clamp(2.6rem,5vw,4.4rem)]">
              Complete your <span className="display-soft">payment.</span>
            </h1>
            <p className="mt-4 max-w-xl font-body text-[12px] leading-relaxed text-mauve">
              Your slot is temporarily held. Complete payment to confirm the appointment. No clinical
              details are sent to the payment provider.
            </p>

            <div className="mt-8 rounded-[26px] border border-white/[0.08] bg-white/[0.025] p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2.5">
                  <DoctorAvatar doctor={appointment.doctor} size="sm" />
                  <div>
                    <p className="font-sans text-[12px] font-semibold text-ivory">{appointment.doctor.name}</p>
                    <p className="mt-1 font-body text-[9.5px] text-mauve">{appointment.doctor.title}</p>
                  </div>
                </div>
                <Badge tone="rose">Awaiting payment</Badge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <CalendarDays className="mt-0.5 h-3.5 w-3.5 text-lavender" />
                  <div>
                    <p className="font-body text-[8.5px] uppercase tracking-[0.14em] text-mauve">Date & time</p>
                    <p className="mt-1 font-sans text-[10px] text-ivory">
                      {formatDateTime(appointment.startAt, appointment.timezone)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  {appointment.mode === 'ONLINE' ? (
                    <Video className="mt-0.5 h-3.5 w-3.5 text-lavender" />
                  ) : (
                    <CalendarDays className="mt-0.5 h-3.5 w-3.5 text-lavender" />
                  )}
                  <div>
                    <p className="font-body text-[8.5px] uppercase tracking-[0.14em] text-mauve">Format</p>
                    <p className="mt-1 font-sans text-[10px] text-ivory">
                      {appointment.mode === 'ONLINE' ? 'Secure video' : 'In person'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-white/[0.08] pt-4">
                <div className="flex justify-between font-body text-[10px]">
                  <span className="text-mauve">Consultation fee</span>
                  <span className="text-ivory">
                    {formatCurrency((appointment.payment?.amountPaise || 0))}
                  </span>
                </div>
                <div className="flex justify-between font-body text-[10px]">
                  <span className="text-mauve">Taxes</span>
                  <span className="text-ivory">
                    {formatCurrency((appointment.payment?.taxPaise || 0))}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/[0.08] pt-2 font-sans text-sm font-semibold">
                  <span className="text-ivory">Total</span>
                  <span className="text-rose">
                    {formatCurrency(
                      appointment.payment?.totalPaise ||
                        (appointment.payment?.amountPaise || 0) + (appointment.payment?.taxPaise || 0),
                    )}
                  </span>
                </div>
              </div>
              <p className="mt-3 font-body text-[8px] leading-relaxed text-mauve/60">
                Demo tax configuration only. The applicable GST treatment of healthcare services must
                be confirmed by a qualified adviser.
              </p>
            </div>

            {!intent ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="font-body text-[9px] text-mauve">
                  <LockKeyhole className="mr-1 inline h-3 w-3" /> Payment is processed server-side.
                </p>
                <Button onClick={() => void startPayment()} loading={starting} icon={<CreditCard className="h-4 w-4" />}>
                  Start secure payment
                </Button>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-lavender/15 bg-lavender/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lavender" />
                  <p className="font-body text-[10px] leading-relaxed text-mauve">
                    {intent.mode === 'demo'
                      ? 'Demo payment mode is active. No real money will be charged.'
                      : 'Razorpay is ready. Nayacura will verify the signature and amount on the server.'}
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  {intent.mode === 'demo' ? (
                    <Button onClick={() => void verifyDemo()} loading={paying}>
                      Complete demo payment
                    </Button>
                  ) : (
                    <Button onClick={() => void openRazorpay()} loading={paying}>
                      Open secure payment
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Link
                to="/dashboard?section=appointments"
                className="font-sans text-[10px] text-mauve hover:text-ivory"
              >
                Return to my appointments
              </Link>
              <Link
                to="/legal/cancellation-refund"
                className="font-sans text-[10px] text-mauve hover:text-ivory"
              >
                Cancellation & refund terms
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
