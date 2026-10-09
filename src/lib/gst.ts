// Store GST config (settings key='store_gst'). Safe for client + server.

export interface GstConfig {
  enabled: boolean;
  gstin: string;
  legal_name: string;
  state: string;       // seller state — place of supply comparison
  default_rate: number; // % used when a product has no rate
}

export const DEFAULT_GST: GstConfig = {
  enabled: false,
  gstin: '',
  legal_name: 'ONLY GODS',
  state: 'Andhra Pradesh',
  default_rate: 5,
};

export function mergeGst(value: unknown): GstConfig {
  const v = (value ?? {}) as Partial<GstConfig>;
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : DEFAULT_GST.enabled,
    gstin: typeof v.gstin === 'string' ? v.gstin : DEFAULT_GST.gstin,
    legal_name: typeof v.legal_name === 'string' && v.legal_name.trim() ? v.legal_name : DEFAULT_GST.legal_name,
    state: typeof v.state === 'string' && v.state.trim() ? v.state : DEFAULT_GST.state,
    default_rate: typeof v.default_rate === 'number' && v.default_rate >= 0 ? v.default_rate : DEFAULT_GST.default_rate,
  };
}

export interface GstLine { taxable: number; tax: number; rate: number }

/** Back-calculate tax from a tax-INCLUSIVE line total. */
export function splitInclusive(lineTotal: number, rate: number): GstLine {
  const r = Number(rate) || 0;
  const taxable = r > 0 ? lineTotal / (1 + r / 100) : lineTotal;
  return { taxable, tax: lineTotal - taxable, rate: r };
}
