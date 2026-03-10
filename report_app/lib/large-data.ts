// ── Large dataset generation for scale testing ──────────────────────────────

const PRODUCTS = ['Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Headset', 'Webcam', 'Dock', 'Cable', 'SSD', 'RAM'];
const CATEGORIES = ['Hardware', 'Hardware', 'Peripherals', 'Peripherals', 'Audio', 'Video', 'Accessories', 'Accessories', 'Storage', 'Memory'];
const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
const REPS = ['Alex Chen', 'Sarah Kim', 'James Wilson', 'Maria Garcia', 'David Lee', 'Emma Brown', 'Ryan Patel', 'Lisa Wang', 'Tom Harris', 'Nina Scott'];
const PAYMENT = ['Credit Card', 'Wire Transfer', 'Purchase Order', 'PayPal'];
const STATUS = ['completed', 'processing', 'shipped', 'cancelled', 'refunded'];
const BASE_PRICES = [1200, 450, 120, 60, 180, 90, 250, 15, 85, 65];

/**
 * Fast seeded RNG — generates rows without creating Date objects or
 * calling toISOString (the main bottleneck in large-scale generation).
 */
export function generateLargeDataset(count: number): any[] {
  let seed = 42;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const rows = new Array(count);

  for (let i = 0; i < count; i++) {
    const productIdx = (rng() * 10) | 0;
    const qty = ((rng() * 20) | 0) + 1;
    const unitPrice = Math.round(BASE_PRICES[productIdx] * (0.8 + rng() * 0.4));
    const discount = rng() < 0.3 ? (rng() * 20) | 0 : 0;
    const amount = Math.round(qty * unitPrice * (1 - discount / 100));
    const profit = Math.round(amount * (0.5 + rng() * 0.25) * (1 - 1));
    const profitActual = Math.round(amount - amount * (0.5 + rng() * 0.25));
    const year = 2023 + ((rng() * 2) | 0);
    const month = ((rng() * 12) | 0) + 1;
    const day = ((rng() * 28) | 0) + 1;

    rows[i] = {
      id: i + 1,
      date: `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`,
      year,
      quarter: `Q${((month - 1) / 3 | 0) + 1}`,
      product: PRODUCTS[productIdx],
      category: CATEGORIES[productIdx],
      region: REGIONS[(rng() * 5) | 0],
      salesRep: REPS[(rng() * 10) | 0],
      quantity: qty,
      unitPrice,
      discount,
      amount,
      profit: profitActual,
      paymentMethod: PAYMENT[(rng() * 4) | 0],
      status: rng() < 0.7 ? 'completed' : STATUS[(rng() * 5) | 0],
    };
  }

  return rows;
}

export const LARGE_DATA_COLUMNS = [
  { field: 'id', header: 'ID', width: 80, type: 'number' as const, sortable: true, filterable: true },
  { field: 'date', header: 'Date', width: 110, type: 'date' as const, sortable: true },
  { field: 'product', header: 'Product', width: 110, type: 'string' as const, sortable: true, filterable: true },
  { field: 'category', header: 'Category', width: 110, type: 'string' as const, sortable: true, filterable: true },
  { field: 'region', header: 'Region', width: 130, type: 'string' as const, sortable: true, filterable: true },
  { field: 'salesRep', header: 'Sales Rep', width: 120, type: 'string' as const, sortable: true, filterable: true },
  { field: 'quantity', header: 'Qty', width: 60, type: 'number' as const, sortable: true },
  { field: 'unitPrice', header: 'Unit Price', width: 100, type: 'number' as const, sortable: true },
  { field: 'discount', header: 'Disc %', width: 70, type: 'number' as const, sortable: true },
  { field: 'amount', header: 'Amount', width: 100, type: 'number' as const, sortable: true, filterable: true },
  { field: 'profit', header: 'Profit', width: 90, type: 'number' as const, sortable: true },
  { field: 'paymentMethod', header: 'Payment', width: 120, type: 'string' as const, sortable: true, filterable: true },
  { field: 'status', header: 'Status', width: 100, type: 'string' as const, sortable: true, filterable: true },
];

export const SCALE_STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  completed:  { bg: '#052e16', color: '#4ade80', dot: '#22c55e' },
  processing: { bg: '#172554', color: '#93c5fd', dot: '#3b82f6' },
  shipped:    { bg: '#422006', color: '#fb923c', dot: '#f97316' },
  cancelled:  { bg: '#450a0a', color: '#fca5a5', dot: '#ef4444' },
  refunded:   { bg: '#1e1b4b', color: '#c4b5fd', dot: '#8b5cf6' },
};
