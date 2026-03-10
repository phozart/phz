/**
 * Single source of truth for all dataset definitions.
 * Every page (datasets, scale, reports, duckdb) references this registry
 * to get columns, status colors, criteria fields, and PG table mappings.
 */

export interface DatasetColumn {
  field: string;
  header: string;
  width: number;
  type?: 'string' | 'number' | 'date' | 'boolean';
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
}

export interface CriteriaField {
  id: string;
  label: string;
  type: 'chip_group' | 'multi_select' | 'single_select' | 'numeric_range';
  dataField: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  numericRangeConfig?: { min: number; max: number; step: number; unit: string; showSlider: boolean };
}

export interface DatasetDefinition {
  id: string;
  name: string;
  description: string;
  /** PG table name (snake_case) */
  sourceTable: string;
  /** PG columns allowed in queries (snake_case) */
  pgColumns: string[];
  /** Grid column definitions (camelCase fields) */
  columns: DatasetColumn[];
  /** Status colors for the status column */
  statusColors: Record<string, { bg: string; color: string; dot: string }>;
  /** Criteria fields for filtering UI */
  criteria: { fields: CriteriaField[] };
}

function opts(values: string[]) {
  return values.map(v => ({ value: v, label: v }));
}

export const DATASETS: Record<string, DatasetDefinition> = {
  sales_orders: {
    id: 'sales_orders',
    name: 'Sales Orders',
    description: 'Sales transactions with products, regions, and financial data',
    sourceTable: 'sales_orders',
    pgColumns: [
      'id', 'date', 'year', 'quarter', 'month', 'product', 'category',
      'region', 'sales_rep', 'quantity', 'unit_price', 'discount',
      'amount', 'profit', 'payment_method', 'status',
      'customer_name', 'customer_email', 'order_priority', 'shipping_method',
      'shipping_cost', 'tax_amount', 'total_amount', 'warehouse',
      'channel', 'currency', 'exchange_rate', 'return_flag',
      'fulfillment_date', 'lead_time_days', 'margin_pct', 'notes',
    ],
    columns: [
      { field: 'id', header: 'ID', width: 70, type: 'number', sortable: true, filterable: true },
      { field: 'date', header: 'Date', width: 110, type: 'date', sortable: true, filterable: true },
      { field: 'product', header: 'Product', width: 110, type: 'string', sortable: true, filterable: true },
      { field: 'category', header: 'Category', width: 110, type: 'string', sortable: true, filterable: true },
      { field: 'region', header: 'Region', width: 130, type: 'string', sortable: true, filterable: true },
      { field: 'salesRep', header: 'Sales Rep', width: 130, type: 'string', sortable: true, filterable: true },
      { field: 'quantity', header: 'Qty', width: 60, type: 'number', sortable: true },
      { field: 'unitPrice', header: 'Unit Price', width: 100, type: 'number', sortable: true },
      { field: 'discount', header: 'Disc %', width: 70, type: 'number', sortable: true },
      { field: 'amount', header: 'Amount', width: 100, type: 'number', sortable: true, filterable: true },
      { field: 'profit', header: 'Profit', width: 90, type: 'number', sortable: true },
      { field: 'paymentMethod', header: 'Payment', width: 120, type: 'string', sortable: true, filterable: true },
      { field: 'status', header: 'Status', width: 100, type: 'string', sortable: true, filterable: true },
      { field: 'customerName', header: 'Customer', width: 140, type: 'string', sortable: true, filterable: true },
      { field: 'customerEmail', header: 'Email', width: 200, type: 'string', sortable: true, filterable: true },
      { field: 'orderPriority', header: 'Priority', width: 90, type: 'string', sortable: true, filterable: true },
      { field: 'shippingMethod', header: 'Shipping', width: 100, type: 'string', sortable: true, filterable: true },
      { field: 'shippingCost', header: 'Ship Cost', width: 90, type: 'number', sortable: true },
      { field: 'taxAmount', header: 'Tax', width: 80, type: 'number', sortable: true },
      { field: 'totalAmount', header: 'Total', width: 100, type: 'number', sortable: true, filterable: true },
      { field: 'warehouse', header: 'Warehouse', width: 110, type: 'string', sortable: true, filterable: true },
      { field: 'channel', header: 'Channel', width: 90, type: 'string', sortable: true, filterable: true },
      { field: 'currency', header: 'Ccy', width: 50, type: 'string', sortable: true, filterable: true },
      { field: 'exchangeRate', header: 'FX Rate', width: 80, type: 'number', sortable: true },
      { field: 'returnFlag', header: 'Return', width: 70, type: 'boolean', sortable: true },
      { field: 'fulfillmentDate', header: 'Fulfilled', width: 110, type: 'date', sortable: true },
      { field: 'leadTimeDays', header: 'Lead Days', width: 80, type: 'number', sortable: true },
      { field: 'marginPct', header: 'Margin %', width: 80, type: 'number', sortable: true },
      { field: 'notes', header: 'Notes', width: 200, type: 'string', sortable: false },
    ],
    statusColors: {
      completed:  { bg: '#052e16', color: '#4ade80', dot: '#22c55e' },
      processing: { bg: '#172554', color: '#93c5fd', dot: '#3b82f6' },
      shipped:    { bg: '#422006', color: '#fb923c', dot: '#f97316' },
      cancelled:  { bg: '#450a0a', color: '#fca5a5', dot: '#ef4444' },
      refunded:   { bg: '#1e1b4b', color: '#c4b5fd', dot: '#8b5cf6' },
    },
    criteria: {
      fields: [
        { id: 'region', label: 'Region', type: 'chip_group', dataField: 'region',
          options: opts(['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East']) },
        { id: 'category', label: 'Category', type: 'multi_select', dataField: 'category',
          options: opts(['Hardware', 'Peripherals', 'Audio', 'Video', 'Accessories', 'Storage', 'Memory']) },
        { id: 'status', label: 'Status', type: 'single_select', dataField: 'status', placeholder: 'All',
          options: opts(['completed', 'processing', 'shipped', 'cancelled', 'refunded']) },
        { id: 'amount', label: 'Amount', type: 'numeric_range', dataField: 'amount',
          numericRangeConfig: { min: 0, max: 30000, step: 500, unit: '$', showSlider: true } },
        { id: 'channel', label: 'Channel', type: 'chip_group', dataField: 'channel',
          options: opts(['Online', 'In-Store', 'Phone', 'Partner']) },
        { id: 'orderPriority', label: 'Priority', type: 'single_select', dataField: 'orderPriority', placeholder: 'All',
          options: opts(['High', 'Medium', 'Low', 'Critical']) },
        { id: 'warehouse', label: 'Warehouse', type: 'multi_select', dataField: 'warehouse',
          options: opts(['US-East', 'US-West', 'EU-Central', 'EU-West', 'APAC-Tokyo', 'APAC-Sydney']) },
      ],
    },
  },

  employees: {
    id: 'employees',
    name: 'Employee Directory',
    description: 'Employee records with departments, positions, and performance data',
    sourceTable: 'employees',
    pgColumns: [
      'id', 'name', 'email', 'department', 'position', 'salary',
      'rating', 'start_date', 'status', 'location', 'projects', 'is_remote',
    ],
    columns: [
      { field: 'id', header: 'ID', width: 50, type: 'number', sortable: true },
      { field: 'name', header: 'Name', width: 160, sortable: true, filterable: true, editable: true },
      { field: 'email', header: 'Email', width: 220, sortable: true, filterable: true },
      { field: 'department', header: 'Department', width: 120, type: 'string', sortable: true, filterable: true },
      { field: 'position', header: 'Position', width: 100, type: 'string', sortable: true, filterable: true },
      { field: 'salary', header: 'Salary', width: 100, type: 'number', sortable: true, filterable: true },
      { field: 'rating', header: 'Rating', width: 70, type: 'number', sortable: true },
      { field: 'startDate', header: 'Start Date', width: 110, type: 'date', sortable: true },
      { field: 'status', header: 'Status', width: 90, type: 'string', sortable: true, filterable: true },
      { field: 'location', header: 'Location', width: 120, sortable: true, filterable: true },
      { field: 'projects', header: 'Projects', width: 80, type: 'number', sortable: true },
      { field: 'isRemote', header: 'Remote', width: 70, type: 'boolean', sortable: true },
    ],
    statusColors: {
      active:    { bg: '#052e16', color: '#4ade80', dot: '#22c55e' },
      'on-leave': { bg: '#422006', color: '#fb923c', dot: '#f97316' },
      probation: { bg: '#172554', color: '#93c5fd', dot: '#3b82f6' },
      inactive:  { bg: '#450a0a', color: '#fca5a5', dot: '#ef4444' },
    },
    criteria: {
      fields: [
        { id: 'department', label: 'Department', type: 'chip_group', dataField: 'department',
          options: opts(['Engineering', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations', 'Product', 'Design']) },
        { id: 'position', label: 'Position', type: 'multi_select', dataField: 'position',
          options: opts(['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP']) },
        { id: 'status', label: 'Status', type: 'single_select', dataField: 'status', placeholder: 'All',
          options: opts(['active', 'on-leave', 'probation', 'inactive']) },
        { id: 'salary', label: 'Salary Range', type: 'numeric_range', dataField: 'salary',
          numericRangeConfig: { min: 50000, max: 300000, step: 5000, unit: '$', showSlider: true } },
      ],
    },
  },
};

export function getDataset(id: string): DatasetDefinition | undefined {
  return DATASETS[id];
}

export function listDatasets(): DatasetDefinition[] {
  return Object.values(DATASETS);
}
