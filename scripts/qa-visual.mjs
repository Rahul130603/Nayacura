import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const base = 'http://127.0.0.1:5173';
const out = 'D:\\naya\\qa-artifacts';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu-sandbox'],
});

const errors = [];
const results = [];

async function audit(page, label) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      width: doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      overflow: doc.scrollWidth > doc.clientWidth + 1,
    };
  });
  results.push({ label, url: page.url(), ...overflow });
  if (overflow.overflow) {
    console.warn(`HORIZONTAL OVERFLOW ${label}: ${overflow.scrollWidth} > ${overflow.width}`);
  }
}

async function screenshot(page, name) {
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: false });
}

async function newPage(viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push({ where: page.url(), text: message.text() });
  });
  page.on('pageerror', (error) => errors.push({ where: page.url(), text: error.message }));
  return { context, page };
}

const desktop = await newPage();
await desktop.page.goto(`${base}/`, { waitUntil: 'networkidle' });
await audit(desktop.page, 'home-desktop');
await screenshot(desktop.page, '01-home-desktop');

await desktop.page.locator('h1').first().waitFor();
const heroCanvas = await desktop.page.locator('canvas').count();
console.log('Hero canvas count:', heroCanvas);

for (const [name, path] of [
  ['about', '/about'],
  ['services', '/services'],
  ['doctors', '/doctors'],
  ['pricing', '/pricing'],
  ['journal', '/journal'],
  ['how', '/how-it-works'],
  ['ai', '/ai'],
]) {
  await desktop.page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  await audit(desktop.page, `${name}-desktop`);
  await screenshot(desktop.page, `02-${name}`);
}

await desktop.page.goto(`${base}/doctors/aanya-rao`, { waitUntil: 'networkidle' });
await audit(desktop.page, 'doctor-profile-desktop');
await screenshot(desktop.page, '03-doctor-profile');

// Patient login and booking journey
const patient = await newPage();
await patient.page.goto(`${base}/login`, { waitUntil: 'networkidle' });
await screenshot(patient.page, '04-login');
await patient.page.fill('#PATIENT-email', 'patient@nayacura.demo');
await patient.page.fill('#PATIENT-password', 'Nayacura@2026');
await patient.page.getByRole('button', { name: /sign in securely/i }).click();
await patient.page.waitForURL('**/dashboard', { timeout: 20000 });
await patient.page.waitForLoadState('networkidle');
await audit(patient.page, 'patient-dashboard');
await screenshot(patient.page, '05-patient-dashboard');

// Booking
await patient.page.goto(`${base}/book?doctor=meera-krishnan&mode=ONLINE`, {
  waitUntil: 'networkidle',
});
await patient.page.getByRole('button', { name: /continue/i }).first().click();
await patient.page.getByRole('button', { name: /continue/i }).first().click();
await patient.page.waitForTimeout(900);
const slotButtons = patient.page.locator('button').filter({ hasText: /^(9|10|11|12|1|2|3|4|5|6|7|8):/ });
const slotCount = await slotButtons.count();
if (slotCount === 0) {
  const anySlot = patient.page.locator('button[aria-pressed]').filter({ hasText: /AM|PM/ });
  await anySlot.first().click();
} else {
  await slotButtons.first().click();
}
await patient.page.getByRole('button', { name: /continue/i }).first().click();
await patient.page.waitForTimeout(500);
await patient.page.fill('#phone', '+91 90000 11111');
await patient.page.locator('input[type="checkbox"]').nth(0).check();
await patient.page.locator('input[type="checkbox"]').nth(1).check();
await screenshot(patient.page, '06-booking-details');
await patient.page.getByRole('button', { name: /hold this slot/i }).click();
await patient.page.waitForTimeout(1500);
await screenshot(patient.page, '07-booking-payment');
const demoButton = patient.page.getByRole('button', { name: /complete demo payment/i });
if (await demoButton.count()) {
  await demoButton.click();
  await patient.page.waitForTimeout(1500);
  await screenshot(patient.page, '08-booking-confirmed');
  const bodyText = await patient.page.locator('body').innerText();
  console.log('BOOKING_CONFIRMED', bodyText.includes('Your appointment is confirmed'));
  const bookingId = bodyText.match(/NYC-[A-Z0-9-]+/)?.[0];
  console.log('BOOKING_ID', bookingId);
} else {
  console.log('Demo payment button not found; provider may be live.');
}

// AI streaming
await patient.page.goto(`${base}/ai`, { waitUntil: 'networkidle' });
await patient.page.fill('#naya-input', 'I feel anxious about intimacy. Where should I start?');
await patient.page.getByRole('button', { name: /send message/i }).click();
await patient.page.waitForTimeout(3500);
const aiText = await patient.page.locator('body').innerText();
console.log('AI_RESPONSE_RECEIVED', aiText.toLowerCase().includes('anxiety') || aiText.toLowerCase().includes('naya'));
await screenshot(patient.page, '09-ai-chat');

// Doctor dashboard
const doctor = await newPage();
await doctor.page.goto(`${base}/doctor/login`, { waitUntil: 'networkidle' });
await doctor.page.fill('#DOCTOR-email', 'doctor@nayacura.demo');
await doctor.page.fill('#DOCTOR-password', 'Nayacura@2026');
await doctor.page.getByRole('button', { name: /sign in securely/i }).click();
await doctor.page.waitForURL('**/doctor', { timeout: 20000 });
await doctor.page.waitForLoadState('networkidle');
await audit(doctor.page, 'doctor-dashboard');
await screenshot(doctor.page, '10-doctor-dashboard');
await doctor.page.goto(`${base}/doctor?section=availability`, { waitUntil: 'networkidle' });
await audit(doctor.page, 'doctor-availability');
await screenshot(doctor.page, '11-doctor-availability');

// Admin dashboard
const admin = await newPage();
await admin.page.goto(`${base}/admin/login`, { waitUntil: 'networkidle' });
await admin.page.fill('#ADMIN-email', 'admin@nayacura.demo');
await admin.page.fill('#ADMIN-password', 'Nayacura@2026');
await admin.page.getByRole('button', { name: /sign in securely/i }).click();
await admin.page.waitForURL('**/admin', { timeout: 20000 });
await admin.page.waitForLoadState('networkidle');
await audit(admin.page, 'admin-dashboard');
await screenshot(admin.page, '12-admin-dashboard');
await admin.page.goto(`${base}/admin?section=doctors`, { waitUntil: 'networkidle' });
await screenshot(admin.page, '13-admin-doctors');
await admin.page.goto(`${base}/admin?section=audit`, { waitUntil: 'networkidle' });
await screenshot(admin.page, '14-admin-audit');

// Mobile
const mobile = await newPage({ width: 390, height: 844 });
for (const [name, path] of [
  ['home', '/'],
  ['doctors', '/doctors'],
  ['services', '/services'],
  ['journal', '/journal'],
  ['about', '/about'],
]) {
  await mobile.page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  await audit(mobile.page, `${name}-mobile`);
  await screenshot(mobile.page, `20-${name}-mobile`);
}

await desktop.context.close();
await patient.context.close();
await doctor.context.close();
await admin.context.close();
await mobile.context.close();
await browser.close();

console.log('\nAUDIT RESULTS');
console.table(results);
console.log('\nCONSOLE ERRORS');
console.log(errors.length ? errors : 'None');
