# Security & privacy

This document describes the security posture of the **development demo**. It is not a certification, an audit report or a substitute for professional security, legal or clinical review.

## Assets

- Account identifiers and contact details
- Sexual-health and relationship consultation reasons
- Clinical notes, prescriptions and uploaded medical documents
- Appointment history and payment records
- AI conversations
- Teleconsultation room access
- Administrator and clinician access
- Session tokens and encryption keys

## Threat model (summary)

| Threat | Example | Current mitigation |
| --- | --- | --- |
| Account takeover | Credential stuffing, weak passwords | bcrypt, rate limits, opaque hashed sessions, password reset controls |
| Cross-site request forgery | Forged booking/cancellation | Double-submit CSRF cookie + header on all mutations |
| Cross-account access | Patient opens another patient’s record | Ownership checks on every protected resource; 404 for foreign records |
| Privilege escalation | Patient calls doctor/admin APIs | Server-side role middleware; verified-doctor requirement; least-privilege admin |
| Clinical data exposure to admins | Admin reads notes | Clinical notes/prescriptions/AI messages not included in admin routes |
| Database theft | Local DB file copied | Field-level AES-256-GCM encryption for notes, prescriptions and AI messages |
| Token theft | Cookie exfiltration | HTTP-only cookie, SameSite=Lax, Secure in production, short session TTL, revocation |
| Double booking | Two patients confirm one time | Transactional conflict check, payment holds, production partial unique index |
| Malicious upload | Script disguised as a report | PDF/JPEG/PNG allowlist, 5 MB limit, magic-byte check, random storage key, no public serving |
| Unauthorised video access | Shared room link | Consent required, short-lived server-generated tokens, room-scoped grants, no public links |
| AI misuse | Diagnosis/prescription request | Identity disclosure, strict system prompt, emergency interception, demo safety fallback |
| XSS | User-provided content rendered as HTML | React escaping; article content is static repository-authored HTML; no user HTML rendering |
| Log leakage | Passwords/clinical text in logs | Structured logger with secret/content redaction; audit logs store no clinical free text |

## Implemented controls

### Authentication and sessions

- bcrypt cost 12.
- 48-byte random session token; only SHA-256 hash stored.
- 7-day default session lifetime, configurable with `SESSION_TTL_DAYS`.
- HTTP-only, SameSite=Lax cookie; `Secure` controlled by `COOKIE_SECURE`.
- Session listing/reveal and revocation.
- Password reset tokens hashed, single-use, 30-minute expiry; resets revoke all sessions.
- Email verification tokens hashed, single-use, 24-hour expiry.
- Login rate limiting (12 per 15 minutes) and generic invalid-credential message.
- Role mismatch rejected at sign-in.

### CSRF

- `nayacura_csrf` non-HTTP-only cookie.
- Required `X-CSRF-Token` for POST/PATCH/PUT/DELETE.
- Timing-safe comparison.
- `SameSite=Lax` session cookie.
- No CORS wildcard when credentials are used.

### Authorisation

- Patient resources filter by the authenticated patient profile.
- Doctor resources require verified professional status and filter by the doctor profile.
- Admin routes exclude clinical note content, prescriptions, document contents and AI conversations.
- Foreign resource lookups return 404 to avoid record-existence disclosure.
- Role and ownership checks are repeated in API routes; UI restrictions are not security boundaries.

### Data protection

- AES-256-GCM with a random 12-byte IV per payload.
- Key derived via scrypt from `DATA_ENCRYPTION_KEY`.
- Payload version prefix supports future migration.
- Clinical notes, prescription medication/instructions and AI message content encrypted at rest.
- AI conversation titles are generic; they do not include the user’s message.
- Medical documents are stored outside the web root with random filenames.
- No card data is stored.
- No recording by default.
- Authenticated responses set `Cache-Control: no-store`; SSE responses set `no-cache, no-transform`. Public directory responses remain cacheable.

### Network and headers

- Helmet security headers.
- HSTS enabled in production.
- CORS allowlist with credentials.
- HTTPS expected at the reverse proxy; `COOKIE_SECURE=true` and `TRUST_PROXY=1` required.
- Body limits: 1 MB JSON, 100 KB form, 5 MB document upload.
- Rate limiting in memory for the single-node demo.

### Audit and operations

- Login, booking, payment, cancellation, reschedule, clinical note, prescription, document, consent, AI deletion, credential, content and refund actions write audit events.
- No clinical free text in audit metadata.
- IP addresses are hashed.
- Structured logs redact common sensitive keys and truncate values.
- Health endpoint reports database status and integration presence, not secret values.

