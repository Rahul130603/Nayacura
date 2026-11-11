import bcrypt from 'bcryptjs';
import { DateTime } from 'luxon';
import { PrismaClient } from '@prisma/client';
import { encryptText } from '../src/utils/crypto';
import { articles } from '../../frontend/src/data/articles';
import { serviceCategories, services } from '../../frontend/src/data/services';
import { demoDoctors } from '../../frontend/src/data/doctors';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'Nayacura@2026';

const scheduleBySlug: Record<
  string,
  { weekdays: number[]; windows: [number, number][]; onlineOnly?: boolean }
> = {
  'aanya-rao': { weekdays: [1, 2, 4], windows: [[600, 780], [960, 1140]] },
  'arjun-menon': { weekdays: [1, 3, 5], windows: [[570, 780], [900, 1080]] },
  'meera-krishnan': { weekdays: [2, 4, 6], windows: [[600, 840]] },
  'kabir-shah': { weekdays: [1, 3, 5], windows: [[660, 900], [1020, 1140]] },
  'nila-varma': { weekdays: [1, 2, 3, 4, 5], windows: [[1020, 1200]], onlineOnly: true },
  'rahul-iyer': { weekdays: [2, 3, 6], windows: [[600, 780], [900, 1080]] },
  'sana-qureshi': { weekdays: [1, 2, 4], windows: [[660, 840], [960, 1080]] },
  'vikram-nair': { weekdays: [1, 3, 5], windows: [[540, 720], [900, 1080]] },
};

const clinicsSeed = [
  { name: 'Nayacura Demo Care Space — Chennai', city: 'Chennai' },
  { name: 'Nayacura Demo Care Space — Bengaluru', city: 'Bengaluru' },
  { name: 'Nayacura Demo Care Space — Mumbai', city: 'Mumbai' },
  { name: 'Nayacura Demo Care Space — Delhi', city: 'Delhi' },
  { name: 'Nayacura Demo Care Space — Kochi', city: 'Kochi' },
  { name: 'Nayacura Demo Care Space — Hyderabad', city: 'Hyderabad' },
];

const plans = [
  {
    code: 'first-consultation',
    name: 'First consultation',
    description:
      'A paced first conversation with a specialist, available by secure video or in person. The clinician will clarify what can be assessed remotely and what may need another step.',
    pricePaise: 240000,
    taxPercent: 18,
    duration: '45–60 minutes',
    mode: 'EITHER',
    popular: true,
    includes: [
      'Private first consultation',
      'Clinician-led history and goals',
      'Discussion of appropriate next steps',
      'Secure dashboard record of the appointment',
      'No guarantee of diagnosis, prescription or outcome',
    ],
  },
  {
    code: 'couples-counselling',
    name: 'Couples counselling',
    description:
      'A joint session for two people who want a structured space to understand a repeating pattern, communicate needs or prepare for a relationship transition.',
    pricePaise: 360000,
    taxPercent: 18,
    duration: '60–75 minutes',
    mode: 'EITHER',
    popular: false,
    includes: [
      'Joint video or in-person session',
      'Consent and safety screening before joint work',
      'Communication and pattern exploration',
      'One agreed focus for the session',
      'Clinician may recommend individual support alongside',
    ],
  },
  {
    code: 'follow-up',
    name: 'Follow-up consultation',
    description:
      'A shorter session for an existing patient, where the clinician has recommended follow-up. It is not unlimited and does not create ongoing access to a clinician.',
    pricePaise: 160000,
    taxPercent: 18,
    duration: '25–30 minutes',
    mode: 'EITHER',
    popular: false,
    includes: [
      'Review of agreed goals',
      'Discussion of progress and barriers',
      'Updated recommended next steps',
      'Available only where clinically appropriate',
    ],
  },
  {
    code: 'online-consultation',
    name: 'Online consultation',
    description:
      'A secure video appointment from a private space you choose. Suitable for many conversation-led concerns, initial reviews, therapy and follow-ups; not a replacement for an examination.',
    pricePaise: 220000,
    taxPercent: 18,
    duration: '45 minutes',
    mode: 'ONLINE',
    popular: false,
    includes: [
      'Backend-generated short-lived video room access',
      'Consent screen before joining',
      'Device and microphone controls',
      'No recording by default',
      'In-person referral may be recommended',
    ],
  },
  {
    code: 'in-person-consultation',
    name: 'In-person consultation',
    description:
      'A clinic appointment in a listed city when a fuller clinical space or physical assessment may be useful. Exact clinic details are shared after confirmation.',
    pricePaise: 280000,
    taxPercent: 18,
    duration: '45–60 minutes',
    mode: 'IN_PERSON',
    popular: false,
    includes: [
      'Clinician appointment in a listed city',
      'Possibility of examination where clinically appropriate and consented',
      'Coordination with appropriate tests or referrals',
      'Exact address shared after booking in a production service',
    ],
  },
];

