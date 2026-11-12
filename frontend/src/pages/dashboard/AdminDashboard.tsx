import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Headphones,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  MessageSquare,
  Plus,
  RefreshCw,
  ScrollText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Star,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardShell, type DashboardNavItem } from '@/components/layout/DashboardShell';
import { Seo } from '@/components/Seo';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { DoctorAvatar } from '@/components/ui/DoctorAvatar';
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import type { AdminOverview } from '@/types';

type AdminDoctor = {
  id: string;
  slug: string;
  name: string;
  email: string;
  title: string;
  photoUrl?: string | null;
  isDemo: boolean;
  city: string;
  status: string;
  verified: boolean;
  experienceYears: number;
  feePaise: number;
  createdAt: string;
  appointments: number;
  specializations: string[];
  credentials: {
    id: string;
    title: string;
    institution: string | null;
    registrationNumber: string | null;
    council: string | null;
    year: number | null;
    verified: boolean;
  }[];
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  deletedAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  doctorStatus: string | null;
};

type AdminAppointment = {
  id: string;
  bookingId: string;
  status: string;
  mode: string;
  startAt: string;
  doctorName: string;
  patientName: string;
  totalPaise: number;
  paymentStatus: string | null;
  paymentProvider: string | null;
  hasClinicalNotes: boolean;
  hasPrescriptions: boolean;
};

type AdminPayment = {
  id: string;
  bookingId: string;
  doctorName: string;
  patientName: string;
  amountPaise: number;
  taxPaise: number;
  totalPaise: number;
  status: string;
  provider: string;
  createdAt: string;
  paidAt: string | null;
  refunds: { id: string; amountPaise: number; status: string; reason: string | null }[];
};

type AdminTicket = {
  id: string;
  reference: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  messages: { id: string; body: string; authorRole: string; createdAt: string }[];
};

type AdminArticle = {
  id: string;
  slug: string;
  title: string;
  categoryName: string;
  status: string;
  featured: boolean;
  author: string;
  reviewer: string | null;
  publishedAt: string;
};

type AdminService = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  categoryName: string;
  active: boolean;
  featured: boolean;
};

type AuditLogItem = {
  id: string;
  actor: string;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: string | null;
  createdAt: string;
};

type AdminReview = {
  id: string;
  doctorName: string;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  isIllustrative: boolean;
  createdAt: string;
};

type AdminSettings = {
  settings: { id: string; key: string; value: string; updatedAt: string }[];
  environment: {
    demoMode: boolean;
    razorpayConfigured: boolean;
    livekitConfigured: boolean;
    llmConfigured: boolean;
    smtpConfigured: boolean;
  };
};

const statusTone = (status: string) => {
  if (['CONFIRMED', 'VERIFIED', 'PAID', 'RESOLVED', 'APPROVED', 'PUBLISHED'].includes(status)) return 'lavender' as const;
  if (['PENDING', 'PENDING_PAYMENT', 'OPEN', 'PENDING_REVIEW'].includes(status)) return 'rose' as const;
  if (['CANCELLED', 'SUSPENDED', 'REJECTED', 'FAILED'].includes(status)) return 'burgundy' as const;
  return 'muted' as const;
};

function TableShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
        <div>
          <p className="font-sans text-[12px] font-semibold text-ivory">{title}</p>
          {description && <p className="mt-0.5 font-body text-[9px] text-mauve">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const [params] = useSearchParams();
  const section = params.get('section') || 'overview';
  const { push } = useToast();
  const queryClient = useQueryClient();

  const overviewQuery = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api<AdminOverview>('/admin/overview'),
  });
  const doctorsQuery = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => api<{ doctors: AdminDoctor[] }>('/admin/doctors'),
    enabled: ['overview', 'doctors'].includes(section),
  });
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api<{ users: AdminUser[] }>('/admin/users'),
    enabled: section === 'users',
  });
  const appointmentsQuery = useQuery({
    queryKey: ['admin-appointments'],
    queryFn: () => api<{ appointments: AdminAppointment[] }>('/admin/appointments'),
    enabled: ['overview', 'appointments'].includes(section),
  });
  const paymentsQuery = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => api<{ payments: AdminPayment[] }>('/admin/payments'),
    enabled: ['overview', 'payments'].includes(section),
  });
  const ticketsQuery = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: () => api<{ tickets: AdminTicket[] }>('/admin/tickets'),
    enabled: ['overview', 'support'].includes(section),
  });
  const reviewsQuery = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => api<{ reviews: AdminReview[] }>('/admin/reviews'),
    enabled: section === 'reviews',
  });
  const contentQuery = useQuery({
    queryKey: ['admin-content'],
    queryFn: () =>
      Promise.all([
        api<{ categories: { id: string; name: string; serviceCount: number }[]; services: AdminService[] }>('/admin/services'),
        api<{ articles: AdminArticle[] }>('/admin/articles'),
      ]).then(([services, articles]) => ({ ...services, ...articles })),
    enabled: section === 'content',
  });
  const auditQuery = useQuery({
    queryKey: ['admin-audit'],
    queryFn: () => api<{ logs: AuditLogItem[] }>('/admin/audit'),
    enabled: section === 'audit',
  });
  const settingsQuery = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api<AdminSettings>('/admin/settings'),
    enabled: section === 'settings',
  });
  const rolesQuery = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () =>
      api<{
        roles: { role: string; permissions: string[]; restrictions: string[] }[];
        note: string;
      }>('/admin/roles'),
    enabled: section === 'roles',
  });

  const [doctorModal, setDoctorModal] = useState<AdminDoctor | null>(null);
  const [doctorNote, setDoctorNote] = useState('');
  const [refundTarget, setRefundTarget] = useState<AdminPayment | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [ticketTarget, setTicketTarget] = useState<AdminTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<{ key: string; value: string }[]>([]);

  const overview = overviewQuery.data;
  const doctors = doctorsQuery.data?.doctors || [];
  const appointments = appointmentsQuery.data?.appointments || [];
  const payments = paymentsQuery.data?.payments || [];
  const tickets = ticketsQuery.data?.tickets || [];

  useEffect(() => {
    if (settingsQuery.data) {
      setSettingsDraft(settingsQuery.data.settings.map(({ key, value }) => ({ key, value })));
    }
  }, [settingsQuery.data]);

  async function verifyDoctor(status: 'VERIFIED' | 'SUSPENDED') {
    if (!doctorModal) return;
    setActionLoading(true);
    try {
      await api(`/admin/doctors/${doctorModal.id}/verify`, {
        method: 'POST',
        body: { verified: status === 'VERIFIED', status, note: doctorNote || undefined },
      });
      push({
        title: `Credential status set to ${status}`,
        description: 'This demo does not perform primary-source verification.',
        tone: 'success',
      });
      setDoctorModal(null);
      setDoctorNote('');
      await Promise.all([
        doctorsQuery.refetch(),
        overviewQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ['doctors'] }),
      ]);
    } catch (error) {
      push({ title: 'Could not update status', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function recordRefund() {
    if (!refundTarget) return;
    setActionLoading(true);
    try {
      await api(`/admin/payments/${refundTarget.id}/refund`, {
        method: 'POST',
        body: { amountPaise: Math.round(Number(refundAmount) * 100), reason: refundReason },
      });
      push({
        title: 'Refund recorded as pending',
        description: 'No live Razorpay refund API call is made in this demo.',
        tone: 'success',
      });
      setRefundTarget(null);
      setRefundAmount('');
      setRefundReason('');
      await paymentsQuery.refetch();
    } catch (error) {
      push({ title: 'Could not record refund', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function replyToTicket() {
    if (!ticketTarget) return;
    setActionLoading(true);
    try {
      await api(`/admin/tickets/${ticketTarget.id}/reply`, {
        method: 'POST',
        body: { message: ticketReply },
      });
      push({ title: 'Reply added', tone: 'success' });
      setTicketTarget(null);
      setTicketReply('');
      await ticketsQuery.refetch();
    } catch (error) {
      push({ title: 'Could not reply', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  async function updateTicketStatus(ticket: AdminTicket, status: string) {
    try {
      await api(`/admin/tickets/${ticket.id}`, { method: 'PATCH', body: { status } });
      push({ title: 'Ticket updated', tone: 'success' });
      await ticketsQuery.refetch();
    } catch (error) {
      push({ title: 'Could not update ticket', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    }
  }

  async function moderateReview(review: AdminReview, status: string) {
    try {
      await api(`/admin/reviews/${review.id}`, { method: 'PATCH', body: { status } });
      push({ title: `Review ${status.toLowerCase()}`, tone: 'success' });
      await reviewsQuery.refetch();
    } catch (error) {
      push({ title: 'Could not moderate review', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    }
  }

  async function toggleService(service: AdminService, field: 'active' | 'featured') {
    try {
      await api(`/admin/services/${service.id}`, {
        method: 'PATCH',
        body: { [field]: !service[field] },
      });
      push({ title: 'Service updated', tone: 'success' });
      await contentQuery.refetch();
    } catch (error) {
      push({ title: 'Could not update service', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    }
  }

  async function toggleArticle(article: AdminArticle) {
    try {
      await api(`/admin/articles/${article.id}`, {
        method: 'PATCH',
        body: { status: article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' },
      });
      push({ title: 'Article status updated', tone: 'success' });
      await contentQuery.refetch();
    } catch (error) {
      push({ title: 'Could not update article', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    }
  }

  async function saveSettings() {
    setActionLoading(true);
    try {
      await api('/admin/settings', { method: 'PATCH', body: { settings: settingsDraft } });
      push({ title: 'Platform settings saved', tone: 'success' });
      await settingsQuery.refetch();
    } catch (error) {
      push({ title: 'Could not save settings', description: error instanceof Error ? error.message : undefined, tone: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  const navItems: DashboardNavItem[] = [
    { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'doctors', label: 'Doctor onboarding', icon: Stethoscope, badge: overview?.pendingDoctors },
    { key: 'users', label: 'Accounts', icon: Users },
    { key: 'appointments', label: 'Appointments', icon: CalendarDays },
    { key: 'payments', label: 'Payments & refunds', icon: CircleDollarSign },
    { key: 'content', label: 'Content', icon: BookOpen },
    { key: 'reviews', label: 'Review moderation', icon: Star },
    { key: 'support', label: 'Support tickets', icon: Headphones, badge: overview?.openTickets },
    { key: 'audit', label: 'Audit logs', icon: ScrollText },
    { key: 'settings', label: 'Platform settings', icon: Settings },
    { key: 'roles', label: 'Roles & permissions', icon: ShieldCheck },
  ];

  const sectionTitles: Record<string, string> = {
    overview: 'Platform overview',
    doctors: 'Doctor onboarding',
    users: 'Account administration',
    appointments: 'Appointment operations',
    payments: 'Payments & refunds',
    content: 'Content management',
    reviews: 'Review moderation',
    support: 'Support tickets',
    audit: 'Audit trail',
    settings: 'Platform settings',
    roles: 'Roles & permissions',
  };

  const paidTotal = useMemo(
    () => payments.filter((payment) => ['PAID', 'DEMO_PAID'].includes(payment.status)).reduce((sum, payment) => sum + payment.totalPaise, 0),
    [payments],
  );

  if (overviewQuery.isError) {
    return (
      <DashboardShell portal="Admin console" title="Administration" subtitle="Least-privilege platform operations" navItems={navItems} accent="burgundy">
        <ErrorState title="Admin data could not load" description="The API may be unavailable or your admin session has expired." onRetry={() => void overviewQuery.refetch()} />
      </DashboardShell>
    );
  }

  return (
    <>
      <Seo title="Admin Console" description="Least-privilege platform administration." path="/admin" noIndex />
      <DashboardShell
        portal="Admin console"
        title={sectionTitles[section] || 'Platform overview'}
        subtitle="Least-privilege operations · clinical notes are restricted"
        navItems={navItems}
        accent="burgundy"
      >
        {overviewQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full" />
            <div className="grid gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : section === 'overview' ? (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-[24px] border border-lavender/15 bg-gradient-to-br from-burgundy/30 via-plum to-royal/15 p-5 sm:p-7">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10" />
              <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-rose">Administration</p>
                  <h2 className="mt-2 font-display text-[clamp(1.9rem,3.3vw,2.8rem)] text-ivory">
                    Platform operations at a glance.
                  </h2>
                  <p className="mt-2 font-body text-[10px] text-mauve">
                    Clinical notes and AI conversation content are excluded from this console.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="rose" dot>{overview?.pendingDoctors || 0} credential reviews</Badge>
                  <Badge tone="muted">{overview?.openTickets || 0} open tickets</Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Accounts', value: overview?.users || 0, sub: `${overview?.patients || 0} ${overview?.patients === 1 ? 'patient' : 'patients'}`, icon: Users },
                { label: 'Clinicians', value: overview?.doctors || 0, sub: `${overview?.pendingDoctors || 0} pending`, icon: Stethoscope },
                { label: 'Appointments', value: overview?.appointments || 0, sub: `${overview?.upcomingAppointments || 0} upcoming`, icon: CalendarDays },
                { label: 'Recorded revenue', value: formatCurrency(overview?.revenuePaise || 0), sub: 'Demo amounts', icon: CircleDollarSign },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                    <div className="flex items-center justify-between">
                      <Icon className="h-4 w-4 text-lavender" />
                      <span className="font-body text-[8px] text-mauve/50">{item.sub}</span>
                    </div>
                    <p className="mt-4 font-display text-2xl text-ivory">{item.value}</p>
                    <p className="mt-0.5 font-body text-[9px] uppercase tracking-[0.12em] text-mauve/60">{item.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
              <TableShell
                title="Recent appointments"
                description="Administrative metadata only — no clinical content"
                actions={<button type="button" onClick={() => window.location.assign('/admin?section=appointments')} className="font-sans text-[9px] font-semibold text-lavender">View all</button>}
              >
                <div className="divide-y divide-white/[0.06]">
                  {appointments.slice(0, 6).map((appointment) => (
                    <div key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                      <div>
                        <p className="font-sans text-[10px] text-ivory">{appointment.patientName} → {appointment.doctorName}</p>
                        <p className="mt-0.5 font-body text-[8px] text-mauve">
                          {formatDate(appointment.startAt)} · {appointment.mode}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={statusTone(appointment.status)}>{appointment.status.replace(/_/g, ' ')}</Badge>
                        <span className="font-mono text-[7.5px] text-mauve/40">{appointment.bookingId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </TableShell>

              <div className="space-y-3">
                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
                  <p className="font-sans text-[11px] font-semibold text-ivory">Operational queue</p>
                  <div className="mt-4 space-y-2">
                    {[
                      ['Credential reviews', overview?.pendingDoctors || 0, '/admin?section=doctors'],
                      ['Open support tickets', overview?.openTickets || 0, '/admin?section=support'],
                      ['Audit events', overview?.auditEvents || 0, '/admin?section=audit'],
                    ].map(([label, value, to]) => (
                      <button
                        key={label as string}
                        type="button"
                        onClick={() => window.location.assign(to as string)}
                        className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] px-3.5 py-3 text-left hover:border-lavender/20"
                      >
                        <span className="font-body text-[9.5px] text-ivory/65">{label as string}</span>
                        <span className="flex items-center gap-2 font-sans text-[11px] font-semibold text-ivory">
                          {value as number} <ChevronRight className="h-3 w-3 text-mauve" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-[22px] border border-rose/20 bg-burgundy/20 p-5">
                  <ShieldAlert className="h-4 w-4 text-rose" />
                  <p className="mt-3 font-sans text-[10px] font-semibold text-ivory">Clinical access boundary</p>
                  <p className="mt-2 font-body text-[9px] leading-relaxed text-mauve">
                    Administrators can see that a note or prescription exists, but not its content.
                    Clinical records, AI conversations and medical documents remain outside this role.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : section === 'doctors' ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-sans text-[12px] font-semibold text-ivory">Clinician accounts</p>
                <p className="mt-0.5 font-body text-[9px] text-mauve">
                  Demo verification workflow. No primary-source credential check is performed.
                </p>
              </div>
              <button type="button" onClick={() => void doctorsQuery.refetch()} className="inline-flex items-center gap-1.5 font-sans text-[9px] text-mauve hover:text-ivory">
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>
            <div className="grid gap-2.5">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="rounded-[18px] border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <DoctorAvatar doctor={doctor} size="sm" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-sans text-[11.5px] font-semibold text-ivory">{doctor.name}</p>
                          <Badge tone={statusTone(doctor.status)}>{doctor.status}</Badge>
                          <Badge tone="muted">Demo</Badge>
                        </div>
                        <p className="mt-1 font-body text-[9px] text-mauve">{doctor.title} · {doctor.city} · {doctor.experienceYears} yrs</p>
                        <p className="mt-1 font-body text-[8.5px] text-mauve/60">
                          {doctor.specializations.join(' · ')} · {doctor.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-sans text-[10px] text-ivory/70">{formatCurrency(doctor.feePaise)}</p>
                      <Button size="sm" variant="secondary" className="min-h-8 px-3 text-[9px]" onClick={() => setDoctorModal(doctor)}>
                        Review credentials
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : section === 'users' ? (
          <TableShell title="Accounts" description="No clinical or AI content is exposed here">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="border-b border-white/[0.07]">
                  <tr>
                    {['Name', 'Email', 'Role', 'Verified', 'Created', 'Last login'].map((header) => (
                      <th key={header} className="px-5 py-3 font-sans text-[8px] font-semibold uppercase tracking-[0.14em] text-mauve/60">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {usersQuery.data?.users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-5 py-3 font-sans text-[10px] text-ivory">{user.name}</td>
                      <td className="px-5 py-3 font-body text-[9px] text-mauve">{user.email}</td>
                      <td className="px-5 py-3"><Badge tone="muted">{user.role}</Badge></td>
                      <td className="px-5 py-3 font-body text-[9px] text-mauve">{user.emailVerified ? 'Yes' : 'No'}</td>
                      <td className="px-5 py-3 font-body text-[9px] text-mauve">{formatDate(user.createdAt)}</td>
                      <td className="px-5 py-3 font-body text-[9px] text-mauve">{user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableShell>
        ) : section === 'appointments' ? (
          <TableShell title="Appointment operations" description="Clinical content is restricted from administrators">
            <div className="divide-y divide-white/[0.06]">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-sans text-[10.5px] text-ivory">{appointment.patientName} → {appointment.doctorName}</p>
                    <p className="mt-0.5 font-body text-[8.5px] text-mauve">
                      {appointment.bookingId} · {formatDateTime(appointment.startAt)} · {appointment.mode}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone(appointment.status)}>{appointment.status.replace(/_/g, ' ')}</Badge>
                    <Badge tone="muted">{appointment.paymentStatus || 'No payment'}</Badge>
                    <span className="font-body text-[8px] text-mauve/50">
                      Clinical: {appointment.hasClinicalNotes || appointment.hasPrescriptions ? 'present (restricted)' : 'none'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TableShell>
        ) : section === 'payments' ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-lavender/15 bg-lavender/[0.04] px-5 py-4">
              <p className="font-body text-[9px] uppercase tracking-[0.14em] text-mauve">Recorded demo revenue</p>
              <p className="mt-1 font-display text-3xl text-ivory">{formatCurrency(paidTotal)}</p>
              <p className="mt-1 font-body text-[8px] text-mauve/50">Gross paid amounts in the loaded records. No settlement or card data.</p>
            </div>
            <TableShell title="Payments" description="No card details are stored. Refunds are recorded, not gateway-processed.">
              <div className="divide-y divide-white/[0.06]">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-sans text-[10px] text-ivory">{payment.patientName} → {payment.doctorName}</p>
                      <p className="mt-0.5 font-body text-[8.5px] text-mauve">{payment.bookingId} · {formatDate(payment.createdAt)}</p>
                      {payment.refunds.map((refund) => (
                        <p key={refund.id} className="mt-1 font-body text-[8px] text-rose">
                          Refund {formatCurrency(refund.amountPaise)} · {refund.status}
                        </p>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-sans text-[11px] font-semibold text-ivory">{formatCurrency(payment.totalPaise)}</p>
                        <Badge tone={statusTone(payment.status)} className="mt-1">{payment.status}</Badge>
                      </div>
                      {['PAID', 'DEMO_PAID'].includes(payment.status) && (
                        <Button size="sm" variant="secondary" className="min-h-8 px-3 text-[9px]" onClick={() => setRefundTarget(payment)}>
                          Refund
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TableShell>
          </div>
        ) : section === 'content' ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <TableShell title="Service catalogue" description="Toggle active or featured status">
              <div className="max-h-[600px] divide-y divide-white/[0.06] overflow-y-auto">
                {contentQuery.data?.services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="font-sans text-[10px] text-ivory">{service.name}</p>
                      <p className="mt-0.5 font-body text-[8px] text-mauve">{service.categoryName}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => void toggleService(service, 'active')}
                        className={cn('rounded-full border px-2.5 py-1 font-sans text-[8px]', service.active ? 'border-lavender/25 bg-lavender/10 text-lavender' : 'border-white/10 text-mauve')}
                      >
                        {service.active ? 'Active' : 'Hidden'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleService(service, 'featured')}
                        className={cn('rounded-full border px-2.5 py-1 font-sans text-[8px]', service.featured ? 'border-rose/25 bg-rose/10 text-rose' : 'border-white/10 text-mauve')}
                      >
                        Featured
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </TableShell>
            <TableShell title="Journal articles" description="Demo content is unreviewed editorial draft">
              <div className="max-h-[600px] divide-y divide-white/[0.06] overflow-y-auto">
                {contentQuery.data?.articles.map((article) => (
                  <div key={article.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-sans text-[10px] text-ivory">{article.title}</p>
                      <p className="mt-0.5 font-body text-[8px] text-mauve">
                        {article.categoryName} · {article.reviewer ? `Reviewed by ${article.reviewer}` : 'Not medically reviewed'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void toggleArticle(article)}
                      className={cn('shrink-0 rounded-full border px-2.5 py-1 font-sans text-[8px]', article.status === 'PUBLISHED' ? 'border-lavender/25 bg-lavender/10 text-lavender' : 'border-white/10 text-mauve')}
                    >
                      {article.status}
                    </button>
                  </div>
                ))}
              </div>
            </TableShell>
          </div>
        ) : section === 'reviews' ? (
          <div className="space-y-2.5">
            {reviewsQuery.data?.reviews.length ? (
              reviewsQuery.data.reviews.map((review) => (
                <div key={review.id} className="rounded-[18px] border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-sans text-[10.5px] text-ivory">{review.doctorName}</p>
                      <div className="mt-1 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} className={cn('h-3 w-3', index < review.rating ? 'fill-rose text-rose' : 'text-white/15')} />
                        ))}
                      </div>
                      <p className="mt-2 max-w-xl font-body text-[10px] leading-relaxed text-mauve">{review.body}</p>
                    </div>
                    <div className="flex gap-2">
                      {review.status === 'PENDING' && (
                        <>
                          <Button size="sm" variant="secondary" className="min-h-8 px-3 text-[9px]" onClick={() => void moderateReview(review, 'REJECTED')}>
                            Reject
                          </Button>
                          <Button size="sm" className="min-h-8 px-3 text-[9px]" onClick={() => void moderateReview(review, 'APPROVED')}>
                            Approve
                          </Button>
                        </>
                      )}
                      <Badge tone={statusTone(review.status)}>{review.status}</Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<Star className="h-5 w-5" />}
                title="No reviews to moderate"
                description="Reviews are accepted only after a completed consultation. This demo does not fabricate testimonials."
              />
            )}
          </div>
        ) : section === 'support' ? (
          <div className="space-y-2.5">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-[18px] border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-sans text-[10.5px] font-semibold text-ivory">{ticket.subject}</p>
                      <Badge tone={statusTone(ticket.status)}>{ticket.status.replace(/_/g, ' ')}</Badge>
                      <Badge tone="muted">{ticket.priority}</Badge>
                    </div>
                    <p className="mt-1 font-body text-[8.5px] text-mauve">
                      {ticket.reference} · {ticket.name} · {ticket.email} · {ticket.category}
                    </p>
                    <p className="mt-1 font-body text-[8px] text-mauve/50">
                      {ticket.messages.length} message{ticket.messages.length === 1 ? '' : 's'} · {formatDate(ticket.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" className="min-h-8 px-3 text-[9px]" onClick={() => setTicketTarget(ticket)}>
                      Open
                    </Button>
                    {ticket.status !== 'CLOSED' && (
                      <Button size="sm" variant="ghost" className="min-h-8 px-3 text-[9px]" onClick={() => void updateTicketStatus(ticket, 'CLOSED')}>
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : section === 'audit' ? (
          <TableShell title="Audit trail" description="Metadata only. Clinical content is never written to audit logs.">
            <div className="max-h-[650px] divide-y divide-white/[0.06] overflow-y-auto">
              {auditQuery.data?.logs.map((log) => (
                <div key={log.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-sans text-[9.5px] text-ivory">{log.action}</p>
                    <p className="font-mono text-[8px] text-mauve/50">{formatDateTime(log.createdAt)}</p>
                  </div>
                  <p className="mt-1 font-body text-[8.5px] text-mauve">
                    {log.actor} ({log.actorRole || 'system'}) · {log.entityType}
                    {log.entityId ? ` · ${log.entityId.slice(0, 12)}…` : ''}
                  </p>
                </div>
              ))}
            </div>
          </TableShell>
        ) : section === 'settings' ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <p className="font-sans text-[12px] font-semibold text-ivory">Platform settings</p>
                <Button size="sm" onClick={() => void saveSettings()} loading={actionLoading}>Save</Button>
              </div>
              <p className="mt-1 font-body text-[9px] text-mauve">These values affect the demo platform only.</p>
              <div className="mt-4 space-y-2">
                {settingsDraft.map((setting, index) => (
                  <div key={setting.key} className="grid gap-2 rounded-xl border border-white/[0.06] p-3 sm:grid-cols-[200px_1fr] sm:items-center">
                    <p className="font-mono text-[9px] text-mauve">{setting.key}</p>
                    <input
                      value={setting.value}
                      onChange={(e) =>
                        setSettingsDraft((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, value: e.target.value } : item)),
                        )
                      }
                      className="rounded-lg border border-white/10 bg-midnight px-3 py-2 font-body text-[10px] text-ivory focus:border-lavender/40 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.02] p-5">
                <p className="font-sans text-[11px] font-semibold text-ivory">Integration status</p>
                <div className="mt-3 space-y-2">
                  {settingsQuery.data &&
                    Object.entries(settingsQuery.data.environment).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2.5">
                        <span className="font-body text-[9px] capitalize text-mauve">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <Badge tone={value ? 'lavender' : 'muted'}>{value ? 'Configured' : 'Demo fallback'}</Badge>
                      </div>
                    ))}
                </div>
              </div>
              <div className="rounded-[22px] border border-rose/20 bg-burgundy/20 p-5">
                <ShieldAlert className="h-4 w-4 text-rose" />
                <p className="mt-3 font-sans text-[10px] font-semibold text-ivory">No certification claim</p>
                <p className="mt-2 font-body text-[9px] leading-relaxed text-mauve">
                  This demo is not HIPAA, GDPR or DPDP certified. Integration flags show whether
                  credentials exist, not whether the integration has been clinically or legally approved.
                </p>
              </div>
            </div>
          </div>
        ) : section === 'roles' ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-lavender/15 bg-lavender/[0.04] p-5">
              <p className="font-sans text-[11px] font-semibold text-ivory">Least-privilege model</p>
              <p className="mt-1 font-body text-[9px] leading-relaxed text-mauve">
                {rolesQuery.data?.note || 'Permissions are defined by role and checked server-side.'}
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {rolesQuery.data?.roles.map((role) => (
                <div key={role.role} className="rounded-[20px] border border-white/[0.08] bg-white/[0.02] p-5">
                  <Badge tone={role.role === 'ADMIN' ? 'burgundy' : role.role === 'DOCTOR' ? 'lavender' : 'rose'}>{role.role}</Badge>
                  <div className="mt-4">
                    <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.14em] text-mauve">Allowed</p>
                    <ul className="mt-2 space-y-1.5">
                      {role.permissions.map((permission) => (
                        <li key={permission} className="flex items-start gap-1.5 font-body text-[9px] leading-relaxed text-ivory/60">
                          <Check className="mt-0.5 h-2.5 w-2.5 shrink-0 text-lavender" /> {permission}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4 border-t border-white/[0.06] pt-3">
                    <p className="font-sans text-[8px] font-semibold uppercase tracking-[0.14em] text-rose/70">Restricted</p>
                    <ul className="mt-2 space-y-1.5">
                      {role.restrictions.map((restriction) => (
                        <li key={restriction} className="flex items-start gap-1.5 font-body text-[9px] leading-relaxed text-mauve">
                          <X className="mt-0.5 h-2.5 w-2.5 shrink-0 text-rose/60" /> {restriction}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="Section unavailable" description="Return to the admin overview." />
        )}
      </DashboardShell>

      <Modal
        open={Boolean(doctorModal)}
        onClose={() => setDoctorModal(null)}
        title="Credential review"
        description="This is a demonstration workflow. No real credential verification or regulatory check is performed."
        className="max-w-2xl"
      >
        {doctorModal && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/[0.08] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <DoctorAvatar doctor={doctorModal} size="sm" />
                  <div>
                    <p className="font-sans text-[12px] font-semibold text-ivory">{doctorModal.name}</p>
                    <p className="mt-0.5 font-body text-[9px] text-mauve">{doctorModal.email}</p>
                  </div>
                </div>
                <Badge tone={statusTone(doctorModal.status)}>{doctorModal.status}</Badge>
              </div>
              <div className="mt-3 space-y-2">
                {doctorModal.credentials.map((credential) => (
                  <div key={credential.id} className="rounded-lg border border-white/[0.06] p-3">
                    <p className="font-sans text-[9.5px] text-ivory/80">{credential.title}</p>
                    <p className="mt-0.5 font-body text-[8.5px] text-mauve">
                      {credential.institution || 'No institution'} · {credential.registrationNumber || 'No registration'}
                    </p>
                    <p className="mt-0.5 font-body text-[8px] text-mauve/60">
                      {credential.council || 'No council'} · {credential.year || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="doctor-review-note" className="label-premium">Internal review note (optional)</label>
              <input
                id="doctor-review-note"
                value={doctorNote}
                onChange={(e) => setDoctorNote(e.target.value)}
                className="input-premium"
                placeholder="No clinical or document content"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setDoctorModal(null)}>Cancel</Button>
              <Button variant="danger" loading={actionLoading} onClick={() => void verifyDoctor('SUSPENDED')}>
                Suspend
              </Button>
              <Button loading={actionLoading} onClick={() => void verifyDoctor('VERIFIED')} icon={<BadgeCheck className="h-4 w-4" />}>
                Mark verified
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        title="Record a refund"
        description="This only records a pending refund in the demo database. It does not call Razorpay or move money."
      >
        {refundTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/[0.08] p-3.5">
              <p className="font-sans text-[10px] text-ivory">{refundTarget.bookingId}</p>
              <p className="mt-0.5 font-body text-[9px] text-mauve">Paid {formatCurrency(refundTarget.totalPaise)}</p>
            </div>
            <div>
              <label htmlFor="refund-amount" className="label-premium">Amount (₹)</label>
              <input
                id="refund-amount"
                type="number"
                min={1}
                max={refundTarget.totalPaise / 100}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="input-premium"
              />
            </div>
            <div>
              <label htmlFor="refund-reason" className="label-premium">Reason</label>
              <input
                id="refund-reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="input-premium"
                placeholder="Administrative reason only"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRefundTarget(null)}>Cancel</Button>
              <Button loading={actionLoading} disabled={!refundAmount || !refundReason} onClick={() => void recordRefund()}>
                Record refund
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(ticketTarget)}
        onClose={() => setTicketTarget(null)}
        title="Support ticket"
        description="Reply to the support request. Never request clinical records through this channel."
        className="max-w-2xl"
      >
        {ticketTarget && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-sans text-[11px] font-semibold text-ivory">{ticketTarget.subject}</p>
                <p className="mt-0.5 font-body text-[8.5px] text-mauve">{ticketTarget.reference} · {ticketTarget.email}</p>
              </div>
              <Badge tone={statusTone(ticketTarget.status)}>{ticketTarget.status.replace(/_/g, ' ')}</Badge>
            </div>
            <div className="max-h-[40vh] space-y-2 overflow-y-auto">
              {ticketTarget.messages.map((message) => (
                <div key={message.id} className={cn('rounded-xl border border-white/[0.07] p-3', message.authorRole === 'ADMIN' && 'bg-lavender/[0.04]')}>
                  <p className="font-body text-[10px] leading-relaxed text-ivory/70">{message.body}</p>
                  <p className="mt-1 font-body text-[7.5px] uppercase tracking-wider text-mauve/50">
                    {message.authorRole} · {formatDateTime(message.createdAt)}
                  </p>
                </div>
              ))}
            </div>
            <textarea
              value={ticketReply}
              onChange={(e) => setTicketReply(e.target.value)}
              rows={3}
              className="input-premium resize-none"
              placeholder="Write a support reply"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setTicketTarget(null)}>Close</Button>
              <Button loading={actionLoading} disabled={!ticketReply.trim()} onClick={() => void replyToTicket()}>
                Send reply
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
