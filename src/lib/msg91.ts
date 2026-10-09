/** Send an OTP SMS via MSG91 Flow API. Returns {sent:false} when not configured (test mode). */
export async function sendOtpSms(phone: string, code: string): Promise<{ sent: boolean; reason?: string }> {
  const authkey = process.env.MSG91_AUTH_KEY;
  const template_id = process.env.MSG91_TEMPLATE_ID;
  const sender = process.env.MSG91_SENDER_ID;
  if (!authkey || !template_id) return { sent: false, reason: 'not_configured' };

  // 10-digit Indian number -> prefix country code 91 if needed.
  const digits = phone.replace(/\D/g, '');
  const mobiles = digits.length === 10 ? `91${digits}` : digits;

  // Flow API (same proven path as Thantra/bookmyseva). The DLT template variable name
  // can differ (##var## vs ##OTP##), so send the code under both keys — MSG91 ignores
  // any key the template doesn't use. MSG91_FLOW_OTP_KEY lets us pin the exact name.
  const otpKey = process.env.MSG91_FLOW_OTP_KEY || 'OTP';
  const payload: Record<string, string> = {
    template_id,
    sender: sender ?? '',
    short_url: '0',
    mobiles,
    var: code,
  };
  payload[otpKey] = code;

  try {
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: { authkey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await res.json().catch(() => ({}));
    const sent = res.ok && j?.type !== 'error';
    console.log('[MSG91] mobiles=%s status=%s resp=%s', mobiles, res.status, JSON.stringify(j));
    return { sent, reason: sent ? undefined : (j?.message || `http_${res.status}`) };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : 'send failed' };
  }
}