### AI safety

- System prompt bans diagnosis, prescribing, guaranteed outcomes, emergency care and explicit content.
- Emergency keyword interception in English and Tamil.
- Fixed emergency response includes 112 and Tele-MANAS 14416.
- Guests are not stored.
- Auth storage requires explicit consent and is deletable.
- The AI is labelled as AI in the UI and in responses.
- A demo fallback avoids dependence on an unconfigured LLM.

## Known gaps and pre-launch requirements

1. **No independent security audit or penetration test.**
2. **No ISO 27001, SOC 2, HIPAA, GDPR or DPDP certification.** Do not claim one.
3. **No production data-protection impact assessment, records of processing, processor agreements or formal retention schedule.**
4. **No primary-source clinician credential verification or registration check.**
5. **No formal clinical governance, incident response or medical-device assessment.**
6. **No malware scanning for uploaded documents.**
7. **No Redis/distributed rate limiting or shared session cache.**
8. **No whole-database encryption or managed KMS; only field-level encryption.** Key rotation and versioned re-encryption are not implemented.
9. **No automated gateway refund.** Refunds are recorded as pending.
10. **No live support desk, grievance officer or emergency monitoring.**
11. **No background worker for hold expiry or notifications**; expired holds are cleaned on booking attempt.
12. **No independent WCAG audit.**
13. **No audit tamper-evidence / append-only storage.**
14. **No production backup, disaster recovery or key restoration drill.**
15. **No Content Security Policy in the API’s Helmet configuration**; production should serve a carefully tested CSP from the reverse proxy or app.
16. **No account lockout** beyond rate limiting; add risk-based controls if required.
17. **Email and SMS delivery are not guaranteed** unless SMTP is configured; SMS/WhatsApp are preferences only.
18. **Local demo verification/reset links are logged to the API terminal when SMTP is absent.** This is a development convenience and must not be reproduced in production.
19. **Articles are not medically reviewed.** A production editorial workflow with named, credentialed reviewers is required.

## Data subject requests

| Request | Route | Current demo behaviour |
| --- | --- | --- |
| Delete AI history | `/ai` chat header or dashboard privacy | Hard-deletes stored conversations for the authenticated user |
| Account deletion | Dashboard → Privacy → Request deletion | Logs a support ticket and marks `deletionRequestedAt`; does **not** auto-erase clinical/payment/audit records |
| Access/correction | Dashboard records/profile | Shows own data and allows contact/profile correction; no automated export |
| Marketing withdrawal | Profile settings | Stores a revocation consent record |

A production deployment needs identity verification, statutory timelines, an export mechanism, a documented retention matrix and a named grievance officer.

## Incident response outline

1. Contain: revoke sessions, disable affected integrations, rotate secrets.
2. Assess: determine data categories, affected users, legal notification duties and clinical risk.
3. Preserve: secure logs and audit records without copying clinical content.
4. Notify: follow applicable Indian law, contractual duties and regulator guidance after legal review.
5. Recover: restore from verified backups, test, monitor.
6. Review: post-incident report, remediation and control updates.

This outline is not a legal compliance programme.

## Pre-launch security checklist

- [ ] Independent penetration test and threat-model review
- [ ] Legal review of privacy notice, consent, retention and grievance process under applicable Indian law (including DPDP)
- [ ] Clinical governance, registration verification and telemedicine compliance review
- [ ] Production PostgreSQL with encrypted storage, backups and tested restoration
- [ ] KMS-backed encryption keys with rotation and re-encryption plan
- [ ] Managed Redis or equivalent for rate limiting and session/revocation coordination
- [ ] Object storage with malware scanning, signed URLs and lifecycle deletion
- [ ] HTTPS, HSTS, secure cookies, trusted proxy configuration and a tested CSP
- [ ] Least-privilege production IAM, secrets manager and audit export
- [ ] Logging/monitoring with alerting, but no clinical content in logs
- [ ] Data-processing agreements with Razorpay, LiveKit, LLM, email and hosting providers
- [ ] Verified clinician onboarding with primary-source registration checks
- [ ] Medical reviewer workflow for every article
- [ ] Support/grievance staffing and published response times
- [ ] Disaster-recovery and data-deletion drills
- [ ] Accessibility audit with assistive-technology users
- [ ] Remove all demo credentials, demo labels and demo payment/video adapters
