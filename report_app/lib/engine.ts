// ── Singleton BI Engine setup ────────────────────────────────────────────────
import {
  createBIEngine,
  dataProductId,
  computeAggregation,
  computeAggregations,
} from '@phozart/phz-engine';
import type { BIEngine, DataProductDef } from '@phozart/phz-engine';

/**
 * Pre-defined data products matching the PostgreSQL datasets
 * seeded in Docker (see report_app/scripts/seed-*.ts).
 */
const SEED_DATA_PRODUCTS: DataProductDef[] = [
  {
    id: dataProductId('sales_orders'),
    name: 'Sales Orders',
    description: 'Transactional sales data with 1M rows',
    owner: 'analytics-team',
    schema: {
      fields: [
        { name: 'id', type: 'number' },
        { name: 'date', type: 'date' },
        { name: 'year', type: 'number' },
        { name: 'quarter', type: 'string' },
        { name: 'month', type: 'string' },
        { name: 'product', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'region', type: 'string' },
        { name: 'salesRep', type: 'string' },
        { name: 'quantity', type: 'number' },
        { name: 'unitPrice', type: 'number' },
        { name: 'discount', type: 'number' },
        { name: 'amount', type: 'number' },
        { name: 'profit', type: 'number' },
        { name: 'paymentMethod', type: 'string' },
        { name: 'status', type: 'string' },
      ],
    },
    tags: ['sales', 'revenue', 'orders'],
  },
  {
    id: dataProductId('employees'),
    name: 'Employees',
    description: 'Employee directory with 200 records',
    owner: 'hr-team',
    schema: {
      fields: [
        { name: 'id', type: 'number' },
        { name: 'firstName', type: 'string' },
        { name: 'lastName', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'department', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'hireDate', type: 'date' },
        { name: 'salary', type: 'number' },
        { name: 'managerId', type: 'number' },
        { name: 'location', type: 'string' },
      ],
    },
    tags: ['hr', 'employees', 'directory'],
  },
];

let _engine: BIEngine | null = null;

export function getEngine(): BIEngine {
  if (!_engine) {
    _engine = createBIEngine({
      enableMetrics: true,
      initialDataProducts: SEED_DATA_PRODUCTS,
    });
  }
  return _engine;
}

export { computeAggregation, computeAggregations };
