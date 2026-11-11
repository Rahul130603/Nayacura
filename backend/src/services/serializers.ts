import type { Prisma } from '@prisma/client';
import { withinJoinWindow } from './slots';
import { decryptText } from '../utils/crypto';

export const doctorCardInclude = {
  user: { select: { name: true, email: true } },
  specializations: { include: { specialization: true } },
  clinics: { include: { clinic: true } },
  availabilities: { where: { active: true } },
  reviews: { where: { status: 'APPROVED' }, select: { rating: true } },
} satisfies Prisma.DoctorProfileInclude;

export const doctorDetailInclude = {
  ...doctorCardInclude,
  credentials: true,
  clinics: { include: { clinic: true } },
  availabilities: { where: { active: true }, orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] },
  reviews: {
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      createdAt: true,
      isIllustrative: true,
    },
  },
} satisfies Prisma.DoctorProfileInclude;

type DoctorCard = Prisma.DoctorProfileGetPayload<{ include: typeof doctorCardInclude }>;
type DoctorDetail = Prisma.DoctorProfileGetPayload<{ include: typeof doctorDetailInclude }>;

function parseLanguages(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function averageRating(reviews: { rating: number }[]) {
  if (!reviews.length) return null;
  return Math.round((reviews.reduce((total, review) => total + review.rating, 0) / reviews.length) * 10) / 10;
}

export function serializeDoctor(doctor: DoctorCard, nextAvailable: string | null = null) {
  const reviewCount = doctor.reviews.length;
  return {
    id: doctor.id,
    slug: doctor.slug,
    name: doctor.user.name,
    title: doctor.title,
    gender: doctor.gender,
    photoUrl: doctor.photoUrl,
    experienceYears: doctor.experienceYears,
    languages: parseLanguages(doctor.languages),
    feePaise: doctor.feePaise,
    onlineEnabled: doctor.onlineEnabled,
    inPersonEnabled: doctor.inPersonEnabled,
    city: doctor.city,
    clinicName: doctor.clinics?.[0]?.clinic.name || null,
    timezone: doctor.timezone,
    nextAvailable,
    rating: averageRating(doctor.reviews),
    reviewCount,
    verified: doctor.verified,
    isDemo: doctor.isDemo,
    specializations: doctor.specializations.map((item) => ({
      slug: item.specialization.slug,
      name: item.specialization.name,
    })),
    bio: doctor.bio,
    approach: doctor.approach,
    qualifications: [] as string[],
    registrationNumber: null,
    registrationCouncil: null,
    registrationYear: null,
    followUpFeePaise: doctor.followUpFeePaise || undefined,
    cancellationHours: 24,
  };
}

export function serializeDoctorDetail(doctor: DoctorDetail, nextAvailable: string | null = null) {
  const base = serializeDoctor(doctor, nextAvailable);
  const primaryCredential = doctor.credentials[0];
  const clinic = doctor.clinics[0]?.clinic;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const windowMap = new Map<number, string[]>();
  for (const window of doctor.availabilities) {
    const start = `${String(Math.floor(window.startMinute / 60)).padStart(2, '0')}:${String(window.startMinute % 60).padStart(2, '0')}`;
    const end = `${String(Math.floor(window.endMinute / 60)).padStart(2, '0')}:${String(window.endMinute % 60).padStart(2, '0')}`;
    const list = windowMap.get(window.weekday) || [];
    list.push(`${start}–${end}`);
    windowMap.set(window.weekday, list);
  }

  return {
    ...base,
    qualifications: doctor.credentials.map((credential) =>
      credential.institution ? `${credential.title} — ${credential.institution}` : credential.title,
    ),
    registrationNumber: primaryCredential?.registrationNumber || null,
    registrationCouncil: primaryCredential?.council || null,
    registrationYear: primaryCredential?.year || null,
    followUpFeePaise: doctor.followUpFeePaise || undefined,
    availabilitySummary: Array.from(windowMap.entries()).map(([weekday, windows]) => ({
      day: dayNames[weekday] || 'Day',
      windows,
    })),
    clinic: clinic
      ? {
          name: clinic.name,
          city: clinic.city,
          addressNote:
            clinic.addressNote || 'Exact clinic details are shared after a confirmed booking.',
        }
      : null,
    reviews: doctor.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      createdAt: review.createdAt.toISOString(),
      reviewerLabel: review.isIllustrative ? 'Illustrative review (demo)' : 'Verified patient',
      isIllustrative: review.isIllustrative,
    })),
    faqs: [
      {
        question: 'Is this a real clinician?',
        answer:
          'No. This is an illustrative development profile. The name, portrait, qualifications, registration details and availability are fictional and have not been independently verified.',
      },
      {
        question: 'Can a video consultation replace an examination?',
        answer:
          'No. Some concerns require an in-person assessment, tests or a physical examination. The clinician will explain when that is the case.',
      },
      {
        question: 'What happens if I need to cancel?',
        answer:
          'Cancellation terms are shown before payment. This demo uses a 24-hour window for most clinicians; the final production policy must be reviewed legally and clinically.',
      },
    ],
    credentials: doctor.credentials.map((credential) => ({
      id: credential.id,
      type: credential.type,
      title: credential.title,
      institution: credential.institution,
      year: credential.year,
      verified: credential.verified,
    })),
  };
}

