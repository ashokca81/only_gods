// Dashboard-managed Cash-on-Delivery Terms & Conditions. Safe on client and server.

export interface CodTermsConfig {
  title: string;
  body: string; // plain text; newlines are preserved when shown
}

export const DEFAULT_COD_TERMS: CodTermsConfig = {
  title: 'Cash on Delivery — Terms & Conditions',
  body:
    'By choosing Cash on Delivery you agree to pay the full order amount in cash at the time of delivery.\n\n' +
    '• Please keep the exact amount ready for the delivery agent.\n' +
    '• Your order may be verified by a phone call before it is dispatched.\n' +
    '• Repeated refusal of Cash on Delivery orders may disable this option for your number.',
};

export function mergeCodTerms(value: unknown): CodTermsConfig {
  const v = (value ?? {}) as Partial<CodTermsConfig>;
  return {
    title: typeof v.title === 'string' && v.title.trim() !== '' ? v.title : DEFAULT_COD_TERMS.title,
    body: typeof v.body === 'string' && v.body.trim() !== '' ? v.body : DEFAULT_COD_TERMS.body,
  };
}
