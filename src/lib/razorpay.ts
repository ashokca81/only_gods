import Razorpay from 'razorpay';
import crypto from 'crypto';

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export const razorpayKeyId = keyId ?? '';
export const isRazorpayConfigured = Boolean(keyId && keySecret);

export function getRazorpay() {
  if (!keyId || !keySecret) throw new Error('Razorpay not configured');
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/** Verify the checkout signature: HMAC-SHA256(order_id|payment_id, key_secret). */
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!keySecret) return false;
  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ''));
  } catch {
    return false;
  }
}