export const appointmentInclude = {
  doctor: {
    include: {
      user: { select: { name: true, email: true } },
      specializations: { include: { specialization: true } },
    },
  },
  patient: { include: { user: { select: { name: true, email: true } } } },
  payment: { include: { refunds: true } },
  clinicalNotes: { select: { id: true } },
  prescriptions: { select: { id: true } },
  consultation: true,
  statusHistory: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.AppointmentInclude;

type AppointmentFull = Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>;

export function serializePayment(payment: {
  id: string;
  amountPaise: number;
  taxPaise: number;
  totalPaise: number;
  currency: string;
  status: string;
  provider: string;
  createdAt: Date;
  paidAt?: Date | null;
} | null) {
  if (!payment) return null;
  return {
    id: payment.id,
    amountPaise: payment.amountPaise,
    taxPaise: payment.taxPaise,
    totalPaise: payment.totalPaise,
    currency: payment.currency,
    status: payment.status,
    provider: payment.provider,
    createdAt: payment.createdAt.toISOString(),
    paidAt: payment.paidAt?.toISOString() || null,
  };
}

export function serializeAppointment(appointment: AppointmentFull, viewer: 'PATIENT' | 'DOCTOR') {
  const canJoin =
    viewer === 'PATIENT'
      ? ['CONFIRMED', 'IN_PROGRESS'].includes(appointment.status) &&
        appointment.mode === 'ONLINE' &&
        withinJoinWindow(appointment.startAt, appointment.endAt)
      : ['CONFIRMED', 'IN_PROGRESS'].includes(appointment.status) &&
        appointment.mode === 'ONLINE' &&
        withinJoinWindow(appointment.startAt, appointment.endAt);

  return {
    id: appointment.id,
    bookingId: appointment.bookingId,
    status: appointment.status,
    mode: appointment.mode,
    startAt: appointment.startAt.toISOString(),
    endAt: appointment.endAt.toISOString(),
    timezone: appointment.timezone,
    reason: viewer === 'PATIENT' ? appointment.reason : appointment.reason,
    doctor: {
      id: appointment.doctor.id,
      slug: appointment.doctor.slug,
      name: appointment.doctor.user.name,
      title: appointment.doctor.title,
      photoUrl: appointment.doctor.photoUrl,
      feePaise: appointment.doctor.feePaise,
      specializations: appointment.doctor.specializations.map((item) => ({
        slug: item.specialization.slug,
        name: item.specialization.name,
      })),
    },
    patient:
      viewer === 'DOCTOR'
        ? {
            id: appointment.patient.id,
            name: appointment.patient.user.name,
            email: appointment.patient.user.email,
          }
        : {
            id: appointment.patient.id,
            name: appointment.patient.user.name,
          },
    payment: serializePayment(appointment.payment),
    hasNotes: appointment.clinicalNotes.length > 0,
    prescriptionAvailable: appointment.prescriptions.length > 0,
    canJoin,
    createdAt: appointment.createdAt.toISOString(),
    statusHistory: appointment.statusHistory.map((item) => ({
      status: item.status,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

export function serializeClinicalNote(note: {
  id: string;
  encryptedContent: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: note.id,
    content: decryptText(note.encryptedContent),
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export function serializePrescription(prescription: {
  id: string;
  encryptedMedications: string;
  encryptedInstructions: string;
  issuedAt: Date;
  status: string;
}) {
  return {
    id: prescription.id,
    medications: JSON.parse(decryptText(prescription.encryptedMedications)),
    instructions: decryptText(prescription.encryptedInstructions),
    issuedAt: prescription.issuedAt.toISOString(),
    status: prescription.status,
  };
}

export function serializeArticle(article: {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryName: string;
  content: string;
  author: string;
  reviewer: string | null;
  publishedAt: Date;
  reviewedAt: Date | null;
  readingMinutes: number;
  featured: boolean;
  image: string;
  metaTitle: string | null;
  metaDescription: string | null;
}) {
  return {
    ...article,
    publishedAt: article.publishedAt.toISOString(),
    reviewedAt: article.reviewedAt?.toISOString() || null,
  };
}

export function safeJson(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
