# API reference

Base URL: `/api`

All responses are JSON unless marked SSE or file download. State-changing requests require the `X-CSRF-Token` header; the value comes from the readable `nayacura_csrf` cookie set by `GET /api/auth/csrf`.

Errors use:

```json
{
  "message": "Human-readable message",
  "code": "MACHINE_CODE",
  "details": {}
}
```

Authentication uses the HTTP-only `nayacura_session` cookie. Roles are `PATIENT`, `DOCTOR`, `ADMIN`.

---

## Health and public configuration

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Database and integration status |
| `GET` | `/config/public` | Public | Demo flags, tax rate, support hours |
| `GET` | `/services` | Public | Service categories and services; optional `?category=` |
| `GET` | `/services/:slug` | Public | Service summary |
| `GET` | `/plans` | Public | Consultation plans and tax note |
| `GET` | `/articles` | Public | Published articles; `?category=&search=&limit=` |
| `GET` | `/articles/:slug` | Public | Article and related articles |

---

## Authentication

| Method | Path | Access | Body / notes |
| --- | --- | --- | --- |
| `GET` | `/auth/csrf` | Public | Issues CSRF cookie |
| `POST` | `/auth/register` | Public | `name,email,password,ageConfirmed=true,consent=true`; auto-creates patient and session |
| `POST` | `/auth/login` | Public | `email,password,role?`; role mismatch returns 403 |
| `POST` | `/auth/logout` | Auth | Revokes current session |
| `GET` | `/auth/me` | Public | `{user:null}` or safe user payload |
| `POST` | `/auth/forgot-password` | Public | `email`; generic response |
| `POST` | `/auth/reset-password` | Public | `token,password`; revokes sessions |
| `POST` | `/auth/verify-email` | Public | `token` |
| `POST` | `/auth/resend-verification` | Auth | Resends verification |
| `GET` | `/auth/sessions` | Auth | Active sessions |
| `DELETE` | `/auth/sessions/:id` | Auth | Revoke own session |
| `POST` | `/auth/logout-all` | Auth | Revoke other sessions |
| `POST` | `/auth/account-deletion` | Patient | `reason?,confirmation=true`; logs request and signs out |

Rate limits: 12 auth attempts per 15 minutes; demo skips limits in the test environment.

Demo registration returns `demoVerificationLink` only when `DEMO_MODE=true` and SMTP is not configured. In production, configure SMTP and remove/ignore this demo convenience.

---

## Doctors and availability

| Method | Path | Access | Query/notes |
| --- | --- | --- | --- |
| `GET` | `/doctors` | Public | `gender, specialization, mode, language, city, minExperience, maxFee (rupees), availability, search, sort, page, limit` |
| `GET` | `/doctors/filters` | Public | Specialisations, languages, cities and fee range |
| `GET` | `/doctors/:slug` | Public | Profile, credentials, reviews (approved only), clinic |
| `GET` | `/doctors/:slug/availability` | Public | `mode=ONLINE|IN_PERSON&days=1..45` |

Only `verified=true`, `status=VERIFIED` profiles appear publicly. Ratings are computed from approved reviews only; none are seeded.

Availability returns UTC ISO `startAt`/`endAt` timestamps. The client renders them in the device timezone. The server revalidates any selected slot at booking time.

---

## Appointments and payment

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/appointments` | Patient | Create a 15-minute hold and payment order |
| `GET` | `/appointments/:id` | Owner / doctor | Appointment details |
| `POST` | `/appointments/:id/payment/order` | Patient owner | Recreate a payment order for a live hold |
| `POST` | `/appointments/:id/payment/verify` | Patient owner | Verify Razorpay signature/amount or demo payment |
| `POST` | `/appointments/:id/cancel` | Owner / doctor | Cancel; records eligible refunds as pending |
| `POST` | `/appointments/:id/reschedule` | Patient owner | Move to a validated new slot |
| `GET` | `/appointments/:id/notes` | Owner / doctor | Decrypted clinical notes after access check |
| `GET` | `/appointments/:id/prescriptions` | Owner / doctor | Decrypted prescription records |
| `POST` | `/appointments/:id/consultation/consent` | Owner / doctor | `teleconsultationConsent=true,recordingConsent=false` |
| `GET` | `/appointments/:id/video-token` | Owner / doctor | Short-lived LiveKit token or demo room info |
| `POST` | `/appointments/:id/review` | Patient owner | Completed consultation only; creates pending review |

### Create appointment body

```json
{
  "doctorSlug": "aanya-rao",
  "mode": "ONLINE",
  "startAt": "2026-11-12T04:30:00.000Z",
  "fullName": "Riya Sharma",
  "email": "patient@nayacura.demo",
  "phone": "+91 90000 00000",
  "ageConfirmed": true,
  "reason": "Optional short note",
  "communicationPreference": "EMAIL",
  "consent": true
}
```

Conflict protection: an overlapping active appointment returns `409 CONFLICT`. Stale payment holds are cancelled when a new booking attempt begins. The PostgreSQL migration adds a partial unique index for active appointments.

### Payment verification

Demo:

```json
{ "demo": true }
```

Razorpay:

```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

The API verifies the HMAC signature and fetches the payment from Razorpay to confirm order, amount and captured/authorized status. It never accepts a client-reported amount.

---

## Patient dashboard

