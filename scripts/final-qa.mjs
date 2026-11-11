import { chromium } from 'playwright-core';
import { mkdirSync, copyFileSync } from 'node:fs';

const base = 'http://127.0.0.1:5173';
const out = 'D:\\naya\\qa-artifacts\\final';
const docs = 'D:\\naya\\docs\\screenshots';
mkdirSync(out, { recursive: true });
mkdirSync(docs, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const errors = [];
const overflows = [];

function observe(page) {
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push({ url: page.url(), text: message.text() });
  });
  page.on('pageerror', (error) => errors.push({ url: page.url(), text: error.message }));
}

async function go(page, path, wait = 1100) {
  await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(wait);
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  if (overflow.scrollWidth > overflow.width + 1) overflows.push({ path, ...overflow });
}

async function snap(page, name) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${name}.png` });
}

// Desktop public pages + documentation screenshots
const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const desktop = await desktopContext.newPage();
observe(desktop);
await go(desktop, '/', 1600);
await snap(desktop, 'home-desktop');
copyFileSync(`${out}/home-desktop.png`, `${docs}/home-desktop.png`);

await go(desktop, '/doctors/aanya-rao');
await snap(desktop, 'doctor-profile');
copyFileSync(`${out}/doctor-profile.png`, `${docs}/doctor-profile.png`);

await go(desktop, '/services');
await snap(desktop, 'services');
await go(desktop, '/journal');
await snap(desktop, 'journal');
await go(desktop, '/ai');
await snap(desktop, 'ai');
await go(desktop, '/pricing');
await snap(desktop, 'pricing');
await go(desktop, '/how-it-works');
await snap(desktop, 'how-it-works');
await go(desktop, '/legal/privacy');
await snap(desktop, 'legal');

// Patient authentication and dashboard
const patientContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const patient = await patientContext.newPage();
observe(patient);
await go(patient, '/login');
await patient.fill('#PATIENT-email', 'patient@nayacura.demo');
await patient.fill('#PATIENT-password', 'Nayacura@2026');
await patient.getByRole('button', { name: /sign in securely/i }).click();
await patient.waitForURL('**/dashboard', { timeout: 20_000 });
await patient.waitForTimeout(1200);
await snap(patient, 'patient-dashboard');
copyFileSync(`${out}/patient-dashboard.png`, `${docs}/patient-dashboard.png`);
await go(patient, '/dashboard?section=appointments');
await snap(patient, 'patient-appointments');
await go(patient, '/dashboard?section=privacy');
await snap(patient, 'patient-privacy');

// Complete-payment page and confirmation (also verifies the payment recovery route)
const booking = await patient.evaluate(async () => {
  const csrf = document.cookie
    .split('; ')
    .find((item) => item.startsWith('nayacura_csrf='))
    ?.split('=')[1];
  const availability = await fetch('/api/doctors/arjun-menon/availability?mode=ONLINE&days=21').then((r) => r.json());
  const slot = availability.days[0].slots[0].startAt;
  const response = await fetch('/api/appointments', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': decodeURIComponent(csrf || '') },
    body: JSON.stringify({
      doctorSlug: 'arjun-menon',
      mode: 'ONLINE',
      startAt: slot,
      fullName: 'Riya Sharma',
      email: 'patient@nayacura.demo',
      phone: '+91 90000 00000',
      ageConfirmed: true,
      reason: 'Final QA demo booking (no real clinical details).',
      communicationPreference: 'EMAIL',
      consent: true,
    }),
  }).then((r) => r.json());
  return { id: response.appointment.id, bookingId: response.appointment.bookingId };
});
await go(patient, `/payment/${booking.id}`);
await snap(patient, 'complete-payment');
await patient.getByRole('button', { name: /start secure payment/i }).click();
await patient.waitForTimeout(500);
await patient.getByRole('button', { name: /complete demo payment/i }).click();
await patient.waitForTimeout(1500);
await snap(patient, 'booking-confirmed');
copyFileSync(`${out}/booking-confirmed.png`, `${docs}/booking-confirmed.png`);

// Clinician
const doctorContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const doctor = await doctorContext.newPage();
observe(doctor);
await go(doctor, '/doctor/login');
await doctor.fill('#DOCTOR-email', 'doctor@nayacura.demo');
await doctor.fill('#DOCTOR-password', 'Nayacura@2026');
await doctor.getByRole('button', { name: /sign in securely/i }).click();
await doctor.waitForURL('**/doctor', { timeout: 20_000 });
await doctor.waitForTimeout(1000);
await snap(doctor, 'doctor-dashboard');
copyFileSync(`${out}/doctor-dashboard.png`, `${docs}/doctor-dashboard.png`);
await go(doctor, '/doctor?section=availability');
await snap(doctor, 'doctor-availability');

// Admin
const adminContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const admin = await adminContext.newPage();
observe(admin);
await go(admin, '/admin/login');
await admin.fill('#ADMIN-email', 'admin@nayacura.demo');
await admin.fill('#ADMIN-password', 'Nayacura@2026');
await admin.getByRole('button', { name: /sign in securely/i }).click();
await admin.waitForURL('**/admin', { timeout: 20_000 });
await admin.waitForTimeout(1000);
await snap(admin, 'admin-dashboard');
copyFileSync(`${out}/admin-dashboard.png`, `${docs}/admin-dashboard.png`);
await go(admin, '/admin?section=doctors');
await snap(admin, 'admin-credentials');
await go(admin, '/admin?section=audit');
await snap(admin, 'admin-audit');

// Mobile and reduced motion
const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mobile = await mobileContext.newPage();
observe(mobile);
await go(mobile, '/');
await snap(mobile, 'home-mobile');
await mobile.getByRole('button', { name: /open navigation menu/i }).click();
await mobile.waitForTimeout(500);
await snap(mobile, 'mobile-menu');
await go(mobile, '/services');
await snap(mobile, 'services-mobile');
copyFileSync(`${out}/services-mobile.png`, `${docs}/services-mobile.png`);

const reducedContext = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const reduced = await reducedContext.newPage();
observe(reduced);
await go(reduced, '/', 1200);
const reducedCanvas = await reduced.locator('canvas').count();
const reducedFallback = await reduced.getByText(/still representation of connection/i).count();
await snap(reduced, 'reduced-motion');

// Static SEO assets
const sitemap = await desktopContext.request.get(`${base}/sitemap.xml`);
const robots = await desktopContext.request.get(`${base}/robots.txt`);
const og = await desktopContext.request.get(`${base}/og/nayacura-og.png`);

await desktopContext.close();
await patientContext.close();
await doctorContext.close();
await adminContext.close();
await mobileContext.close();
await reducedContext.close();
await browser.close();

console.log(
  JSON.stringify(
    {
      errors,
      overflows,
      reducedMotion: { canvas: reducedCanvas, fallback: reducedFallback },
      staticAssets: {
        sitemap: sitemap.status(),
        robots: robots.status(),
        ogImage: og.status(),
      },
      booking,
    },
    null,
    2,
  ),
);
