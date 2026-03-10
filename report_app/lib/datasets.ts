// ── Deterministic data generation for the reporting app ──────────────────────

const PRODUCTS = ['Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Headset', 'Webcam', 'Dock', 'Cable', 'SSD', 'RAM'];
const CATEGORIES = ['Hardware', 'Hardware', 'Peripherals', 'Peripherals', 'Audio', 'Video', 'Accessories', 'Accessories', 'Storage', 'Memory'];
const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
const REPS = ['Alex Chen', 'Sarah Kim', 'James Wilson', 'Maria Garcia', 'David Lee', 'Emma Brown', 'Ryan Patel', 'Lisa Wang', 'Tom Harris', 'Nina Scott',
  'Jake Miller', 'Amy Zhang', 'Chris Davis', 'Rachel Liu', 'Mark Taylor', 'Sophie Martin', 'Ben Thomas', 'Olivia Clark', 'Dan White', 'Kate Johnson'];
const PAYMENT = ['Credit Card', 'Wire Transfer', 'Purchase Order', 'PayPal'];
const ORDER_STATUS = ['completed', 'processing', 'shipped', 'cancelled', 'refunded'];

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations', 'Product', 'Design'];
const POSITIONS = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP'];
const EMP_STATUS = ['active', 'on-leave', 'probation', 'inactive'];
const LOCATIONS = ['New York', 'San Francisco', 'London', 'Berlin', 'Tokyo', 'Sydney', 'Toronto', 'Singapore'];
const FIRST_NAMES = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack',
  'Kate', 'Leo', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rosa', 'Sam', 'Tina',
  'Uma', 'Victor', 'Wendy', 'Xavier', 'Yuki', 'Zara', 'Aaron', 'Beth', 'Carl', 'Diana',
  'Eric', 'Fiona', 'George', 'Holly', 'Ivan', 'Julia', 'Kevin', 'Laura', 'Mike', 'Nina'];
const LAST_NAMES = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Lee', 'Chen', 'Wang', 'Garcia', 'Martinez',
  'Taylor', 'Thomas', 'Harris', 'Clark', 'Lewis', 'Walker', 'Hall', 'Allen', 'Young', 'King',
  'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Hill', 'Campbell', 'Mitchell', 'Roberts',
  'Carter', 'Phillips', 'Evans', 'Turner', 'Torres', 'Parker', 'Collins', 'Edwards', 'Stewart', 'Morris'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function generateSalesData(count: number = 1000) {
  const rng = seededRandom(42);
  const rows = [];
  const startDate = new Date('2023-01-01');

  for (let i = 0; i < count; i++) {
    const daysOffset = Math.floor(rng() * 730); // ~2 years
    const date = new Date(startDate.getTime() + daysOffset * 86400000);
    const productIdx = Math.floor(rng() * PRODUCTS.length);
    const qty = Math.floor(rng() * 20) + 1;
    const basePrice = [1200, 450, 120, 60, 180, 90, 250, 15, 85, 65][productIdx];
    const unitPrice = Math.round(basePrice * (0.8 + rng() * 0.4));
    const discount = rng() < 0.3 ? Math.round(rng() * 20) : 0;
    const amount = Math.round(qty * unitPrice * (1 - discount / 100));
    const costRatio = 0.5 + rng() * 0.25;
    const profit = Math.round(amount * (1 - costRatio));

    rows.push({
      id: i + 1,
      date: date.toISOString().slice(0, 10),
      year: date.getFullYear(),
      quarter: `Q${Math.floor(date.getMonth() / 3) + 1}`,
      month: date.toLocaleString('en', { month: 'short' }),
      product: PRODUCTS[productIdx],
      category: CATEGORIES[productIdx],
      region: REGIONS[Math.floor(rng() * REGIONS.length)],
      salesRep: REPS[Math.floor(rng() * REPS.length)],
      quantity: qty,
      unitPrice,
      discount,
      amount,
      profit,
      paymentMethod: PAYMENT[Math.floor(rng() * PAYMENT.length)],
      status: ORDER_STATUS[rng() < 0.7 ? 0 : Math.floor(rng() * ORDER_STATUS.length)],
    });
  }
  return rows;
}

