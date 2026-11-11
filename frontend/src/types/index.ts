export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
  patient?: { id: string; phone?: string | null; communicationPreference?: string | null } | null;
  doctor?: { id: string; slug: string; status: string; verified: boolean } | null;
}

export interface Specialization {
  slug: string;
  name: string;
}

export interface Doctor {
  id: string;
  slug: string;
  name: string;
  title: string;
  gender: 'MALE' | 'FEMALE' | 'NONBINARY';
  photoUrl: string | null;
  experienceYears: number;
  languages: string[];
  feePaise: number;
  onlineEnabled: boolean;
  inPersonEnabled: boolean;
  city: string;
  clinicName: string | null;
  timezone: string;
  nextAvailable: string | null;
  rating: number | null;
  reviewCount: number;
  verified: boolean;
  isDemo: boolean;
  specializations: Specialization[];
  bio: string;
  approach: string;
  qualifications: string[];
  registrationNumber?: string | null;
  registrationCouncil?: string | null;
  registrationYear?: number | null;
  followUpFeePaise?: number;
  cancellationHours?: number;
}

export interface DoctorDetail extends Doctor {
  availabilitySummary: { day: string; windows: string[] }[];
  clinic: { name: string; city: string; addressNote: string } | null;
  reviews: Review[];
  faqs: { question: string; answer: string }[];
}

export interface Review {
  id: string;
  rating: number;
  title?: string | null;
  body: string;
  createdAt: string;
  reviewerLabel: string;
  isIllustrative: boolean;
}

export interface AvailabilitySlot {
  startAt: string;
  endAt: string;
  mode: 'ONLINE' | 'IN_PERSON';
  label?: string;
}

export interface DoctorFilters {
  gender?: string;
  specialization?: string;
  mode?: string;
  language?: string;
  city?: string;
  minExperience?: number;
  maxFee?: number;
  availability?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export type AppointmentStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export interface Appointment {
  id: string;
  bookingId: string;
  status: AppointmentStatus;
  mode: 'ONLINE' | 'IN_PERSON';
  startAt: string;
  endAt: string;
  timezone: string;
  reason?: string | null;
  doctor: Pick<Doctor, 'id' | 'slug' | 'name' | 'title' | 'photoUrl' | 'feePaise'> & {
    specializations?: Specialization[];
  };
  patient?: { id: string; name: string; email?: string };
  payment?: Payment | null;
  hasNotes?: boolean;
  prescriptionAvailable?: boolean;
  canJoin?: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  amountPaise: number;
  taxPaise: number;
  totalPaise: number;
  currency: string;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED' | 'DEMO_PAID';
  provider: 'RAZORPAY' | 'DEMO';
  createdAt: string;
  paidAt?: string | null;
}

export interface ServiceSummary {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  summary: string;
  icon?: string;
  featured?: boolean;
}

export interface ServiceCategory {
  slug: string;
  name: string;
  tagline: string;
  description: string;
}

export interface ServiceDetail extends ServiceSummary {
  overview: string;
  concerns: string[];
  factors: string[];
  whenToSeek: string[];
  consultation: string[];
  specialists: string[];
  faqs: { question: string; answer: string }[];
}

export interface ArticleSummary {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryName: string;
  author: string;
  reviewer?: string | null;
  publishedAt: string;
  reviewedAt?: string | null;
  readingMinutes: number;
  featured: boolean;
  image: string;
}

export interface Article extends ArticleSummary {
  content: string;
  related: ArticleSummary[];
  metaTitle?: string;
  metaDescription?: string;
}

export interface Plan {
  code: string;
  name: string;
  description: string;
  pricePaise: number;
  taxPercent: number;
  duration: string;
  includes: string[];
  mode: 'ONLINE' | 'IN_PERSON' | 'EITHER';
  popular?: boolean;
}

export interface SupportTicket {
  id: string;
  reference: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages?: { id: string; body: string; authorRole: string; createdAt: string }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
  type: string;
}

export interface StaffAppointment extends Appointment {
  patient: { id: string; name: string; email: string };
  hasClinicalNote?: boolean;
}

export interface AdminOverview {
  users: number;
  patients: number;
  doctors: number;
  pendingDoctors: number;
  appointments: number;
  upcomingAppointments: number;
  revenuePaise: number;
  openTickets: number;
  auditEvents: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
