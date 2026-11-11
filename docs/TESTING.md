# Testing

## Automated API tests

```bash
npm test
```

The command first reseeds the local SQLite database, then runs Vitest + Supertest against the real Express application factory.

Current suite: **12 tests**

- Health check and database availability
- Anonymous `/auth/me` returns no user
- Role mismatch rejected at login
- Verified doctors listed; pending profile excluded
- Gender filter correctness
- Double-booking conflict
- Demo payment verification
- Appointment cancellation
- Cross-patient appointment isolation
- Patient/doctor/admin route isolation
- Admin appointment metadata restricted from clinical content
- English emergency escalation in Naya AI
- Tamil AI fallback
- Consent-gated AI conversation storage, read and deletion
- Support ticket creation
- Access-controlled document upload, download and deletion
- CSRF rejection on state-changing requests

Configuration lives in `backend/vitest.config.ts`; environment overrides are set in `backend/tests/setup-env.ts`. Rate limiting is skipped when `NODE_ENV=test`.

> The test command is destructive to the local demo database because it reseeds. Never point it at a production database.

## Type checking and builds

```bash
npm run typecheck
npm run build
```

The frontend build must complete with no TypeScript errors; the API build emits to `backend/dist`.

## Browser QA

A Playwright Core utility is included at `scripts/qa-visual.mjs`. It uses the installed Chrome executable and is not part of `npm test`. A shorter final-pass utility that also captures documentation screenshots is at `scripts/final-qa.mjs`.

```bash
node scripts/qa-visual.mjs
```

It checks:

- Home hero and WebGL canvas presence
- Console errors
- Horizontal overflow at desktop and mobile widths
- Public page rendering
- Login and six-step booking with demo payment
- AI streaming
- Patient, doctor and admin dashboards
- Doctor availability editor
- Admin credential and audit screens
- Screenshots saved to `qa-artifacts/`

The script assumes:

- Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`
- Frontend at `http://127.0.0.1:5173`
- API running at port 4000
- Seeded demo data

Adjust the executable path and base URL for another machine.

## Manual QA checklist

### Public experience

- [ ] Home hero animates smoothly; reduced-motion setting shows the fallback.
- [ ] Mega menu is keyboard operable; Escape closes it.
- [ ] Doctor filters, search, reset and no-result state work.
- [ ] Doctor availability calendar changes mode without horizontal overflow.
- [ ] Service search and category tabs are responsive.
- [ ] Journal search, category filter, article TOC and reading progress work.
- [ ] Legal pages show the draft warning.
- [ ] 404 page renders.
- [ ] Every page has a unique title and description.

### Authentication

- [ ] Patient, doctor and admin logins all route correctly.
- [ ] Signing in with the wrong portal is rejected.
- [ ] Password reset link works with SMTP configured; local link appears in API terminal otherwise.
- [ ] Email verification marks the account verified.
- [ ] Logout revokes the session.
- [ ] Other sessions can be revoked.
- [ ] Account deletion request signs the user out and logs a reference.

### Booking

- [ ] Selected specialist and format persist across steps.
- [ ] Timezone display is sensible.
- [ ] Double booking is rejected with no payment.
- [ ] Form validation catches missing age/consent/phone.
- [ ] Demo payment is clearly labelled.
- [ ] Confirmation contains booking ID, doctor, time and instructions.
- [ ] Cancellation and reschedule update the dashboard.
- [ ] Follow-up messaging does not imply unlimited care.

### Dashboards

- [ ] Patient sees only their own appointments, records, payments and documents.
- [ ] Document upload rejects wrong type/size and accepts valid PDF/JPEG/PNG.
- [ ] Doctor cannot access another doctor’s appointment.
- [ ] Doctor status transitions respect allowed transitions.
- [ ] Clinical notes/prescriptions encrypt and render after ownership checks.
- [ ] Admin can see counts and verification workflow but not clinical-note content.
- [ ] Admin refund is recorded as pending, not falsely marked as processed.
- [ ] Support replies are visible to the correct user.

### AI

- [ ] The AI label and “not a doctor” boundary are visible.
- [ ] Guest chats are not stored.
- [ ] Consent checkbox enables storage.
- [ ] History loads and can be deleted.
- [ ] Emergency messages show 112 / Tele-MANAS 14416 and do not store conversation content.
- [ ] Tamil responses render correctly.
- [ ] AI API errors degrade to a safe message.

### Accessibility and responsiveness

- [ ] Keyboard-only navigation reaches all interactive controls.
- [ ] Focus states are visible.
- [ ] Forms have labels and error associations.
- [ ] No horizontal overflow at 320, 390, 768, 1024, 1440 and 1920.
- [ ] Reduced-motion mode disables 3D and smooth scrolling.
- [ ] Dialog focus is trapped and restored.
- [ ] Mobile booking works without hover.
- [ ] Mobile dashboards open via the menu.

## Known test limitations

- No full end-to-end test runner in CI; the Playwright script is a local utility.
- No coverage threshold.
- No external integration tests against live Razorpay/LiveKit/LLM/SMTP.
- No load, concurrency or penetration testing.
- AI safety keyword coverage is not a clinical evaluation.
- Browser QA uses Chrome only; Safari/Firefox need manual testing.
- Screen-reader testing with real assistive technology remains outstanding.