export function generateEmployeeData(count: number = 200) {
  const rng = seededRandom(99);
  const rows = [];

  for (let i = 0; i < count; i++) {
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const posIdx = Math.min(Math.floor(rng() * 7), 6);
    const baseSalary = [60000, 80000, 110000, 130000, 150000, 180000, 220000][posIdx];
    const salary = Math.round(baseSalary * (0.85 + rng() * 0.3));
    const rating = Math.round((2.5 + rng() * 2.5) * 10) / 10;
    const startYear = 2015 + Math.floor(rng() * 10);
    const startMonth = String(1 + Math.floor(rng() * 12)).padStart(2, '0');
    const startDay = String(1 + Math.floor(rng() * 28)).padStart(2, '0');
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];

    rows.push({
      id: i + 1,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      department: dept,
      position: POSITIONS[posIdx],
      salary,
      rating,
      startDate: `${startYear}-${startMonth}-${startDay}`,
      status: EMP_STATUS[rng() < 0.75 ? 0 : Math.floor(rng() * EMP_STATUS.length)],
      location: LOCATIONS[Math.floor(rng() * LOCATIONS.length)],
      projects: Math.floor(rng() * 15) + 1,
      isRemote: rng() < 0.35,
      manager: i < 8 ? null : FIRST_NAMES[Math.floor(rng() * 8)] + ' ' + LAST_NAMES[Math.floor(rng() * 10)],
    });
  }
  return rows;
}

export const SALES_COLUMNS = [
  { field: 'id', header: 'ID', width: 60, type: 'number' as const, sortable: true, filterable: true },
  { field: 'date', header: 'Date', width: 110, type: 'date' as const, sortable: true, filterable: true },
  { field: 'product', header: 'Product', width: 120, type: 'string' as const, sortable: true, filterable: true },
  { field: 'category', header: 'Category', width: 110, type: 'string' as const, sortable: true, filterable: true },
  { field: 'region', header: 'Region', width: 130, type: 'string' as const, sortable: true, filterable: true },
  { field: 'salesRep', header: 'Sales Rep', width: 140, type: 'string' as const, sortable: true, filterable: true },
  { field: 'quantity', header: 'Qty', width: 60, type: 'number' as const, sortable: true, filterable: true },
  { field: 'unitPrice', header: 'Unit Price', width: 100, type: 'number' as const, sortable: true },
  { field: 'discount', header: 'Disc %', width: 70, type: 'number' as const, sortable: true },
  { field: 'amount', header: 'Amount', width: 100, type: 'number' as const, sortable: true, filterable: true },
  { field: 'profit', header: 'Profit', width: 90, type: 'number' as const, sortable: true },
  { field: 'paymentMethod', header: 'Payment', width: 120, type: 'string' as const, sortable: true, filterable: true },
  { field: 'status', header: 'Status', width: 100, type: 'string' as const, sortable: true, filterable: true },
];

export const EMPLOYEE_COLUMNS = [
  { field: 'id', header: 'ID', width: 50, type: 'number' as const, sortable: true },
  { field: 'name', header: 'Name', width: 160, sortable: true, filterable: true, editable: true },
  { field: 'email', header: 'Email', width: 220, sortable: true, filterable: true },
  { field: 'department', header: 'Department', width: 120, type: 'string' as const, sortable: true, filterable: true },
  { field: 'position', header: 'Position', width: 100, type: 'string' as const, sortable: true, filterable: true },
  { field: 'salary', header: 'Salary', width: 100, type: 'number' as const, sortable: true, filterable: true },
  { field: 'rating', header: 'Rating', width: 70, type: 'number' as const, sortable: true },
  { field: 'startDate', header: 'Start Date', width: 110, type: 'date' as const, sortable: true },
  { field: 'status', header: 'Status', width: 90, type: 'string' as const, sortable: true, filterable: true },
  { field: 'location', header: 'Location', width: 120, sortable: true, filterable: true },
  { field: 'projects', header: 'Projects', width: 80, type: 'number' as const, sortable: true },
  { field: 'isRemote', header: 'Remote', width: 70, type: 'boolean' as const, sortable: true },
];

export const SALES_STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  completed:  { bg: '#052e16', color: '#4ade80', dot: '#22c55e' },
  processing: { bg: '#172554', color: '#93c5fd', dot: '#3b82f6' },
  shipped:    { bg: '#422006', color: '#fb923c', dot: '#f97316' },
  cancelled:  { bg: '#450a0a', color: '#fca5a5', dot: '#ef4444' },
  refunded:   { bg: '#1e1b4b', color: '#c4b5fd', dot: '#8b5cf6' },
};

export const EMPLOYEE_STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  active:    { bg: '#052e16', color: '#4ade80', dot: '#22c55e' },
  'on-leave': { bg: '#422006', color: '#fb923c', dot: '#f97316' },
  probation: { bg: '#1e1b4b', color: '#818cf8', dot: '#6366f1' },
  inactive:  { bg: '#1c1917', color: '#78716c', dot: '#57534e' },
};

export { REGIONS, DEPARTMENTS };
export const CATEGORIES_LIST = [...new Set(CATEGORIES)];