function nextSlotFor(
  weekdays: number[],
  windows: [number, number][],
  daysAhead = 30,
  minimumHours = 24,
) {
  const now = DateTime.now().setZone('Asia/Kolkata');
  for (let offset = 0; offset < daysAhead; offset += 1) {
    const day = now.plus({ days: offset }).startOf('day');
    if (!weekdays.includes(day.weekday)) continue;
    for (const [start] of windows) {
      const candidate = day.plus({ minutes: start });
      if (candidate > now.plus({ hours: minimumHours })) return candidate;
    }
  }
  throw new Error('Could not find a seed slot');
}

async function main() {
  console.log('Clearing previous demo data…');
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.clinicalNote.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medicalDocument.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.appointmentStatusHistory.deleteMany();
  await prisma.review.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.consentRecord.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.doctorAvailability.deleteMany();
  await prisma.doctorCredential.deleteMany();
  await prisma.doctorClinic.deleteMany();
  await prisma.doctorSpecialization.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.specialization.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.article.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.platformSetting.deleteMany();

  console.log('Creating accounts…');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const patientUser = await prisma.user.create({
    data: {
      name: 'Riya Sharma',
      email: 'patient@nayacura.demo',
      passwordHash,
      role: 'PATIENT',
      emailVerified: true,
      patient: {
        create: {
          phone: '+91 90000 00000',
          ageConfirmed: true,
          preferredLanguage: 'en',
          communicationPreference: 'EMAIL',
          aiHistoryEnabled: false,
        },
      },
    },
    include: { patient: true },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: 'Nayacura Demo Admin',
      email: 'admin@nayacura.demo',
      passwordHash,
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  console.log('Creating clinics and specialisations…');
  const clinics = new Map<string, string>();
  for (const clinic of clinicsSeed) {
    const created = await prisma.clinic.create({
      data: {
        ...clinic,
        timezone: 'Asia/Kolkata',
        addressNote:
          'Demo location only. No real address or phone number is published. Exact details would be shared after a confirmed booking in production.',
        isDemo: true,
      },
    });
    clinics.set(clinic.city, created.id);
  }

  const specializationSet = new Map<string, { slug: string; name: string }>();
  for (const doctor of demoDoctors) {
    for (const specialization of doctor.specializations) {
      specializationSet.set(specialization.slug, specialization);
    }
  }
  const specializations = new Map<string, string>();
  for (const item of specializationSet.values()) {
    const created = await prisma.specialization.create({
      data: {
        slug: item.slug,
        name: item.name,
        description: `Demonstration category for ${item.name}.`,
      },
    });
    specializations.set(item.slug, created.id);
  }

  console.log('Creating demo clinician profiles…');
  const doctorProfiles = new Map<string, string>();
  for (const doctor of demoDoctors) {
    const isLead = doctor.slug === 'aanya-rao';
    const user = await prisma.user.create({
      data: {
        name: doctor.name,
        email: isLead ? 'doctor@nayacura.demo' : `${doctor.slug}@nayacura.demo`,
        passwordHash,
        role: 'DOCTOR',
        emailVerified: true,
      },
    });
    const profile = await prisma.doctorProfile.create({
      data: {
        userId: user.id,
        slug: doctor.slug,
        title: doctor.title,
        gender: doctor.gender,
        photoUrl: doctor.photoUrl,
        bio: doctor.bio,
        approach: doctor.approach,
        experienceYears: doctor.experienceYears,
        languages: JSON.stringify(doctor.languages),
        feePaise: doctor.feePaise,
        followUpFeePaise: doctor.followUpFeePaise || null,
        onlineEnabled: doctor.onlineEnabled,
        inPersonEnabled: doctor.inPersonEnabled,
        city: doctor.city,
        timezone: doctor.timezone,
        verified: true,
        status: 'VERIFIED',
        isDemo: true,
        credentialCheckedAt: new Date(),
        credentialCheckedBy: adminUser.id,
        specializations: {
          create: doctor.specializations.map((specialization, index) => ({
            specializationId: specializations.get(specialization.slug) as string,
            isPrimary: index === 0,
          })),
        },
        credentials: {
          create: doctor.qualifications.map((qualification, index) => {
            const [title, institution] = qualification.split(' — ');
            return {
              type: index === 0 ? 'DEGREE' : 'CERTIFICATION',
              title,
              institution: institution || null,
              registrationNumber: index === 0 ? doctor.registrationNumber || null : null,
              council: index === 0 ? doctor.registrationCouncil || null : null,
              year: index === 0 ? doctor.registrationYear || null : null,
              verified: true,
              note: 'Illustrative demo credential. Not independently verified.',
            };
          }),
        },
        clinics: {
          create: {
            clinicId: clinics.get(doctor.city) as string,
          },
        },
      },
    });
    doctorProfiles.set(doctor.slug, profile.id);

    const schedule = scheduleBySlug[doctor.slug];
    if (schedule) {
      for (const weekday of schedule.weekdays) {
        for (const [startMinute, endMinute] of schedule.windows) {
          await prisma.doctorAvailability.create({
            data: {
              doctorId: profile.id,
              weekday,
              startMinute,
              endMinute,
              mode: schedule.onlineOnly ? 'ONLINE' : 'BOTH',
              slotMinutes: 30,
              active: true,
            },
          });
        }
      }
    }
  }

  // A pending applicant makes the credential-review workflow demonstrable.
  const pendingUser = await prisma.user.create({
    data: {
      name: 'Dr. Ishaan Kapoor',
      email: 'ishaan.kapoor@nayacura.demo',
      passwordHash,
      role: 'DOCTOR',
      emailVerified: true,
    },
  });
  await prisma.doctorProfile.create({
    data: {
      userId: pendingUser.id,
      slug: 'ishaan-kapoor',
      title: 'Psychiatrist — credential review pending',
      gender: 'MALE',
      photoUrl: '/images/portraits/arjun.svg',
      bio: 'Pending demonstration profile. This clinician is not visible in the public directory and cannot access clinical tools until the credential workflow is completed.',
      approach: 'Demonstration record for the admin credential-verification workflow.',
      experienceYears: 6,
      languages: JSON.stringify(['English', 'Hindi']),
      feePaise: 250000,
      onlineEnabled: true,
      inPersonEnabled: true,
      city: 'Delhi',
      timezone: 'Asia/Kolkata',
      verified: false,
      status: 'PENDING',
      isDemo: true,
      credentials: {
        create: {
          type: 'DEGREE',
          title: 'MD Psychiatry — illustrative pending record',
          institution: 'Illustrative demo institution',
          registrationNumber: 'DEMO-PENDING-9911',
          council: 'Illustrative demo credential only',
          year: 2019,
          verified: false,
          note: 'Pending document review in the demo workflow.',
        },
      },
    },
  });

  console.log('Creating service catalogue…');
  const categoryIds = new Map<string, string>();
  for (let index = 0; index < serviceCategories.length; index += 1) {
    const category = serviceCategories[index];
    const created = await prisma.serviceCategory.create({
      data: {
        slug: category.slug,
        name: category.name,
        tagline: category.tagline,
        description: category.description,
        sortOrder: index,
      },
    });
    categoryIds.set(category.slug, created.id);
  }
  for (let index = 0; index < services.length; index += 1) {
    const service = services[index];
    await prisma.service.create({
      data: {
        slug: service.slug,
        name: service.name,
        summary: service.summary,
        categoryId: categoryIds.get(service.categorySlug) as string,
        featured: Boolean(service.featured),
        active: true,
        sortOrder: index,
      },
    });
  }

  console.log('Seeding journal articles…');
  for (const article of articles) {
    await prisma.article.create({
      data: {
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        category: article.category,
        categoryName: article.categoryName,
        content: article.content,
        author: article.author,
        reviewer: null,
        publishedAt: new Date(article.publishedAt),
        reviewedAt: null,
        readingMinutes: article.readingMinutes,
        featured: article.featured,
        image: article.image,
        metaTitle: article.metaTitle || null,
        metaDescription: article.metaDescription || null,
        status: 'PUBLISHED',
      },
    });
  }

  console.log('Seeding plans and settings…');
  for (let index = 0; index < plans.length; index += 1) {
    const plan = plans[index];
    await prisma.plan.create({
      data: {
        code: plan.code,
        name: plan.name,
        description: plan.description,
        pricePaise: plan.pricePaise,
        taxPercent: plan.taxPercent,
        duration: plan.duration,
        includes: JSON.stringify(plan.includes),
        mode: plan.mode,
        popular: plan.popular,
        active: true,
        sortOrder: index,
      },
    });
  }

  await prisma.platformSetting.createMany({
    data: [
      { key: 'demo_mode', value: 'true' },
      { key: 'support_hours', value: 'Mon–Sat, 09:00–19:00 IST (illustrative)' },
      { key: 'default_tax_percent', value: '18' },
      { key: 'ai_history_default', value: 'off' },
      { key: 'booking_hold_minutes', value: '15' },
      { key: 'cancellation_window_hours', value: '24' },
      { key: 'recording_enabled', value: 'false' },
    ],
  });

  console.log('Creating illustrative appointments…');
  const aanyaSchedule = scheduleBySlug['aanya-rao'];
  const upcomingStart = nextSlotFor(aanyaSchedule.weekdays, aanyaSchedule.windows, 30, 24);
  const upcomingEnd = upcomingStart.plus({ minutes: 30 });
  const upcomingDoctor = await prisma.doctorProfile.findUniqueOrThrow({
    where: { slug: 'aanya-rao' },
  });
  const upcoming = await prisma.appointment.create({
    data: {
      bookingId: 'NYC-DEMO-UPCOMING',
      patientId: patientUser.patient!.id,
      doctorId: upcomingDoctor.id,
      clinicId: clinics.get('Chennai'),
      mode: 'ONLINE',
      status: 'CONFIRMED',
      startAt: upcomingStart.toUTC().toJSDate(),
      endAt: upcomingEnd.toUTC().toJSDate(),
      timezone: 'Asia/Kolkata',
      reason: 'Illustrative demo booking: sleep, stress and changes in desire.',
      feePaise: upcomingDoctor.feePaise,
      taxPaise: Math.round(upcomingDoctor.feePaise * 0.18),
      totalPaise: upcomingDoctor.feePaise + Math.round(upcomingDoctor.feePaise * 0.18),
      videoRoomName: 'nayacura-demo-room-upcoming',
      payment: {
        create: {
          amountPaise: upcomingDoctor.feePaise,
          taxPaise: Math.round(upcomingDoctor.feePaise * 0.18),
          totalPaise: upcomingDoctor.feePaise + Math.round(upcomingDoctor.feePaise * 0.18),
          status: 'DEMO_PAID',
          provider: 'DEMO',
          paidAt: new Date(),
        },
      },
      consultation: {
        create: {
          roomName: 'nayacura-demo-room-upcoming',
          status: 'SCHEDULED',
        },
      },
      statusHistory: {
        create: [
          { status: 'PENDING_PAYMENT', note: 'Illustrative booking created.', changedBy: patientUser.id },
          { status: 'CONFIRMED', note: 'Demo payment completed.', changedBy: patientUser.id },
        ],
      },
    },
  });

  const pastStart = DateTime.now()
    .setZone('Asia/Kolkata')
    .minus({ days: 18 })
    .set({ hour: 11, minute: 0, second: 0, millisecond: 0 });
  const rahulProfile = await prisma.doctorProfile.findUniqueOrThrow({
    where: { slug: 'rahul-iyer' },
  });
  const past = await prisma.appointment.create({
    data: {
      bookingId: 'NYC-DEMO-PAST',
      patientId: patientUser.patient!.id,
      doctorId: rahulProfile.id,
      clinicId: clinics.get('Chennai'),
      mode: 'IN_PERSON',
      status: 'COMPLETED',
      startAt: pastStart.toUTC().toJSDate(),
      endAt: pastStart.plus({ minutes: 45 }).toUTC().toJSDate(),
      timezone: 'Asia/Kolkata',
      reason: 'Illustrative demo booking: anxiety and intimacy.',
      feePaise: rahulProfile.feePaise,
      taxPaise: Math.round(rahulProfile.feePaise * 0.18),
      totalPaise: rahulProfile.feePaise + Math.round(rahulProfile.feePaise * 0.18),
      payment: {
        create: {
          amountPaise: rahulProfile.feePaise,
          taxPaise: Math.round(rahulProfile.feePaise * 0.18),
          totalPaise: rahulProfile.feePaise + Math.round(rahulProfile.feePaise * 0.18),
          status: 'DEMO_PAID',
          provider: 'DEMO',
          paidAt: pastStart.toJSDate(),
        },
      },
      consultation: {
        create: {
          roomName: 'nayacura-demo-room-past',
          status: 'ENDED',
          startedAt: pastStart.toUTC().toJSDate(),
          endedAt: pastStart.plus({ minutes: 45 }).toUTC().toJSDate(),
          consentRecordedAt: pastStart.toUTC().toJSDate(),
          recordingConsent: false,
        },
      },
      statusHistory: {
        create: [
          { status: 'PENDING_PAYMENT', note: 'Illustrative booking created.', changedBy: patientUser.id },
          { status: 'CONFIRMED', note: 'Demo payment completed.', changedBy: patientUser.id },
          { status: 'COMPLETED', note: 'Illustrative completed consultation.', changedBy: rahulProfile.userId },
        ],
      },
    },
  });

  await prisma.clinicalNote.create({
    data: {
      appointmentId: past.id,
      doctorId: rahulProfile.id,
      patientId: patientUser.patient!.id,
      encryptedContent: encryptText(
        'ILLUSTRATIVE DEMO NOTE — not a real patient record. The client described anxiety around intimacy and performance pressure. Sleep and work stress were explored. No diagnosis was made in this demo. Options discussed included psychosexual support, stress care and a follow-up conversation with the client’s consent. No medication was prescribed.',
      ),
    },
  });
  await prisma.prescription.create({
    data: {
      appointmentId: past.id,
      doctorId: rahulProfile.id,
      patientId: patientUser.patient!.id,
      encryptedMedications: encryptText(
        JSON.stringify([
          {
            name: 'No medication issued (illustrative demo record)',
            dosage: '—',
            frequency: '—',
            duration: '—',
          },
        ]),
      ),
      encryptedInstructions: encryptText(
        'This is an illustrative development record, not clinical advice. A real prescription would require an appropriate assessment, valid consent and a legally registered prescriber.',
      ),
      status: 'ISSUED',
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: patientUser.id,
        type: 'BOOKING_CONFIRMED',
        title: 'Your demo consultation is confirmed',
        body: `Booking ${upcoming.bookingId} with Dr. Aanya Rao. Open your dashboard to review the details.`,
      },
      {
        userId: patientUser.id,
        type: 'CLINICAL_NOTE_ADDED',
        title: 'A demo consultation note was added',
        body: 'A note and a clearly labelled illustrative prescription are available in your dashboard.',
      },
      {
        userId: upcomingDoctor.userId,
        type: 'APPOINTMENT_STATUS',
        title: 'Upcoming demo consultation',
        body: `Booking ${upcoming.bookingId} is confirmed. Your patient has not yet recorded teleconsultation consent.`,
      },
      {
        userId: rahulProfile.userId,
        type: 'APPOINTMENT_STATUS',
        title: 'Demo appointment completed',
        body: 'An illustrative patient appointment is marked completed in this development dataset.',
      },
      {
        userId: adminUser.id,
        type: 'CREDENTIAL_REVIEW',
        title: 'One credential review is pending',
        body: 'Dr. Ishaan Kapoor has a pending demonstration credential record.',
      },
      {
        userId: pendingUser.id,
        type: 'CREDENTIAL_STATUS',
        title: 'Credential review pending',
        body: 'Your demonstration profile is awaiting review. Clinical tools remain unavailable.',
      },
    ],
  });

  const ticket = await prisma.supportTicket.create({
    data: {
      reference: 'NYS-DEMO0001',
      userId: patientUser.id,
      name: patientUser.name,
      email: patientUser.email,
      category: 'GENERAL',
      subject: 'How do I prepare for my first consultation?',
      status: 'RESOLVED',
      priority: 'NORMAL',
      messages: {
        create: [
          {
            authorUserId: patientUser.id,
            authorRole: 'PATIENT',
            body: 'I have booked my first demo consultation. Do I need to prepare anything?',
          },
          {
            authorUserId: adminUser.id,
            authorRole: 'ADMIN',
            body: 'You do not need to prepare a diagnosis. A private space, a stable connection and any questions you want to ask are enough. This demo support response is illustrative.',
          },
        ],
      },
    },
  });

  await prisma.supportTicket.create({
    data: {
      reference: 'NYS-DEMO0002',
      userId: patientUser.id,
      name: patientUser.name,
      email: patientUser.email,
      category: 'APPOINTMENT',
      subject: 'Can I change my video appointment format?',
      status: 'OPEN',
      priority: 'NORMAL',
      messages: {
        create: [
          {
            authorUserId: patientUser.id,
            authorRole: 'PATIENT',
            body: 'If I decide that an in-person conversation would suit me better, can I change the format after booking? This is a demo question and contains no clinical detail.',
          },
        ],
      },
    },
  });

  await prisma.consentRecord.createMany({
    data: [
      {
        userId: patientUser.id,
        type: 'PRIVACY_NOTICE_AND_TERMS',
        granted: true,
        version: 'draft-2026-11',
      },
      {
        userId: patientUser.id,
        type: 'TELECONSULTATION',
        granted: true,
        version: 'draft-2026-11',
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: adminUser.id,
        actorRole: 'ADMIN',
        action: 'SEED_DEMO_DATA',
        entityType: 'Platform',
        metadata: JSON.stringify({ seeded: true, articles: articles.length, services: services.length }),
      },
      {
        actorId: patientUser.id,
        actorRole: 'PATIENT',
        action: 'DEMO_BOOKING_CREATED',
        entityType: 'Appointment',
        entityId: upcoming.id,
        metadata: JSON.stringify({ bookingId: upcoming.bookingId, demo: true }),
      },
      {
        actorId: rahulProfile.userId,
        actorRole: 'DOCTOR',
        action: 'DEMO_CLINICAL_NOTE_CREATED',
        entityType: 'Appointment',
        entityId: past.id,
        metadata: JSON.stringify({ note: 'Content encrypted at rest', demo: true }),
      },
    ],
  });

  console.log(`
✓ Nayacura demo seed complete
  Patient:  patient@nayacura.demo / ${DEMO_PASSWORD}
  Doctor:   doctor@nayacura.demo / ${DEMO_PASSWORD}
  Admin:    admin@nayacura.demo / ${DEMO_PASSWORD}
  Clinicians: ${demoDoctors.length} public demo profiles + 1 pending review
  Articles: ${articles.length}
  Services: ${services.length}
  Upcoming booking: ${upcoming.bookingId}
  Past booking: ${past.bookingId}
  Support ticket: ${ticket.reference}
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
