import type { ServiceCategory, ServiceDetail } from '@/types';

export const serviceCategories: ServiceCategory[] = [
  {
    slug: 'mens-sexual-wellness',
    name: "Men's sexual wellness",
    tagline: 'Performance pressure, desire and confidence — without judgment.',
    description:
      'Confidential support for erection difficulties, ejaculation concerns, low desire and the anxiety that often travels with them. Our approach starts with listening, then moves toward appropriate assessment and evidence-informed care.',
  },
  {
    slug: 'womens-sexual-wellness',
    name: "Women's sexual wellness",
    tagline: 'Pleasure, pain and change — held with respect.',
    description:
      'Specialist care for desire changes, pain during intimacy, menopause-related wellbeing and anxiety. Every conversation is paced around your comfort and your consent.',
  },
  {
    slug: 'couples-relationship-counselling',
    name: 'Couples & relationship counselling',
    tagline: 'A structured space for two people to be heard.',
    description:
      'Relationship counselling for communication strain, intimacy shifts, conflict and rebuilding trust. The relationship is the client — both voices matter, and no one is placed on trial.',
  },
  {
    slug: 'emotional-psychological-wellbeing',
    name: 'Emotional & psychological wellbeing',
    tagline: 'The mind and body are not separate conversations.',
    description:
      'Support for stress, body image, relationship anxiety and sexual health education with a qualified mental health professional. Care that recognises context, history and identity.',
  },
];

const commonFaqs = [
  {
    question: 'Will I have to share more than I am comfortable with?',
    answer:
      'No. You decide what to share and when. A clinician may ask questions to understand your context, but you can decline any line of discussion or ask to slow down. The first appointment can focus only on what feels manageable.',
  },
  {
    question: 'Is everything I say confidential?',
    answer:
      'Clinical conversations are treated as private and are accessible only to authorised members of your care team. There are limited legal and safety exceptions, such as an immediate risk to life, which a clinician will explain where possible. Read the Privacy Policy for how data is handled on this demo platform.',
  },
];

