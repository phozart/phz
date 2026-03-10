/**
 * In-memory WorkspaceAdapter for testing the real <phz-workspace> component.
 * Implements the required interfaces: EngineStorageAdapter + AsyncDefinitionStore +
 * placement/catalog methods.
 *
 * Seeds with realistic artifacts that reference the real sales_orders and employees
 * datasets from the PostgreSQL backend.
 */

export class InMemoryWorkspaceAdapter {
  private reports = new Map<string, any>();
  private dashboards = new Map<string, any>();
  private kpis = new Map<string, any>();
  private metrics = new Map<string, any>();
  private definitions = new Map<string, any>();
  private placements = new Map<string, any>();
  private artifacts = new Map<string, any>();
  private _initialized = false;

  // --- EngineStorageAdapter ---

  async saveReport(report: any): Promise<void> {
    this.reports.set(report.id, { ...report, updatedAt: Date.now() });
  }
  async loadReports(): Promise<any[]> {
    return Array.from(this.reports.values());
  }
  async deleteReport(id: string): Promise<void> {
    this.reports.delete(id);
  }

  async saveDashboard(dashboard: any): Promise<void> {
    this.dashboards.set(dashboard.id, { ...dashboard, updatedAt: Date.now() });
  }
  async loadDashboards(): Promise<any[]> {
    return Array.from(this.dashboards.values());
  }
  async deleteDashboard(id: string): Promise<void> {
    this.dashboards.delete(id);
  }

  async saveKPI(kpi: any): Promise<void> {
    this.kpis.set(kpi.id, kpi);
  }
  async loadKPIs(): Promise<any[]> {
    return Array.from(this.kpis.values());
  }
  async deleteKPI(id: string): Promise<void> {
    this.kpis.delete(id);
  }

  async saveMetric(metric: any): Promise<void> {
    this.metrics.set(metric.id, metric);
  }
  async loadMetrics(): Promise<any[]> {
    return Array.from(this.metrics.values());
  }
  async deleteMetric(id: string): Promise<void> {
    this.metrics.delete(id);
  }

  // --- AsyncDefinitionStore ---

  async save(def: any): Promise<any> {
    this.definitions.set(def.id, { ...def, updatedAt: Date.now() });
    return def;
  }
  async load(id: string): Promise<any | undefined> {
    return this.definitions.get(id);
  }
  async list(): Promise<any[]> {
    return Array.from(this.definitions.values()).map(d => ({
      id: d.id,
      name: d.name ?? d.id,
      type: d.type ?? 'definition',
      version: d.version ?? 1,
      createdAt: d.createdAt ?? Date.now(),
      updatedAt: d.updatedAt ?? Date.now(),
    }));
  }
  async delete(id: string): Promise<boolean> {
    return this.definitions.delete(id);
  }
  async duplicate(id: string, options?: { name?: string }): Promise<any | undefined> {
    const original = this.definitions.get(id);
    if (!original) return undefined;
    const copy = { ...original, id: `${id}-copy-${Date.now()}`, name: options?.name ?? `${original.name} (Copy)` };
    this.definitions.set(copy.id, copy);
    return copy;
  }

  // --- Placement Store ---

  async savePlacement(placement: any): Promise<any> {
    this.placements.set(placement.id, placement);
    return placement;
  }
  async loadPlacements(_filter?: any): Promise<any[]> {
    return Array.from(this.placements.values());
  }
  async deletePlacement(id: string): Promise<void> {
    this.placements.delete(id);
  }

  // --- Catalog ---

  async listArtifacts(_filter?: any): Promise<any[]> {
    const now = Date.now();
    const all = [
      ...Array.from(this.reports.values()).map(r => ({
        id: r.id, name: r.name ?? r.id, type: 'report',
        description: r.description, dataSource: r.dataSource,
        createdAt: r.createdAt ?? now, updatedAt: r.updatedAt ?? now,
      })),
      ...Array.from(this.dashboards.values()).map(d => ({
        id: d.id, name: d.name ?? d.id, type: 'dashboard',
        description: d.description,
        createdAt: d.createdAt ?? now, updatedAt: d.updatedAt ?? now,
      })),
      ...Array.from(this.definitions.values()).map(d => ({
        id: d.id, name: d.name ?? d.id, type: d.type ?? 'definition',
        description: d.description,
        createdAt: d.createdAt ?? now, updatedAt: d.updatedAt ?? now,
      })),
    ];
    return all;
  }

