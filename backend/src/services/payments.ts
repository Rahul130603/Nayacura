import Razorpay from 'razorpay';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

let client: Razorpay | null = null;

function getClient() {
  if (!env.razorpayConfigured) return null;
  if (!client) {
    client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID as string,
      key_secret: env.RAZORPAY_KEY_SECRET as string,
    });
  }
  return client;
}

export type CreatedOrder = {
  provider: 'RAZORPAY' | 'DEMO';
  providerOrderId: string | null;
  keyId: string | null;
  amountPaise: number;
  mode: 'live' | 'demo';
};

export async function createPaymentOrder(input: {
  amountPaise: number;
  receipt: string;
  bookingId: string;
}): Promise<CreatedOrder> {
  const razorpay = getClient();
  if (!razorpay || env.isDemo) {
    return {
      provider: 'DEMO',
      providerOrderId: null,
      keyId: null,
      amountPaise: input.amountPaise,
      mode: 'demo',
    };
  }

  const order = await razorpay.orders.create({
    amount: input.amountPaise,
    currency: 'INR',
    receipt: input.receipt,
    notes: { bookingId: input.bookingId, service: 'Nayacura consultation' },
  });

  return {
    provider: 'RAZORPAY',
    providerOrderId: order.id,
    keyId: env.RAZORPAY_KEY_ID as string,
    amountPaise: order.amount,
    mode: 'live',
  };
}

export function verifyRazorpaySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  if (!env.RAZORPAY_KEY_SECRET) {
    throw new AppError('Payment verification is not configured.', 503, 'PAYMENT_NOT_CONFIGURED');
  }
  const expected = createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest('hex');
  const left = Buffer.from(expected);
  const right = Buffer.from(input.signature);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function fetchAndValidateRazorpayPayment(input: {
  paymentId: string;
  orderId: string;
  expectedAmountPaise: number;
}) {
  const razorpay = getClient();
  if (!razorpay) {
    throw new AppError('Payment provider is not configured.', 503, 'PAYMENT_NOT_CONFIGURED');
  }
  const payment = await razorpay.payments.fetch(input.paymentId);
  if (payment.order_id !== input.orderId) {
    throw new AppError('Payment order does not match this booking.', 400, 'PAYMENT_MISMATCH');
  }
  if (payment.amount !== input.expectedAmountPaise) {
    throw new AppError('Payment amount does not match this booking.', 400, 'PAYMENT_MISMATCH');
  }
  if (!['captured', 'authorized'].includes(payment.status)) {
    throw new AppError('The payment has not been captured.', 400, 'PAYMENT_NOT_CAPTURED');
  }
  return payment;
}
