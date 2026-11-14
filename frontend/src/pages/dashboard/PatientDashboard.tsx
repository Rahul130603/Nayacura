import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  FileText,
  FolderLock,
  Headphones,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  MessageCircle,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Upload,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import { api, ApiError, uploadMedicalDocument } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { DashboardShell, type DashboardNavItem } from '@/components/layout/DashboardShell';
import { Seo } from '@/components/Seo';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { DoctorAvatar } from '@/components/ui/DoctorAvatar';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import type { Appointment, AppointmentStatus, Payment, SupportTicket } from '@/types';

type OverviewResponse = {
  user: { id: string; name: string; email: string; emailVerified: boolean };
  patient: {
    id: string;
    phone: string | null;
    preferredLanguage: string;
    communicationPreference: string;
    aiHistoryEnabled: boolean;
  };
  upcoming: Appointment[];
  notifications: {
    id: string;
    title: string;
    body: string;
    type: string;
    readAt: string | null;
    createdAt: string;
  }[];
  unreadCount: number;
  stats: { upcoming: number };
  recentDocuments: DocumentItem[];
  recentPayments: (Payment & { bookingId: string })[];
};

type DocumentItem = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  createdAt: string;
  uploader?: string;
};

type PrescriptionItem = {
  id: string;
  medications: { name: string; dosage: string; frequency: string; duration: string }[];
  instructions: string;
  issuedAt: string;
  status: string;
  doctorName: string;
  bookingId: string;
  appointmentDate: string;
  disclaimer: string;
};

type PaymentItem = {
  id: string;
  bookingId: string;
  doctorName: string;
  startAt: string;
  amountPaise: number;
  taxPaise: number;
  totalPaise: number;
  currency: string;
  status: string;
  provider: string;
  createdAt: string;
  paidAt: string | null;
  refunds: { id: string; amountPaise: number; status: string; createdAt: string }[];
};

type ProfileResponse = {
  profile: {
    name: string;
    email: string;
    emailVerified: boolean;
    phone: string | null;
    preferredLanguage: string;
    communicationPreference: string;
    marketingConsent: boolean;
    aiHistoryEnabled: boolean;
    deletionRequestedAt: string | null;
    createdAt: string;
  };
};

type SessionItem = {
  id: string;
  userAgent: string | null;
  current: boolean;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

type AvailabilityDay = {
  date: string;
  label: string;
  shortLabel: string;
  slots: { startAt: string; endAt: string; label: string }[];
};

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Payment pending',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No show',
  RESCHEDULED: 'Rescheduled',
};

function statusTone(status: string): 'lavender' | 'rose' | 'muted' | 'burgundy' {
  if (status === 'CONFIRMED' || status === 'IN_PROGRESS') return 'lavender';
  if (status === 'PENDING_PAYMENT') return 'rose';
  if (status === 'CANCELLED') return 'burgundy';
  return 'muted';
}

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function QuickStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-lavender">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <p className="mt-4 font-display text-3xl text-ivory">{value}</p>
      <p className="mt-0.5 font-body text-[9px] uppercase tracking-[0.12em] text-mauve/60">{label}</p>
    </div>
  );
}

