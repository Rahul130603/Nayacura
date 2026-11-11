# Deployment

> **Read this first:** the Nayacura repository is a development demo. Deploying the code does not make it a compliant clinical service. Real deployment requires clinical governance, credential verification, legal review, security testing, operational staffing and production-grade infrastructure.

## Recommended production topology

```text
Internet
  │ HTTPS / WSS
  ▼
Reverse proxy / WAF / CDN
  ├── static assets (built SPA)
  ├── /api ─────────────── Node.js API (2+ instances)
  └── WebSocket ────────── LiveKit (managed, or self-hosted with TURN)
                                 │
                    ┌────────────┼─────────────┐
                    ▼            ▼             ▼
              PostgreSQL     Redis/shared    Object storage
              (encrypted)    rate limits     (encrypted + scanning)
                                 │
                    Razorpay · LLM · SMTP · observability
```

The included Express production mode serves `frontend/dist` itself. That is adequate for a single instance or a simple demo deployment. At scale, serve static files from a CDN or reverse proxy.

## 1. Prerequisites

- Managed PostgreSQL 15+
- Managed Redis or an equivalent shared limiter/session cache for multi-instance deployment
- Object storage for documents (the demo stores files on local disk)
- SMTP provider
- Razorpay account and KYC (only if taking real payments)
- LiveKit project (only if real video is required)
- LLM provider with a data-processing agreement appropriate to sensitive data
- TLS certificate and a reverse proxy
- Secrets manager
- Backups and monitoring

## 2. Environment

Create `backend/.env` from `.env.example`. Set at minimum:

```env
NODE_ENV=production
PORT=4000
APP_URL=https://app.example.com
CORS_ORIGIN=https://app.example.com
DATABASE_URL=postgresql://user:password@host:5432/nayacura?schema=public&sslmode=require
SESSION_TTL_DAYS=7
DEMO_MODE=false
DATA_ENCRYPTION_KEY=<long-random-secret-from-a-secrets-manager>
TAX_PERCENT=18
COOKIE_SECURE=true
TRUST_PROXY=1
UPLOAD_DIR=/var/lib/nayacura/uploads
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LLM_API_KEY=...
LLM_BASE_URL=https://...
LLM_MODEL=...
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="Nayacura <care@example.com>"
```

Do not place any of these values in frontend code or commit them. `DATA_ENCRYPTION_KEY` must be backed up securely; losing it makes encrypted clinical data unreadable.

## 3. Database

Follow [`MIGRATIONS.md`](MIGRATIONS.md) to switch to PostgreSQL. In summary:

```bash
cp backend/prisma/schema.postgresql.prisma backend/prisma/schema.prisma
rm -rf backend/prisma/migrations
cp -R backend/prisma/postgresql/migrations backend/prisma/migrations
cd backend
npx prisma generate
npx prisma migrate deploy
```

Do **not** run `npm run db:seed` against production: it deletes all data.

## 4. Build

From the repository root:

```bash
npm ci
npm run build
npm test
```

`npm run build` compiles the Express API and creates `frontend/dist`.

## 5. Run

```bash
NODE_ENV=production npm start
```

The API listens on `PORT` (default 4000). When `frontend/dist` exists, Express serves it and applies an SPA fallback for non-API routes.

Use a process manager (systemd, PM2, a container orchestrator). Run at least two API instances for availability once rate limiting and the session cache are moved to Redis.

## 6. Reverse proxy configuration

Example Nginx excerpt (review and adapt):

```nginx
server {
  listen 443 ssl http2;
  server_name app.example.com;

  ssl_certificate     /etc/letsencrypt/live/app.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

  location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 120s;
  }

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Set `COOKIE_SECURE=true` and `TRUST_PROXY=1`. Ensure the proxy passes WebSocket upgrades if you proxy LiveKit through the same domain; managed LiveKit is usually simpler.

## 7. Health and observability

- Liveness/readiness: `GET /api/health` (checks the database).
- Collect structured JSON logs; do not log request bodies.
- Alert on 5xx rate, database latency, auth failure spikes, email failures, payment verification failures and credential-queue age.
- Do not send clinical content or tokens to a third-party analytics service.
- Enable audit log export to append-only storage with access controls.

## 8. Backups and recovery

- Automated encrypted PostgreSQL backups with point-in-time recovery.
- Documented restore drills.
- Object-storage versioning and lifecycle rules.
- Secure offline backup of the encryption key.
- Retention aligned with legal advice and clinical-record duties.
- Deletion workflows that cover database rows, object storage, AI conversations and backups.

## 9. Integrations go-live checklist

### Razorpay

- [ ] KYC and merchant account approved
- [ ] `DEMO_MODE=false`
- [ ] Live keys stored server-side only
- [ ] Webhook/reconciliation strategy reviewed
- [ ] Signature and amount verification tested in staging
- [ ] Refund process defined (the demo only records pending refunds)
- [ ] Tax treatment reviewed by an adviser

### LiveKit

- [ ] Project configured and tokens tested
- [ ] Room limits, TURN and regional latency tested
- [ ] Consent screen and no-recording boundary verified
- [ ] Access logs and retention validated
- [ ] Emergency escalation path independent of the video room

### LLM

- [ ] Provider contract permits sensitive health data
- [ ] Data retention/training opt-out verified
- [ ] System prompt and safety evaluation completed
- [ ] Abuse monitoring and human escalation defined
- [ ] Tamil/English quality reviewed by native speakers and clinicians
- [ ] Clear AI identity and non-diagnostic boundary tested
- [ ] No API key in browser bundles

### SMTP

- [ ] SPF, DKIM and DMARC configured
- [ ] Templates contain no clinical details
- [ ] Bounce/complaint handling configured
- [ ] Unsubscribe process for marketing consent

## 10. Go-live gates

Do not accept real patients or payments until:

1. Legal counsel has reviewed the legal drafts, consent flows, retention and telemedicine model.
2. Qualified clinicians and a clinical governance lead have approved content and care pathways.
3. Every clinician’s registration and identity are verified at source.
4. An independent security test and privacy impact assessment are complete.
5. Production infrastructure, backups, monitoring, incident response and support staffing are operational.
6. Payment and tax compliance are confirmed by advisers.
7. Accessibility has been tested with assistive-technology users.
8. A grievance officer and statutory response process are in place.
9. Demo credentials, demo labels, demo payment/video adapters and demo data are removed from production.
10. A rollback and data-deletion plan is tested.

## 11. Rollback

- Deploy immutable application versions.
- Keep database migrations backward-compatible where possible.
- Restore from a verified backup for destructive schema failures.
- Never rotate `DATA_ENCRYPTION_KEY` without a controlled re-encryption plan.
- Revoke sessions and provider keys if compromise is suspected.
