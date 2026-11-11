import { z } from 'zod';

const name = z.string().trim().min(2, 'Please enter your full name.').max(80);
const email = z.string().trim().toLowerCase().email('Please enter a valid email address.');
const password = z
  .string()
  .min(10, 'Use at least 10 characters.')
  .max(128, 'Password is too long.')
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
    message: 'Include at least one letter and one number.',
  });

export const registerSchema = z.object({
  name,
  email,
  password,
  ageConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'Nayacura is for adults aged 18 and over.' }),
  }),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Please accept the privacy notice to create an account.' }),
  }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Please enter your password.').max(128),
  role: z.enum(['PATIENT', 'DOCTOR', 'ADMIN']).optional(),
});

export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(500),
  password,
});
export const verifyEmailSchema = z.object({ token: z.string().min(20).max(500) });
export const accountDeletionSchema = z.object({
  reason: z.string().trim().max(500).optional(),
  confirmation: z.literal(true),
});

export const doctorQuerySchema = z.object({
  gender: z.enum(['MALE', 'FEMALE', 'NONBINARY']).optional(),
  specialization: z.string().max(80).optional(),
  mode: z.enum(['ONLINE', 'IN_PERSON']).optional(),
  language: z.string().max(40).optional(),
  city: z.string().max(80).optional(),
  minExperience: z.coerce.number().min(0).max(60).optional(),
  maxFee: z.coerce.number().min(0).max(10000000).optional(),
  availability: z.enum(['ANY', 'TODAY', 'THIS_WEEK']).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['recommended', 'experience', 'fee_low', 'fee_high', 'earliest']).optional(),
  page: z.coerce.number().min(1).max(100).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

export const availabilityQuerySchema = z.object({
  mode: z.enum(['ONLINE', 'IN_PERSON']).default('ONLINE'),
  days: z.coerce.number().min(1).max(45).default(21),
});

export const createAppointmentSchema = z.object({
  doctorSlug: z.string().min(1).max(100),
  mode: z.enum(['ONLINE', 'IN_PERSON']),
  startAt: z.string().datetime({ offset: true }),
  serviceSlug: z.string().max(100).optional(),
  fullName: name,
  email,
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
  communicationPreference: z.enum(['EMAIL', 'SMS', 'WHATSAPP']).default('EMAIL'),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Please provide consent to proceed.' }),
  }),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
  demo: z.boolean().optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  startAt: z.string().datetime({ offset: true }),
});

export const appointmentStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  note: z.string().trim().max(500).optional(),
});

export const aiChatSchema = z.object({
  message: z.string().trim().min(1, 'Please write a message.').max(2000),
  conversationId: z.string().max(100).nullable().optional(),
  language: z.enum(['en', 'ta']).default('en'),
  consent: z.boolean().default(false),
});

export const supportTicketSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  category: z.enum([
    'GENERAL',
    'APPOINTMENT',
    'BILLING',
    'DOCTOR_ONBOARDING',
    'PRIVACY',
    'ACCESSIBILITY',
    'TECHNICAL',
  ]),
  subject: z.string().trim().min(5, 'Please add a short subject.').max(140),
  message: z.string().trim().min(10, 'Please add a little more detail.').max(3000),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
});

export const supportReplySchema = z.object({
  message: z.string().trim().min(1).max(3000),
});

export const clinicalNoteSchema = z.object({
  content: z.string().trim().min(10, 'Please add a note.').max(12000),
});

export const prescriptionSchema = z.object({
  medications: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        dosage: z.string().trim().min(1).max(120),
        frequency: z.string().trim().min(1).max(120),
        duration: z.string().trim().min(1).max(120),
      }),
    )
    .min(1)
    .max(20),
  instructions: z.string().trim().min(5, 'Please add instructions.').max(4000),
});

export const patientProfileSchema = z.object({
  name: name.optional(),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  preferredLanguage: z.enum(['en', 'ta', 'hi', 'te', 'ml']).optional(),
  communicationPreference: z.enum(['EMAIL', 'SMS', 'WHATSAPP']).optional(),
  marketingConsent: z.boolean().optional(),
  aiHistoryEnabled: z.boolean().optional(),
});

export const availabilityUpdateSchema = z.object({
  windows: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        startMinute: z.number().int().min(0).max(1439),
        endMinute: z.number().int().min(1).max(1440),
        mode: z.enum(['ONLINE', 'IN_PERSON', 'BOTH']),
      }),
    )
    .max(40),
});

export const doctorProfileUpdateSchema = z.object({
  bio: z.string().trim().min(20).max(3000).optional(),
  approach: z.string().trim().min(20).max(3000).optional(),
  feePaise: z.number().int().min(0).max(1000000).optional(),
  followUpFeePaise: z.number().int().min(0).max(1000000).optional(),
  onlineEnabled: z.boolean().optional(),
  inPersonEnabled: z.boolean().optional(),
  languages: z.array(z.string().trim().min(2).max(40)).min(1).max(10).optional(),
});

export const adminDoctorVerifySchema = z.object({
  verified: z.boolean(),
  status: z.enum(['PENDING', 'VERIFIED', 'SUSPENDED']),
  note: z.string().trim().max(500).optional(),
});

export const adminTicketUpdateSchema = z.object({
  status: z.enum(['OPEN', 'IN_REVIEW', 'WAITING_ON_USER', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).optional(),
});

export const adminReviewModerationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().trim().max(500).optional(),
});

export const dataDeleteRequestSchema = z.object({
  scope: z.enum(['AI_CONVERSATIONS', 'ACCOUNT']),
  confirmation: z.literal(true),
});

export const documentUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  dataBase64: z.string().min(20).max(9_000_000),
  category: z.enum(['REPORT', 'PRESCRIPTION', 'REFERRAL', 'OTHER']).default('OTHER'),
  appointmentId: z.string().max(100).optional(),
});
