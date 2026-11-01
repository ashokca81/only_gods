// Price builder: the customer sees ONE price = (product price + shipping) + GST.
// Shipping and GST are never shown separately on the storefront.

export function customerPrice(base: number, shipping: number, gstRate: number): number {
  const b = Math.max(0, Number(base) || 0);
  const s = Math.max(0, Number(shipping) || 0);
  const r = Math.max(0, Number(gstRate) || 0);
  return Math.round((b + s) * (1 + r / 100));
}