export const services: ServiceDetail[] = [
  {
    slug: 'erectile-difficulties',
    name: 'Erectile difficulties',
    categorySlug: 'mens-sexual-wellness',
    categoryName: "Men's sexual wellness",
    summary:
      'Confidential assessment for difficulty getting or keeping an erection, including the anxiety that can follow.',
    icon: 'activity',
    featured: true,
    overview:
      'Erection difficulties are common and can arise from physical, emotional and relational factors — often in combination. A consultation offers a calm, private space to describe what is happening, understand possible contributors and discuss appropriate next steps, including when a medical assessment is advisable.',
    concerns: [
      'Difficulty getting an erection some or most of the time',
      'Losing an erection during intimacy',
      'Pressure to perform, or worry that it will happen again',
      'Changes after starting a new medication or after illness',
      'Avoiding intimacy because of embarrassment or fear',
      'A partner’s response and the strain on communication',
    ],
    factors: [
      'Cardiovascular and metabolic health, including blood pressure and diabetes',
      'Sleep, fatigue, alcohol use and some medications',
      'Stress, low mood, anxiety and previous difficult experiences',
      'Relationship conflict, mismatched expectations or fear of judgment',
      'Changes related to ageing or hormonal health',
    ],
    whenToSeek: [
      'The concern has persisted for several weeks or is causing distress',
      'You feel anxious about intimacy or are avoiding closeness',
      'There has been a sudden change, especially with chest pain or other acute symptoms',
      'You are taking medication and want to understand possible effects',
      'The issue is affecting your relationship or sense of self',
    ],
    consultation: [
      'A clinician will listen to your history and ask about physical and emotional factors.',
      'Where appropriate, they may recommend a medical review or tests with a qualified doctor.',
      'You will discuss options, risks, consent and what a realistic care plan might look like.',
      'Follow-up can include communication support, stress care or specialist referral.',
    ],
    specialists: ['Sexual medicine', 'Urology (referral)', 'Psychosexual therapy', 'Couples counselling'],
    faqs: [
      {
        question: 'Is this only a physical problem?',
        answer:
          'Not necessarily. Physical health, stress, medication, relationship dynamics and anxiety can all contribute. A clinician will consider the whole picture rather than assuming a single cause.',
      },
      {
        question: 'Will I need tests?',
        answer:
          'Sometimes. If a medical contributor is suspected, a qualified doctor may recommend blood pressure checks or blood tests. Any test is explained first, and results are discussed with you.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'premature-ejaculation-concerns',
    name: 'Premature ejaculation concerns',
    categorySlug: 'mens-sexual-wellness',
    categoryName: "Men's sexual wellness",
    summary:
      'Practical, nonjudgmental support for ejaculation concerns and the confidence strain they can create.',
    icon: 'timer',
    overview:
      'Ejaculation concerns are personal and often misunderstood. There is no single “normal” timeline, and distress matters more than a stopwatch. A confidential consultation can help you understand patterns, reduce performance pressure and explore evidence-informed approaches with a qualified professional.',
    concerns: [
      'Ejaculating sooner than you or your partner would like',
      'Anxiety before or during intimacy',
      'Avoiding sex or dating because of embarrassment',
      'A partner’s disappointment and resulting tension',
      'Difficulty relaxing or being present',
      'Concerns that began after a period of stress or change',
    ],
    factors: [
      'Anxiety, self-monitoring and fear of judgment',
      'Relationship dynamics and communication patterns',
      'Limited or conflicting sex education',
      'Some medications or health conditions',
      'Fatigue, alcohol use and general stress',
    ],
    whenToSeek: [
      'The concern causes persistent distress or avoidance',
      'It is affecting your relationship or confidence',
      'You have tried self-help and feel stuck',
      'You notice a sudden change alongside other symptoms',
      'You want accurate information rather than internet myths',
    ],
    consultation: [
      'A clinician explores the pattern, context and your goals without a script.',
      'You may discuss anxiety, relationship factors and practical techniques.',
      'A qualified doctor can review possible medical contributors if relevant.',
      'Care may combine education, psychosexual support and couples communication work.',
    ],
    specialists: ['Sexual medicine', 'Psychosexual therapy', 'Psychology', 'Couples counselling'],
    faqs: [
      {
        question: 'Is there a fixed time that counts as premature?',
        answer:
          'No single duration defines a concern. Clinicians consider distress, control, context and relationship impact rather than using one universal threshold.',
      },
      {
        question: 'Can counselling help if the cause feels physical?',
        answer:
          'Counselling can help with the anxiety and relationship patterns that often accompany the concern, while a doctor reviews physical contributors. The two approaches can work together.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'low-sexual-desire-men',
    name: 'Low sexual desire in men',
    categorySlug: 'mens-sexual-wellness',
    categoryName: "Men's sexual wellness",
    summary:
      'Explore changes in desire with a clinician who considers health, mood, stress and relationship context.',
    icon: 'sparkles',
    overview:
      'Desire naturally fluctuates. When a change feels persistent, distressing or out of step with your sense of yourself, it deserves a thoughtful conversation. Low desire is not a measure of masculinity, and care begins by understanding what has changed — not by assigning blame.',
    concerns: [
      'Little or no interest in sex for an extended period',
      'A change from your previous level of desire',
      'Pressure from a partner or from yourself',
      'Difficulty feeling present or interested during intimacy',
      'Withdrawing from closeness to avoid the conversation',
      'Worry that something is “wrong” with you',
    ],
    factors: [
      'Stress, exhaustion, low mood and anxiety',
      'Relationship conflict, unmet needs or loss of safety',
      'Sleep, alcohol use, medication and general health',
      'Hormonal or medical factors that need qualified assessment',
      'Life transitions, grief and changes in self-image',
    ],
    whenToSeek: [
      'The change is persistent and concerns you',
      'You feel pressure or distress around intimacy',
      'Your relationship is being affected',
      'It coincides with low mood, significant stress or a health change',
      'You want to understand your options without being judged',
    ],
    consultation: [
      'The first session maps the change, your health and relationship context.',
      'A clinician may explore mood, stress, sleep and medication history.',
      'Medical assessment can be arranged when appropriate, with your consent.',
      'Care may include therapy, couples work or a coordinated medical review.',
    ],
    specialists: ['Sexual medicine', 'Psychiatry (referral)', 'Psychology', 'Couples counselling'],
    faqs: [
      {
        question: 'Is low desire always a medical problem?',
        answer:
          'No. Desire is influenced by mood, stress, safety, relationship quality, health and life stage. A clinician assesses context before labelling anything.',
      },
      {
        question: 'What if my partner wants help more than I do?',
        answer:
          'Your consent matters. A couples session can help both people talk about expectations, but no one should be pressured into treatment. Sometimes the first step is a conversation about what each person needs.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'performance-anxiety',
    name: 'Performance-related anxiety',
    categorySlug: 'mens-sexual-wellness',
    categoryName: "Men's sexual wellness",
    summary:
      'Break the cycle of worry, self-monitoring and avoidance with evidence-informed psychological support.',
    icon: 'brain',
    overview:
      'Performance anxiety can turn a natural experience into a test. The more you monitor yourself, the harder it becomes to be present — and that frustration can fuel more anxiety. Therapy offers a structured way to understand the cycle and gently change it.',
    concerns: [
      'Racing thoughts or self-monitoring during intimacy',
      'Fear of disappointing a partner',
      'Avoiding sex, dating or closeness',
      'Physical tension and difficulty relaxing',
      'Reassurance-seeking that never quite helps',
      'Shame after intimacy, even when things go well',
    ],
    factors: [
      'High expectations and beliefs about “good” sex',
      'Previous embarrassing or painful experiences',
      'Anxiety sensitivity and fear of bodily sensations',
      'Relationship pressure or fear of abandonment',
      'Perfectionism and harsh self-criticism',
    ],
    whenToSeek: [
      'Worry is interfering with intimacy or relationships',
      'You are avoiding closeness because of anxiety',
      'Self-help strategies are not shifting the pattern',
      'The distress affects your mood or confidence',
      'You want a structured, private space to work through it',
    ],
    consultation: [
      'A therapist helps map the anxiety cycle and its triggers.',
      'You learn grounding, attention and communication skills at your pace.',
      'Where helpful, a couples session can make the bedroom a safer place to talk.',
      'Progress is reviewed collaboratively; there are no guaranteed outcomes.',
    ],
    specialists: ['Psychosexual therapy', 'Cognitive behavioural therapy', 'Psychology', 'Couples counselling'],
    faqs: [
      {
        question: 'Do I have to talk about the details of sex?',
        answer:
          'You never have to share more than you choose. Therapy can focus on thoughts, emotions and patterns without a detailed account of intimate acts.',
      },
      {
        question: 'How many sessions might I need?',
        answer:
          'It varies. Some people find several structured sessions useful; others need longer. A clinician can discuss a plan after understanding your goals, without promising a fixed outcome.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'sexual-confidence-concerns',
    name: 'Sexual confidence concerns',
    categorySlug: 'mens-sexual-wellness',
    categoryName: "Men's sexual wellness",
    summary:
      'Rebuild a kinder relationship with your body, desire and intimate identity.',
    icon: 'shield',
    overview:
      'Confidence is not a performance score. It is the felt sense that you can be present, communicate and be accepted. When that sense has been eroded by comparison, shame or difficult experiences, therapy can help you rebuild it without pretending to be someone else.',
    concerns: [
      'Feeling inexperienced or “behind” others',
      'Comparing yourself with pornography or peers',
      'Shame about your body, desire or sexual history',
      'Difficulty communicating wants and boundaries',
      'Fear of rejection or being judged',
      'Confidence that drops after a difficult experience',
    ],
    factors: [
      'Limited or shaming sex education',
      'Body image and appearance pressure',
      'Unrealistic cultural or media scripts',
      'Past rejection, coercion or difficult intimacy',
      'Anxiety and low mood',
    ],
    whenToSeek: [
      'Shame or self-criticism is affecting intimacy',
      'You avoid relationships or closeness',
      'You struggle to communicate boundaries',
      'Past experiences continue to affect the present',
      'You want to feel more at ease in your body',
    ],
    consultation: [
      'A therapist explores the story behind your confidence and what you want to change.',
      'Sessions may include values, self-compassion, communication and boundary work.',
      'You set the pace; no intimate detail is required.',
      'Where relevant, a clinician can connect you with medical or couples support.',
    ],
    specialists: ['Psychosexual therapy', 'Psychology', 'Sex therapy', 'Couples counselling'],
    faqs: [
      {
        question: 'Is confidence something therapy can build?',
        answer:
          'Therapy can help you examine the beliefs and experiences that undermine confidence, practise new ways of relating, and reduce shame. It is a process, not a quick fix.',
      },
      {
        question: 'Will I be judged for my history?',
        answer:
          'A qualified therapist is there to understand, not to moralise. You are in control of what you disclose and when.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'intimacy-relationship-difficulties-men',
    name: 'Intimacy & relationship difficulties',
    categorySlug: 'mens-sexual-wellness',
    categoryName: "Men's sexual wellness",
    summary:
      'When closeness feels complicated, specialist support can help you communicate and reconnect.',
    icon: 'users',
    overview:
      'Intimacy difficulties rarely belong to one person. They can grow from unspoken expectations, mismatched desire, stress, or a loss of emotional safety. Counselling offers a structured space to slow the cycle down and hear what is really being asked for.',
    concerns: [
      'Feeling disconnected from your partner',
      'Mismatched desire or different intimacy needs',
      'Arguments that repeat without resolution',
      'Withdrawing after conflict',
      'Difficulty talking about sex or affection',
      'Feeling criticized or misunderstood',
    ],
    factors: [
      'Unspoken expectations and assumptions',
      'Stress, exhaustion and competing responsibilities',
      'Past experiences of rejection or betrayal',
      'Cultural and family messages about masculinity',
      'Communication patterns that escalate or shut down',
    ],
    whenToSeek: [
      'The same conflict keeps returning',
      'You feel lonely in your relationship',
      'Intimacy has become a source of anxiety',
      'One or both partners are avoiding the conversation',
      'You want to rebuild connection before small issues become entrenched',
    ],
    consultation: [
      'A therapist helps both partners describe the pattern without blame.',
      'Sessions build communication skills and clarify needs and boundaries.',
      'Individual work may be recommended alongside couples sessions.',
      'Progress is reviewed together; no outcome is guaranteed.',
    ],
    specialists: ['Couples counselling', 'Psychosexual therapy', 'Relationship therapy', 'Psychology'],
    faqs: [
      {
        question: 'Can I come alone if my partner is not ready?',
        answer:
          'Yes. Individual sessions can help you clarify your needs and communication patterns. A couples format is offered when both people freely agree.',
      },
      {
        question: 'Will the therapist take sides?',
        answer:
          'A couples therapist holds the relationship as the client. The aim is not to decide who is right, but to help both people be heard and to change unhelpful patterns.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'reproductive-wellness-guidance-men',
    name: 'Reproductive wellness guidance',
    categorySlug: 'mens-sexual-wellness',
    categoryName: "Men's sexual wellness",
    summary:
      'Understand fertility, preventive health and reproductive wellbeing with appropriate medical guidance.',
    icon: 'heart-pulse',
    overview:
      'Reproductive wellness includes far more than fertility. It covers preventive health, understanding changes in your body, and knowing when to seek medical assessment. This service offers education and appropriate referral — not promises about fertility outcomes.',
    concerns: [
      'Questions about fertility or trying to conceive',
      'Concerns about testosterone or hormonal health',
      'Changes in sexual function alongside health conditions',
      'Preventive sexual health questions',
      'Confusion about conflicting online information',
      'Planning a family and wanting accurate guidance',
    ],
    factors: [
      'Age, general health and lifestyle factors',
      'Medical conditions and medications',
      'Stress, sleep and substance use',
      'Family history and previous health events',
      'Access to accurate, nonjudgmental information',
    ],
    whenToSeek: [
      'You have been trying to conceive without success',
      'You notice a persistent change in sexual or reproductive health',
      'You have questions about a diagnosed condition',
      'You want to discuss preventive health or screening',
      'You need help navigating conflicting information',
    ],
    consultation: [
      'A clinician reviews your history and goals.',
      'Appropriate tests or specialist referrals are discussed with consent.',
      'You receive clear, evidence-informed information about options and limits.',
      'Follow-up is planned according to your needs and preferences.',
    ],
    specialists: ['Sexual medicine', 'Urology (referral)', 'Fertility specialist (referral)', 'General medicine'],
    faqs: [
      {
        question: 'Can this consultation confirm fertility?',
        answer:
          'No. Fertility assessment requires specific tests and specialist evaluation. A consultation can help you understand the process and arrange appropriate referral.',
      },
      {
        question: 'Do you prescribe testosterone or other hormones?',
        answer:
          'Nayacura does not prescribe through this education service. Any hormonal treatment requires an in-person medical assessment, appropriate testing and prescribing by a qualified clinician.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'low-sexual-desire-women',
    name: 'Low sexual desire in women',
    categorySlug: 'womens-sexual-wellness',
    categoryName: "Women's sexual wellness",
    summary:
      'Care that considers hormones, relationships, stress, identity and what desire means to you.',
    icon: 'sparkles',
    featured: true,
    overview:
      'Low desire is one of the most misunderstood areas of women’s health. It is not a failure, and it is not always a disorder. A specialist can help you understand changes in context — energy, safety, relationship, health and life stage — and decide what kind of support, if any, you want.',
    concerns: [
      'A noticeable drop in interest in sex',
      'Feeling pressure to want sex at a certain frequency',
      'Difficulty getting interested even when you want closeness',
      'Pain, fatigue or stress affecting desire',
      'Changes during pregnancy, postpartum or menopause',
      'Relationship strain around different levels of desire',
    ],
    factors: [
      'Stress, exhaustion, low mood and anxiety',
      'Relationship quality, safety and unmet emotional needs',
      'Hormonal changes across the reproductive life course',
      'Medication, health conditions and sleep',
      'Cultural messages, shame and previous experiences',
    ],
    whenToSeek: [
      'The change is persistent and distressing to you',
      'You feel pressure or guilt around intimacy',
      'It affects your relationship or self-image',
      'It coincides with pain, mood changes or a health transition',
      'You want accurate information and a nonjudgmental discussion',
    ],
    consultation: [
      'A clinician explores your health, relationships, stress and goals.',
      'You are never required to frame low desire as a problem if it is not troubling you.',
      'Medical review or therapy can be arranged depending on what you choose.',
      'Care is collaborative and paced around your comfort.',
    ],
    specialists: ['Gynaecology', 'Psychosexual therapy', 'Sexual medicine', 'Couples counselling'],
    faqs: [
      {
        question: 'Is there a “normal” level of desire?',
        answer:
          'Desire varies widely between people and across life stages. A clinician is more interested in whether the change bothers you and what it means in your life than in a universal number.',
      },
      {
        question: 'Will I be told to just relax?',
        answer:
          'No. Dismissive advice is not care. A good consultation explores real contributors and offers options, including the option to focus on relationship or emotional support rather than medical treatment.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'painful-intimacy',
    name: 'Pain or discomfort during intimacy',
    categorySlug: 'womens-sexual-wellness',
    categoryName: "Women's sexual wellness",
    summary:
      'Pain deserves investigation, not endurance. Explore causes and pathways to comfortable intimacy.',
    icon: 'heart-pulse',
    featured: true,
    overview:
      'Sexual pain can have physical, emotional and relational contributors, and it is never something you should simply put up with. A confidential consultation can help you describe what happens, understand possible causes and access appropriate assessment and support.',
    concerns: [
      'Sharp, burning or aching pain during or after sex',
      'Pain with penetration or tampon use',
      'Vaginal dryness or irritation',
      'Tensing up in anticipation of pain',
      'Avoiding intimacy because of fear',
      'Pain that persists despite trying different positions or lubricants',
    ],
    factors: [
      'Genitourinary and hormonal changes, including menopause',
      'Infection, skin conditions or pelvic floor concerns',
      'Endometriosis or other gynaecological conditions (assessment required)',
      'Anxiety, fear of pain and previous difficult experiences',
      'Relationship pressure or insufficient arousal and lubrication',
    ],
    whenToSeek: [
      'Pain is persistent or recurring',
      'Pain occurs with bleeding or new discharge',
      'You are avoiding intimacy or medical care',
      'Pain is affecting your emotional wellbeing',
      'You have a history of pelvic pain or difficult examinations',
    ],
    consultation: [
      'A clinician listens to the pattern and your history at your pace.',
      'A gynaecological assessment may be recommended and explained first.',
      'Pelvic floor or psychosexual support may be part of the plan.',
      'You can pause, decline or ask for a different approach at any point.',
    ],
    specialists: ['Gynaecology', 'Pelvic floor physiotherapy', 'Psychosexual therapy', 'Sexual medicine'],
    faqs: [
      {
        question: 'Do I have to have an internal examination?',
        answer:
          'No examination can happen without your consent. A clinician can start with a conversation and discuss what an examination would involve before you decide.',
      },
      {
        question: 'Can pain be psychological?',
        answer:
          'Pain is real regardless of cause, and psychological factors can influence how pain is experienced. A good assessment considers both body and mind without dismissing either.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'sexual-wellbeing-concerns-women',
    name: 'Sexual wellbeing concerns',
    categorySlug: 'womens-sexual-wellness',
    categoryName: "Women's sexual wellness",
    summary:
      'A private space to talk about pleasure, satisfaction, bodily changes and sexual self-understanding.',
    icon: 'flower',
    overview:
      'Sexual wellbeing is broader than function. It includes comfort, pleasure, safety, communication and the freedom to define what a satisfying intimate life means for you. If something feels off, a specialist can help you make sense of it without pathologising normal variation.',
    concerns: [
      'Difficulty becoming aroused or feeling present',
      'Changes in pleasure or orgasm',
      'Embarrassment about your body or desires',
      'Feeling disconnected from your sexual self',
      'Concerns after childbirth, illness or surgery',
      'Uncertainty about what is normal',
    ],
    factors: [
      'Stress, sleep and mental health',
      'Hormonal and physical changes',
      'Relationship safety and communication',
      'Medication and health conditions',
      'Cultural and personal expectations',
    ],
    whenToSeek: [
      'A change is bothering you',
      'You feel ashamed or confused about your body',
      'Intimacy feels like an obligation rather than a choice',
      'A health event has changed your sexual wellbeing',
      'You want accurate, respectful information',
    ],
    consultation: [
      'A clinician begins with your definition of wellbeing and your goals.',
      'Relevant medical, emotional and relationship factors are explored.',
      'Options may include education, therapy, medical review or a combination.',
      'You remain in control of the direction and pace of care.',
    ],
    specialists: ['Gynaecology', 'Sexual medicine', 'Psychosexual therapy', 'Psychology'],
    faqs: [
      {
        question: 'Will the conversation be explicit?',
        answer:
          'Clinicians ask only what is relevant to your care and explain why. You can decline any question and still receive support.',
      },
      {
        question: 'Is it okay to come with no specific diagnosis in mind?',
        answer:
          'Absolutely. Many people seek care because something feels different or because they want a trustworthy space to talk. You do not need to arrive with a label.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'intimacy-related-anxiety',
    name: 'Intimacy-related anxiety',
    categorySlug: 'womens-sexual-wellness',
    categoryName: "Women's sexual wellness",
    summary:
      'Gentle, structured support for fear, worry and self-consciousness around closeness.',
    icon: 'brain',
    overview:
      'Anxiety can make intimacy feel unsafe or exhausting. It may show up as racing thoughts, physical tension, avoidance or a need to get through the experience rather than be in it. Therapy can help you understand the pattern and rebuild a sense of choice and safety.',
    concerns: [
      'Racing thoughts or dissociation during intimacy',
      'Fear of pain, rejection or losing control',
      'Self-consciousness about your body',
      'Avoiding intimacy entirely',
      'People-pleasing or difficulty saying no',
      'Anxiety after intimacy or difficulty relaxing',
    ],
    factors: [
      'Past experiences, including coercion or boundary violations',
      'Fear of pain or previous painful intimacy',
      'Body image and shame',
      'Relationship dynamics and fear of conflict',
      'Generalised anxiety or low mood',
    ],
    whenToSeek: [
      'Anxiety is limiting your relationships or wellbeing',
      'You feel unsafe or unable to say no',
      'Avoidance is becoming the main strategy',
      'Past experiences are affecting the present',
      'You want support at your own pace',
    ],
    consultation: [
      'A therapist creates a predictable, consent-led space.',
      'You set the limits of what is discussed; grounding and safety come first.',
      'Therapy may include anxiety skills, boundary work and trauma-informed support.',
      'Medical assessment can be arranged if pain or physical symptoms are present.',
    ],
    specialists: ['Psychosexual therapy', 'Trauma-informed therapy', 'Psychology', 'Gynaecology'],
    faqs: [
      {
        question: 'Do I have to talk about trauma immediately?',
        answer:
          'No. Trauma-informed care means stability and choice come first. You can work on coping and safety before deciding whether to explore past experiences.',
      },
      {
        question: 'Can therapy make intimacy feel safe again?',
        answer:
          'Many people find therapy helpful for reducing anxiety and rebuilding a sense of agency. Progress varies and cannot be guaranteed; the goal is meaningful change, not a prescribed timeline.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'menopause-sexual-wellbeing',
    name: 'Menopause-related sexual wellbeing',
    categorySlug: 'womens-sexual-wellness',
    categoryName: "Women's sexual wellness",
    summary:
      'Evidence-informed care for dryness, pain, desire and intimacy changes during perimenopause and menopause.',
    icon: 'moon',
    overview:
      'Perimenopause and menopause can change sexual wellbeing in ways that are rarely discussed openly. Vaginal dryness, discomfort, sleep disruption and desire shifts are common — and there are options. Care should be personalised, unhurried and free of euphemism.',
    concerns: [
      'Vaginal dryness, burning or irritation',
      'Pain or discomfort during sex',
      'Changes in desire or arousal',
      'Sleep disruption and fatigue affecting intimacy',
      'Feeling uncertain about hormonal and non-hormonal options',
      'Relationship and body-image changes',
    ],
    factors: [
      'Declining oestrogen and other hormonal changes',
      'Genitourinary and pelvic floor changes',
      'Sleep, mood and stress',
      'Medication and other health conditions',
      'Relationship dynamics and access to accurate information',
    ],
    whenToSeek: [
      'Dryness or pain is affecting comfort or intimacy',
      'You want to discuss hormonal or non-hormonal options',
      'Symptoms are affecting sleep, mood or relationships',
      'You feel dismissed or unsure where to get care',
      'You want a private, evidence-informed conversation',
    ],
    consultation: [
      'A gynaecology or sexual medicine clinician reviews symptoms and history.',
      'Options including lubricants, moisturisers, local therapies and referral are discussed with risks and benefits.',
      'Psychosexual or couples support can be added where useful.',
      'Care is individualised; no single pathway suits everyone.',
    ],
    specialists: ['Gynaecology', 'Menopause care', 'Sexual medicine', 'Psychosexual therapy'],
    faqs: [
      {
        question: 'Is discomfort during menopause just something to accept?',
        answer:
          'No. There are evidence-based options for dryness and pain. A clinician can discuss benefits and risks based on your history.',
      },
      {
        question: 'Can I discuss this without a physical examination?',
        answer:
          'Often the first conversation can be verbal. If an examination would help, it will be explained and only proceed with your consent.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'relationship-communication-challenges',
    name: 'Relationship & communication challenges',
    categorySlug: 'womens-sexual-wellness',
    categoryName: "Women's sexual wellness",
    summary:
      'Find language for needs, boundaries and desires when conversations keep going wrong.',
    icon: 'message-circle',
    overview:
      'Communication is not simply about talking more. It is about being heard, regulating conflict and making room for two perspectives. When conversations about intimacy, responsibilities or boundaries keep failing, a skilled therapist can help change the pattern.',
    concerns: [
      'The same argument repeating without resolution',
      'Difficulty saying what you need',
      'Feeling dismissed or responsible for everything',
      'Avoiding difficult conversations',
      'Mismatched expectations about intimacy or time',
      'Silence or resentment growing over time',
    ],
    factors: [
      'Different communication styles and family scripts',
      'Unspoken expectations and assumptions',
      'Stress, workload and unequal responsibilities',
      'Fear of conflict or abandonment',
      'Cultural and gender-role expectations',
    ],
    whenToSeek: [
      'You feel unheard or chronically misunderstood',
      'Conflict is frequent, escalating or shutting down',
      'You are avoiding important conversations',
      'You want to build skills before a crisis',
      'One or both partners are ready to work on the relationship',
    ],
    consultation: [
      'A therapist maps the communication cycle with both partners.',
      'Sessions focus on listening, reflection and boundaries.',
      'Individual work may be recommended where safety or capacity requires it.',
      'Both partners are supported to participate without blame.',
    ],
    specialists: ['Couples counselling', 'Relationship therapy', 'Communication coaching', 'Psychology'],
    faqs: [
      {
        question: 'Is counselling only for relationships in crisis?',
        answer:
          'No. Many couples seek support to improve everyday communication or prepare for a transition. Early support can be useful.',
      },
      {
        question: 'What if my partner refuses to attend?',
        answer:
          'You can still seek individual support. A therapist can help you clarify boundaries and decide what you need, even if couples work is not currently possible.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'reproductive-wellness-guidance-women',
    name: 'Reproductive wellness guidance',
    categorySlug: 'womens-sexual-wellness',
    categoryName: "Women's sexual wellness",
    summary:
      'Understand your reproductive health, screening needs and options with clear, careful guidance.',
    icon: 'flower',
    overview:
      'Reproductive wellness covers menstrual health, contraception, fertility questions, preventive screening and sexual health. This service offers education and appropriate medical referral — never pressure, stigma or promises about outcomes.',
    concerns: [
      'Questions about fertility or trying to conceive',
      'Contraception decisions and side effects',
      'Menstrual changes or pelvic symptoms',
      'Confusion about screening recommendations',
      'Sexual health questions and prevention',
      'Planning around pregnancy, postpartum or menopause',
    ],
    factors: [
      'Age, medical history and family history',
      'Hormonal and reproductive life stage',
      'Medication and existing health conditions',
      'Lifestyle, stress and access to care',
      'The quality of information available to you',
    ],
    whenToSeek: [
      'You have persistent pelvic or menstrual symptoms',
      'You need accurate contraception or fertility information',
      'You are unsure about screening or prevention',
      'You have been trying to conceive without success',
      'You want care without judgment',
    ],
    consultation: [
      'A clinician reviews your history and what you want to understand.',
      'Appropriate testing or gynaecology referral is discussed with consent.',
      'You receive clear information on options, benefits and limits.',
      'Follow-up is planned around your needs.',
    ],
    specialists: ['Gynaecology', 'Reproductive medicine (referral)', 'Sexual health', 'General practice'],
    faqs: [
      {
        question: 'Can Nayacura provide contraception?',
        answer:
          'This demo platform provides education and appointment pathways. Prescription contraception requires assessment by an appropriately qualified clinician in a suitable clinical setting.',
      },
      {
        question: 'Will my fertility be assessed in one appointment?',
        answer:
          'No. Fertility assessment involves specific tests and specialist evaluation over time. A consultation can help you understand the process and next steps.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'emotional-connection',
    name: 'Emotional connection',
    categorySlug: 'couples-relationship-counselling',
    categoryName: 'Couples & relationship counselling',
    summary:
      'Reconnect through small, consistent moments of attention, curiosity and safety.',
    icon: 'heart',
    featured: true,
    overview:
      'Connection is built in ordinary moments: being noticed, listened to and chosen. When those moments fade, couples can feel like roommates or strangers. Counselling helps you understand what got lost and practise ways to turn toward each other again.',
    concerns: [
      'Feeling lonely inside the relationship',
      'Conversations that stay practical and never personal',
      'Loss of affection or curiosity',
      'Parallel lives and little shared time',
      'Feeling taken for granted',
      'Difficulty repairing after distance or conflict',
    ],
    factors: [
      'Workload, parenting and competing demands',
      'Unmet emotional needs and assumptions',
      'Unresolved conflict and accumulated resentment',
      'Different attachment and affection styles',
      'Major transitions such as relocation or parenthood',
    ],
    whenToSeek: [
      'You feel more like housemates than partners',
      'Attempts to reconnect are dismissed or misunderstood',
      'Distance is affecting intimacy',
      'You want to rebuild before considering separation',
      'Both partners are willing to try',
    ],
    consultation: [
      'A therapist helps each partner describe what connection means to them.',
      'Sessions identify cycles of distance and small experiments to interrupt them.',
      'Communication and repair skills are practised in the room.',
      'Progress is reviewed together without promising a particular outcome.',
    ],
    specialists: ['Couples counselling', 'Emotionally focused therapy', 'Relationship therapy', 'Psychology'],
    faqs: [
      {
        question: 'Can therapy help if we still love each other?',
        answer:
          'Yes. Love and connection are related but not identical. Therapy can help translate care into everyday behaviours that feel connecting to both people.',
      },
      {
        question: 'How long does couples counselling take?',
        answer:
          'It depends on the concerns, goals and capacity of both partners. A therapist can propose a review after a small number of sessions to see whether the work is useful.',
      },
    ],
  },
  {
    slug: 'communication-difficulties',
    name: 'Communication difficulties',
    categorySlug: 'couples-relationship-counselling',
    categoryName: 'Couples & relationship counselling',
    summary:
      'Move from blame and withdrawal toward conversations where both people can be heard.',
    icon: 'message-circle',
    overview:
      'Most couples do not lack love; they lack a reliable way to talk about hard things. Criticism, defensiveness, stonewalling and contempt can take over before either person notices. Counselling helps make the pattern visible and teaches a different way to engage.',
    concerns: [
      'Arguments that escalate quickly',
      'One partner shutting down while the other pursues',
      'Criticism, defensiveness or contempt',
      'Avoiding difficult topics altogether',
      'Repeating the same conversation with no change',
      'Feeling unheard even when the other person is speaking',
    ],
    factors: [
      'Different nervous-system responses to conflict',
      'Unmet needs expressed as criticism or withdrawal',
      'Family-of-origin communication patterns',
      'Stress and depleted capacity',
      'Unresolved past incidents',
    ],
    whenToSeek: [
      'Conversations regularly end in hurt or withdrawal',
      'You avoid important topics to keep the peace',
      'Conflict is affecting children, intimacy or daily life',
      'You want a neutral space to address a specific issue',
      'One or both partners feel hopeless about being heard',
    ],
    consultation: [
      'The therapist slows the cycle and helps both partners observe it.',
      'You learn to express needs without attack and respond without defensiveness.',
      'Sessions may include structured conversations and repair practice.',
      'The therapist does not declare who is right; the goal is a workable pattern.',
    ],
    specialists: ['Couples counselling', 'Relationship therapy', 'Communication coaching', 'Psychology'],
    faqs: [
      {
        question: 'Is it a bad sign if we argue?',
        answer:
          'Conflict itself is not the problem. How conflict is handled, repaired and connected to underlying needs matters more than whether it happens.',
      },
      {
        question: 'Can one partner change the dynamic alone?',
        answer:
          'One person can change their part, which often shifts the cycle. Couples work is faster when both participate, but individual growth can still be meaningful.',
      },
    ],
  },
  {
    slug: 'intimacy-challenges-couples',
    name: 'Intimacy challenges for couples',
    categorySlug: 'couples-relationship-counselling',
    categoryName: 'Couples & relationship counselling',
    summary:
      'Explore mismatched desire, sexual communication and change with both voices in the room.',
    icon: 'flame',
    overview:
      'Intimacy challenges are often a couple’s issue, not one person’s problem. Mismatched desire, pain, performance anxiety, resentment or a loss of emotional safety can all affect closeness. Couples counselling creates a space where both people can speak honestly without pressure.',
    concerns: [
      'Different levels of desire',
      'Intimacy feeling like an obligation or negotiation',
      'One partner avoiding closeness',
      'Sex becoming a source of conflict',
      'Difficulty discussing preferences and boundaries',
      'Impact of health changes, parenting or stress',
    ],
    factors: [
      'Emotional safety and unresolved resentment',
      'Physical health, pain, medication and fatigue',
      'Mismatched expectations and scripts',
      'Hormonal and life-stage changes',
      'Fear of rejection or disappointing the other person',
    ],
    whenToSeek: [
      'Intimacy is a recurring source of distress',
      'One or both partners are avoiding the topic',
      'There is pressure, coercion or fear',
      'A health change has affected closeness',
      'You want to rebuild intimacy without a performance goal',
    ],
    consultation: [
      'A therapist helps both partners describe needs, fears and meanings.',
      'Sessions may include communication, pacing and consent practices.',
      'Medical assessment can be arranged alongside therapy.',
      'The therapist does not set a frequency target; the couple defines what feels right.',
    ],
    specialists: ['Couples counselling', 'Psychosexual therapy', 'Sexual medicine', 'Gynaecology'],
    faqs: [
      {
        question: 'Do we need to agree on how often to have sex?',
        answer:
          'A shared understanding can help, but a therapist will not impose a number. The work is about mutual consent, communication and what feels satisfying to both people.',
      },
      {
        question: 'What if one of us has a medical issue?',
        answer:
          'Medical care and relational support can work together. A therapist may recommend a medical review, and a physician can explain options and limits.',
      },
    ],
  },
  {
    slug: 'relationship-conflicts',
    name: 'Relationship conflicts',
    categorySlug: 'couples-relationship-counselling',
    categoryName: 'Couples & relationship counselling',
    summary:
      'Work through recurring conflict, decide what matters, and learn to repair rather than win.',
    icon: 'swords',
    overview:
      'Some conflict is inevitable; chronic conflict that leaves both people feeling unsafe or unseen is not. Counselling helps couples separate solvable problems from enduring differences, reduce destructive patterns and decide what kind of relationship they want to build.',
    concerns: [
      'Frequent arguments about small things',
      'Conflict about money, family, parenting or time',
      'One person threatening to leave during conflict',
      'Hurtful language or stonewalling',
      'Repair never happening after arguments',
      'Deciding whether to continue the relationship',
    ],
    factors: [
      'Unmet needs and unequal power or workload',
      'Different values, expectations and family scripts',
      'Trust injuries and unresolved incidents',
      'Stress and limited capacity',
      'Patterns of escalation or avoidance',
    ],
    whenToSeek: [
      'Conflict is frequent or feels uncontrollable',
      'There is fear, intimidation or coercion (seek safety support)',
      'Arguments affect children or daily functioning',
      'Repair attempts consistently fail',
      'You want help deciding the next step',
    ],
    consultation: [
      'A therapist assesses safety and the pattern of conflict first.',
      'Sessions may focus on de-escalation, boundaries and repair.',
      'Where abuse or coercion is present, individual safety planning takes priority.',
      'The therapist supports decisions without pushing reconciliation.',
    ],
    specialists: ['Couples counselling', 'Relationship therapy', 'Trauma-informed therapy', 'Psychology'],
    faqs: [
      {
        question: 'Is couples counselling safe if there is abuse?',
        answer:
          'No. Couples counselling is not appropriate when one partner is afraid or coercion is present. A therapist should prioritise individual safety and appropriate support.',
      },
      {
        question: 'Can therapy help us decide whether to separate?',
        answer:
          'It can help you clarify values, needs and the relationship pattern. The decision remains yours; a therapist does not act as a judge or advocate for a particular outcome.',
      },
    ],
  },
  {
    slug: 'trust-rebuilding',
    name: 'Trust rebuilding',
    categorySlug: 'couples-relationship-counselling',
    categoryName: 'Couples & relationship counselling',
    summary:
      'For couples navigating broken trust: careful conversations, accountability and realistic pacing.',
    icon: 'shield',
    overview:
      'Trust can be shaken by betrayal, secrecy, broken promises or repeated letdowns. Rebuilding it requires more than reassurance. It needs honest acknowledgement, consistent behaviour, boundaries and time. Counselling provides structure for that difficult process without guaranteeing that a relationship will continue.',
    concerns: [
      'Discovering secrecy or a breach of an agreement',
      'Repeated broken promises',
      'Constant checking or reassurance-seeking',
      'Difficulty believing anything the other person says',
      'Shame and defensiveness after disclosure',
      'Deciding whether repair is possible',
    ],
    factors: [
      'The nature and duration of the breach',
      'Whether responsibility is acknowledged',
      'Consistency of changed behaviour',
      'Both partners’ capacity and safety',
      'Individual histories and attachment patterns',
    ],
    whenToSeek: [
      'Trust has been seriously damaged',
      'Conversations about the breach go in circles',
      'You want a structured process rather than repeated arguments',
      'There is ongoing secrecy or coercion',
      'You need support deciding what you can accept',
    ],
    consultation: [
      'A therapist assesses safety and readiness before any joint work.',
      'Sessions separate accountability from blame and identify what repair requires.',
      'Individual support may be recommended alongside couples work.',
      'The pace is set by safety and consent, not pressure to forgive.',
    ],
    specialists: ['Couples counselling', 'Trauma-informed therapy', 'Relationship therapy', 'Psychology'],
    faqs: [
      {
        question: 'Does trust rebuilding mean forgiving?',
        answer:
          'Not automatically. Forgiveness is a personal choice. The work can focus on understanding, accountability, boundaries and whether the relationship can be safe and honest.',
      },
      {
        question: 'How long does it take?',
        answer:
          'There is no fixed timeline. Rebuilding trust depends on safety, consistency and both people’s capacity. A therapist can help set milestones without promising an outcome.',
      },
    ],
  },
  {
    slug: 'premarital-counselling',
    name: 'Premarital counselling',
    categorySlug: 'couples-relationship-counselling',
    categoryName: 'Couples & relationship counselling',
    summary:
      'Prepare for marriage by discussing expectations, money, family, intimacy and conflict before they become crises.',
    icon: 'rings',
    overview:
      'Premarital counselling is not about predicting whether a marriage will last. It is a structured opportunity to discuss the practical and emotional realities that shape a shared life: values, family expectations, money, work, intimacy, and how you will handle disagreement.',
    concerns: [
      'Different expectations about family and living arrangements',
      'Money, career and decision-making differences',
      'Family involvement and boundary questions',
      'Intimacy expectations and consent',
      'How conflict is handled',
      'Migration, faith or cultural differences',
    ],
    factors: [
      'Family and cultural scripts',
      'Different attachment and communication styles',
      'Unspoken assumptions about roles',
      'Readiness and personal goals',
      'Existing trust and safety',
    ],
    whenToSeek: [
      'You are planning to marry and want a shared framework',
      'Difficult topics are being avoided',
      'Families are heavily involved in decisions',
      'You want to discuss intimacy and boundaries early',
      'You want a neutral space to ask hard questions',
    ],
    consultation: [
      'A therapist guides structured conversations across key areas.',
      'You identify differences and agree on how to discuss them.',
      'Sessions may be individual or joint depending on the issue.',
      'The aim is clarity, not a verdict on the relationship.',
    ],
    specialists: ['Couples counselling', 'Premarital counselling', 'Relationship education', 'Psychology'],
    faqs: [
      {
        question: 'Is premarital counselling only for religious couples?',
        answer:
          'No. It is a secular, practical process for any couple preparing for a committed relationship. It can be adapted to your beliefs and context.',
      },
      {
        question: 'Do we need to be engaged?',
        answer:
          'No. Couples considering commitment at any stage can benefit from structured conversations about expectations and values.',
      },
    ],
  },
  {
    slug: 'couples-wellness-planning',
    name: 'Couples wellness planning',
    categorySlug: 'couples-relationship-counselling',
    categoryName: 'Couples & relationship counselling',
    summary:
      'Build shared routines for emotional, sexual and relational wellbeing — realistically.',
    icon: 'calendar-heart',
    overview:
      'Wellbeing does not maintain itself. Couples wellness planning helps you translate good intentions into sustainable routines: how you check in, repair, make time, protect intimacy and support each other’s health. It is practical, collaborative and tailored to your actual life.',
    concerns: [
      'No time or energy for connection',
      'Health changes affecting the relationship',
      'Parenting or caregiving crowding out intimacy',
      'Different ideas about rest and recreation',
      'Repeated cycles of burnout',
      'Wanting a shared plan, not just advice',
    ],
    factors: [
      'Work schedules and caregiving load',
      'Health, sleep and stress',
      'Financial pressure',
      'Different energy patterns and needs',
      'Social and family obligations',
    ],
    whenToSeek: [
      'You want to protect the relationship during a busy season',
      'A health change needs shared planning',
      'You are tired of intentions that never become habits',
      'You want to discuss needs before resentment builds',
      'Both partners want a practical, nonjudgmental plan',
    ],
    consultation: [
      'A therapist helps you audit time, energy and needs.',
      'You choose a small number of realistic routines to test.',
      'Sessions review what works without turning the plan into another performance metric.',
      'The plan can include medical, sexual and emotional wellbeing priorities.',
    ],
    specialists: ['Couples counselling', 'Relationship coaching', 'Psychology', 'Lifestyle medicine (referral)'],
    faqs: [
      {
        question: 'Is this just scheduling sex?',
        answer:
          'No. Planning can include intimacy, but it is broader: rest, communication, repair, health and shared time. The couple decides what matters.',
      },
      {
        question: 'How many sessions does planning take?',
        answer:
          'Some couples use one or two structured sessions; others prefer ongoing review. The therapist will propose a pace and check whether it is useful.',
      },
    ],
  },
  {
    slug: 'stress-related-intimacy-concerns',
    name: 'Stress-related intimacy concerns',
    categorySlug: 'emotional-psychological-wellbeing',
    categoryName: 'Emotional & psychological wellbeing',
    summary:
      'When pressure, exhaustion and worry take up the space where closeness used to be.',
    icon: 'waves',
    overview:
      'Stress changes the body and the mind. It can reduce desire, make arousal harder, increase tension and leave little capacity for connection. This service helps you understand that relationship and build practical, compassionate ways to protect intimacy during demanding seasons.',
    concerns: [
      'Desire disappearing when life feels overwhelming',
      'Difficulty switching off or being present',
      'Irritability and withdrawal from a partner',
      'Anxiety about not meeting expectations',
      'Using sex as a stress reliever, then feeling disconnected',
      'Guilt about low capacity',
    ],
    factors: [
      'Workload, financial pressure and caregiving',
      'Sleep disruption and exhaustion',
      'Anxiety and low mood',
      'Unrelenting self-criticism',
      'Relationship strain and limited support',
    ],
    whenToSeek: [
      'Stress is persistently affecting intimacy or wellbeing',
      'You feel guilty or ashamed about low capacity',
      'Sleep, mood or functioning is worsening',
      'You want practical support before burnout',
      'Your relationship is suffering and conversations are stuck',
    ],
    consultation: [
      'A therapist explores stress, sleep, mood and relationship context.',
      'You identify small changes that are realistic rather than another to-do list.',
      'Where needed, referral for medical or mental health assessment is discussed.',
      'Care is paced to your capacity and reviewed over time.',
    ],
    specialists: ['Psychology', 'Psychosexual therapy', 'Stress and burnout support', 'Couples counselling'],
    faqs: [
      {
        question: 'Is low desire because of stress “just in my head”?',
        answer:
          'No. Stress has real physiological and emotional effects. It deserves attention rather than dismissal.',
      },
      {
        question: 'Should I wait until things calm down?',
        answer:
          'That depends. Some people benefit from support during the difficult season rather than after it. A clinician can help you decide what is realistic.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'body-image-confidence',
    name: 'Body image & confidence',
    categorySlug: 'emotional-psychological-wellbeing',
    categoryName: 'Emotional & psychological wellbeing',
    summary:
      'Build a less punitive relationship with your body so intimacy can feel like a choice, not a test.',
    icon: 'mirror',
    overview:
      'Body image can shape whether you feel safe being seen, touched or desired. Shame about appearance, weight, scars, ageing or gender expression can keep you distant from intimacy. Therapy offers a space to examine those beliefs and practise a kinder, more embodied way of being.',
    concerns: [
      'Avoiding intimacy because you feel ashamed of your body',
      'Constant comparison with others',
      'Fear of being seen or touched',
      'Shame about scars, ageing or changes after illness',
      'Difficulty accepting compliments',
      'Feeling disconnected from bodily sensations',
    ],
    factors: [
      'Cultural appearance standards and social media',
      'Past teasing, rejection or medical experiences',
      'Gender and identity-related stress',
      'Anxiety and depression',
      'Relationship dynamics and perceived criticism',
    ],
    whenToSeek: [
      'Body shame is limiting intimacy or daily life',
      'You avoid being seen or touched',
      'Appearance worries are persistent and distressing',
      'A health change has affected body image',
      'You want support without being told to “just love yourself”',
    ],
    consultation: [
      'A therapist explores the origins of body shame and its impact.',
      'Sessions may include cognitive, compassion and somatic approaches.',
      'You set the pace; no exposure exercise is imposed.',
      'Medical or dietetic referral may be considered where appropriate.',
    ],
    specialists: ['Psychology', 'Body image therapy', 'Psychosexual therapy', 'Trauma-informed therapy'],
    faqs: [
      {
        question: 'Is body image therapy about losing weight?',
        answer:
          'No. The focus is your relationship with your body, not a prescribed appearance. Care should not assume that weight change is the solution.',
      },
      {
        question: 'Will I have to look at my body in a mirror?',
        answer:
          'Not unless you agree. Therapy can start with conversation and coping. Any exercise is collaborative and can be adapted or declined.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'relationship-anxiety',
    name: 'Relationship anxiety',
    categorySlug: 'emotional-psychological-wellbeing',
    categoryName: 'Emotional & psychological wellbeing',
    summary:
      'Understand worry, reassurance-seeking and fear of abandonment in intimate relationships.',
    icon: 'cloud',
    overview:
      'Relationship anxiety can feel like a constant alarm: worry about being left, misreading a partner’s mood, or needing reassurance that never lasts. Therapy helps you recognise the cycle, build tolerance for uncertainty and communicate needs without losing yourself.',
    concerns: [
      'Constant worry that your partner will leave',
      'Reassurance-seeking that only temporarily helps',
      'Over-analysing messages and tone',
      'Difficulty trusting a partner’s care',
      'People-pleasing to avoid conflict',
      'Anxiety that intensifies as the relationship becomes closer',
    ],
    factors: [
      'Attachment history and early relational experiences',
      'Anxiety sensitivity and intolerance of uncertainty',
      'Past betrayal or abandonment',
      'Low self-worth and fear of being a burden',
      'Relationship dynamics that reinforce inconsistency',
    ],
    whenToSeek: [
      'Worry is interfering with daily life or the relationship',
      'Reassurance-seeking is increasing',
      'You feel unable to express needs directly',
      'Anxiety is affecting sleep or concentration',
      'You want support before the pattern becomes entrenched',
    ],
    consultation: [
      'A therapist maps triggers, thoughts, behaviours and relational patterns.',
      'You build grounding, self-soothing and communication skills.',
      'Individual or couples work may be recommended depending on the dynamic.',
      'The aim is greater agency, not perfect certainty.',
    ],
    specialists: ['Psychology', 'Attachment-based therapy', 'CBT', 'Couples counselling'],
    faqs: [
      {
        question: 'Is relationship anxiety a sign the relationship is wrong?',
        answer:
          'Not necessarily. Anxiety can arise from past experiences or current inconsistency. Therapy helps you understand the signal rather than make a quick judgment.',
      },
      {
        question: 'Should my partner come to therapy?',
        answer:
          'Sometimes couples work helps, but individual therapy is useful even if your partner does not attend. The choice depends on your goals and safety.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'emotional-wellbeing',
    name: 'Emotional wellbeing',
    categorySlug: 'emotional-psychological-wellbeing',
    categoryName: 'Emotional & psychological wellbeing',
    summary:
      'A private space to understand mood, shame, identity and the emotional side of intimate life.',
    icon: 'sun',
    overview:
      'Sexual wellbeing is emotional wellbeing. Anxiety, low mood, shame, grief and identity stress can all shape desire, safety and connection. This service offers a confidential space to make sense of what you are carrying and to choose the support that fits.',
    concerns: [
      'Persistent low mood or loss of interest',
      'Shame or guilt around sexuality',
      'Anxiety that affects relationships or intimacy',
      'Grief, transition or identity-related stress',
      'Feeling disconnected from yourself',
      'Difficulty asking for help',
    ],
    factors: [
      'Life events, loss and transitions',
      'Chronic stress and sleep disruption',
      'Social and cultural pressures',
      'Past experiences and relational history',
      'Physical health and medication',
    ],
    whenToSeek: [
      'Low mood or anxiety is persistent',
      'You feel unable to cope or enjoy things',
      'Shame is affecting your relationships',
      'You are considering self-harm or suicide (seek urgent support)',
      'You want a safe place to talk before things escalate',
    ],
    consultation: [
      'A clinician listens and helps clarify what support you need.',
      'A safety assessment is done where there are acute concerns.',
      'Therapy, medical review or crisis resources may be recommended.',
      'Care is collaborative and respects your pace and identity.',
    ],
    specialists: ['Psychology', 'Psychiatry (referral)', 'Counselling', 'Crisis support'],
    faqs: [
      {
        question: 'What if I am in crisis right now?',
        answer:
          'This platform is not an emergency service. If you are in immediate danger, contact local emergency services or a trusted crisis line. In India, Tele-MANAS is available on 14416. Do not wait for a booking.',
      },
      {
        question: 'Will my employer or family find out?',
        answer:
          'Nayacura accounts are private and clinical data is access-controlled. However, this is a development demo and not a substitute for a real clinical privacy programme. Read the Privacy Policy for details.',
      },
      ...commonFaqs,
    ],
  },
  {
    slug: 'sexual-health-education',
    name: 'Sexual health education',
    categorySlug: 'emotional-psychological-wellbeing',
    categoryName: 'Emotional & psychological wellbeing',
    summary:
      'Evidence-informed education to replace myths, shame and confusion with accurate understanding.',
    icon: 'book-open',
    overview:
      'Most people receive incomplete or shaming sex education. That gap can create anxiety, unsafe choices and relationship strain. This service offers respectful, age-appropriate education on bodies, consent, prevention and communication — and clear boundaries about what education can and cannot replace.',
    concerns: [
      'Confusion about anatomy, arousal or sexual response',
      'Myths about virginity, purity or “normal” sex',
      'Questions about consent and communication',
      'Uncertainty about prevention and sexual health screening',
      'Shame inherited from family or culture',
      'Wanting accurate information for yourself or a relationship',
    ],
    factors: [
      'Limited or abstinence-only education',
      'Cultural silence and stigma',
      'Misinformation online',
      'Fear of judgment from family or peers',
      'Lack of access to trustworthy resources',
    ],
    whenToSeek: [
      'You want accurate information without judgment',
      'Confusion or shame is affecting your wellbeing',
      'You want to communicate better with a partner',
      'You have questions about prevention or screening',
      'You are supporting someone else and want reliable guidance',
    ],
    consultation: [
      'An educator or clinician starts with your questions and context.',
      'Information is explained clearly, with evidence and limits.',
      'You can ask anything without being assumed to have a concern.',
      'Referral is offered if a medical assessment or therapy would help.',
    ],
    specialists: ['Sexual health education', 'Gynaecology', 'Sexual medicine', 'Psychology'],
    faqs: [
      {
        question: 'Is education the same as therapy?',
        answer:
          'No. Education provides information and clarity. Therapy addresses emotional and behavioural patterns over time. A clinician can help you decide which is appropriate.',
      },
      {
        question: 'Can I ask questions anonymously?',
        answer:
          'You can use Naya AI for general, non-identifying questions. For personalised clinical advice, a consultation with a qualified professional is required.',
      },
      ...commonFaqs,
    ],
  },
];

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}

export function servicesByCategory(categorySlug: string) {
  return services.filter((service) => service.categorySlug === categorySlug);
}

export const featuredServices = services.filter((service) => service.featured);
