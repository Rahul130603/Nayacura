import type { Doctor, DoctorDetail } from '@/types';

const demoStockPortraits: Partial<Record<string, { src: string; position?: string }>> = {
  'aanya-rao': { src: '/images/portraits/aanya-demo-stock.jpg', position: 'center 76%' },
  'arjun-menon': { src: '/images/portraits/arjun-demo-stock.jpg', position: '87% top' },
  'meera-krishnan': { src: '/images/portraits/meera-demo-stock.jpg', position: 'center 10%' },
  'kabir-shah': { src: '/images/portraits/kabir-demo-stock.jpg', position: 'left top' },
  'nila-varma': { src: '/images/portraits/nila-demo-stock.jpg', position: 'center 34%' },
  'rahul-iyer': { src: '/images/portraits/rahul-demo-stock.jpg', position: '68% top' },
  'sana-qureshi': { src: '/images/portraits/sana-demo-stock.jpg', position: 'center 32%' },
  'vikram-nair': { src: '/images/portraits/vikram-demo-stock.jpg', position: 'center 14%' },
};

export function getDemoStockPortrait(doctor: Pick<Doctor, 'slug'> & Partial<Pick<Doctor, 'isDemo' | 'photoUrl'>>) {
  const portrait = demoStockPortraits[doctor.slug];
  if (!portrait || doctor.isDemo === false) return undefined;
  if (doctor.isDemo) return portrait;

  // Older appointment responses identify demo doctors by their seeded avatar.
  const demo = getDemoDoctor(doctor.slug);
  return doctor.photoUrl && doctor.photoUrl === demo?.photoUrl ? portrait : undefined;
}

/**
 * Illustrative development data. These are not real clinicians and the
 * credentials, registration details, fees and availability are fictional.
 * The UI labels them accordingly everywhere they appear.
 */
