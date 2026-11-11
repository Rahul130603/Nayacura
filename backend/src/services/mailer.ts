import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { formatDateTime } from '../utils/dates';

let transporter: Transporter | null = null;

function getTransporter() {
  if (!env.smtpConfigured) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

async function send(to: string, subject: string, text: string, template: string) {
  const transport = getTransporter();
  if (!transport) {
    logger.info('email.skipped_demo', { template, reason: 'SMTP_NOT_CONFIGURED' });
    return { delivered: false as const };
  }
  try {
    await transport.sendMail({ from: env.SMTP_FROM, to, subject, text });
    logger.info('email.sent', { template });
    return { delivered: true as const };
  } catch (error) {
    logger.warn('email.failed', {
      template,
      error: error instanceof Error ? error.message : String(error),
    });
    return { delivered: false as const };
  }
}

/**
 * Transactional notifications deliberately exclude the consultation reason,
 * clinical notes, prescriptions and any AI conversation content.
 */
export async function sendBookingConfirmation(input: {
  to: string;
  bookingId: string;
  doctorName: string;
  startAt: Date;
  timezone: string;
  mode: string;
}) {
  const when = formatDateTime(input.startAt.toISOString(), input.timezone);
  const modeLabel = input.mode === 'ONLINE' ? 'Secure video consultation' : 'In-person consultation';
  return send(
    input.to,
    `Nayacura booking confirmed — ${input.bookingId}`,
    `Your Nayacura appointment is confirmed.\n\nBooking reference: ${input.bookingId}\nClinician: ${input.doctorName}\nWhen: ${when} (${input.timezone})\nFormat: ${modeLabel}\n\nTo view joining instructions or manage this booking, sign in to your private dashboard.\n\nThis message does not include clinical details. If you did not make this booking, contact support.\n\nNayacura is a development demo. This email may not have been sent if SMTP is not configured.`,
    'booking_confirmation',
  );
}

export async function sendBookingCancellation(input: {
  to: string;
  bookingId: string;
  doctorName: string;
  startAt: Date;
  timezone: string;
}) {
  return send(
    input.to,
    `Nayacura booking cancelled — ${input.bookingId}`,
    `Your appointment with ${input.doctorName} on ${formatDateTime(
      input.startAt.toISOString(),
      input.timezone,
    )} has been cancelled.\n\nBooking reference: ${input.bookingId}\n\nRefund eligibility depends on the disclosed cancellation terms. You can review the demo policy in your dashboard.\n\nNo clinical details are included in this message.`,
    'booking_cancellation',
  );
}

export async function sendPasswordReset(to: string, resetUrl: string) {
  return send(
    to,
    'Reset your Nayacura password',
    `A password reset was requested for this email address.\n\nOpen this link within 30 minutes:\n${resetUrl}\n\nIf you did not request this, you can ignore the message. The link expires automatically.`,
    'password_reset',
  );
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  return send(
    to,
    'Verify your Nayacura email',
    `Welcome to Nayacura.\n\nPlease verify your email address within 24 hours:\n${verifyUrl}\n\nIf you did not create an account, you can ignore this message.`,
    'email_verification',
  );
}

export async function sendSupportAcknowledgement(input: {
  to: string;
  reference: string;
}) {
  return send(
    input.to,
    `Nayacura support request received — ${input.reference}`,
    `We have received your support request.\n\nReference: ${input.reference}\n\nPlease do not send clinical details or identity documents by email. This is a development demo; no live support desk operates.\n\nIf this is an emergency, contact local emergency services immediately.`,
    'support_acknowledgement',
  );
}