  // --- Lifecycle ---

  async initialize(): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;

    const now = Date.now();
    const day = 86400000;

    // Seed reports referencing real datasets
    await this.saveReport({
      id: 'report-sales-by-region',
      name: 'Sales by Region',
      description: 'Revenue and profit breakdown across geographic regions',
      dataSource: 'sales_orders',
      columns: ['region', 'category', 'product', 'amount', 'profit', 'quantity'],
      groupBy: ['region'],
      sortBy: [{ field: 'amount', direction: 'desc' }],
      filters: [],
      createdAt: now - day * 14,
    });

    await this.saveReport({
      id: 'report-top-products',
      name: 'Top Products',
      description: 'Best-selling products by volume and revenue',
      dataSource: 'sales_orders',
      columns: ['product', 'category', 'quantity', 'amount', 'profit', 'status'],
      groupBy: ['product'],
      sortBy: [{ field: 'quantity', direction: 'desc' }],
      filters: [{ field: 'status', operator: 'eq', value: 'completed' }],
      createdAt: now - day * 10,
    });

    await this.saveReport({
      id: 'report-employee-directory',
      name: 'Employee Directory',
      description: 'Full employee listing with department, position, and compensation',
      dataSource: 'employees',
      columns: ['name', 'email', 'department', 'position', 'salary', 'rating', 'startDate', 'status'],
      sortBy: [{ field: 'name', direction: 'asc' }],
      filters: [],
      createdAt: now - day * 7,
    });

    await this.saveReport({
      id: 'report-salary-analysis',
      name: 'Salary Analysis',
      description: 'Compensation analysis by department and position level',
      dataSource: 'employees',
      columns: ['department', 'position', 'salary', 'rating', 'projects'],
      groupBy: ['department', 'position'],
      sortBy: [{ field: 'salary', direction: 'desc' }],
      filters: [{ field: 'status', operator: 'eq', value: 'active' }],
      createdAt: now - day * 3,
    });

    await this.saveReport({
      id: 'report-monthly-revenue',
      name: 'Monthly Revenue Trend',
      description: 'Revenue trend by month with year-over-year comparison',
      dataSource: 'sales_orders',
      columns: ['date', 'year', 'quarter', 'month', 'amount', 'profit', 'quantity'],
      groupBy: ['year', 'month'],
      sortBy: [{ field: 'date', direction: 'asc' }],
      filters: [],
      createdAt: now - day * 20,
    });

    // Seed dashboards with widget configurations
    await this.saveDashboard({
      id: 'dash-sales-overview',
      name: 'Sales Overview',
      description: 'Executive dashboard with KPIs, charts, and order pipeline',
      layout: { columns: 3, gap: 16 },
      widgets: [
        { id: 'w1', type: 'kpi', title: 'Total Revenue', dataSource: 'sales_orders', measure: 'amount', aggregation: 'sum', span: 1 },
        { id: 'w2', type: 'kpi', title: 'Total Orders', dataSource: 'sales_orders', measure: 'id', aggregation: 'count', span: 1 },
        { id: 'w3', type: 'kpi', title: 'Avg Order Value', dataSource: 'sales_orders', measure: 'amount', aggregation: 'avg', span: 1 },
        { id: 'w4', type: 'chart', title: 'Revenue by Region', dataSource: 'sales_orders', chartType: 'bar', dimension: 'region', measure: 'amount', span: 2 },
        { id: 'w5', type: 'chart', title: 'Status Distribution', dataSource: 'sales_orders', chartType: 'pie', dimension: 'status', measure: 'id', span: 1 },
        { id: 'w6', type: 'grid', title: 'Recent Orders', dataSource: 'sales_orders', columns: ['id', 'date', 'product', 'amount', 'status'], limit: 20, span: 3 },
      ],
      createdAt: now - day * 12,
    });