All routes require `PATIENT`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/patient/overview` | Next appointments, history, notifications, counts, recent documents/payments |
| `GET` | `/patient/appointments` | `?filter=upcoming|past|all` |
| `GET` | `/patient/documents` | Own document metadata |
| `POST` | `/patient/documents` | Raw file upload (PDF/JPEG/PNG, ≤5 MB) |
| `GET` | `/patient/documents/:id/download` | Authenticated download |
| `DELETE` | `/patient/documents/:id` | Remove a self-uploaded document |
| `GET` | `/patient/prescriptions` | Decrypted prescription records |
| `GET` | `/patient/payments` | Payment and refund status |
| `GET` | `/patient/profile` | Profile and preferences |
| `PATCH` | `/patient/profile` | Name, phone, language, communication, marketing, AI preference |
| `GET` | `/patient/notifications` | Notifications |
| `PATCH` | `/patient/notifications/:id/read` | Mark one read |
| `POST` | `/patient/notifications/read-all` | Mark all read |

Document upload headers:

```text
Content-Type: application/pdf | image/jpeg | image/png
X-File-Name: <URI-encoded file name>
X-File-Category: REPORT | PRESCRIPTION | REFERRAL | OTHER
X-Appointment-Id: <optional appointment ID>
```

---

## Clinician dashboard

All routes require a `DOCTOR` session whose profile is `verified=true` and `status=VERIFIED`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/doctor/overview` | Today, upcoming, payment-pending requests, stats and notifications |
| `GET` | `/doctor/appointments` | `?filter=today|upcoming|requests|all` |
| `PATCH` | `/doctor/appointments/:id/status` | Allowed status transitions; doctor-owned only |
| `POST` | `/doctor/appointments/:id/cancel` | Clinician cancellation; pending refund recorded |
| `GET` | `/doctor/availability` | Weekly windows |
| `PUT` | `/doctor/availability` | Replace windows; 30-minute slots |
| `GET` | `/doctor/profile` | Professional profile and credentials |
| `PATCH` | `/doctor/profile` | Bio, approach, fees, languages, modes |
| `GET` | `/doctor/earnings` | Gross demo earnings and transactions |
| `POST` | `/doctor/appointments/:id/notes` | Encrypted clinical note |
| `POST` | `/doctor/appointments/:id/prescriptions` | Encrypted prescription record |
| `GET` | `/doctor/appointments/:id/clinical` | Notes and prescriptions for own appointment |

Clinical notes are allowed for confirmed, active or completed appointments. Prescriptions are allowed only during/after an active consultation. This is a demo; real prescribing requires registration, assessment and legal compliance.

---

## Administrator

All routes require `ADMIN`. Administrators cannot fetch clinical note content or AI conversation content.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/admin/overview` | Counts, revenue, queues, permission summary |
| `GET` | `/admin/doctors` | Clinician list for credential workflow |
| `POST` | `/admin/doctors/:id/verify` | `verified,status,note`; updates credentials and notifies |
| `GET` | `/admin/users` | Account list without clinical content |
| `GET` | `/admin/appointments` | Minimal operational metadata |
| `GET` | `/admin/payments` | Payments and refunds; no card data |
| `POST` | `/admin/payments/:id/refund` | Record a pending refund; no gateway call |
| `GET` | `/admin/tickets` | Support tickets |
| `PATCH` | `/admin/tickets/:id` | Status/priority |
| `POST` | `/admin/tickets/:id/reply` | Support reply |
| `GET` | `/admin/reviews` | Moderation queue |
| `PATCH` | `/admin/reviews/:id` | Approve/reject |
| `GET` | `/admin/services` | Service catalogue |
| `PATCH` | `/admin/services/:id` | Active/featured/summary |
| `GET` | `/admin/articles` | All article statuses |
| `PATCH` | `/admin/articles/:id` | Publish/draft/archive, featured |
| `GET` | `/admin/audit` | Recent audit events |
| `GET` | `/admin/settings` | Settings and integration flags |
| `PATCH` | `/admin/settings` | Update platform settings |
| `GET` | `/admin/roles` | Least-privilege matrix |

---

## Naya AI

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/ai/chat` | Public / auth | SSE stream; body `message,language,consent,conversationId?` |
| `GET` | `/ai/conversations` | Auth | Own stored conversations |
| `GET` | `/ai/conversations/:id` | Auth owner | Decrypted messages |
| `DELETE` | `/ai/conversations/:id` | Auth owner | Hard-delete conversation |
| `DELETE` | `/ai/conversations` | Auth owner | Delete all own conversations |

SSE events:

```text
data: {"type":"meta","conversationId":null,"stored":false,"mode":"demo-fallback"}

data: {"type":"token","token":"Anxiety"}

data: {"type":"done","mode":"demo-fallback","language":"en"}
```

Guest messages are never stored. Authenticated storage requires `consent:true`. Emergency messages are intercepted and stored only as part of the audit-free safety path (no conversation content is stored).

---

## Support

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/support/tickets` | Public / auth | Create ticket; returns reference |
| `GET` | `/support/tickets` | Auth | Own tickets |
| `GET` | `/support/tickets/:id` | Owner / admin | Ticket and messages |
| `POST` | `/support/tickets/:id/messages` | Owner / admin | Reply |

Support messages are not for clinical details; the API and UI both warn against including them. The demo has no live support desk.

---

## Status codes

| Code | Meaning |
| --- | --- |
| 200/201/204 | Success |
| 401 | Missing/expired session |
| 403 | Role, ownership, CSRF or consent failure |
| 404 | Not found or deliberately hidden from an unauthorised user |
| 409 | Conflict (double booking, consent required, duplicate review) |
| 422 | Zod validation failure |
| 429 | Rate limited |
| 500/502/503 | Server/provider error; no sensitive details are returned |

For security, cross-account appointment lookups return **404**, not 403, to avoid confirming record existence.
