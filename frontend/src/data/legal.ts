export type LegalPage = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  updated: string;
  content: string;
};

const DRAFT =
  '<blockquote>Pre-launch draft. This document is a product prototype and has not been reviewed by Indian legal or clinical counsel. It is not legal advice and must not be published as a binding policy until reviewed and adapted for the operating entity, jurisdiction and actual data practices.</blockquote>';

export const legalPages: LegalPage[] = [
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    eyebrow: 'Legal & trust',
    summary:
      'What Nayacura would collect, why it would collect it, how long it would keep it, and the choices available to you.',
    updated: '11 November 2026',
    content: `${DRAFT}
<h2>1. Who this policy is for</h2>
<p>This draft describes how a future Nayacura service would handle personal information belonging to patients, prospective patients, doctors and website visitors. It is written for a planned India-based service. The final policy must name the actual legal entity, its registered address, the grievance officer and all processors before launch.</p>
<h2>2. Information we would collect</h2>
<p><strong>Account and contact data:</strong> name, email address, phone number, role, preferred language and communication preferences.</p>
<p><strong>Appointment data:</strong> selected clinician, consultation type, date and time, payment status and administrative booking identifiers.</p>
<p><strong>Health information you choose to share:</strong> a reason for consultation, clinical notes created by an authorised clinician, prescriptions or documents uploaded with consent, and messages you send to Naya AI. This is sensitive personal data and is treated with additional care.</p>
<p><strong>Technical data:</strong> session information, device and browser type, approximate region derived from IP, security logs and privacy-friendly usage events. We would avoid advertising trackers and cross-site profiling by default.</p>
<h2>3. Why we would process it</h2>
<p>To create and secure your account; arrange and deliver consultations; process payments; provide support; maintain clinical and audit records; protect the service from abuse; meet legal obligations; and, only with separate opt-in consent, send optional wellness communications. Sensitive health data would not be used for targeted advertising.</p>
<h2>4. Consent and legal bases</h2>
<p>Nayacura would rely on your consent for collecting sensitive health information, storing AI conversations and any optional marketing. Consent would be specific, informed, freely given and withdrawable. Some processing may be necessary for the performance of a service, for compliance with law or for legitimate safety and security purposes. Where Indian law requires a different legal basis, the final policy would identify it precisely.</p>
<h2>5. Sharing</h2>
<p>Information would be shared only with the clinician you select, authorised operational teams with a need to know, payment and communication processors, and authorities where legally required. Administrators would not automatically receive clinical notes. The final policy must list every processor, its location and the safeguards used for cross-border transfers.</p>
<h2>6. Security</h2>
<p>The prototype uses hashed passwords, server-side sessions in HTTP-only cookies, role-based access checks, CSRF protection, rate limiting and audit events. Production deployment would require independent security testing and a documented incident response plan, encryption key management, backups and disaster recovery. No method of transmission or storage is completely secure, and no certification should be claimed without an independent audit.</p>
<h2>7. Retention and deletion</h2>
<p>Clinical records may be subject to retention duties under applicable Indian medical and tax law. Account, marketing and support data would be retained only as long as necessary for the stated purpose. The final schedule must be approved by legal counsel. You may submit a deletion request; if a legal retention duty applies, we would explain what must be kept and for how long.</p>
<h2>8. Your choices</h2>
<p>Subject to applicable law, you may request access, correction, deletion, withdrawal of consent, a copy of your data or information about processing. You may also raise a grievance. Use the <a href="/legal/data-deletion">Data Deletion Request</a> or <a href="/contact">Support</a> form. The final policy must explain response timelines, identity verification and the relevant regulator.</p>
<h2>9. Children</h2>
<p>Nayacura is intended for adults aged 18 and over. We would not knowingly collect data from anyone under 18. If such data is discovered, it would be handled under the incident response process.</p>
<h2>10. Changes</h2>
<p>Material changes would be communicated through the account or email before they take effect. The final policy must include the legal entity, contact details and grievance officer.</p>`,
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    eyebrow: 'Legal & trust',
    summary:
      'The proposed rules for using Nayacura, the limits of the platform and the responsibilities of users and clinicians.',
    updated: '11 November 2026',
    content: `${DRAFT}
<h2>1. The service</h2>
<p>Nayacura is a planned platform connecting adults with independent qualified healthcare professionals for sexual wellness, relationship and emotional wellbeing support. Nayacura is not a hospital, insurer, emergency service or substitute for an in-person medical examination. This development build is a demonstration and provides no real clinical service.</p>
<h2>2. Eligibility</h2>
<p>You must be at least 18 and legally able to enter into a contract. You agree to provide accurate account and appointment information, use only your own identity, and not impersonate another person. Clinicians must provide genuine credentials and maintain the registrations required by the relevant council.</p>
<h2>3. Your responsibilities</h2>
<ul>
<li>Do not use the platform for emergencies or urgent care.</li>
<li>Provide relevant health information so a clinician can assess whether a remote consultation is appropriate.</li>
<li>Do not record a consultation without the other participants’ explicit informed consent.</li>
<li>Do not upload malware, attempt unauthorised access, scrape data or disrupt the service.</li>
<li>Respect clinicians and support staff. Abusive, coercive or harassing conduct may lead to account suspension.</li>
</ul>
<h2>4. Clinical responsibility</h2>
<p>Clinicians are responsible for the care they provide within their competence and registration. Nayacura does not guarantee diagnosis, treatment, cure, fertility or any particular outcome. A clinician may decline a remote consultation or require an in-person assessment where that is clinically appropriate.</p>
<h2>5. Payments and pricing</h2>
<p>Prices, taxes and cancellation terms are shown before payment. Payment processing is performed by a third-party provider. Nayacura would not store full card details. Demo payment flows create no real charge. Refund eligibility is described in the <a href="/legal/cancellation-refund">Cancellation and Refund Policy</a>.</p>
<h2>6. Privacy and consent</h2>
<p>Your use of the service is also governed by the <a href="/legal/privacy">Privacy Policy</a> and <a href="/legal/teleconsultation-consent">Teleconsultation Consent</a>. You consent to the processing needed to arrange your care, but sensitive data will not be used for advertising.</p>
<h2>7. Intellectual property</h2>
<p>The Nayacura name, interface, editorial content and original illustrations are protected by applicable law. You may not reproduce or commercially exploit them without permission. Educational content is provided for general information only.</p>
<h2>8. Suspension and termination</h2>
<p>Accounts may be suspended for fraud, safety risk, credential failure, abuse or breach of these terms. You may request account closure at any time, subject to legal retention obligations.</p>
<h2>9. Disclaimers and liability</h2>
<p>To the extent permitted by applicable law, the service is provided without warranties of uninterrupted availability or fitness for a particular purpose. Nothing in these terms excludes liability that cannot lawfully be excluded. The final wording must be prepared and reviewed by Indian counsel, including the treatment of consumer rights and clinical negligence.</p>
<h2>10. Governing law and disputes</h2>
<p>The final terms should state the operating entity, governing law and a grievance process that complies with applicable Indian law. A dispute-resolution clause must not restrict mandatory statutory rights.</p>`,
  },
  {
    slug: 'medical-disclaimer',
    title: 'Medical Disclaimer',
    eyebrow: 'Clinical boundaries',
    summary:
      'Nayacura provides information and facilitates care. It does not diagnose, prescribe or replace an examination.',
    updated: '11 November 2026',
    content: `${DRAFT}
<h2>1. Not medical advice</h2>
<p>The educational content, service descriptions and Naya AI responses on this platform are for general information and support. They do not constitute medical advice, diagnosis, treatment or a prescription for any individual. Reading them does not create a clinician-patient relationship.</p>
<h2>2. No guaranteed outcomes</h2>
<p>Sexual wellness and relationship concerns are influenced by many factors. No clinician can guarantee a cure, a specific timeline or a particular outcome. Any treatment discussion should include benefits, risks, alternatives and uncertainty.</p>
<h2>3. AI limitations</h2>
<p>Naya AI is an artificial intelligence assistant. It is not a doctor, therapist, nurse or emergency responder. It cannot examine you, diagnose you, prescribe medication or judge whether a symptom is serious in your particular case. It may produce incomplete or inaccurate information. Do not rely on it for clinical decisions.</p>
<h2>4. Emergencies</h2>
<p>This platform is not designed for emergencies. If you are in immediate danger, experiencing severe chest pain, significant bleeding, a suspected acute infection, suicidal thoughts or another urgent medical situation, contact local emergency services or go to the nearest emergency department. In India, Tele-MANAS is available on 14416 for mental health support. Do not wait for an online appointment.</p>
<h2>5. Teleconsultation limits</h2>
<p>A video consultation cannot replace a physical examination, imaging or laboratory testing. A clinician may determine that remote care is not appropriate and ask you to attend in person. Withholding information, or using a false identity, can make care unsafe.</p>
<h2>6. Medication and products</h2>
<p>Do not start, stop or change any medication based on this website, Naya AI or generic content. Do not use unregulated sexual performance products. Prescription decisions require an appropriate assessment by a qualified and licensed clinician.</p>
<h2>7. Content review</h2>
<p>All articles in this prototype are marked as unreviewed editorial drafts. The final platform must establish a documented medical review process, record reviewer credentials and display publication and review dates accurately. This demo does not invent reviewers or accreditations.</p>
<h2>8. Seek qualified care</h2>
<p>For personal concerns, book a consultation with a qualified professional who can assess your history and context. If you are unsure where to start, contact a trusted general practitioner or an appropriate specialist in your jurisdiction.</p>`,
  },
  {
    slug: 'teleconsultation-consent',
    title: 'Consent for Teleconsultation',
    eyebrow: 'Clinical boundaries',
    summary:
      'What you are agreeing to before a secure video or telephone consultation, and the limits of remote care.',
    updated: '11 November 2026',
    content: `${DRAFT}
<h2>1. What teleconsultation is</h2>
<p>Teleconsultation allows you to speak with a qualified healthcare professional using video or audio. It can be convenient and private, but it is not identical to an in-person visit. The clinician cannot physically examine you and may have less information available.</p>
<h2>2. Information you will be asked to provide</h2>
<p>Your identity, age confirmation, contact details, a reason for the consultation, relevant medical history and any medications or reports you choose to share. You are responsible for giving accurate information. You may decline to answer a question, but the clinician will explain if that limits their ability to help.</p>
<h2>3. Clinical judgement</h2>
<p>The clinician will decide whether remote care is appropriate. They may recommend an in-person examination, tests, emergency care or a referral. They may end the consultation if it is unsafe to continue. No outcome is guaranteed.</p>
<h2>4. Privacy and the physical setting</h2>
<p>You should join from a private, quiet space where you cannot be overheard and where no one else can see the screen unless you have agreed to their presence. The clinician will also take reasonable steps to protect confidentiality. You should not record the session unless both parties have given explicit informed consent.</p>
<h2>5. Technology limits</h2>
<p>Video quality can be affected by your network, device or browser. A dropped connection may interrupt care. The platform will attempt reconnection, but you should have a phone number or alternative contact method for urgent follow-up if the platform supports one in production. This demo’s video room does not connect to a real clinician.</p>
<h2>6. Emergencies</h2>
<p>Teleconsultation is not an emergency service. If you experience severe symptoms, thoughts of harming yourself or others, or another emergency, call local emergency services immediately rather than waiting for the session.</p>
<h2>7. Consent record</h2>
<p>Before a real consultation, the production platform should record your consent, the time, the clinician identity and the consultation type, and provide you with a copy. This prototype provides a demonstration consent screen but does not create a legally valid clinical consent record.</p>
<h2>8. Withdrawal</h2>
<p>You can withdraw consent and stop the consultation at any time. You can also ask questions about what is being discussed or decline any recommendation. Withdrawal does not affect care already provided.</p>`,
  },
  {
    slug: 'cancellation-refund',
    title: 'Cancellation & Refund Policy',
    eyebrow: 'Payments',
    summary:
      'Proposed cancellation windows, refund timelines and the difference between demo payments and real transactions.',
    updated: '11 November 2026',
    content: `${DRAFT}
<h2>1. Demo payments</h2>
<p>In this development build, “payment” is simulated unless Razorpay keys are configured by the operator. No money is collected by the demo. The flow demonstrates order creation, verification and a receipt, but it is not a live payment service.</p>
<h2>2. Cancellation before a consultation</h2>
<p>A production policy might allow cancellation up to 24 hours before the appointment for a full refund, subject to the clinician’s stated cancellation window. Later cancellations may attract a fee because the clinician’s time has been reserved. Exact terms must be shown before payment and reviewed by counsel.</p>
<h2>3. Clinician cancellations</h2>
<p>If a clinician cancels and cannot offer a suitable alternative, the consultation fee should be refunded in full. Any third-party payment charges that cannot be recovered would be explained transparently.</p>
<h2>4. No-shows</h2>
<p>A patient who does not attend and does not cancel within the stated window may be charged according to the disclosed policy. A clinician who does not attend should not be paid for that appointment, and the patient should be offered a prompt resolution.</p>
<h2>5. Technical failures</h2>
<p>If a consultation cannot take place because of a platform failure, the patient should be offered a rescheduled appointment or a refund. Network failures on the patient’s side would be handled fairly and individually, not with an automatic penalty.</p>
<h2>6. Refund method and timing</h2>
<p>Approved refunds would normally be returned to the original payment method. Processing timelines depend on the payment provider and bank and should be stated precisely in the final policy. Nayacura would not request full card details or one-time passwords for a refund.</p>
<h2>7. Follow-ups and packages</h2>
<p>Follow-up eligibility is clinician-specific and time-limited. The demo does not sell unlimited-care packages or imply guaranteed access to a clinician. Any future plan must describe exactly what is included, its validity and its exclusions.</p>
<h2>8. How to request</h2>
<p>Use the <a href="/contact">Support</a> page with your booking reference. Do not include sensitive clinical details in a cancellation request. The final policy must state the review timeline and escalation route.</p>`,
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    eyebrow: 'Privacy',
    summary:
      'The small set of cookies this prototype uses for security and session management — and what it avoids.',
    updated: '11 November 2026',
    content: `${DRAFT}
<h2>1. What cookies are</h2>
<p>Cookies are small text records stored by your browser. They can keep a session secure, remember preferences or support measurement. This prototype aims to use as few as possible.</p>
<h2>2. Cookies used in this demo</h2>
<p><strong>nayacura_session:</strong> an HTTP-only session cookie used to keep you signed in. It is required for account security and cannot be disabled while using authenticated features.</p>
<p><strong>nayacura_csrf:</strong> a non-sensitive, readable token used to protect forms against cross-site request forgery. It is required for state-changing requests.</p>
<p><strong>nayacura_consent:</strong> if implemented, records your cookie notice choice. It is not used for advertising.</p>
<h2>3. What this prototype avoids</h2>
<p>No advertising cookies, cross-site behavioural profiling, session replay or third-party marketing pixels are intentionally included. Web fonts may be requested from Google Fonts depending on deployment; a production service should self-host fonts or list the provider and its data implications.</p>
<h2>4. Analytics</h2>
<p>If privacy-friendly analytics are added, they should collect aggregated, non-clinical events without recording URLs that contain appointment or health details. Analytics must not be used to infer sensitive health conditions or to build advertising profiles.</p>
<h2>5. Managing cookies</h2>
<p>You can delete or block cookies in your browser settings. Blocking the session cookie will prevent sign-in and protected features from working. Blocking the CSRF cookie may prevent forms from submitting safely.</p>
<h2>6. Third parties</h2>
<p>Production integrations may include a payment provider and a video provider. Their cookies and data practices must be disclosed in the final policy and reviewed before launch. This prototype does not load third-party payment or video scripts unless configured by an operator.</p>
<h2>7. Contact</h2>
<p>Questions about cookies can be sent through the <a href="/contact">Support</a> page. The final policy must identify the legal entity and a grievance contact.</p>`,
  },
  {
    slug: 'data-deletion',
    title: 'Data Deletion Request',
    eyebrow: 'Privacy',
    summary:
      'How to request deletion of your account or AI conversation data, and the limits imposed by clinical record duties.',
    updated: '11 November 2026',
    content: `${DRAFT}
<h2>1. What you can request</h2>
<p>You may request deletion of your account profile, optional marketing preferences, AI conversation history and other data that is not subject to a legal retention duty. You may also request deletion of a specific AI conversation directly from the assistant.</p>
<h2>2. What may be retained</h2>
<p>Medical records, prescriptions, payment records and audit logs may need to be retained for periods required by applicable Indian law, professional guidance or tax rules. If retention applies, the production service should tell you what is kept, why, for how long and who can access it. Retained records would be isolated from active use.</p>
<h2>3. How to submit a request</h2>
<p>Use the <a href="/contact">Support</a> page with the subject “Data deletion request”. Include the email address associated with your account. Do not include clinical details, identity documents or payment card information in the initial message. The production service should verify identity through a secure process before acting.</p>
<h2>4. What happens next</h2>
<p>The intended workflow is: acknowledge the request, verify identity, identify data in scope, delete or anonymise eligible records, confirm completion and explain any lawful retention. Timelines and exceptions must be finalised with legal counsel and aligned with applicable law.</p>
<h2>5. Account deletion versus deactivation</h2>
<p>Deactivation hides an account but may not delete records. Deletion removes eligible data and may be irreversible. This prototype does not process real deletion requests; the form is a demonstration.</p>
<h2>6. Authorised representative</h2>
<p>Where applicable law permits, a nominated representative may submit a request on your behalf with appropriate proof of authority. The production process should be accessible and must not impose unreasonable barriers.</p>
<h2>7. Complaints</h2>
<p>If you are dissatisfied with how a request is handled, use the <a href="/legal/grievance">Grievance & Support</a> route. The final policy must name the grievance officer and the relevant supervisory authority.</p>`,
  },
  {
    slug: 'grievance',
    title: 'Grievance & Support Information',
    eyebrow: 'Legal & trust',
    summary:
      'A clear route for complaints about privacy, care, payments or accessibility — and what to do in an emergency.',
    updated: '11 November 2026',
    content: `${DRAFT}
<h2>1. Scope</h2>
<p>This page describes how a future Nayacura service would receive and review grievances relating to privacy, account access, appointment handling, payments, clinician conduct, content accuracy and accessibility. It is a draft; no grievance officer has been appointed for this demo.</p>
<h2>2. How to raise a concern</h2>
<p>Use the <a href="/contact">Support</a> page, select the relevant category and include your account email and a factual summary. Do not include unnecessary clinical details, identity documents or card numbers. A production service would provide a dedicated email address and, where required by law, a named grievance officer with contact details.</p>
<h2>3. What to expect</h2>
<p>A production process should acknowledge receipt, assign a reference, investigate fairly and communicate an outcome within a stated timeline. Complex clinical concerns may require review by an independent clinician. You should be told if more information is needed and how to escalate.</p>
<h2>4. Clinical complaints</h2>
<p>Concerns about a clinician’s conduct or care should be handled separately from general support and reviewed by a qualified clinical governance lead. The final process must respect patient confidentiality and the clinician’s right to respond, while prioritising patient safety. Regulatory reporting duties must be assessed with counsel.</p>
<h2>5. Privacy complaints</h2>
<p>Privacy concerns should be reviewed by the person responsible for data protection. The final policy must state how to exercise rights under applicable law and how to complain to the relevant authority if an internal resolution is unsatisfactory.</p>
<h2>6. Emergencies are different</h2>
<p>Do not use the grievance form for an emergency. If you are in immediate danger, contact local emergency services or go to the nearest emergency department. In India, Tele-MANAS on 14416 provides mental health support. This platform does not provide crisis response.</p>
<h2>7. Honest status</h2>
<p>This prototype does not operate a real support desk or grievance process. Any timelines, officer details or escalation routes must be added only when they are genuinely operational. Publishing an unmonitored contact channel would be worse than stating clearly that this is a demo.</p>`,
  },
];

export function getLegalPage(slug: string) {
  return legalPages.find((page) => page.slug === slug);
}