    await this.saveDashboard({
      id: 'dash-hr-analytics',
      name: 'HR Analytics',
      description: 'Workforce metrics, department breakdown, and compensation overview',
      layout: { columns: 2, gap: 16 },
      widgets: [
        { id: 'w1', type: 'kpi', title: 'Headcount', dataSource: 'employees', measure: 'id', aggregation: 'count', span: 1 },
        { id: 'w2', type: 'kpi', title: 'Avg Salary', dataSource: 'employees', measure: 'salary', aggregation: 'avg', span: 1 },
        { id: 'w3', type: 'chart', title: 'By Department', dataSource: 'employees', chartType: 'bar', dimension: 'department', measure: 'id', span: 1 },
        { id: 'w4', type: 'chart', title: 'By Position Level', dataSource: 'employees', chartType: 'bar', dimension: 'position', measure: 'id', span: 1 },
        { id: 'w5', type: 'grid', title: 'Employee List', dataSource: 'employees', columns: ['name', 'department', 'position', 'salary', 'status'], limit: 15, span: 2 },
      ],
      createdAt: now - day * 8,
    });

    await this.saveDashboard({
      id: 'dash-product-performance',
      name: 'Product Performance',
      description: 'Product category analysis with profitability metrics',
      layout: { columns: 2, gap: 16 },
      widgets: [
        { id: 'w1', type: 'kpi', title: 'Total Profit', dataSource: 'sales_orders', measure: 'profit', aggregation: 'sum', span: 1 },
        { id: 'w2', type: 'kpi', title: 'Avg Discount', dataSource: 'sales_orders', measure: 'discount', aggregation: 'avg', span: 1 },
        { id: 'w3', type: 'chart', title: 'Category Revenue', dataSource: 'sales_orders', chartType: 'bar', dimension: 'category', measure: 'amount', span: 2 },
        { id: 'w4', type: 'chart', title: 'Payment Methods', dataSource: 'sales_orders', chartType: 'pie', dimension: 'paymentMethod', measure: 'id', span: 1 },
        { id: 'w5', type: 'chart', title: 'Profit by Region', dataSource: 'sales_orders', chartType: 'bar', dimension: 'region', measure: 'profit', span: 1 },
      ],
      createdAt: now - day * 5,
    });

    // Seed grid definitions (data sources the workspace can browse)
    await this.save({
      id: 'def-sales-orders',
      name: 'Sales Orders',
      type: 'data-source',
      description: 'Sales transactions — products, regions, financials',
      dataSource: 'sales_orders',
      schema: {
        fields: [
          { name: 'id', dataType: 'number' },
          { name: 'date', dataType: 'date' },
          { name: 'product', dataType: 'string' },
          { name: 'category', dataType: 'string' },
          { name: 'region', dataType: 'string' },
          { name: 'salesRep', dataType: 'string' },
          { name: 'quantity', dataType: 'number' },
          { name: 'unitPrice', dataType: 'number' },
          { name: 'discount', dataType: 'number' },
          { name: 'amount', dataType: 'number' },
          { name: 'profit', dataType: 'number' },
          { name: 'paymentMethod', dataType: 'string' },
          { name: 'status', dataType: 'string' },
        ],
      },
      createdAt: now - day * 30,
      version: 1,
    });

    await this.save({
      id: 'def-employees',
      name: 'Employees',
      type: 'data-source',
      description: 'Employee records — departments, positions, compensation',
      dataSource: 'employees',
      schema: {
        fields: [
          { name: 'id', dataType: 'number' },
          { name: 'name', dataType: 'string' },
          { name: 'email', dataType: 'string' },
          { name: 'department', dataType: 'string' },
          { name: 'position', dataType: 'string' },
          { name: 'salary', dataType: 'number' },
          { name: 'rating', dataType: 'number' },
          { name: 'startDate', dataType: 'date' },
          { name: 'status', dataType: 'string' },
          { name: 'location', dataType: 'string' },
          { name: 'projects', dataType: 'number' },
          { name: 'isRemote', dataType: 'boolean' },
        ],
      },
      createdAt: now - day * 30,
      version: 1,
    });
  }

  async clear(): Promise<void> {
    this.reports.clear();
    this.dashboards.clear();
    this.kpis.clear();
    this.metrics.clear();
    this.definitions.clear();
    this.placements.clear();
    this.artifacts.clear();
    this._initialized = false;
  }
}
