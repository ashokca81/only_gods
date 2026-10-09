/** Format a number as Indian Rupees, e.g. 23000 -> "₹23,000". */
export function formatPrice(n: number): string {
  return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
}
