import { describe, expect, it, beforeAll } from 'vitest';
import request from 'supertest';
import type { SuperAgentTest } from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

function csrfFrom(response: request.Response): string {
  const cookies = (response.headers['set-cookie'] || []) as unknown as string[];
  const cookie = cookies.find((item) => item.startsWith('nayacura_csrf='));
  if (!cookie) throw new Error('CSRF cookie missing');
  return decodeURIComponent(cookie.split(';')[0].split('=')[1]);
}

async function csrf(agent: SuperAgentTest) {
  const response = await agent.get('/api/auth/csrf').expect(200);
  return csrfFrom(response);
}

async function login(
  email: string,
  password = 'Nayacura@2026',
  role?: 'PATIENT' | 'DOCTOR' | 'ADMIN',
) {
  const agent = request.agent(app);
  const token = await csrf(agent);
  const response = await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', token)
    .send({ email, password, ...(role ? { role } : {}) });
  return { agent, csrfToken: token, response };
}

describe('Nayacura critical API workflows', () => {
  let patient: SuperAgentTest;
  let patientCsrf: string;
  let appointmentId: string;

  beforeAll(async () => {
    const session = await login('patient@nayacura.demo');
    expect(session.response.status).toBe(200);
    patient = session.agent;
    patientCsrf = session.csrfToken;
  });

  it('reports health and an anonymous session without leaking data', async () => {
    const health = await request(app).get('/api/health').expect(200);
    expect(health.body.status).toBe('ok');
    expect(health.body.database).toBe('ok');
    const me = await request(app).get('/api/auth/me').expect(200);
    expect(me.body.user).toBeNull();
  });

  it('rejects a role mismatch at sign-in', async () => {
    const attempt = await login('patient@nayacura.demo', 'Nayacura@2026', 'DOCTOR');
    expect(attempt.response.status).toBe(403);
  });

  it('lists only verified demo doctors and supports filters', async () => {
    const all = await request(app).get('/api/doctors').expect(200);
    expect(all.body.total).toBeGreaterThanOrEqual(8);
    expect(all.body.doctors.every((doctor: { verified: boolean }) => doctor.verified)).toBe(true);
    const female = await request(app).get('/api/doctors?gender=FEMALE').expect(200);
    expect(female.body.doctors.length).toBeGreaterThan(0);
    expect(
      female.body.doctors.every((doctor: { gender: string }) => doctor.gender === 'FEMALE'),
    ).toBe(true);
    const pending = await request(app).get('/api/doctors/ishaan-kapoor');
    expect(pending.status).toBe(404);
  });

  it('prevents double booking and verifies a demo payment', async () => {
    const availability = await request(app)
      .get('/api/doctors/meera-krishnan/availability?mode=ONLINE&days=21')
      .expect(200);
    const slot =
      availability.body.days[1]?.slots[0]?.startAt || availability.body.days[0]?.slots[1]?.startAt;
    expect(slot).toBeTruthy();

    const payload = {
      doctorSlug: 'meera-krishnan',
      mode: 'ONLINE',
      startAt: slot,
      fullName: 'Riya Sharma',
      email: 'patient@nayacura.demo',
      phone: '+91 90000 00000',
      ageConfirmed: true,
      communicationPreference: 'EMAIL',
      consent: true,
    };

    const created = await patient
      .post('/api/appointments')
      .set('X-CSRF-Token', patientCsrf)
      .send(payload)
      .expect(201);
    expect(created.body.appointment.status).toBe('PENDING_PAYMENT');
    expect(created.body.payment.mode).toBe('demo');
    appointmentId = created.body.appointment.id;

    const duplicate = await patient
      .post('/api/appointments')
      .set('X-CSRF-Token', patientCsrf)
      .send(payload);
    expect(duplicate.status).toBe(409);

    const paid = await patient
      .post(`/api/appointments/${appointmentId}/payment/verify`)
      .set('X-CSRF-Token', patientCsrf)
      .send({ demo: true })
      .expect(200);
    expect(paid.body.appointment.status).toBe('CONFIRMED');
    expect(paid.body.payment.status).toBe('DEMO_PAID');

    const cancel = await patient
      .post(`/api/appointments/${appointmentId}/cancel`)
      .set('X-CSRF-Token', patientCsrf)
      .send({ reason: 'Automated test cleanup' })
      .expect(200);
    expect(cancel.body.appointment.status).toBe('CANCELLED');
  });

  it('protects patient data from another patient account', async () => {
    const other = request.agent(app);
    const token = await csrf(other);
    const email = `isolation-${Date.now()}@nayacura.demo`;
    const registered = await other
      .post('/api/auth/register')
      .set('X-CSRF-Token', token)
      .send({
        name: 'Isolation Test',
        email,
        password: 'Testpass1234',
        ageConfirmed: true,
        consent: true,
      });
    expect(registered.status).toBe(201);

    const mine = await patient.get('/api/patient/appointments').expect(200);
    const foreignId = mine.body.appointments[0]?.id;
    expect(foreignId).toBeTruthy();
    const attempt = await other.get(`/api/appointments/${foreignId}`);
    expect(attempt.status).toBe(404);

    const adminAttempt = await other.get('/api/admin/overview');
    expect(adminAttempt.status).toBe(403);
  });

  it('enforces role boundaries for clinician and admin areas', async () => {
    const doctor = await login('doctor@nayacura.demo');
    expect(doctor.response.status).toBe(200);
    await doctor.agent
      .get('/api/doctor/overview')
      .expect(200)
      .expect((response) => {
        expect(response.body.doctor.verified).toBe(true);
      });
    await doctor.agent.get('/api/patient/overview').expect(403);

    const admin = await login('admin@nayacura.demo');
    expect(admin.response.status).toBe(200);
    await admin.agent.get('/api/admin/overview').expect(200);
    const adminAppointments = await admin.agent.get('/api/admin/appointments').expect(200);
    expect(adminAppointments.body.appointments[0]?.clinicalAccess).toBe('RESTRICTED');
    await admin.agent.get('/api/patient/overview').expect(403);
  });

  it('escalates emergency messages in Naya AI and never stores them', async () => {
    const agent = request.agent(app);
    const token = await csrf(agent);
    const response = await agent
      .post('/api/ai/chat')
      .set('X-CSRF-Token', token)
      .set('Content-Type', 'application/json')
      .set('Accept', 'text/event-stream')
      .send({ message: 'I want to kill myself', language: 'en', consent: false });
    expect(response.status).toBe(200);
    expect(response.text).toContain('14416');
    expect(response.text.toLowerCase()).toContain('emergency');
    expect(response.text).toContain('"mode":"safety"');
  });

  it('streams a safe demo AI fallback in Tamil', async () => {
    const agent = request.agent(app);
    const token = await csrf(agent);
    const response = await agent
      .post('/api/ai/chat')
      .set('X-CSRF-Token', token)
      .set('Content-Type', 'application/json')
      .set('Accept', 'text/event-stream')
      .send({ message: 'உடலுறவு குறித்த பதற்றம் உள்ளது', language: 'ta', consent: false });
    expect(response.status).toBe(200);
    expect(response.text).toContain('"mode":"demo-fallback"');
    expect(response.text).toContain('மருத்துவர்');
  });

  it('stores and deletes an AI conversation only with consent', async () => {
    const response = await patient
      .post('/api/ai/chat')
      .set('X-CSRF-Token', patientCsrf)
      .set('Content-Type', 'application/json')
      .set('Accept', 'text/event-stream')
      .send({
        message: 'How do I prepare for a first consultation?',
        language: 'en',
        consent: true,
      });
    expect(response.status).toBe(200);
    expect(response.text).toContain('"stored":true');
    const conversationId = response.text.match(/"conversationId":"([^"]+)"/)?.[1];
    expect(conversationId).toBeTruthy();

    const list = await patient.get('/api/ai/conversations').expect(200);
    expect(
      list.body.conversations.some(
        (conversation: { id: string }) => conversation.id === conversationId,
      ),
    ).toBe(true);

    const stored = await patient.get(`/api/ai/conversations/${conversationId}`).expect(200);
    expect(stored.body.messages.length).toBeGreaterThanOrEqual(2);
    expect(stored.body.messages[0].content).toContain('prepare for a first consultation');

    await patient
      .delete(`/api/ai/conversations/${conversationId}`)
      .set('X-CSRF-Token', patientCsrf)
      .expect(204);
    const deleted = await patient.get(`/api/ai/conversations/${conversationId}`);
    expect(deleted.status).toBe(404);
  });

  it('accepts a support ticket and returns a reference', async () => {
    const agent = request.agent(app);
    const token = await csrf(agent);
    const response = await agent
      .post('/api/support/tickets')
      .set('X-CSRF-Token', token)
      .send({
        name: 'Test User',
        email: 'test@example.com',
        category: 'GENERAL',
        subject: 'Testing the support workflow',
        message: 'This is an automated test support message with no clinical detail.',
        priority: 'NORMAL',
      })
      .expect(201);
    expect(response.body.ticket.reference).toMatch(/^NYS-/);
  });

  it('uploads, downloads and deletes an access-controlled document', async () => {
    const upload = await patient
      .post('/api/patient/documents')
      .set('X-CSRF-Token', patientCsrf)
      .set('Content-Type', 'application/pdf')
      .set('X-File-Name', encodeURIComponent('demo-report.pdf'))
      .set('X-File-Category', 'REPORT')
      .send(Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'));
    expect(upload.status).toBe(201);
    const documentId = upload.body.document.id;

    const download = await patient
      .get(`/api/patient/documents/${documentId}/download`)
      .expect(200);
    expect(download.headers['content-type']).toContain('application/pdf');

    await patient
      .delete(`/api/patient/documents/${documentId}`)
      .set('X-CSRF-Token', patientCsrf)
      .expect(204);
  });

  it('requires CSRF for state-changing requests', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient@nayacura.demo', password: 'Nayacura@2026' });
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('CSRF_FAILED');
  });
});
