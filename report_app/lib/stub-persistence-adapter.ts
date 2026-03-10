/**
 * In-memory PersistenceAdapter for testing the real shell web components.
 * Implements the @phozart/phz-shared PersistenceAdapter interface with
 * demo seed data so the viewer/editor shells have artifacts to display.
 */

// Use the workspace re-export since shared sub-paths may not resolve
// through webpack aliases in all configurations.
type ArtifactPayload<T = unknown> = {
  id: string;
  type: string;
  name: string;
  description?: string;
  data: T;
  version?: number;
  createdAt?: number;
  updatedAt?: number;
};

type SaveResult = {
  id: string;
  version: number;
  savedAt: number;
  success: boolean;
  error?: string;
};

type ArtifactFilter = {
  type?: string;
  search?: string;
  published?: boolean;
  ownerId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
};

type ArtifactListItem = {
  id: string;
  type: string;
  name: string;
  description?: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  ownerId?: string;
  published?: boolean;
};

type ArtifactList = {
  items: ArtifactListItem[];
  totalCount: number;
  hasMore: boolean;
};

type FilterPreset = {
  id: string;
  name: string;
  description?: string;
  artifactId: string;
  values: Record<string, unknown>;
  isDefault?: boolean;
  ownerId?: string;
  createdAt: number;
  updatedAt: number;
};

type PersonalView = {
  id: string;
  userId: string;
  artifactId: string;
  name: string;
  config: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
};

type FieldEnrichment = {
  field: string;
  label?: string;
  description?: string;
  format?: string;
};

export interface PersistenceAdapter {
  save(payload: ArtifactPayload): Promise<SaveResult>;
  load<T = unknown>(id: string): Promise<ArtifactPayload<T> | null>;
  delete(id: string): Promise<{ success: boolean; error?: string }>;
  list(filter?: ArtifactFilter): Promise<ArtifactList>;
  saveFilterPreset(preset: FilterPreset): Promise<SaveResult>;
  listFilterPresets(artifactId: string): Promise<FilterPreset[]>;
  deleteFilterPreset(presetId: string): Promise<{ success: boolean; error?: string }>;
  savePersonalView(view: PersonalView): Promise<SaveResult>;
  loadPersonalView(userId: string, artifactId: string): Promise<PersonalView | null>;
  deletePersonalView(viewId: string): Promise<{ success: boolean; error?: string }>;
  saveFieldEnrichments(sourceId: string, enrichments: FieldEnrichment[]): Promise<SaveResult>;
  loadFieldEnrichments(sourceId: string): Promise<FieldEnrichment[]>;
}

const now = Date.now();

const day = 86400000;