export const demoDoctors: (Doctor & { faqs: DoctorDetail['faqs'] })[] = [
  {
    id: 'doc_aanya',
    slug: 'aanya-rao',
    name: 'Dr. Aanya Rao',
    title: 'Psychosexual Therapist & Relationship Counsellor',
    gender: 'FEMALE',
    photoUrl: '/images/portraits/aanya.svg',
    experienceYears: 12,
    languages: ['English', 'Tamil', 'Hindi'],
    feePaise: 240000,
    onlineEnabled: true,
    inPersonEnabled: true,
    city: 'Chennai',
    clinicName: 'Nayacura Demo Care Space — Chennai',
    timezone: 'Asia/Kolkata',
    nextAvailable: null,
    rating: null,
    reviewCount: 0,
    verified: true,
    isDemo: true,
    specializations: [
      { slug: 'psychosexual-therapy', name: 'Psychosexual therapy' },
      { slug: 'relationship-counselling', name: 'Relationship counselling' },
    ],
    bio: 'Aanya works with adults navigating desire changes, performance anxiety, intimacy after difficult experiences and communication strain in relationships. Her approach is consent-led, paced and practical — with no assumption that there is one “right” way to be intimate.',
    approach:
      'Sessions begin with what feels most urgent to you. Aanya combines psychosexual therapy, attachment-informed practice and communication work, and will never require you to disclose more than you choose.',
    qualifications: [
      'M.A. Clinical Psychology — illustrative demo qualification',
      'Advanced Diploma in Psychosexual Therapy — illustrative demo qualification',
    ],
    registrationNumber: 'DEMO-PSY-1042',
    registrationCouncil: 'Illustrative demo credential only',
    registrationYear: 2014,
    followUpFeePaise: 180000,
    cancellationHours: 24,
    faqs: [
      {
        question: 'Do you work with both individuals and couples?',
        answer:
          'Yes. Aanya sees individuals for psychosexual therapy and couples for relationship and intimacy concerns. The format is agreed together after an initial conversation.',
      },
      {
        question: 'Will I have to describe intimate acts in detail?',
        answer:
          'No. Therapy can focus on emotions, patterns, communication and goals. You control what you share, and you can pause at any point.',
      },
    ],
  },
  {
    id: 'doc_arjun',
    slug: 'arjun-menon',
    name: 'Dr. Arjun Menon',
    title: 'Consultant Sexual Medicine & Mental Health',
    gender: 'MALE',
    photoUrl: '/images/portraits/arjun.svg',
    experienceYears: 15,
    languages: ['English', 'Malayalam', 'Hindi'],
    feePaise: 320000,
    onlineEnabled: true,
    inPersonEnabled: true,
    city: 'Bengaluru',
    clinicName: 'Nayacura Demo Care Space — Bengaluru',
    timezone: 'Asia/Kolkata',
    nextAvailable: null,
    rating: null,
    reviewCount: 0,
    verified: true,
    isDemo: true,
    specializations: [
      { slug: 'sexual-medicine', name: 'Sexual medicine' },
      { slug: 'psychiatry', name: 'Psychiatry' },
    ],
    bio: 'Arjun works at the intersection of physical and emotional sexual health. He supports men and couples with erection difficulties, anxiety, medication-related concerns and reproductive wellbeing questions, with careful attention to what is and is not known.',
    approach:
      'A thorough history comes first, followed by a discussion of possible contributors. Any tests or referrals are explained before they happen, and medication is never prescribed without an appropriate clinical assessment.',
    qualifications: [
      'MBBS — illustrative demo qualification',
      'MD Psychiatry — illustrative demo qualification',
      'Fellowship in Sexual Medicine — illustrative demo qualification',
    ],
    registrationNumber: 'DEMO-MED-2218',
    registrationCouncil: 'Illustrative demo credential only',
    registrationYear: 2011,
    followUpFeePaise: 240000,
    cancellationHours: 24,
    faqs: [
      {
        question: 'Can you prescribe medication online?',
        answer:
          'Not through this demo platform. In a real service, prescribing would require an appropriate assessment, verified identity and compliance with telemedicine and drug regulations. This demo does not prescribe.',
      },
      {
        question: 'Do I need tests before the first appointment?',
        answer:
          'No. Bring any recent reports if you have them, but the first conversation can start without tests. If tests are appropriate, the process will be explained.',
      },
    ],
  },
  {
    id: 'doc_meera',
    slug: 'meera-krishnan',
    name: 'Dr. Meera Krishnan',
    title: 'Gynaecologist & Women’s Sexual Health Specialist',
    gender: 'FEMALE',
    photoUrl: '/images/portraits/meera.svg',
    experienceYears: 11,
    languages: ['English', 'Tamil'],
    feePaise: 260000,
    onlineEnabled: true,
    inPersonEnabled: true,
    city: 'Chennai',
    clinicName: 'Nayacura Demo Care Space — Chennai',
    timezone: 'Asia/Kolkata',
    nextAvailable: null,
    rating: null,
    reviewCount: 0,
    verified: true,
    isDemo: true,
    specializations: [
      { slug: 'gynaecology', name: 'Gynaecology' },
      { slug: 'sexual-medicine', name: 'Sexual medicine' },
    ],
    bio: 'Meera supports women through pain, dryness, menopause-related changes and questions about reproductive wellbeing. She is known for explaining options without rushing and for making examinations consent-led.',
    approach:
      'A verbal history always comes before any examination. Meera explains what she is checking, why, and what the alternatives are. You can decline any part of an assessment and still receive care.',
    qualifications: [
      'MBBS — illustrative demo qualification',
      'MS Obstetrics & Gynaecology — illustrative demo qualification',
      'Certificate in Menopause Care — illustrative demo qualification',
    ],
    registrationNumber: 'DEMO-GYN-3107',
    registrationCouncil: 'Illustrative demo credential only',
    registrationYear: 2015,
    followUpFeePaise: 190000,
    cancellationHours: 24,
    faqs: [
      {
        question: 'Can we talk without an internal examination?',
        answer:
          'Yes. The first consultation can be entirely conversational. If an examination would help, Meera will explain the reason, the process and alternatives before asking for consent.',
      },
      {
        question: 'Do you discuss menopause and dryness?',
        answer:
          'Yes. These are core parts of her work. She can discuss non-hormonal and hormonal options, their evidence, benefits and risks, and when a specialist referral is appropriate.',
      },
    ],
  },
  {
    id: 'doc_kabir',
    slug: 'kabir-shah',
    name: 'Dr. Kabir Shah',
    title: 'Urologist & Men’s Reproductive Wellness Specialist',
    gender: 'MALE',
    photoUrl: '/images/portraits/kabir.svg',
    experienceYears: 18,
    languages: ['English', 'Hindi', 'Gujarati'],
    feePaise: 350000,
    onlineEnabled: true,
    inPersonEnabled: true,
    city: 'Mumbai',
    clinicName: 'Nayacura Demo Care Space — Mumbai',
    timezone: 'Asia/Kolkata',
    nextAvailable: null,
    rating: null,
    reviewCount: 0,
    verified: true,
    isDemo: true,
    specializations: [
      { slug: 'urology', name: 'Urology' },
      { slug: 'sexual-medicine', name: 'Sexual medicine' },
    ],
    bio: 'Kabir works with men on erection difficulties, reproductive health questions and sexual concerns that overlap with medical conditions. His consultations are direct, private and focused on informed choice rather than pressure.',
    approach:
      'He starts with a careful medical and lifestyle history, explains the limits of a video assessment, and recommends in-person review or tests when those are needed for safe care.',
    qualifications: [
      'MBBS — illustrative demo qualification',
      'MS General Surgery — illustrative demo qualification',
      'MCh Urology — illustrative demo qualification',
    ],
    registrationNumber: 'DEMO-URO-1809',
    registrationCouncil: 'Illustrative demo credential only',
    registrationYear: 2008,
    followUpFeePaise: 260000,
    cancellationHours: 48,
    faqs: [
      {
        question: 'Can a video consultation replace a physical examination?',
        answer:
          'No. Some concerns require an in-person examination or tests. Kabir will explain when that is the case and help you plan the next step.',
      },
      {
        question: 'Do you discuss fertility?',
        answer:
          'Yes, at an educational and referral level. Fertility assessment and treatment require specific tests and specialist care, which can be arranged where appropriate.',
      },
    ],
  },
  {
    id: 'doc_nila',
    slug: 'nila-varma',
    name: 'Dr. Nila Varma',
    title: 'Clinical Psychologist & Couples Therapist',
    gender: 'FEMALE',
    photoUrl: '/images/portraits/nila.svg',
    experienceYears: 9,
    languages: ['English', 'Tamil', 'Telugu'],
    feePaise: 220000,
    onlineEnabled: true,
    inPersonEnabled: false,
    city: 'Hyderabad',
    clinicName: null,
    timezone: 'Asia/Kolkata',
    nextAvailable: null,
    rating: null,
    reviewCount: 0,
    verified: true,
    isDemo: true,
    specializations: [
      { slug: 'clinical-psychology', name: 'Clinical psychology' },
      { slug: 'couples-therapy', name: 'Couples therapy' },
      { slug: 'psychosexual-therapy', name: 'Psychosexual therapy' },
    ],
    bio: 'Nila works with relationship anxiety, body image, intimacy-related fear and couples who feel stuck in the same argument. Her style is warm, structured and grounded in consent and safety.',
    approach:
      'She uses attachment-informed and cognitive behavioural approaches, with a strong focus on helping people understand their nervous system responses without blaming themselves. Couples work is only offered when both people can participate safely.',
    qualifications: [
      'M.Phil Clinical Psychology — illustrative demo qualification',
      'Certificate in Couples & Family Therapy — illustrative demo qualification',
    ],
    registrationNumber: 'DEMO-CLIN-4402',
    registrationCouncil: 'Illustrative demo credential only',
    registrationYear: 2017,
    followUpFeePaise: 165000,
    cancellationHours: 24,
    faqs: [
      {
        question: 'Do you offer online couples therapy?',
        answer:
          'Yes, when both partners can join from a private space and consent to the format. Nila will discuss privacy and safety arrangements before the first joint session.',
      },
      {
        question: 'Is this suitable if there is abuse in the relationship?',
        answer:
          'No. Joint sessions are not appropriate where there is coercion, fear or violence. Safety planning and individual support take priority. If you are in danger, contact local emergency services.',
      },
    ],
  },
  {
    id: 'doc_rahul',
    slug: 'rahul-iyer',
    name: 'Dr. Rahul Iyer',
    title: 'Consultant Psychiatrist, Sexual Wellbeing',
    gender: 'MALE',
    photoUrl: '/images/portraits/rahul.svg',
    experienceYears: 14,
    languages: ['English', 'Tamil', 'Hindi'],
    feePaise: 280000,
    onlineEnabled: true,
    inPersonEnabled: true,
    city: 'Chennai',
    clinicName: 'Nayacura Demo Care Space — Chennai',
    timezone: 'Asia/Kolkata',
    nextAvailable: null,
    rating: null,
    reviewCount: 0,
    verified: true,
    isDemo: true,
    specializations: [
      { slug: 'psychiatry', name: 'Psychiatry' },
      { slug: 'sexual-medicine', name: 'Sexual medicine' },
    ],
    bio: 'Rahul supports adults whose sexual wellbeing is affected by anxiety, low mood, stress, body image or relationship strain. He is careful about the limits of online assessment and works collaboratively with therapists and physicians.',
    approach:
      'He prioritises understanding before intervention. Medication is discussed only when clinically appropriate, with clear information about evidence, side-effects and alternatives. This demo does not prescribe.',
    qualifications: [
      'MBBS — illustrative demo qualification',
      'MD Psychiatry — illustrative demo qualification',
    ],
    registrationNumber: 'DEMO-PSY-2904',
    registrationCouncil: 'Illustrative demo credential only',
    registrationYear: 2012,
    followUpFeePaise: 200000,
    cancellationHours: 24,
    faqs: [
      {
        question: 'Can you help with performance anxiety?',
        answer:
          'Yes, after an assessment. Care may include therapy, stress and mood support, or coordination with a sexual medicine clinician. Outcomes are not guaranteed.',
      },
      {
        question: 'What if I am having thoughts of self-harm?',
        answer:
          'This platform is not an emergency service. If you are in immediate danger, contact local emergency services or Tele-MANAS on 14416. Do not wait for a routine appointment.',
      },
    ],
  },
  {
    id: 'doc_sana',
    slug: 'sana-qureshi',
    name: 'Dr. Sana Qureshi',
    title: 'Relationship Therapist & Premarital Counsellor',
    gender: 'FEMALE',
    photoUrl: '/images/portraits/sana.svg',
    experienceYears: 8,
    languages: ['English', 'Hindi', 'Urdu'],
    feePaise: 210000,
    onlineEnabled: true,
    inPersonEnabled: true,
    city: 'Delhi',
    clinicName: 'Nayacura Demo Care Space — Delhi',
    timezone: 'Asia/Kolkata',
    nextAvailable: null,
    rating: null,
    reviewCount: 0,
    verified: true,
    isDemo: true,
    specializations: [
      { slug: 'relationship-counselling', name: 'Relationship counselling' },
      { slug: 'couples-therapy', name: 'Couples therapy' },
    ],
    bio: 'Sana helps couples prepare for commitment, navigate family expectations and rebuild communication after conflict. She is attentive to culture, faith and family context without letting any of them override consent.',
    approach:
      'Her work is structured but not rigid: values, money, family, intimacy, conflict and repair are explored as practical conversations. She does not tell couples what to decide.',
    qualifications: [
      'M.A. Counselling Psychology — illustrative demo qualification',
      'Diploma in Family Systems Therapy — illustrative demo qualification',
    ],
    registrationNumber: 'DEMO-COUP-5120',
    registrationCouncil: 'Illustrative demo credential only',
    registrationYear: 2018,
    followUpFeePaise: 160000,
    cancellationHours: 24,
    faqs: [
      {
        question: 'Is premarital counselling religious?',
        answer:
          'No. It is a secular, practical process and can be adapted to a couple’s cultural or faith context without promoting a particular tradition.',
      },
      {
        question: 'Can one partner attend alone?',
        answer:
          'Yes. Individual sessions can be useful, although some relationship patterns are easier to address together when both people are willing and safe to participate.',
      },
    ],
  },
  {
    id: 'doc_vikram',
    slug: 'vikram-nair',
    name: 'Dr. Vikram Nair',
    title: 'Psychosexual Therapist & Men’s Wellbeing Specialist',
    gender: 'MALE',
    photoUrl: '/images/portraits/vikram.svg',
    experienceYears: 10,
    languages: ['English', 'Malayalam', 'Tamil'],
    feePaise: 230000,
    onlineEnabled: true,
    inPersonEnabled: true,
    city: 'Kochi',
    clinicName: 'Nayacura Demo Care Space — Kochi',
    timezone: 'Asia/Kolkata',
    nextAvailable: null,
    rating: null,
    reviewCount: 0,
    verified: true,
    isDemo: true,
    specializations: [
      { slug: 'psychosexual-therapy', name: 'Psychosexual therapy' },
      { slug: 'relationship-counselling', name: 'Relationship counselling' },
    ],
    bio: 'Vikram works with men on performance anxiety, confidence, communication and intimacy after major life changes. He brings a calm, practical style and a strong stance against shame-based advice.',
    approach:
      'He helps clients understand the cycle maintaining their difficulty and practise small, consent-led changes. Where a medical contributor is possible, he coordinates with an appropriate clinician.',
    qualifications: [
      'M.Sc. Clinical Psychology — illustrative demo qualification',
      'Advanced Training in Psychosexual Therapy — illustrative demo qualification',
    ],
    registrationNumber: 'DEMO-PSY-6044',
    registrationCouncil: 'Illustrative demo credential only',
    registrationYear: 2016,
    followUpFeePaise: 175000,
    cancellationHours: 24,
    faqs: [
      {
        question: 'Is therapy focused on performance?',
        answer:
          'No. The goal is not a performance standard. Therapy focuses on anxiety, connection, communication and what a satisfying intimate life means to you.',
      },
      {
        question: 'Can partners join a session?',
        answer:
          'Sometimes, if both people agree. Vikram will only offer a joint session when it is safe and clinically appropriate.',
      },
    ],
  },
];

export function getDemoDoctor(slug: string) {
  return demoDoctors.find((doctor) => doctor.slug === slug);
}
