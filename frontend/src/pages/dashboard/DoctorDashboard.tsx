import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileSignature,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Stethoscope,
  Trash2,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { DashboardShell, type DashboardNavItem } from '@/components/layout/DashboardShell';
import { Seo } from '@/components/Seo';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import type { Appointment } from '@/types';

type DoctorOverview = {
  doctor: {
    id: string;
    name: string;
    email: string;
    title: string;
    verified: boolean;
    status: string;
    timezone: string;
  };
  today: Appointment[];
  upcoming: Appointment[];
  requests: Appointment[];
  notifications: {
    id: string;
    title: string;
    body: string;
    type: string;
    readAt: string | null;
    createdAt: string;
  }[];
  stats: {
    today: number;
    upcoming: number;
    completed: number;
    monthEarningsPaise: number;
    lifetimeEarningsPaise: number;
  };
};

type AvailabilityWindow = {
  id?: string;
  weekday: number;
  startMinute: number;
  endMinute: number;
  mode: string;
  slotMinutes?: number;
  active?: boolean;
};

type DoctorProfileData = {
  id: string;
  name: string;
  email: string;
  slug: string;
  title: string;
  bio: string;
  approach: string;
  gender: string;
  experienceYears: number;
  languages: string[];
  feePaise: number;
  followUpFeePaise: number | null;
  onlineEnabled: boolean;
  inPersonEnabled: boolean;
  city: string;
  timezone: string;
  verified: boolean;
  status: string;
  specializations: string[];
  credentials: { id: string; title: string; institution: string | null; verified: boolean }[];
  clinics: { name: string; city: string }[];
};

type EarningsData = {
  earnings: {
    lifetimePaise: number;
    pendingSettlementPaise: number;
    currency: string;
    demoNote: string;
  };
  transactions: {
    id: string;
    bookingId: string;
    patientName: string;
    totalPaise: number;
    status: string;
    paidAt: string | null;
    refunds: { amountPaise: number; status: string }[];
  }[];
};

type ClinicalNote = { id: string; content: string; createdAt: string; updatedAt: string };
type ClinicalPrescription = {
  id: string;
  medications: { name: string; dosage: string; frequency: string; duration: string }[];
  instructions: string;
  issuedAt: string;
  status: string;
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No show',
};

function statusTone(status: string): 'lavender' | 'rose' | 'muted' | 'burgundy' {
  if (status === 'CONFIRMED' || status === 'IN_PROGRESS') return 'lavender';
  if (status === 'PENDING_PAYMENT') return 'rose';
  if (status === 'CANCELLED') return 'burgundy';
  return 'muted';
}

function toTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function fromTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const section = params.get('section') || 'overview';
  const { push } = useToast();
  const queryClient = useQueryClient();

  const overviewQuery = useQuery({
    queryKey: ['doctor-overview'],
    queryFn: () => api<DoctorOverview>('/doctor/overview'),
  });
  const appointmentsQuery = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: () => api<{ appointments: Appointment[] }>('/doctor/appointments'),
  });
  const availabilityQuery = useQuery({
    queryKey: ['doctor-availability'],
    queryFn: () => api<{ windows: AvailabilityWindow[]; timezone: string }>('/doctor/availability'),
  });
  const profileQuery = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => api<{ profile: DoctorProfileData }>('/doctor/profile'),
  });
  const earningsQuery = useQuery({
    queryKey: ['doctor-earnings'],
    queryFn: () => api<EarningsData>('/doctor/earnings'),
  });

  const [appointmentFilter, setAppointmentFilter] = useState<'today' | 'upcoming' | 'all' | 'requests'>('upcoming');
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);
  const [availabilityDirty, setAvailabilityDirty] = useState(false);
  const [profileForm, setProfileForm] = useState({
    bio: '',
    approach: '',
    feePaise: 0,
    followUpFeePaise: 0,
    onlineEnabled: true,
    inPersonEnabled: true,
    languages: '',
  });
  const [selectedClinical, setSelectedClinical] = useState<Appointment | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  const [clinicalPrescriptions, setClinicalPrescriptions] = useState<ClinicalPrescription[]>([]);
  const [clinicalLoading, setClinicalLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [prescriptionInstructions, setPrescriptionInstructions] = useState('');
  const [medications, setMedications] = useState([
    { name: '', dosage: '', frequency: '', duration: '' },
  ]);

  const overview = overviewQuery.data;
  const appointments = appointmentsQuery.data?.appointments || [];
  const profile = profileQuery.data?.profile;
  const earnings = earningsQuery.data;

  useEffect(() => {
    if (availabilityQuery.data) {
      setWindows(availabilityQuery.data.windows);
      setAvailabilityDirty(false);
    }
  }, [availabilityQuery.data]);

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      bio: profile.bio,
      approach: profile.approach,
      feePaise: profile.feePaise,
      followUpFeePaise: profile.followUpFeePaise || 0,
      onlineEnabled: profile.onlineEnabled,
      inPersonEnabled: profile.inPersonEnabled,
      languages: profile.languages.join(', '),
    });
  }, [profile]);

  async function refreshAppointments() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['doctor-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] }),
    ]);
  }

  async function updateStatus(appointment: Appointment, status: string) {
    setActionLoading(true);
    try {
      await api(`/doctor/appointments/${appointment.id}/status`, {
        method: 'PATCH',
        body: { status },
      });
      push({ title: `Appointment marked ${statusLabels[status]?.toLowerCase() || status}`, tone: 'success' });
      await refreshAppointments();
    } catch (error) {
      push({ title: 'Status could not be updated', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelAppointment() {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      await api(`/doctor/appointments/${cancelTarget.id}/cancel`, {
        method: 'POST',
        body: { reason: cancelReason || undefined },
      });
      push({ title: 'Appointment cancelled', description: 'Any refund is recorded as pending.', tone: 'success' });
      setCancelTarget(null);
      setCancelReason('');
      await refreshAppointments();
    } catch (error) {
      push({ title: 'Could not cancel', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  function weekdayWindows(weekday: number) {
    return windows
      .map((window, index) => ({ window, index }))
      .filter((entry) => entry.window.weekday === weekday)
      .sort((a, b) => a.window.startMinute - b.window.startMinute);
  }

  function toggleDay(weekday: number) {
    setAvailabilityDirty(true);
    const exists = windows.some((window) => window.weekday === weekday);
    if (exists) {
      setWindows((prev) => prev.filter((window) => window.weekday !== weekday));
    } else {
      setWindows((prev) => [
        ...prev,
        { weekday, startMinute: 600, endMinute: 780, mode: 'BOTH', slotMinutes: 30, active: true },
      ]);
    }
  }

  function updateWindow(index: number, patch: Partial<AvailabilityWindow>) {
    setAvailabilityDirty(true);
    setWindows((prev) =>
      prev.map((window, current) => (current === index ? { ...window, ...patch } : window)),
    );
  }

  function addWindow(weekday: number) {
    setAvailabilityDirty(true);
    const existing = weekdayWindows(weekday);
    const lastEnd = existing.at(-1)?.window.endMinute || 600;
    setWindows((prev) => [
      ...prev,
      {
        weekday,
        startMinute: Math.min(lastEnd + 30, 1380),
        endMinute: Math.min(lastEnd + 90, 1440),
        mode: 'BOTH',
        slotMinutes: 30,
        active: true,
      },
    ]);
  }

  function removeWindow(index: number) {
    setAvailabilityDirty(true);
    setWindows((prev) => prev.filter((_, current) => current !== index));
  }

  async function saveAvailability() {
    setActionLoading(true);
    try {
      await api('/doctor/availability', {
        method: 'PUT',
        body: {
          windows: windows.map((window) => ({
            weekday: window.weekday,
            startMinute: window.startMinute,
            endMinute: window.endMinute,
            mode: window.mode,
          })),
        },
      });
      push({ title: 'Availability updated', description: 'Future booking slots now reflect this schedule.', tone: 'success' });
      setAvailabilityDirty(false);
      await Promise.all([
        availabilityQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ['booking-availability'] }),
        queryClient.invalidateQueries({ queryKey: ['availability'] }),
      ]);
    } catch (error) {
      push({ title: 'Could not save availability', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setActionLoading(true);
    try {
      const languages = profileForm.languages
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      await api('/doctor/profile', {
        method: 'PATCH',
        body: {
          bio: profileForm.bio,
          approach: profileForm.approach,
          feePaise: profileForm.feePaise,
          followUpFeePaise: profileForm.followUpFeePaise,
          onlineEnabled: profileForm.onlineEnabled,
          inPersonEnabled: profileForm.inPersonEnabled,
          languages: languages.length ? languages : ['English'],
        },
      });
      push({ title: 'Professional profile updated', tone: 'success' });
      await profileQuery.refetch();
    } catch (error) {
      push({ title: 'Could not update profile', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function openClinical(appointment: Appointment) {
    setSelectedClinical(appointment);
    setClinicalLoading(true);
    setClinicalNotes([]);
    setClinicalPrescriptions([]);
    setNoteText('');
    setPrescriptionInstructions('');
    setMedications([{ name: '', dosage: '', frequency: '', duration: '' }]);
    try {
      const data = await api<{
        notes: ClinicalNote[];
        prescriptions: ClinicalPrescription[];
      }>(`/doctor/appointments/${appointment.id}/clinical`);
      setClinicalNotes(data.notes);
      setClinicalPrescriptions(data.prescriptions);
    } catch (error) {
      push({ title: 'Clinical record could not load', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setClinicalLoading(false);
    }
  }

  async function addNote() {
    if (!selectedClinical || noteText.trim().length < 10) return;
    setActionLoading(true);
    try {
      await api(`/doctor/appointments/${selectedClinical.id}/notes`, {
        method: 'POST',
        body: { content: noteText },
      });
      setNoteText('');
      push({ title: 'Clinical note saved', description: 'Encrypted at rest and visible to the patient.', tone: 'success' });
      await openClinical(selectedClinical);
    } catch (error) {
      push({ title: 'Could not save note', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function addPrescription() {
    if (!selectedClinical) return;
    const clean = medications.filter((med) => med.name.trim());
    if (!clean.length || prescriptionInstructions.trim().length < 5) {
      push({ title: 'Add a medication and instructions', tone: 'error' });
      return;
    }
    setActionLoading(true);
    try {
      await api(`/doctor/appointments/${selectedClinical.id}/prescriptions`, {
        method: 'POST',
        body: { medications: clean, instructions: prescriptionInstructions },
      });
      setMedications([{ name: '', dosage: '', frequency: '', duration: '' }]);
      setPrescriptionInstructions('');
      push({
        title: 'Prescription record added',
        description: 'Demo only. Real prescribing requires registration and an appropriate assessment.',
        tone: 'success',
      });
      await openClinical(selectedClinical);
    } catch (error) {
      push({ title: 'Could not add prescription', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    let list = appointments;
    if (appointmentFilter === 'today') {
      list = appointments.filter((item) => new Date(item.startAt).toDateString() === now.toDateString());
    } else if (appointmentFilter === 'upcoming') {
      list = appointments.filter(
        (item) => new Date(item.startAt) >= now && !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(item.status),
      );
    } else if (appointmentFilter === 'requests') {
      list = appointments.filter((item) => item.status === 'PENDING_PAYMENT');
    }
    return [...list].sort((a, b) =>
      appointmentFilter === 'all'
        ? new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
        : new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
  }, [appointments, appointmentFilter]);

  const navItems: DashboardNavItem[] = [
    { key: 'overview', label: 'Today', icon: LayoutDashboard },
    { key: 'appointments', label: 'Appointments', icon: CalendarDays, badge: overview?.stats.today },
    { key: 'availability', label: 'Availability', icon: CalendarClock },
    { key: 'clinical', label: 'Clinical records', icon: FileSignature },
    { key: 'earnings', label: 'Earnings', icon: CircleDollarSign },
    { key: 'profile', label: 'Professional profile', icon: UserRound },
    { key: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const sectionTitles: Record<string, string> = {
    overview: 'Today at a glance',
    appointments: 'Appointments',
    availability: 'Availability management',
    clinical: 'Clinical records',
    earnings: 'Earnings overview',
    profile: 'Professional profile',
    notifications: 'Notifications',
  };

  if (overviewQuery.isError) {
    return (
      <DashboardShell
        portal="Clinician portal"
        title="Professional dashboard"
        subtitle="Verified clinician workspace"
        navItems={navItems}
        accent="lavender"
      >
        <ErrorState
          title="Your professional workspace could not load"
          description="Your credential status may not be verified, or the API is unavailable."
          onRetry={() => void overviewQuery.refetch()}
        />
      </DashboardShell>
    );
  }

  return (
    <>
      <Seo
        title="Clinician Dashboard"
        description="Professional appointment, availability, clinical and earnings workspace."
        path="/doctor"
        noIndex
      />
      <DashboardShell
        portal="Clinician portal"
        title={sectionTitles[section] || 'Professional dashboard'}
        subtitle="Verified clinical workspace · demonstration data only"
        navItems={navItems}
        accent="lavender"
      >
        {overviewQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full" />
            <div className="grid gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : section === 'overview' ? (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-[24px] border border-lavender/15 bg-gradient-to-br from-burgundy/25 via-plum to-royal/20 p-5 sm:p-7">
              <div className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full border border-white/10" />
              <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-rose">
                      Professional workspace
                    </p>
                    <Badge tone="lavender">
                      <BadgeCheck className="h-2.5 w-2.5" /> Demo verified
                    </Badge>
                  </div>
                  <h2 className="mt-3 font-display text-[clamp(1.8rem,3vw,2.7rem)] text-ivory">
                    Good to see you, {user?.name?.replace(/^Dr\.?\s*/i, '').split(' ')[0]}.
                  </h2>
                  <p className="mt-2 font-body text-[10.5px] text-mauve">
                    {overview?.stats.today || 0} appointment{overview?.stats.today === 1 ? '' : 's'} today ·{' '}
                    {overview?.stats.upcoming || 0} upcoming this week
                  </p>
                </div>
                <ButtonLink to="/doctor?section=availability" variant="secondary" size="sm" icon={<CalendarClock className="h-3.5 w-3.5" />}>
                  Manage availability
                </ButtonLink>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Today', value: overview?.stats.today || 0, icon: CalendarDays },
                { label: 'This week', value: overview?.stats.upcoming || 0, icon: CalendarClock },
                { label: 'Completed', value: overview?.stats.completed || 0, icon: Check },
                {
                  label: 'Month earnings',
                  value: formatCurrency(overview?.stats.monthEarningsPaise || 0),
                  icon: CircleDollarSign,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <Icon className="h-4 w-4 text-lavender" />
                    <p className="mt-4 font-display text-2xl text-ivory">{item.value}</p>
                    <p className="mt-0.5 font-body text-[9px] uppercase tracking-[0.12em] text-mauve/60">{item.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-sans text-[12px] font-semibold text-ivory">Today’s schedule</p>
                    <p className="mt-0.5 font-body text-[9px] text-mauve">Appointments in your clinic timezone</p>
                  </div>
                  <Link to="/doctor?section=appointments" className="font-sans text-[9px] font-semibold text-lavender hover:text-rose">
                    All appointments
                  </Link>
                </div>
                <div className="mt-4 space-y-2">
                  {overview?.today.length ? (
                    overview.today.map((appointment) => (
                      <div key={appointment.id} className="flex flex-col gap-3 rounded-xl border border-white/[0.07] p-3.5 sm:flex-row sm:items-center">
                        <div className="w-16 shrink-0">
                          <p className="font-sans text-[11px] font-semibold text-ivory">
                            {new Date(appointment.startAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                          <Badge tone={statusTone(appointment.status)} className="mt-1">
                            {statusLabels[appointment.status]}
                          </Badge>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-sans text-[11px] text-ivory">{appointment.patient?.name}</p>
                          <p className="mt-0.5 font-body text-[8.5px] text-mauve">
                            {appointment.mode === 'ONLINE' ? 'Video' : 'In person'} · {appointment.bookingId}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {appointment.mode === 'ONLINE' && appointment.status === 'CONFIRMED' && (
                            <ButtonLink to={`/consult/${appointment.id}`} size="sm" variant="secondary" className="min-h-8 px-3 text-[9px]">
                              Join
                            </ButtonLink>
                          )}
                          {appointment.status === 'CONFIRMED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="min-h-8 px-3 text-[9px]"
                              onClick={() => void updateStatus(appointment, 'IN_PROGRESS')}
                            >
                              Start
                            </Button>
                          )}
                          {appointment.status === 'IN_PROGRESS' && (
                            <Button
                              size="sm"
                              className="min-h-8 px-3 text-[9px]"
                              onClick={() => void updateStatus(appointment, 'COMPLETED')}
                              loading={actionLoading}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      className="py-8"
                      icon={<CalendarDays className="h-5 w-5" />}
                      title="No appointments today"
                      description="Your schedule is clear. Upcoming appointments and requests are still available below."
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
                  <p className="font-sans text-[11px] font-semibold text-ivory">Payment-pending requests</p>
                  <p className="mt-0.5 font-body text-[9px] text-mauve">Not yet confirmed appointments</p>
                  <div className="mt-4 space-y-2">
                    {overview?.requests.length ? (
                      overview.requests.map((appointment) => (
                        <div key={appointment.id} className="rounded-xl border border-white/[0.07] p-3">
                          <p className="font-sans text-[10px] text-ivory">{appointment.patient?.name}</p>
                          <p className="mt-0.5 font-body text-[8px] text-mauve">
                            {formatDate(appointment.startAt)} · {appointment.bookingId}
                          </p>
                          <Badge tone="rose" className="mt-2">Awaiting payment</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="font-body text-[9.5px] text-mauve">No pending requests.</p>
                    )}
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
                  <p className="font-sans text-[11px] font-semibold text-ivory">Notifications</p>
                  <div className="mt-3 space-y-3">
                    {overview?.notifications.slice(0, 3).map((notification) => (
                      <div key={notification.id} className="flex gap-2">
                        <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', notification.readAt ? 'bg-white/15' : 'bg-rose')} />
                        <div>
                          <p className="font-sans text-[9.5px] leading-snug text-ivory/75">{notification.title}</p>
                          <p className="mt-0.5 line-clamp-2 font-body text-[8.5px] leading-relaxed text-mauve">{notification.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : section === 'appointments' ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex flex-wrap rounded-full border border-white/10 bg-white/[0.03] p-1">
                {(['today', 'upcoming', 'requests', 'all'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setAppointmentFilter(filter)}
                    className={cn(
                      'rounded-full px-3 py-1.5 font-sans text-[9px] font-semibold capitalize transition-colors',
                      appointmentFilter === filter ? 'bg-lavender/15 text-ivory' : 'text-mauve',
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <p className="font-body text-[9px] text-mauve">{filteredAppointments.length} shown</p>
            </div>

            <div className="space-y-2.5">
              {appointmentsQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-36" />)
              ) : filteredAppointments.length ? (
                filteredAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
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
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-sans text-[12px] font-semibold text-ivory">{appointment.patient?.name}</p>
                            <Badge tone={statusTone(appointment.status)}>{statusLabels[appointment.status]}</Badge>
                          </div>
                          <p className="mt-1 font-body text-[9px] text-mauve">
                            {new Date(appointment.startAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} ·{' '}
                            {appointment.mode === 'ONLINE' ? 'Secure video' : 'In person'} · {appointment.bookingId}
                          </p>
                          <p className="mt-1 font-body text-[8.5px] text-mauve/70">
                            {appointment.patient?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {appointment.mode === 'ONLINE' && ['CONFIRMED', 'IN_PROGRESS'].includes(appointment.status) && (
                          <ButtonLink to={`/consult/${appointment.id}`} size="sm" variant="secondary" className="min-h-8 px-3 text-[9px]">
                            Join room
                          </ButtonLink>
                        )}
                        {appointment.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-8 px-3 text-[9px]"
                            onClick={() => void updateStatus(appointment, 'IN_PROGRESS')}
                          >
                            Start
                          </Button>
                        )}
                        {appointment.status === 'IN_PROGRESS' && (
                          <Button
                            size="sm"
                            className="min-h-8 px-3 text-[9px]"
                            loading={actionLoading}
                            onClick={() => void updateStatus(appointment, 'COMPLETED')}
                          >
                            Complete
                          </Button>
                        )}
                        {['COMPLETED', 'IN_PROGRESS'].includes(appointment.status) && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="min-h-8 px-3 text-[9px]"
                            onClick={() => void openClinical(appointment)}
                            icon={<FileText className="h-3 w-3" />}
                          >
                            Clinical
                          </Button>
                        )}
                        {['CONFIRMED', 'PENDING_PAYMENT'].includes(appointment.status) && (
                          <button
                            type="button"
                            onClick={() => setCancelTarget(appointment)}
                            className="inline-flex min-h-8 items-center rounded-full border border-white/10 px-3 font-sans text-[9px] text-mauve hover:border-rose/30 hover:text-rose"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={<CalendarDays className="h-5 w-5" />}
                  title="No appointments in this view"
                  description="When patients book and pay for a consultation, the appointment appears here."
                />
              )}
            </div>
          </div>
        ) : section === 'availability' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5">
              <div>
                <p className="font-sans text-[12px] font-semibold text-ivory">Weekly consultation hours</p>
                <p className="mt-1 max-w-xl font-body text-[9.5px] leading-relaxed text-mauve">
                  Slots are generated in {availabilityQuery.data?.timezone || 'your timezone'} for a
                  30-minute first consultation. Clients can book at least two hours ahead.
                  Existing appointments keep their booked times.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => void availabilityQuery.refetch()}>
                  Reset
                </Button>
                <Button size="sm" onClick={() => void saveAvailability()} loading={actionLoading} disabled={!availabilityDirty} icon={<Save className="h-3.5 w-3.5" />}>
                  Save schedule
                </Button>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02]">
              {dayNames.map((day, weekday) => {
                const dayWindows = weekdayWindows(weekday);
                const hasWindows = dayWindows.length > 0;
                return (
                  <div key={day} className="border-b border-white/[0.06] px-4 py-4 last:border-b-0 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-3 sm:pt-1.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={hasWindows}
                          onClick={() => toggleDay(weekday)}
                          className={cn(
                            'relative h-5 w-9 shrink-0 rounded-full border transition-colors',
                            hasWindows ? 'border-lavender/40 bg-lavender/30' : 'border-white/15 bg-white/10',
                          )}
                          aria-label={`${hasWindows ? 'Disable' : 'Enable'} ${day}`}
                        >
                          <span
                            className={cn(
                              'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-ivory transition-transform',
                              hasWindows ? 'translate-x-[18px]' : 'translate-x-0.5',
                            )}
                          />
                        </button>
                        <p className={cn('font-sans text-[11px]', hasWindows ? 'text-ivory' : 'text-mauve/50')}>{day}</p>
                      </div>
                      {hasWindows ? (
                        <div className="space-y-2">
                          {dayWindows.map(({ window, index }) => (
                            <div key={`${weekday}-${index}`} className="flex flex-wrap items-center gap-2">
                              <input
                                type="time"
                                value={toTime(window.startMinute)}
                                onChange={(e) => updateWindow(index, { startMinute: fromTime(e.target.value) })}
                                className="rounded-lg border border-white/10 bg-midnight px-2 py-1.5 font-body text-[10px] text-ivory focus:border-lavender/40 focus:outline-none"
                                aria-label={`${day} start time ${index + 1}`}
                              />
                              <span className="font-body text-[9px] text-mauve">to</span>
                              <input
                                type="time"
                                value={toTime(window.endMinute)}
                                onChange={(e) => updateWindow(index, { endMinute: fromTime(e.target.value) })}
                                className="rounded-lg border border-white/10 bg-midnight px-2 py-1.5 font-body text-[10px] text-ivory focus:border-lavender/40 focus:outline-none"
                                aria-label={`${day} end time ${index + 1}`}
                              />
                              <select
                                value={window.mode}
                                onChange={(e) => updateWindow(index, { mode: e.target.value })}
                                className="rounded-lg border border-white/10 bg-midnight px-2 py-1.5 font-body text-[9px] text-ivory focus:border-lavender/40 focus:outline-none"
                                aria-label={`${day} consultation mode ${index + 1}`}
                              >
                                <option value="BOTH">Video & in person</option>
                                <option value="ONLINE">Video only</option>
                                <option value="IN_PERSON">In person only</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => removeWindow(index)}
                                className="grid h-7 w-7 place-items-center rounded-full text-mauve hover:bg-rose/10 hover:text-rose"
                                aria-label={`Remove ${day} window ${index + 1}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addWindow(weekday)}
                            className="inline-flex items-center gap-1 font-sans text-[8.5px] font-semibold text-lavender hover:text-rose"
                          >
                            <Plus className="h-3 w-3" /> Add window
                          </button>
                        </div>
                      ) : (
                        <span className="font-body text-[9px] text-mauve/40 sm:pt-2">Not available</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-start gap-2 rounded-2xl border border-lavender/15 bg-lavender/[0.04] p-4">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-lavender" />
              <p className="font-body text-[9px] leading-relaxed text-mauve">
                In a real service, availability changes would be checked against existing bookings,
                clinician leave and local timezone rules. This demo supports multiple windows per
                weekday; each slot is 30 minutes.
              </p>
            </div>
          </div>
        ) : section === 'clinical' ? (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-4">
              <p className="font-sans text-[11px] font-semibold text-ivory">Select a consultation</p>
              <p className="mt-1 font-body text-[9px] text-mauve">
                Only your own confirmed, active or completed appointments appear.
              </p>
              <div className="mt-3 space-y-1.5">
                {appointments.filter((item) => ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(item.status)).length ? (
                  appointments
                    .filter((item) => ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(item.status))
                    .map((appointment) => (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => void openClinical(appointment)}
                        className={cn(
                          'flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-3 text-left transition-colors',
                          selectedClinical?.id === appointment.id
                            ? 'border-lavender/30 bg-lavender/[0.07]'
                            : 'border-white/[0.06] hover:border-white/15',
                        )}
                      >
                        <div>
                          <p className="font-sans text-[10px] text-ivory">{appointment.patient?.name}</p>
                          <p className="mt-0.5 font-body text-[8px] text-mauve">
                            {formatDate(appointment.startAt)} · {statusLabels[appointment.status]}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-mauve" />
                      </button>
                    ))
                ) : (
                  <p className="py-6 text-center font-body text-[9px] text-mauve">No clinical appointments available.</p>
                )}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
              {!selectedClinical ? (
                <EmptyState
                  className="py-10"
                  icon={<Stethoscope className="h-5 w-5" />}
                  title="Select an appointment"
                  description="Clinical notes and prescription records are scoped to your own patients and encrypted at rest."
                />
              ) : clinicalLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] pb-4">
                    <div>
                      <p className="font-sans text-[12px] font-semibold text-ivory">{selectedClinical.patient?.name}</p>
                      <p className="mt-0.5 font-body text-[9px] text-mauve">
                        {selectedClinical.bookingId} · {formatDateTime(selectedClinical.startAt, selectedClinical.timezone)}
                      </p>
                    </div>
                    <Badge tone={statusTone(selectedClinical.status)}>{statusLabels[selectedClinical.status]}</Badge>
                  </div>

                  <div className="mt-5">
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-mauve">Clinical notes</p>
                    <div className="mt-3 space-y-2">
                      {clinicalNotes.map((note) => (
                        <div key={note.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                          <p className="whitespace-pre-wrap font-body text-[10.5px] leading-[1.8] text-ivory/70">{note.content}</p>
                          <p className="mt-2 font-body text-[8px] text-mauve/50">{formatDateTime(note.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                      className="input-premium mt-3 resize-none text-[11px]"
                      placeholder="Add a clinical note. It is encrypted at rest and shared with the patient."
                    />
                    <div className="mt-2 flex justify-end">
                      <Button size="sm" onClick={() => void addNote()} loading={actionLoading} disabled={noteText.trim().length < 10}>
                        Save note
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-white/[0.07] pt-5">
                    <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-mauve">Prescription records</p>
                    <div className="mt-3 space-y-2">
                      {clinicalPrescriptions.map((prescription) => (
                        <div key={prescription.id} className="rounded-xl border border-white/[0.07] p-3.5">
                          {prescription.medications.map((medication, index) => (
                            <p key={index} className="font-body text-[10px] text-ivory/70">
                              {medication.name} · {medication.dosage} · {medication.frequency} · {medication.duration}
                            </p>
                          ))}
                          <p className="mt-1.5 font-body text-[9px] text-mauve">{prescription.instructions}</p>
                        </div>
                      ))}
                    </div>
                    {['IN_PROGRESS', 'COMPLETED'].includes(selectedClinical.status) && (
                      <div className="mt-4 rounded-xl border border-white/[0.07] p-3.5">
                        <p className="font-sans text-[9.5px] font-semibold text-ivory">Add prescription record</p>
                        {medications.map((medication, index) => (
                          <div key={index} className="mt-2 grid gap-2 sm:grid-cols-4">
                            {(['name', 'dosage', 'frequency', 'duration'] as const).map((field) => (
                              <input
                                key={field}
                                value={medication[field]}
                                onChange={(e) =>
                                  setMedications((prev) =>
                                    prev.map((item, i) => (i === index ? { ...item, [field]: e.target.value } : item)),
                                  )
                                }
                                placeholder={field}
                                className="rounded-lg border border-white/10 bg-midnight px-2.5 py-2 font-body text-[9px] text-ivory placeholder:capitalize focus:border-lavender/40 focus:outline-none"
                              />
                            ))}
                          </div>
                        ))}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMedications((prev) => [...prev, { name: '', dosage: '', frequency: '', duration: '' }])}
                            icon={<Plus className="h-3 w-3" />}
                          >
                            Add medication
                          </Button>
                          {medications.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMedications((prev) => prev.slice(0, -1))}
                              icon={<Trash2 className="h-3 w-3" />}
                            >
                              Remove last
                            </Button>
                          )}
                        </div>
                        <textarea
                          value={prescriptionInstructions}
                          onChange={(e) => setPrescriptionInstructions(e.target.value)}
                          rows={2}
                          placeholder="Instructions to the patient"
                          className="input-premium mt-2 resize-none text-[10px]"
                        />
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="font-body text-[8px] text-rose/60">
                            Demo only. Prescribing requires registration and an appropriate assessment.
                          </p>
                          <Button size="sm" onClick={() => void addPrescription()} loading={actionLoading}>
                            Add record
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : section === 'earnings' ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-lavender/15 bg-gradient-to-br from-burgundy/30 to-royal/15 p-5">
                <p className="font-body text-[9px] uppercase tracking-[0.15em] text-mauve">Lifetime demo earnings</p>
                <p className="mt-2 font-display text-4xl text-ivory">
                  {formatCurrency(earnings?.earnings.lifetimePaise || 0)}
                </p>
                <p className="mt-2 font-body text-[8.5px] leading-relaxed text-mauve/60">
                  Gross demo amounts, not settled funds.
                </p>
              </div>
              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="font-body text-[9px] uppercase tracking-[0.15em] text-mauve">Pending settlement</p>
                <p className="mt-2 font-display text-4xl text-ivory">
                  {formatCurrency(earnings?.earnings.pendingSettlementPaise || 0)}
                </p>
                <p className="mt-2 font-body text-[8.5px] leading-relaxed text-mauve/60">
                  No bank settlement is implemented in this demo.
                </p>
              </div>
              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5">
                <p className="font-body text-[9px] uppercase tracking-[0.15em] text-mauve">Transactions</p>
                <p className="mt-2 font-display text-4xl text-ivory">{earnings?.transactions.length || 0}</p>
                <p className="mt-2 font-body text-[8.5px] leading-relaxed text-mauve/60">
                  Paid demo consultations only.
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.02]">
              <div className="border-b border-white/[0.07] px-5 py-4">
                <p className="font-sans text-[11px] font-semibold text-ivory">Transaction records</p>
              </div>
              {earnings?.transactions.length ? (
                <div className="divide-y divide-white/[0.06]">
                  {earnings.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                      <div>
                        <p className="font-sans text-[10px] text-ivory">{transaction.patientName}</p>
                        <p className="mt-0.5 font-body text-[8px] text-mauve">
                          {transaction.bookingId} · {transaction.paidAt ? formatDate(transaction.paidAt) : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-sans text-[11px] font-semibold text-ivory">{formatCurrency(transaction.totalPaise)}</p>
                        <p className="font-body text-[8px] text-mauve">
                          {transaction.status === 'DEMO_PAID' ? 'Demo paid' : transaction.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5">
                  <EmptyState
                    className="py-8"
                    icon={<CircleDollarSign className="h-5 w-5" />}
                    title="No demo earnings yet"
                    description="Completed demo payments will appear here. Real settlement, platform fees and tax withholding are not implemented."
                  />
                </div>
              )}
            </div>
            <p className="rounded-xl border border-white/[0.07] px-4 py-3 font-body text-[9px] text-mauve">
              {earnings?.earnings.demoNote ||
                'Gross demonstration amounts only. No settlement, platform fee, tax withholding or bank transfer is implemented.'}
            </p>
          </div>
        ) : section === 'profile' ? (
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <form onSubmit={(event) => void saveProfile(event)} className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-sans text-[12px] font-semibold text-ivory">Professional profile</p>
                  <p className="mt-0.5 font-body text-[9px] text-mauve">Changes apply to future bookings only.</p>
                </div>
                <Badge tone="lavender"><BadgeCheck className="h-2.5 w-2.5" /> Demo verified</Badge>
              </div>
              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="doctor-bio" className="label-premium">Public bio</label>
                  <textarea
                    id="doctor-bio"
                    rows={4}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                    className="input-premium resize-none"
                  />
                </div>
                <div>
                  <label htmlFor="doctor-approach" className="label-premium">Approach</label>
                  <textarea
                    id="doctor-approach"
                    rows={4}
                    value={profileForm.approach}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, approach: e.target.value }))}
                    className="input-premium resize-none"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="doctor-fee" className="label-premium">Consultation fee (₹)</label>
                    <input
                      id="doctor-fee"
                      type="number"
                      min={0}
                      value={profileForm.feePaise / 100}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, feePaise: Number(e.target.value) * 100 }))}
                      className="input-premium"
                    />
                  </div>
                  <div>
                    <label htmlFor="doctor-followup" className="label-premium">Follow-up fee (₹)</label>
                    <input
                      id="doctor-followup"
                      type="number"
                      min={0}
                      value={profileForm.followUpFeePaise / 100}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, followUpFeePaise: Number(e.target.value) * 100 }))}
                      className="input-premium"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="doctor-languages" className="label-premium">Languages (comma separated)</label>
                  <input
                    id="doctor-languages"
                    value={profileForm.languages}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, languages: e.target.value }))}
                    className="input-premium"
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 font-body text-[10px] text-mauve">
                    <input
                      type="checkbox"
                      checked={profileForm.onlineEnabled}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, onlineEnabled: e.target.checked }))}
                      className="h-4 w-4 accent-[#C9A7F5]"
                    />
                    Video consultations
                  </label>
                  <label className="flex items-center gap-2 font-body text-[10px] text-mauve">
                    <input
                      type="checkbox"
                      checked={profileForm.inPersonEnabled}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, inPersonEnabled: e.target.checked }))}
                      className="h-4 w-4 accent-[#C9A7F5]"
                    />
                    In-person consultations
                  </label>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button type="submit" loading={actionLoading} icon={<Save className="h-3.5 w-3.5" />}>
                  Save profile
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
                <p className="font-sans text-[11px] font-semibold text-ivory">Credential summary</p>
                <p className="mt-1 font-body text-[9px] text-mauve">
                  Demo records only. Primary-source verification is not implemented.
                </p>
                <div className="mt-3 space-y-2">
                  {profile?.credentials.map((credential) => (
                    <div key={credential.id} className="rounded-lg border border-white/[0.06] p-3">
                      <p className="font-sans text-[9.5px] text-ivory/80">{credential.title}</p>
                      <p className="mt-0.5 font-body text-[8px] text-mauve">{credential.institution}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 font-body text-[8.5px] text-lavender">
                  <LockKeyhole className="h-3 w-3" /> Clinical tools require verified status
                </p>
              </div>
              <div className="rounded-[22px] border border-lavender/15 bg-lavender/[0.04] p-5">
                <p className="font-sans text-[10px] font-semibold text-ivory">Profile visibility</p>
                <p className="mt-2 font-body text-[9px] leading-relaxed text-mauve">
                  Your public profile is visible only while status is VERIFIED. This demo does not
                  provide a real credential verification service.
                </p>
              </div>
            </div>
          </div>
        ) : section === 'notifications' ? (
          <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
            <p className="font-sans text-[12px] font-semibold text-ivory">Notifications</p>
            <div className="mt-4 space-y-3">
              {overview?.notifications.map((notification) => (
                <div key={notification.id} className="flex gap-3 rounded-xl border border-white/[0.06] p-4">
                  <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', notification.readAt ? 'bg-white/15' : 'bg-rose')} />
                  <div>
                    <p className="font-sans text-[10.5px] font-semibold text-ivory">{notification.title}</p>
                    <p className="mt-1 font-body text-[9.5px] leading-relaxed text-mauve">{notification.body}</p>
                    <p className="mt-1.5 font-body text-[8px] text-mauve/50">{formatDate(notification.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="Section unavailable" description="Return to your overview." />
        )}
      </DashboardShell>

      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel this appointment?"
        description="The patient will be notified. Any refund is recorded as pending; no live gateway refund is processed in this demo."
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="doctor-cancel-reason" className="label-premium">Reason (optional)</label>
            <textarea
              id="doctor-cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="input-premium resize-none"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>Keep appointment</Button>
            <Button variant="danger" loading={actionLoading} onClick={() => void cancelAppointment()}>
              Cancel appointment
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