const SEED_ARTIFACTS: ArtifactPayload[] = [
  // Dashboards
  {
    id: 'dashboard-sales-overview',
    type: 'dashboard',
    name: 'Sales Overview',
    description: 'Executive dashboard with KPIs, revenue by region, and order pipeline',
    data: {
      dataSource: 'sales_orders',
      layout: { columns: 3, gap: 16 },
      widgets: [
        { id: 'w1', type: 'kpi', title: 'Total Revenue', measure: 'amount', aggregation: 'sum' },
        { id: 'w2', type: 'kpi', title: 'Total Orders', measure: 'id', aggregation: 'count' },
        { id: 'w3', type: 'kpi', title: 'Avg Order Value', measure: 'amount', aggregation: 'avg' },
        { id: 'w4', type: 'chart', title: 'Revenue by Region', chartType: 'bar', dimension: 'region', measure: 'amount' },
        { id: 'w5', type: 'chart', title: 'Order Status', chartType: 'pie', dimension: 'status', measure: 'id' },
        { id: 'w6', type: 'grid', title: 'Recent Orders', columns: ['id', 'date', 'product', 'amount', 'status'], limit: 20 },
      ],
    },
    version: 2,
    createdAt: now - day * 14,
    updatedAt: now - day * 1,
  },
  {
    id: 'dashboard-hr-analytics',
    type: 'dashboard',
    name: 'HR Analytics',
    description: 'Workforce metrics, department breakdown, and compensation overview',
    data: {
      dataSource: 'employees',
      layout: { columns: 2, gap: 16 },
      widgets: [
        { id: 'w1', type: 'kpi', title: 'Headcount', measure: 'id', aggregation: 'count' },
        { id: 'w2', type: 'kpi', title: 'Avg Salary', measure: 'salary', aggregation: 'avg' },
        { id: 'w3', type: 'chart', title: 'By Department', chartType: 'bar', dimension: 'department', measure: 'id' },
        { id: 'w4', type: 'chart', title: 'By Position', chartType: 'bar', dimension: 'position', measure: 'id' },
        { id: 'w5', type: 'grid', title: 'Team Members', columns: ['name', 'department', 'position', 'salary', 'status'], limit: 15 },
      ],
    },
    version: 1,
    createdAt: now - day * 10,
    updatedAt: now - day * 2,
  },
  {
    id: 'dashboard-product-perf',
    type: 'dashboard',
    name: 'Product Performance',
    description: 'Category analysis with profitability and payment method breakdown',
    data: {
      dataSource: 'sales_orders',
      layout: { columns: 2, gap: 16 },
      widgets: [
        { id: 'w1', type: 'kpi', title: 'Total Profit', measure: 'profit', aggregation: 'sum' },
        { id: 'w2', type: 'kpi', title: 'Avg Discount', measure: 'discount', aggregation: 'avg' },
        { id: 'w3', type: 'chart', title: 'Category Revenue', chartType: 'bar', dimension: 'category', measure: 'amount' },
        { id: 'w4', type: 'chart', title: 'Payment Methods', chartType: 'pie', dimension: 'paymentMethod', measure: 'id' },
      ],
    },
    version: 1,
    createdAt: now - day * 7,
    updatedAt: now - day * 3,
  },
  // Reports
  {
    id: 'report-sales-by-region',
    type: 'report',
    name: 'Sales by Region',
    description: 'Revenue and profit breakdown across geographic regions',
    data: {
      dataSource: 'sales_orders',
      columns: ['region', 'category', 'product', 'amount', 'profit', 'quantity'],
      groupBy: ['region'],
      sortBy: [{ field: 'amount', direction: 'desc' }],
    },
    version: 3,
    createdAt: now - day * 20,
    updatedAt: now - day * 1,
  },
  {
    id: 'report-top-products',
    type: 'report',
    name: 'Top Products',
    description: 'Best-selling products by volume and revenue',
    data: {
      dataSource: 'sales_orders',
      columns: ['product', 'category', 'quantity', 'amount', 'profit', 'status'],
      groupBy: ['product'],
      sortBy: [{ field: 'quantity', direction: 'desc' }],
      filters: [{ field: 'status', operator: 'eq', value: 'completed' }],
    },
    version: 2,
    createdAt: now - day * 15,
    updatedAt: now - day * 4,
  },
  {
    id: 'report-monthly-revenue',
    type: 'report',
    name: 'Monthly Revenue Trend',
    description: 'Revenue trend by month with year-over-year comparison',
    data: {
      dataSource: 'sales_orders',
      columns: ['date', 'year', 'quarter', 'month', 'amount', 'profit', 'quantity'],
      groupBy: ['year', 'month'],
      sortBy: [{ field: 'date', direction: 'asc' }],
    },
    version: 4,
    createdAt: now - day * 30,
    updatedAt: now - day * 2,
  },
  {
    id: 'report-employee-directory',
    type: 'report',
    name: 'Employee Directory',
    description: 'Full employee listing with department, position, and compensation',
    data: {
      dataSource: 'employees',
      columns: ['name', 'email', 'department', 'position', 'salary', 'rating', 'startDate', 'status'],
      sortBy: [{ field: 'name', direction: 'asc' }],
    },
    version: 1,
    createdAt: now - day * 7,
    updatedAt: now - day * 5,
  },
  {
    id: 'report-salary-analysis',
    type: 'report',
    name: 'Salary Analysis',
    description: 'Compensation analysis by department and position level',
    data: {
      dataSource: 'employees',
      columns: ['department', 'position', 'salary', 'rating', 'projects'],
      groupBy: ['department', 'position'],
      sortBy: [{ field: 'salary', direction: 'desc' }],
      filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    },
    version: 2,
    createdAt: now - day * 5,
    updatedAt: now - day * 1,
  },
];