function AppointmentRow({
  appointment,
  onCancel,
  onReschedule,
  onReview,
  onNotes,
}: {
  appointment: Appointment;
  onCancel: (appointment: Appointment) => void;
  onReschedule: (appointment: Appointment) => void;
  onReview: (appointment: Appointment) => void;
  onNotes: (appointment: Appointment) => void;
}) {
  const canJoin = appointment.canJoin;
  const upcoming = new Date(appointment.startAt) > new Date();
  return (
    <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4 transition-colors hover:border-white/[0.12] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3 sm:w-[210px] sm:shrink-0">
          <div className="w-14 shrink-0 rounded-xl border border-white/[0.08] bg-midnight/40 px-1 py-2 text-center">
            <p className="font-sans text-[8px] font-semibold uppercase tracking-wider text-rose">
              {formatDate(appointment.startAt, { weekday: 'short' })}
            </p>
            <p className="font-display text-2xl leading-none text-ivory">
              {new Date(appointment.startAt).getDate()}
            </p>
            <p className="mt-0.5 font-body text-[8px] text-mauve">
              {new Date(appointment.startAt).toLocaleString('en-IN', { month: 'short' })}
            </p>
          </div>
          <div>
            <p className="font-sans text-[10px] font-semibold text-ivory">
              {new Date(appointment.startAt).toLocaleTimeString('en-IN', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
            <p className="mt-0.5 font-body text-[9px] text-mauve">{appointment.timezone}</p>
            <Badge tone={statusTone(appointment.status)} className="mt-1.5">
              {statusLabels[appointment.status] || appointment.status}
            </Badge>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <DoctorAvatar doctor={appointment.doctor} size="sm" />
              <div>
                <p className="font-sans text-[12px] font-semibold text-ivory">{appointment.doctor.name}</p>
                <p className="mt-0.5 font-body text-[9.5px] text-mauve">{appointment.doctor.title}</p>
              </div>
            </div>
            <span className="font-mono text-[8px] text-mauve/50">{appointment.bookingId}</span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-body text-[9px] text-mauve">
            <span className="inline-flex items-center gap-1">
              {appointment.mode === 'ONLINE' ? <Video className="h-3 w-3" /> : <FolderLock className="h-3 w-3" />}
              {appointment.mode === 'ONLINE' ? 'Secure video' : 'In person'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {formatDateTime(appointment.startAt, appointment.timezone)}
            </span>
            {appointment.payment && (
              <span>
                {appointment.payment.status === 'DEMO_PAID'
                  ? 'Demo paid'
                  : appointment.payment.status === 'PAID'
                    ? 'Paid'
                    : 'Payment pending'}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {appointment.status === 'PENDING_PAYMENT' && (
              <ButtonLink
                to={`/payment/${appointment.id}`}
                size="sm"
                className="min-h-8 px-3 text-[9.5px]"
                icon={<CreditCard className="h-3.5 w-3.5" />}
              >
                Complete payment
              </ButtonLink>
            )}
            {appointment.mode === 'ONLINE' && ['CONFIRMED', 'IN_PROGRESS'].includes(appointment.status) && (
              canJoin ? (
                <ButtonLink
                  to={`/consult/${appointment.id}`}
                  size="sm"
                  icon={<Video className="h-3.5 w-3.5" />}
                  className="min-h-8 px-3 text-[9.5px]"
                >
                  Join room
                </ButtonLink>
              ) : (
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/[0.08] px-3 font-body text-[9px] text-mauve/60">
                  <Clock3 className="h-3 w-3" /> Room opens 15 min before
                </span>
              )
            )}
            {['CONFIRMED', 'PENDING_PAYMENT'].includes(appointment.status) && upcoming && (
              <>
                <button
                  type="button"
                  onClick={() => onReschedule(appointment)}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/10 px-3 font-sans text-[9px] text-mauve transition-colors hover:border-lavender/30 hover:text-ivory"
                >
                  <RefreshCw className="h-3 w-3" /> Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => onCancel(appointment)}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/10 px-3 font-sans text-[9px] text-mauve transition-colors hover:border-rose/30 hover:text-rose"
                >
                  <X className="h-3 w-3" /> Cancel
                </button>
              </>
            )}
            {['COMPLETED', 'IN_PROGRESS'].includes(appointment.status) && (
              <button
                type="button"
                onClick={() => onNotes(appointment)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/10 px-3 font-sans text-[9px] text-mauve transition-colors hover:border-lavender/30 hover:text-ivory"
              >
                <FileText className="h-3 w-3" /> Clinical record
              </button>
            )}
            {appointment.status === 'COMPLETED' && (
              <button
                type="button"
                onClick={() => onReview(appointment)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/10 px-3 font-sans text-[9px] text-mauve transition-colors hover:border-rose/30 hover:text-rose"
              >
                <Star className="h-3 w-3" /> Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniCalendar({
  appointments,
  selected,
  onSelect,
}: {
  appointments: Appointment[];
  selected: string | null;
  onSelect: (date: string | null) => void;
}) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const appointmentDays = useMemo(() => {
    const map = new Map<string, number>();
    appointments.forEach((appointment) => {
      const date = new Date(appointment.startAt);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [appointments]);

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) => {
    if (index < firstDay) return null;
    return index - firstDay + 1;
  });
  const monthLabel = month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.025] p-4">
      <div className="flex items-center justify-between">
        <p className="font-sans text-[11px] font-semibold text-ivory">{monthLabel}</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="grid h-6 w-6 place-items-center rounded-full border border-white/10 text-mauve hover:text-ivory"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="grid h-6 w-6 place-items-center rounded-full border border-white/10 text-mauve hover:text-ivory"
            aria-label="Next month"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <span key={`${day}-${index}`} className="font-body text-[8px] text-mauve/40">
            {day}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <span key={`empty-${index}`} />;
          const date = new Date(month.getFullYear(), month.getMonth(), day);
          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          const count = appointmentDays.get(key) || 0;
          const isSelected = selected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(isSelected ? null : key)}
              className={cn(
                'relative grid aspect-square place-items-center rounded-lg font-body text-[9px] transition-colors',
                isSelected
                  ? 'bg-lavender/15 text-ivory'
                  : count
                    ? 'text-ivory hover:bg-white/[0.05]'
                    : 'text-mauve/40 hover:bg-white/[0.03]',
              )}
              aria-label={`${date.toDateString()}${count ? `, ${count} appointment(s)` : ''}`}
            >
              {day}
              {count > 0 && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-rose" />
              )}
            </button>
          );
        })}
      </div>
      {selected && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="mt-3 w-full border-t border-white/[0.07] pt-2.5 font-sans text-[8px] font-semibold uppercase tracking-wider text-mauve hover:text-ivory"
        >
          Clear date filter
        </button>
      )}
    </div>
  );
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const section = params.get('section') || 'overview';
  const { push } = useToast();
  const queryClient = useQueryClient();

  const overviewQuery = useQuery({
    queryKey: ['patient-overview'],
    queryFn: () => api<OverviewResponse>('/patient/overview'),
  });
  const appointmentsQuery = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => api<{ appointments: Appointment[] }>('/patient/appointments'),
  });
  const documentsQuery = useQuery({
    queryKey: ['patient-documents'],
    queryFn: () => api<{ documents: DocumentItem[] }>('/patient/documents'),
  });
  const prescriptionsQuery = useQuery({
    queryKey: ['patient-prescriptions'],
    queryFn: () => api<{ prescriptions: PrescriptionItem[] }>('/patient/prescriptions'),
  });
  const paymentsQuery = useQuery({
    queryKey: ['patient-payments'],
    queryFn: () => api<{ payments: PaymentItem[] }>('/patient/payments'),
  });
  const profileQuery = useQuery({
    queryKey: ['patient-profile'],
    queryFn: () => api<ProfileResponse>('/patient/profile'),
  });
  const sessionsQuery = useQuery({
    queryKey: ['patient-sessions'],
    queryFn: () => api<{ sessions: SessionItem[] }>('/auth/sessions'),
    enabled: section === 'privacy',
  });
  const ticketsQuery = useQuery({
    queryKey: ['patient-tickets'],
    queryFn: () => api<{ tickets: SupportTicket[] }>('/support/tickets'),
    enabled: section === 'support',
  });

  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [rescheduleDays, setRescheduleDays] = useState<AvailabilityDay[]>([]);
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [notesTarget, setNotesTarget] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState<{ id: string; content: string; createdAt: string }[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<'REPORT' | 'PRESCRIPTION' | 'REFERRAL' | 'OTHER'>('REPORT');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [aiHistoryOpen, setAiHistoryOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [calendarDate, setCalendarDate] = useState<string | null>(null);
  const [appointmentFilter, setAppointmentFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const overview = overviewQuery.data;
  const appointments = appointmentsQuery.data?.appointments || [];
  const documents = documentsQuery.data?.documents || [];
  const prescriptions = prescriptionsQuery.data?.prescriptions || [];
  const payments = paymentsQuery.data?.payments || [];
  const profile = profileQuery.data?.profile;
  const tickets = ticketsQuery.data?.tickets || [];

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    preferredLanguage: 'en',
    communicationPreference: 'EMAIL',
    marketingConsent: false,
  });

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      name: profile.name,
      phone: profile.phone || '',
      preferredLanguage: profile.preferredLanguage,
      communicationPreference: profile.communicationPreference,
      marketingConsent: profile.marketingConsent,
    });
  }, [profile]);

  async function refreshAll() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['patient-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] }),
      queryClient.invalidateQueries({ queryKey: ['patient-documents'] }),
      queryClient.invalidateQueries({ queryKey: ['patient-prescriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['patient-payments'] }),
    ]);
  }

  async function cancelAppointment() {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      const result = await api<{ refund: { amountPaise: number } | null }>(
        `/appointments/${cancelTarget.id}/cancel`,
        { method: 'POST', body: { reason: cancelReason || undefined } },
      );
      push({
        title: 'Appointment cancelled',
        description: result.refund
          ? `A refund of ${formatCurrency(result.refund.amountPaise)} has been recorded as pending.`
          : 'No refund is recorded under the demo terms.',
        tone: 'success',
      });
      setCancelTarget(null);
      setCancelReason('');
      await refreshAll();
    } catch (error) {
      push({ title: 'Could not cancel', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function openReschedule(appointment: Appointment) {
    setRescheduleTarget(appointment);
    setRescheduleSlot('');
    setRescheduleDays([]);
    setRescheduleLoading(true);
    try {
      const data = await api<{ days: AvailabilityDay[] }>(
        `/doctors/${appointment.doctor.slug}/availability?mode=${appointment.mode}&days=21`,
      );
      setRescheduleDays(data.days);
    } catch (error) {
      push({ title: 'Availability could not load', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setRescheduleLoading(false);
    }
  }

  async function submitReschedule() {
    if (!rescheduleTarget || !rescheduleSlot) return;
    setActionLoading(true);
    try {
      await api(`/appointments/${rescheduleTarget.id}/reschedule`, {
        method: 'POST',
        body: { startAt: rescheduleSlot },
      });
      push({ title: 'Appointment rescheduled', tone: 'success' });
      setRescheduleTarget(null);
      await refreshAll();
    } catch (error) {
      push({ title: 'Could not reschedule', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function submitReview() {
    if (!reviewTarget) return;
    setActionLoading(true);
    try {
      await api(`/appointments/${reviewTarget.id}/review`, {
        method: 'POST',
        body: { rating: reviewRating, body: reviewBody },
      });
      push({
        title: 'Review submitted for moderation',
        description: 'It will appear only if approved. This demo does not publish unverified reviews.',
        tone: 'success',
      });
      setReviewTarget(null);
      setReviewBody('');
      await refreshAll();
    } catch (error) {
      push({ title: 'Could not submit review', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function openNotes(appointment: Appointment) {
    setNotesTarget(appointment);
    setNotesLoading(true);
    setNotes([]);
    try {
      const data = await api<{ notes: { id: string; content: string; createdAt: string }[] }>(
        `/appointments/${appointment.id}/notes`,
      );
      setNotes(data.notes);
    } catch (error) {
      push({ title: 'Clinical record could not load', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setNotesLoading(false);
    }
  }

  async function uploadDocument(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      push({ title: 'File is too large', description: 'Use a PDF, JPEG or PNG under 5 MB.', tone: 'error' });
      return;
    }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      push({ title: 'Unsupported file type', description: 'Only PDF, JPEG and PNG are accepted.', tone: 'error' });
      return;
    }
    setUploading(true);
    try {
      await uploadMedicalDocument(file, uploadCategory);
      push({ title: 'Document stored securely', description: 'Access is limited to your care team.', tone: 'success' });
      event.target.value = '';
      await documentsQuery.refetch();
      await overviewQuery.refetch();
    } catch (error) {
      push({ title: 'Upload failed', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await api(`/patient/documents/${deleteTarget}`, { method: 'DELETE' });
      push({ title: 'Document removed', tone: 'success' });
      setDeleteTarget(null);
      await documentsQuery.refetch();
    } catch (error) {
      push({ title: 'Could not remove document', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setActionLoading(true);
    try {
      await api('/patient/profile', { method: 'PATCH', body: profileForm });
      push({ title: 'Profile updated', tone: 'success' });
      await Promise.all([profileQuery.refetch(), overviewQuery.refetch()]);
    } catch (error) {
      push({ title: 'Could not update profile', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function toggleAiHistory() {
    if (!profile) return;
    try {
      await api('/patient/profile', {
        method: 'PATCH',
        body: { aiHistoryEnabled: !profile.aiHistoryEnabled },
      });
      push({ title: profile.aiHistoryEnabled ? 'AI storage preference disabled' : 'AI storage preference enabled', tone: 'success' });
      await profileQuery.refetch();
    } catch (error) {
      push({ title: 'Could not update preference', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    }
  }

  async function revokeSession(id: string) {
    try {
      await api(`/auth/sessions/${id}`, { method: 'DELETE' });
      push({ title: 'Session signed out', tone: 'success' });
      await sessionsQuery.refetch();
    } catch (error) {
      push({ title: 'Could not revoke session', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    }
  }

  async function deleteAiHistory() {
    setActionLoading(true);
    try {
      await api('/ai/conversations', { method: 'DELETE' });
      push({ title: 'AI conversation history deleted', tone: 'success' });
      setAiHistoryOpen(false);
      await profileQuery.refetch();
    } catch (error) {
      push({ title: 'Could not delete history', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function requestAccountDeletion() {
    setActionLoading(true);
    try {
      const result = await api<{ message: string; reference: string }>('/auth/account-deletion', {
        method: 'POST',
        body: { reason: deleteReason || undefined, confirmation: true },
      });
      push({
        title: 'Deletion request logged',
        description: `Reference ${result.reference}. The demo does not delete records automatically.`,
        tone: 'success',
      });
      setDeleteAccountOpen(false);
      window.location.assign('/login');
    } catch (error) {
      push({ title: 'Could not submit request', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function replyToTicket(ticketId: string) {
    if (!replyText.trim()) return;
    setActionLoading(true);
    try {
      await api(`/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: { message: replyText },
      });
      setReplyText('');
      push({ title: 'Reply sent', tone: 'success' });
      await ticketsQuery.refetch();
    } catch (error) {
      push({ title: 'Could not send reply', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  const filteredAppointments = useMemo(() => {
    let list = appointments;
    const now = new Date();
    if (appointmentFilter === 'upcoming') {
      list = list.filter(
        (item) => new Date(item.startAt) >= now && !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(item.status),
      );
    } else if (appointmentFilter === 'past') {
      list = list.filter(
        (item) => new Date(item.startAt) < now || ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(item.status),
      );
    }
    if (calendarDate) {
      list = list.filter((item) => {
        const date = new Date(item.startAt);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` === calendarDate;
      });
    }
    return [...list].sort((a, b) =>
      appointmentFilter === 'upcoming'
        ? new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        : new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
    );
  }, [appointments, appointmentFilter, calendarDate]);

  const navItems: DashboardNavItem[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'appointments', label: 'Appointments', icon: CalendarDays, badge: overview?.stats.upcoming },
    { key: 'records', label: 'Records & prescriptions', icon: FolderLock },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'profile', label: 'Profile settings', icon: UserRound },
    { key: 'privacy', label: 'Privacy & security', icon: ShieldCheck },
    { key: 'support', label: 'Support requests', icon: LifeBuoy },
  ];

  const sectionTitles: Record<string, string> = {
    overview: 'Your private space',
    appointments: 'Appointments',
    records: 'Records & prescriptions',
    payments: 'Payments',
    profile: 'Profile settings',
    privacy: 'Privacy & security',
    support: 'Support requests',
  };

  if (overviewQuery.isError) {
    return (
      <DashboardShell
        portal="Patient portal"
        title="Patient dashboard"
        subtitle="Private care, managed securely"
        navItems={navItems}
        accent="rose"
      >
        <ErrorState
          title="Your dashboard could not load"
          description="Your session may have expired or the API is unavailable."
          onRetry={() => void overviewQuery.refetch()}
        />
      </DashboardShell>
    );
  }

  return (
    <>
      <Seo
        title="Patient Dashboard"
        description="Private appointments, documents, prescriptions and payment history."
        path="/dashboard"
        noIndex
      />
      <DashboardShell
        portal="Patient portal"
        title={sectionTitles[section] || 'Your private space'}
        subtitle={`Good to see you, ${user?.name?.split(' ')[0] || 'there'}. Everything here is private to your account.`}
        navItems={navItems}
        accent="rose"
      >
        {overviewQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : section === 'overview' ? (
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-[24px] border border-lavender/15 bg-gradient-to-br from-burgundy/30 via-plum to-royal/15 p-5 sm:p-7">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10" />
                  <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-rose">
                        {overview?.upcoming.length ? 'Next appointment' : 'Begin whenever you are ready'}
                      </p>
                      <h2 className="mt-2 font-display text-[clamp(1.7rem,3vw,2.5rem)] leading-tight text-ivory">
                        {overview?.upcoming.length
                          ? overview.upcoming[0].doctor.name
                          : 'You do not have to begin with all the words.'}
                      </h2>
                      {overview?.upcoming.length ? (
                        <p className="mt-2 font-body text-[11px] text-mauve">
                          {formatDateTime(overview.upcoming[0].startAt, overview.upcoming[0].timezone)} ·{' '}
                          {overview.upcoming[0].mode === 'ONLINE' ? 'Secure video' : 'In person'}
                        </p>
                      ) : (
                        <p className="mt-2 max-w-md font-body text-[11px] leading-relaxed text-mauve">
                          Browse a specialist, ask Naya a general question or read the journal first.
                          There is no pressure to book today.
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {overview?.upcoming.length ? (
                        <ButtonLink
                          to={
                            overview.upcoming[0].status === 'PENDING_PAYMENT'
                              ? `/payment/${overview.upcoming[0].id}`
                              : overview.upcoming[0].canJoin
                                ? `/consult/${overview.upcoming[0].id}`
                                : '/dashboard?section=appointments'
                          }
                          size="sm"
                          variant={overview.upcoming[0].canJoin || overview.upcoming[0].status === 'PENDING_PAYMENT' ? 'primary' : 'secondary'}
                          icon={
                            overview.upcoming[0].status === 'PENDING_PAYMENT' ? (
                              <CreditCard className="h-3.5 w-3.5" />
                            ) : overview.upcoming[0].canJoin ? (
                              <Video className="h-3.5 w-3.5" />
                            ) : (
                              <CalendarDays className="h-3.5 w-3.5" />
                            )
                          }
                        >
                          {overview.upcoming[0].status === 'PENDING_PAYMENT'
                            ? 'Complete payment'
                            : overview.upcoming[0].canJoin
                              ? 'Join secure room'
                              : 'View appointment'}
                        </ButtonLink>
                      ) : (
                        <ButtonLink to="/doctors" size="sm" arrow>
                          Find a specialist
                        </ButtonLink>
                      )}
                    </div>
                  </div>
                  {overview?.upcoming[0] && (
                    <div className="relative z-10 mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                      <DoctorAvatar doctor={overview.upcoming[0].doctor} size="sm" />
                      <span className="font-body text-[9.5px] text-ivory/60">
                        {overview.upcoming[0].doctor.title}
                      </span>
                      <span className="ml-auto font-mono text-[8px] text-mauve/50">
                        {overview.upcoming[0].bookingId}
                      </span>
                    </div>
                  )}
                </div>

                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-sans text-[11px] font-semibold text-ivory">Upcoming care</p>
                      <p className="mt-0.5 font-body text-[9px] text-mauve">Your next scheduled conversations</p>
                    </div>
                    <Link
                      to="/dashboard?section=appointments"
                      className="font-sans text-[9px] font-semibold text-lavender hover:text-rose"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="mt-4 space-y-2">
                    {overview?.upcoming.length ? (
                      overview.upcoming.map((appointment) => (
                        <AppointmentRow
                          key={appointment.id}
                          appointment={appointment}
                          onCancel={setCancelTarget}
                          onReschedule={(item) => void openReschedule(item)}
                          onReview={setReviewTarget}
                          onNotes={(item) => void openNotes(item)}
                        />
                      ))
                    ) : (
                      <EmptyState
                        className="py-8"
                        icon={<CalendarDays className="h-5 w-5" />}
                        title="No upcoming appointments"
                        description="When you book a consultation, it will appear here with joining instructions."
                        action={
                          <ButtonLink to="/doctors" size="sm" arrow>
                            Browse specialists
                          </ButtonLink>
                        }
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-sans text-[11px] font-semibold text-ivory">Notifications</p>
                    {overview?.unreadCount ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await api('/patient/notifications/read-all', { method: 'POST' });
                          await overviewQuery.refetch();
                        }}
                        className="font-sans text-[8px] font-semibold uppercase tracking-wider text-lavender hover:text-rose"
                      >
                        Mark all read
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4 space-y-3">
                    {overview?.notifications.length ? (
                      overview.notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={async () => {
                            if (notification.readAt) return;
                            await api(`/patient/notifications/${notification.id}/read`, { method: 'PATCH' });
                            await overviewQuery.refetch();
                          }}
                          className="flex w-full items-start gap-2.5 text-left"
                        >
                          <span
                            className={cn(
                              'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                              notification.readAt ? 'bg-white/15' : 'bg-rose',
                            )}
                          />
                          <div>
                            <p className="font-sans text-[10px] font-medium leading-snug text-ivory/80">
                              {notification.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 font-body text-[9px] leading-relaxed text-mauve">
                              {notification.body}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="font-body text-[10px] text-mauve">No notifications yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[22px] border border-lavender/15 bg-lavender/[0.04] p-5">
                  <Sparkles className="h-4 w-4 text-rose" />
                  <p className="mt-3 font-display text-xl leading-tight text-ivory">
                    A private question before a booking?
                  </p>
                  <p className="mt-1.5 font-body text-[9.5px] leading-relaxed text-mauve">
                    Naya can explain general topics in English or Tamil. It cannot diagnose or
                    prescribe.
                  </p>
                  <ButtonLink to="/ai" variant="secondary" size="sm" className="mt-4 w-full">
                    Ask Naya
                  </ButtonLink>
                </div>

                {overview?.recentDocuments.length ? (
                  <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
                    <p className="font-sans text-[11px] font-semibold text-ivory">Recent documents</p>
                    <div className="mt-3 space-y-2">
                      {overview.recentDocuments.map((document) => (
                        <a
                          key={document.id}
                          href={`/api/patient/documents/${document.id}/download`}
                          className="flex items-center gap-2 rounded-lg py-1.5 font-body text-[9.5px] text-mauve hover:text-ivory"
                        >
                          <Paperclip className="h-3 w-3 shrink-0" />
                          <span className="truncate">{document.fileName}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : section === 'appointments' ? (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
              <div className="space-y-3">
                <MiniCalendar
                  appointments={appointments}
                  selected={calendarDate}
                  onSelect={setCalendarDate}
                />
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                  <p className="font-sans text-[10px] font-semibold text-ivory">Calendar legend</p>
                  <div className="mt-3 space-y-2">
                    <span className="flex items-center gap-2 font-body text-[9px] text-mauve">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose" /> Appointment scheduled
                    </span>
                    <span className="flex items-center gap-2 font-body text-[9px] text-mauve">
                      <span className="h-1.5 w-1.5 rounded-full bg-lavender/60" /> Selected date
                    </span>
                  </div>
                  <p className="mt-3 border-t border-white/[0.06] pt-3 font-body text-[8.5px] leading-relaxed text-mauve/60">
                    Dates use your device timezone. The clinician’s timezone is shown on each
                    appointment.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
                    {(['upcoming', 'past', 'all'] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setAppointmentFilter(filter)}
                        className={cn(
                          'rounded-full px-3.5 py-1.5 font-sans text-[9px] font-semibold capitalize transition-colors',
                          appointmentFilter === filter ? 'bg-lavender/15 text-ivory' : 'text-mauve',
                        )}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                  <p className="font-body text-[9px] text-mauve">
                    {filteredAppointments.length} appointment{filteredAppointments.length === 1 ? '' : 's'}
                    {calendarDate ? ' on selected date' : ''}
                  </p>
                </div>
                <div className="mt-4 space-y-2.5">
                  {appointmentsQuery.isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-36 w-full" />)
                  ) : filteredAppointments.length ? (
                    filteredAppointments.map((appointment) => (
                      <AppointmentRow
                        key={appointment.id}
                        appointment={appointment}
                        onCancel={setCancelTarget}
                        onReschedule={(item) => void openReschedule(item)}
                        onReview={setReviewTarget}
                        onNotes={(item) => void openNotes(item)}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={<CalendarDays className="h-5 w-5" />}
                      title="No appointments here"
                      description={
                        appointmentFilter === 'upcoming'
                          ? 'You have no upcoming appointments. You can book a first consultation whenever you are ready.'
                          : 'Nothing matches this filter yet.'
                      }
                      action={
                        appointmentFilter === 'upcoming' ? (
                          <ButtonLink to="/doctors" size="sm" arrow>
                            Find a specialist
                          </ButtonLink>
                        ) : undefined
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : section === 'records' ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-sans text-[12px] font-semibold text-ivory">Medical documents</p>
                  <p className="mt-0.5 font-body text-[9px] text-mauve">PDF, JPEG or PNG · under 5 MB</p>
                </div>
                <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-lavender/25 bg-lavender/[0.06] px-3.5 font-sans text-[9.5px] font-semibold text-lavender transition-colors hover:bg-lavender/10">
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? 'Uploading…' : 'Upload document'}
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={(event) => void uploadDocument(event)}
                    className="sr-only"
                    disabled={uploading}
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ['REPORT', 'Report'],
                  ['PRESCRIPTION', 'Prescription'],
                  ['REFERRAL', 'Referral'],
                  ['OTHER', 'Other'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setUploadCategory(value as typeof uploadCategory)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 font-body text-[8.5px] transition-colors',
                      uploadCategory === value
                        ? 'border-lavender/30 bg-lavender/10 text-lavender'
                        : 'border-white/10 text-mauve',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {documents.length ? (
                  documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.07] px-3.5 py-3"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] text-lavender">
                        <FileText className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-sans text-[10px] text-ivory">{document.fileName}</p>
                        <p className="mt-0.5 font-body text-[8.5px] text-mauve">
                          {document.category} · {fileSize(document.sizeBytes)} · {formatDate(document.createdAt)}
                        </p>
                      </div>
                      <a
                        href={`/api/patient/documents/${document.id}/download`}
                        className="grid h-7 w-7 place-items-center rounded-full text-mauve hover:bg-white/10 hover:text-ivory"
                        aria-label={`Download ${document.fileName}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(document.id)}
                        className="grid h-7 w-7 place-items-center rounded-full text-mauve hover:bg-rose/10 hover:text-rose"
                        aria-label={`Delete ${document.fileName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    className="py-8"
                    icon={<Upload className="h-5 w-5" />}
                    title="No documents yet"
                    description="Upload a report or referral if you want to discuss it. Access is limited to your care team."
                  />
                )}
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.07] bg-midnight/30 p-3">
                <LockKeyhole className="mt-0.5 h-3 w-3 shrink-0 text-lavender" />
                <p className="font-body text-[8.5px] leading-relaxed text-mauve">
                  Do not upload identity documents, payment card images or anything not relevant to
                  your care. Downloads are authenticated and audited.
                </p>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
              <p className="font-sans text-[12px] font-semibold text-ivory">Prescription records</p>
              <p className="mt-0.5 font-body text-[9px] text-mauve">
                Clinician-issued records only. All content is clearly labelled demo data.
              </p>
              <div className="mt-4 space-y-2.5">
                {prescriptions.length ? (
                  prescriptions.map((prescription) => (
                    <div key={prescription.id} className="rounded-xl border border-white/[0.07] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-sans text-[10.5px] font-semibold text-ivory">
                            {prescription.doctorName}
                          </p>
                          <p className="mt-0.5 font-body text-[8.5px] text-mauve">
                            {formatDate(prescription.issuedAt)} · {prescription.bookingId}
                          </p>
                        </div>
                        <Badge tone="muted">{prescription.status}</Badge>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        {prescription.medications.map((medication, index) => (
                          <div key={index} className="rounded-lg bg-white/[0.025] p-2.5">
                            <p className="font-sans text-[9.5px] text-ivory/80">{medication.name}</p>
                            <p className="mt-0.5 font-body text-[8.5px] text-mauve">
                              {medication.dosage} · {medication.frequency} · {medication.duration}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 font-body text-[8.5px] leading-relaxed text-mauve">
                        {prescription.instructions}
                      </p>
                      <p className="mt-2 border-t border-white/[0.06] pt-2 font-body text-[8px] text-rose/70">
                        {prescription.disclaimer}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    className="py-8"
                    icon={<FileText className="h-5 w-5" />}
                    title="No prescription records"
                    description="Prescriptions appear only when issued by an authorised clinician after an appropriate consultation."
                  />
                )}
              </div>
            </div>
          </div>
        ) : section === 'payments' ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <QuickStat
                icon={CreditCard}
                label="Demo paid"
                value={formatCurrency(
                  payments
                    .filter((payment) => ['PAID', 'DEMO_PAID'].includes(payment.status))
                    .reduce((total, payment) => total + payment.totalPaise, 0),
                )}
              />
              <QuickStat
                icon={RefreshCw}
                label="Refund requests"
                value={payments.reduce((total, payment) => total + payment.refunds.length, 0)}
              />
              <QuickStat icon={FileText} label="Transactions" value={payments.length} />
            </div>
            <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.02]">
              <div className="border-b border-white/[0.07] px-5 py-4">
                <p className="font-sans text-[12px] font-semibold text-ivory">Payment history</p>
                <p className="mt-0.5 font-body text-[9px] text-mauve">
                  No card data is stored. Demo payments are not real transactions.
                </p>
              </div>
              {payments.length ? (
                <div className="divide-y divide-white/[0.06]">
                  {payments.map((payment) => (
                    <div key={payment.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-sans text-[10.5px] font-semibold text-ivory">
                            {payment.doctorName}
                          </p>
                          <p className="mt-0.5 font-body text-[8.5px] text-mauve">
                            {payment.bookingId} · {formatDate(payment.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-sans text-[12px] font-semibold text-ivory">
                            {formatCurrency(payment.totalPaise)}
                          </p>
                          <Badge
                            tone={['PAID', 'DEMO_PAID'].includes(payment.status) ? 'lavender' : 'muted'}
                            className="mt-1"
                          >
                            {payment.status === 'DEMO_PAID' ? 'Demo paid' : payment.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-[8.5px] text-mauve">
                        <span>Fee {formatCurrency(payment.amountPaise)}</span>
                        <span>Tax {formatCurrency(payment.taxPaise)}</span>
                        <span>{payment.provider}</span>
                        {payment.refunds.map((refund) => (
                          <span key={refund.id} className="text-rose">
                            Refund {formatCurrency(refund.amountPaise)} · {refund.status}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5">
                  <EmptyState
                    className="py-8"
                    icon={<CreditCard className="h-5 w-5" />}
                    title="No payment history"
                    description="When a consultation is paid for, the transaction and receipt status will appear here."
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] px-4 py-3">
              <p className="font-body text-[9px] text-mauve">
                Refund eligibility depends on cancellation timing and the disclosed terms.
              </p>
              <Link to="/legal/cancellation-refund" className="font-sans text-[9px] font-semibold text-lavender hover:text-rose">
                Read policy →
              </Link>
            </div>
          </div>
        ) : section === 'profile' ? (
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <form onSubmit={(event) => void saveProfile(event)} className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-sans text-[12px] font-semibold text-ivory">Profile details</p>
                  <p className="mt-0.5 font-body text-[9px] text-mauve">Only necessary contact information.</p>
                </div>
                <Badge tone="lavender">{user?.emailVerified ? 'Email verified' : 'Email unverified'}</Badge>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-name" className="label-premium">Full name</label>
                  <input
                    id="profile-name"
                    className="input-premium"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="profile-email" className="label-premium">Email</label>
                  <input id="profile-email" className="input-premium opacity-60" value={profile?.email || ''} disabled />
                  <p className="mt-1.5 font-body text-[8px] text-mauve/60">
                    Email changes require re-verification. Not available in demo settings.
                  </p>
                </div>
                <div>
                  <label htmlFor="profile-phone" className="label-premium">Phone</label>
                  <input
                    id="profile-phone"
                    className="input-premium"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91"
                  />
                </div>
                <div>
                  <label htmlFor="profile-language" className="label-premium">Preferred language</label>
                  <select
                    id="profile-language"
                    className="input-premium"
                    value={profileForm.preferredLanguage}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, preferredLanguage: e.target.value }))}
                  >
                    <option value="en">English</option>
                    <option value="ta">Tamil</option>
                    <option value="hi">Hindi</option>
                    <option value="te">Telugu</option>
                    <option value="ml">Malayalam</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="profile-communication" className="label-premium">Communication preference</label>
                  <select
                    id="profile-communication"
                    className="input-premium"
                    value={profileForm.communicationPreference}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, communicationPreference: e.target.value }))}
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>
                </div>
              </div>
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] p-3.5">
                <input
                  type="checkbox"
                  checked={profileForm.marketingConsent}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, marketingConsent: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 accent-[#C9A7F5]"
                />
                <span className="font-body text-[9.5px] leading-relaxed text-mauve">
                  Send me occasional wellness notes. Optional and separate from appointment emails. No
                  marketing is sent in this demo.
                </span>
              </label>
              <div className="mt-5 flex items-center justify-between">
                <p className="font-body text-[8px] text-mauve/50">
                  Account created {profile ? formatDate(profile.createdAt) : '—'}
                </p>
                <Button type="submit" loading={actionLoading} size="sm">
                  Save changes
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
                <p className="font-sans text-[11px] font-semibold text-ivory">Session security</p>
                <p className="mt-1 font-body text-[9px] leading-relaxed text-mauve">
                  Your session is held in an HTTP-only cookie. Sign out of all other sessions if you
                  used a shared device.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={async () => {
                    await api('/auth/logout-all', { method: 'POST' });
                    push({ title: 'Other sessions signed out', tone: 'success' });
                  }}
                >
                  Sign out other sessions
                </Button>
              </div>
              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
                <p className="font-sans text-[11px] font-semibold text-ivory">Email verification</p>
                <p className="mt-1 font-body text-[9px] leading-relaxed text-mauve">
                  {profile?.emailVerified
                    ? 'Your email address is verified.'
                    : 'Verify your email to protect account recovery and notifications.'}
                </p>
                {!profile?.emailVerified && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={async () => {
                      const result = await api<{ message: string }>('/auth/resend-verification', { method: 'POST' });
                      push({ title: 'Verification requested', description: result.message, tone: 'info' });
                    }}
                  >
                    Resend verification
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : section === 'privacy' ? (
          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-4">
              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
                <p className="font-sans text-[12px] font-semibold text-ivory">Your privacy controls</p>
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] p-4">
                    <div className="max-w-md">
                      <p className="font-sans text-[10.5px] font-semibold text-ivory">Naya AI conversation storage</p>
                      <p className="mt-1 font-body text-[9px] leading-relaxed text-mauve">
                        When enabled, you can opt in to storing each sensitive AI conversation. Stored
                        content is encrypted and visible only to your account.
                      </p>
                    </div>
                    <Switch
                      label="Naya AI conversation storage"
                      checked={profile?.aiHistoryEnabled ?? false}
                      disabled={!profile}
                      onClick={() => void toggleAiHistory()}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] p-4">
                    <div>
                      <p className="font-sans text-[10.5px] font-semibold text-ivory">Delete AI conversations</p>
                      <p className="mt-1 font-body text-[9px] text-mauve">
                        Permanently remove stored Naya conversations from your account.
                      </p>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => setAiHistoryOpen(true)}>
                      Delete history
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] p-4">
                    <div>
                      <p className="font-sans text-[10.5px] font-semibold text-ivory">Data deletion request</p>
                      <p className="mt-1 font-body text-[9px] leading-relaxed text-mauve">
                        Request deletion of eligible account data. Clinical, payment and audit records
                        may require lawful retention.
                      </p>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => setDeleteAccountOpen(true)}>
                      Request deletion
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between">
                  <p className="font-sans text-[12px] font-semibold text-ivory">Active sessions</p>
                  <RefreshCw className="h-3.5 w-3.5 text-mauve" />
                </div>
                <div className="mt-4 space-y-2">
                  {sessionsQuery.data?.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] p-3.5"
                    >
                      <div>
                        <p className="font-sans text-[10px] text-ivory">
                          {session.current ? 'This device' : session.userAgent || 'Unknown device'}
                        </p>
                        <p className="mt-0.5 font-body text-[8.5px] text-mauve">
                          Last active {formatDate(session.lastSeenAt)} · expires {formatDate(session.expiresAt)}
                        </p>
                      </div>
                      {session.current ? (
                        <Badge tone="lavender">Current</Badge>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void revokeSession(session.id)}
                          className="font-sans text-[8.5px] font-semibold text-rose hover:underline"
                        >
                          Sign out
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-[22px] border border-lavender/15 bg-lavender/[0.04] p-5">
                <ShieldCheck className="h-5 w-5 text-lavender" />
                <p className="mt-3 font-display text-xl leading-tight text-ivory">What is protected</p>
                <ul className="mt-3 space-y-2">
                  {[
                    'Hashed account password',
                    'HTTP-only session cookie',
                    'Role-based record access',
                    'Encrypted clinical notes and AI messages',
                    'Audit events for sensitive actions',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 font-body text-[9px] leading-relaxed text-mauve">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-lavender" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[22px] border border-rose/20 bg-burgundy/20 p-5">
                <p className="font-sans text-[10px] font-semibold text-ivory">Honest limits</p>
                <p className="mt-2 font-body text-[9px] leading-relaxed text-mauve">
                  This demo has not been independently security-audited, penetration-tested or
                  certified. Do not upload real medical records or use it for real care.
                </p>
                <Link to="/legal/privacy" className="mt-3 inline-flex items-center gap-1 font-sans text-[9px] font-semibold text-lavender">
                  Read privacy draft <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        ) : section === 'support' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5">
              <div>
                <p className="font-sans text-[12px] font-semibold text-ivory">Support requests</p>
                <p className="mt-0.5 font-body text-[9px] text-mauve">
                  Do not include clinical details. This demo has no live support desk.
                </p>
              </div>
              <ButtonLink to="/contact" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
                New request
              </ButtonLink>
            </div>
            {ticketsQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : tickets.length ? (
              <div className="space-y-2">
                {tickets.map((ticket) => {
                  const open = expandedTicket === ticket.id;
                  return (
                    <div key={ticket.id} className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.02]">
                      <button
                        type="button"
                        onClick={() => setExpandedTicket(open ? null : ticket.id)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                        aria-expanded={open}
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-sans text-[11px] font-semibold text-ivory">{ticket.subject}</p>
                            <Badge tone={ticket.status === 'RESOLVED' ? 'lavender' : 'rose'}>
                              {ticket.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="mt-1 font-body text-[8.5px] text-mauve">
                            {ticket.reference} · {ticket.category} · {formatDate(ticket.createdAt)}
                          </p>
                        </div>
                        <ChevronRight className={cn('h-4 w-4 shrink-0 text-mauve transition-transform', open && 'rotate-90')} />
                      </button>
                      {open && (
                        <div className="border-t border-white/[0.07] px-5 pb-5 pt-4">
                          <div className="space-y-3">
                            {ticket.messages?.map((message) => (
                              <div
                                key={message.id}
                                className={cn(
                                  'max-w-[85%] rounded-xl p-3',
                                  message.authorRole === 'PATIENT'
                                    ? 'ml-auto bg-burgundy/30'
                                    : 'border border-white/[0.07] bg-white/[0.03]',
                                )}
                              >
                                <p className="font-body text-[10px] leading-relaxed text-ivory/70">{message.body}</p>
                                <p className="mt-1 font-body text-[7.5px] uppercase tracking-wider text-mauve/50">
                                  {message.authorRole} · {formatDate(message.createdAt)}
                                </p>
                              </div>
                            ))}
                          </div>
                          {ticket.status !== 'CLOSED' && (
                            <div className="mt-4 flex gap-2">
                              <input
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Add a reply (no clinical details)"
                                className="input-premium min-h-9 flex-1 py-2 text-[10px]"
                              />
                              <Button
                                size="sm"
                                onClick={() => void replyToTicket(ticket.id)}
                                loading={actionLoading}
                                icon={<Send className="h-3 w-3" />}
                              >
                                Send
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<Headphones className="h-5 w-5" />}
                title="No support requests"
                description="If you need help with an appointment, payment, privacy or accessibility issue, create a support request. Please do not include clinical records."
                action={
                  <ButtonLink to="/contact" size="sm">
                    Contact support
                  </ButtonLink>
                }
              />
            )}
            <div className="rounded-2xl border border-rose/20 bg-burgundy/20 p-4">
              <p className="font-body text-[9px] leading-relaxed text-mauve">
                <strong className="text-rose">Emergency?</strong> Support is not monitored for
                emergencies. Contact local emergency services (112 in India) or Tele-MANAS on 14416.
              </p>
            </div>
          </div>
        ) : (
          <EmptyState
            title="This section does not exist"
            description="Return to your overview to continue."
            action={<ButtonLink to="/dashboard?section=overview">Go to overview</ButtonLink>}
          />
        )}
      </DashboardShell>

      {/* Cancel appointment */}
      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel this appointment?"
        description="Cancellation terms depend on timing and the clinician’s policy. Any eligible refund is recorded as pending in this demo."
      >
        {cancelTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] p-3.5">
              <DoctorAvatar doctor={cancelTarget.doctor} size="sm" />
              <div>
                <p className="font-sans text-[11px] font-semibold text-ivory">{cancelTarget.doctor.name}</p>
                <p className="mt-1 font-body text-[9px] text-mauve">
                  {formatDateTime(cancelTarget.startAt, cancelTarget.timezone)}
                </p>
              </div>
            </div>
            <div>
              <label htmlFor="cancel-reason" className="label-premium">Reason (optional)</label>
              <textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="input-premium resize-none"
                placeholder="You do not need to share clinical details."
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setCancelTarget(null)}>Keep appointment</Button>
              <Button variant="danger" loading={actionLoading} onClick={() => void cancelAppointment()}>
                Cancel appointment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reschedule */}
      <Modal
        open={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title="Choose a new time"
        description="The new slot is checked for conflicts and your existing payment is retained."
        className="max-w-2xl"
      >
        {rescheduleLoading ? (
          <div className="skeleton h-40 rounded-xl" />
        ) : rescheduleDays.length ? (
          <div className="max-h-[50vh] space-y-4 overflow-y-auto" data-lenis-prevent>
            {rescheduleDays.slice(0, 8).map((day) => (
              <div key={day.date}>
                <p className="font-body text-[9px] uppercase tracking-[0.14em] text-mauve">{day.label}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {day.slots.map((slot) => (
                    <button
                      key={slot.startAt}
                      type="button"
                      onClick={() => setRescheduleSlot(slot.startAt)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 font-sans text-[9px] transition-colors',
                        rescheduleSlot === slot.startAt
                          ? 'border-rose/40 bg-rose/15 text-rose'
                          : 'border-white/10 text-ivory/70 hover:border-lavender/30',
                      )}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            className="py-8"
            title="No alternative demo slots"
            description="Try again later or contact support. No changes have been made."
          />
        )}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setRescheduleTarget(null)}>Keep current time</Button>
          <Button
            disabled={!rescheduleSlot}
            loading={actionLoading}
            onClick={() => void submitReschedule()}
          >
            Confirm new time
          </Button>
        </div>
      </Modal>

      {/* Review */}
      <Modal
        open={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        title="Share a verified review"
        description="Reviews are accepted only after a completed consultation and are moderated before publication. This demo does not fabricate reviews."
      >
        <div className="space-y-4">
          <div>
            <p className="label-premium">Rating</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setReviewRating(rating)}
                  aria-label={`${rating} star${rating > 1 ? 's' : ''}`}
                  className="rounded-full p-1"
                >
                  <Star className={cn('h-6 w-6', rating <= reviewRating ? 'fill-rose text-rose' : 'text-white/20')} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="review-body" className="label-premium">Your experience</label>
            <textarea
              id="review-body"
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              rows={4}
              className="input-premium resize-none"
              placeholder="Please do not include clinical details or identifying information."
            />
            <p className="mt-1.5 font-body text-[8px] text-mauve/50">
              Minimum 10 characters. Reviews are published with a verified-patient label, not your name.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setReviewTarget(null)}>Cancel</Button>
            <Button
              disabled={reviewBody.trim().length < 10}
              loading={actionLoading}
              onClick={() => void submitReview()}
            >
              Submit for moderation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Notes */}
      <Modal
        open={Boolean(notesTarget)}
        onClose={() => setNotesTarget(null)}
        title="Clinical record"
        description="This content is encrypted at rest and visible only to you and your clinician."
        className="max-w-2xl"
      >
        {notesLoading ? (
          <div className="skeleton h-28 rounded-xl" />
        ) : notes.length ? (
          <div className="max-h-[55vh] space-y-4 overflow-y-auto" data-lenis-prevent>
            {notes.map((note) => (
              <div key={note.id} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                <p className="font-body text-[11px] leading-[1.85] text-ivory/70">{note.content}</p>
                <p className="mt-3 font-body text-[8px] uppercase tracking-wider text-mauve/50">
                  {formatDateTime(note.createdAt)} · demo clinical record
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-body text-[11px] text-mauve">
            No clinical note has been added to this appointment. This may be because the consultation
            is not complete or your clinician has not shared one.
          </p>
        )}
      </Modal>

      {/* Document delete */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Remove this document?"
        description="This removes the document from your account and its stored file. This cannot be undone."
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Keep document</Button>
          <Button variant="danger" loading={actionLoading} onClick={() => void deleteDocument()}>
            Remove document
          </Button>
        </div>
      </Modal>

      {/* AI history delete */}
      <Modal
        open={aiHistoryOpen}
        onClose={() => setAiHistoryOpen(false)}
        title="Delete all AI conversations?"
        description="All stored Naya conversations will be permanently removed from your account."
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setAiHistoryOpen(false)}>Keep history</Button>
          <Button variant="danger" loading={actionLoading} onClick={() => void deleteAiHistory()}>
            Delete all conversations
          </Button>
        </div>
      </Modal>

      {/* Account deletion */}
      <Modal
        open={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        title="Request account deletion"
        description="This logs a deletion request and signs you out. The demo does not automatically erase clinical, payment or audit records that may require lawful retention."
      >
        <div className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-rose/20 bg-burgundy/20 p-3.5">
            <input
              type="checkbox"
              checked={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#E8A0B7]"
            />
            <span className="font-body text-[9.5px] leading-relaxed text-mauve">
              I understand this is a request, not an immediate deletion, and that some records may be
              retained where required by law.
            </span>
          </label>
          <div>
            <label htmlFor="delete-reason" className="label-premium">Reason (optional)</label>
            <textarea
              id="delete-reason"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
              className="input-premium resize-none"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setDeleteAccountOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={!deleteConfirm}
              loading={actionLoading}
              onClick={() => void requestAccountDeletion()}
            >
              Submit deletion request
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