export class InMemoryPersistenceAdapter implements PersistenceAdapter {
  private artifacts = new Map<string, ArtifactPayload>();
  private presets = new Map<string, FilterPreset>();
  private views = new Map<string, PersonalView>();
  private enrichments = new Map<string, FieldEnrichment[]>();

  constructor() {
    for (const a of SEED_ARTIFACTS) {
      this.artifacts.set(a.id, a);
    }
  }

  async save(payload: ArtifactPayload): Promise<SaveResult> {
    const existing = this.artifacts.get(payload.id);
    const version = (existing?.version ?? 0) + 1;
    const savedAt = Date.now();
    this.artifacts.set(payload.id, { ...payload, version, updatedAt: savedAt, createdAt: existing?.createdAt ?? savedAt });
    return { id: payload.id, version, savedAt, success: true };
  }

  async load<T = unknown>(id: string): Promise<ArtifactPayload<T> | null> {
    return (this.artifacts.get(id) as ArtifactPayload<T>) ?? null;
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    this.artifacts.delete(id);
    return { success: true };
  }

  async list(filter?: ArtifactFilter): Promise<ArtifactList> {
    let items = Array.from(this.artifacts.values());
    if (filter?.type) items = items.filter(a => a.type === filter.type);
    if (filter?.search) {
      const s = filter.search.toLowerCase();
      items = items.filter(a => a.name.toLowerCase().includes(s) || a.description?.toLowerCase().includes(s));
    }

    const listItems: ArtifactListItem[] = items.map(a => ({
      id: a.id,
      type: a.type,
      name: a.name,
      description: a.description,
      version: a.version ?? 1,
      createdAt: a.createdAt ?? now,
      updatedAt: a.updatedAt ?? now,
      published: true,
    }));

    const offset = filter?.offset ?? 0;
    const limit = filter?.limit ?? 100;
    const sliced = listItems.slice(offset, offset + limit);

    return { items: sliced, totalCount: listItems.length, hasMore: offset + limit < listItems.length };
  }

  async saveFilterPreset(preset: FilterPreset): Promise<SaveResult> {
    this.presets.set(preset.id, preset);
    return { id: preset.id, version: 1, savedAt: Date.now(), success: true };
  }

  async listFilterPresets(artifactId: string): Promise<FilterPreset[]> {
    return Array.from(this.presets.values()).filter(p => p.artifactId === artifactId);
  }

  async deleteFilterPreset(presetId: string): Promise<{ success: boolean }> {
    this.presets.delete(presetId);
    return { success: true };
  }

  async savePersonalView(view: PersonalView): Promise<SaveResult> {
    this.views.set(`${view.userId}:${view.artifactId}`, view);
    return { id: view.id, version: 1, savedAt: Date.now(), success: true };
  }

  async loadPersonalView(userId: string, artifactId: string): Promise<PersonalView | null> {
    return this.views.get(`${userId}:${artifactId}`) ?? null;
  }

  async deletePersonalView(viewId: string): Promise<{ success: boolean }> {
    for (const [k, v] of this.views) {
      if (v.id === viewId) { this.views.delete(k); break; }
    }
    return { success: true };
  }

  async saveFieldEnrichments(sourceId: string, enrichments: FieldEnrichment[]): Promise<SaveResult> {
    this.enrichments.set(sourceId, enrichments);
    return { id: sourceId, version: 1, savedAt: Date.now(), success: true };
  }

  async loadFieldEnrichments(sourceId: string): Promise<FieldEnrichment[]> {
    return this.enrichments.get(sourceId) ?? [];
  }
}
