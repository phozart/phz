'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { DynamicPhzGrid, DynamicPhzCriteria, DynamicPhzGridAdmin } from '@/components/wrappers/DynamicGrid';
import { DATASETS } from '@/lib/datasets-registry';
import { computeAggregations } from '@/lib/engine';
import { useTheme } from '@/components/ThemeProvider';

interface SavedReport {
  id: number;
  name: string;
  description: string;
  dataset: string;
  config_json: any;
  created_at: string;
  updated_at: string;
}

interface ReportDef {
  id: string;
  name: string;
  dataset: 'sales' | 'employees';
  description: string;
  groupBy?: string;
  columns: any[];
  criteria?: any;
  statusColors?: Record<string, { bg: string; color: string; dot: string }>;
}

const BUILTIN_REPORTS: ReportDef[] = [
  {
    id: 'sales-by-region', name: 'Sales by Region', dataset: 'sales',
    description: 'Revenue breakdown across regions with product categories',
    groupBy: 'region', columns: DATASETS.sales_orders.columns, statusColors: DATASETS.sales_orders.statusColors,
    criteria: {
      fields: [
        { id: 'category', label: 'Category', type: 'chip_group', dataField: 'category', options: ['Hardware', 'Peripherals', 'Audio', 'Video', 'Accessories', 'Storage', 'Memory'].map(v => ({ value: v, label: v })) },
        { id: 'status', label: 'Status', type: 'single_select', dataField: 'status', placeholder: 'All', options: ['completed', 'processing', 'shipped', 'cancelled', 'refunded'].map(v => ({ value: v, label: v })) },
      ],
    },
  },
  {
    id: 'product-performance', name: 'Product Performance', dataset: 'sales',
    description: 'Product-level revenue, quantity, and profit analysis',
    groupBy: 'product', columns: DATASETS.sales_orders.columns, statusColors: DATASETS.sales_orders.statusColors,
    criteria: {
      fields: [
        { id: 'region', label: 'Region', type: 'chip_group', dataField: 'region', options: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'].map(v => ({ value: v, label: v })) },
      ],
    },
  },
  {
    id: 'employee-overview', name: 'Employee Overview', dataset: 'employees',
    description: 'Workforce analysis by department and position',
    groupBy: 'department', columns: DATASETS.employees.columns, statusColors: DATASETS.employees.statusColors,
    criteria: {
      fields: [
        { id: 'position', label: 'Position', type: 'multi_select', dataField: 'position', options: ['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP'].map(v => ({ value: v, label: v })) },
        { id: 'status', label: 'Status', type: 'single_select', dataField: 'status', placeholder: 'All', options: ['active', 'on-leave', 'probation', 'inactive'].map(v => ({ value: v, label: v })) },
      ],
    },
  },
  {
    id: 'quarterly-sales', name: 'Quarterly Sales', dataset: 'sales',
    description: 'Year-over-year quarterly sales trends',
    groupBy: 'quarter', columns: DATASETS.sales_orders.columns, statusColors: DATASETS.sales_orders.statusColors,
  },
];

function ReportCard({ report, onClick, active }: { report: ReportDef; onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-lg border transition-colors w-full ${active ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]'}`}
    >
      <h3 className="font-semibold text-sm">{report.name}</h3>
      <p className="text-xs text-[var(--text-muted)] mt-1">{report.description}</p>
      <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{report.dataset}</span>
    </button>
  );
}

export default function ReportsPage() {
  const { resolved } = useTheme();
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [activeReportId, setActiveReportId] = useState(BUILTIN_REPORTS[0].id);
  const [filteredData, setFilteredData] = useState<any[] | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSavedReports(data); })
      .catch(() => {});
  }, []);

  const [salesData, setSalesData] = useState<any[]>([]);
  const [employeeData, setEmployeeData] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/datasets/sales_orders?mode=page&limit=1000&offset=0').then(r => r.json()),
      fetch('/api/datasets/employees?mode=page&limit=1000&offset=0').then(r => r.json()),
    ]).then(([sales, emp]) => {
      setSalesData(sales.data ?? []);
      setEmployeeData(emp.data ?? []);
    }).catch(() => {}).finally(() => setDataLoading(false));
  }, []);

  const report = BUILTIN_REPORTS.find(r => r.id === activeReportId)!;
  const rawData = report.dataset === 'sales' ? salesData : employeeData;
  const displayData = filteredData ?? rawData;

  const aggregations = useMemo(() => {
    if (report.dataset === 'sales') {
      return computeAggregations(displayData, {
        fields: [
          { field: 'amount', functions: ['sum', 'avg', 'count'] },
          { field: 'profit', functions: ['sum', 'avg'] },
          { field: 'quantity', functions: ['sum'] },
        ],
      });
    }
    return computeAggregations(displayData, {
      fields: [
        { field: 'salary', functions: ['sum', 'avg', 'min', 'max'] },
        { field: 'projects', functions: ['sum', 'avg'] },
        { field: 'rating', functions: ['avg'] },
      ],
    });
  }, [displayData, report.dataset]);

  const handleCriteriaApply = useCallback((detail: any) => {
    const ctx = detail.context ?? detail;
    if (!ctx || !ctx.activeFilters || Object.keys(ctx.activeFilters).length === 0) {
      setFilteredData(null);
      return;
    }
    let result = [...rawData] as Record<string, any>[];
    for (const [field, filter] of Object.entries<any>(ctx.activeFilters)) {
      if (filter.type === 'chip_group' || filter.type === 'multi_select') {
        const values = filter.value as string[];
        if (values.length > 0) result = result.filter(r => values.includes(String(r[field])));
      } else if (filter.type === 'single_select') {
        if (filter.value) result = result.filter(r => String(r[field]) === filter.value);
      }
    }
    setFilteredData(result);
  }, [rawData]);

  const switchReport = (id: string) => {
    setActiveReportId(id);
    setFilteredData(null);
  };

  const handleDeleteSaved = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Delete this report?')) return;
    await fetch(`/api/reports/${id}`, { method: 'DELETE' });
    setSavedReports(prev => prev.filter(r => r.id !== id));
  };

  const fmtNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toFixed(0);
  const fmtDol = (n: number) => '$' + (n >= 1000000 ? `${(n / 1000000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toFixed(0));
  const getAggValue = (field: string, fn: string) => (aggregations as any)?.fieldResults?.[field]?.[fn] ?? 0;

  const filteredSaved = searchQuery
    ? savedReports.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : savedReports;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Pre-built and saved reports</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports/new" className="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded-md font-medium">
            + New Report
          </Link>
          <button onClick={() => setAdminOpen(true)} className="px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-md hover:text-[var(--text-primary)]">
            Customize Grid
          </button>
        </div>
      </div>

      {/* Saved Reports */}
      {savedReports.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Saved Reports</h2>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="px-2 py-1 text-xs border border-[var(--border)] bg-[var(--bg-secondary)] rounded text-[var(--text-primary)]"
            />
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
            {filteredSaved.map(r => (
              <Link
                key={r.id}
                href={`/reports/${r.id}`}
                className="text-left p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)] transition-colors block relative group"
              >
                <h3 className="font-semibold text-xs">{r.name}</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">{r.description}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">{r.dataset}</span>
                  <span className="text-[9px] text-[var(--text-muted)]">{new Date(r.updated_at).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSaved(r.id, e)}
                  className="absolute top-2 right-2 text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  x
                </button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Built-in reports */}
      <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Built-in Reports</h2>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {BUILTIN_REPORTS.map(r => (
          <ReportCard key={r.id} report={r} onClick={() => switchReport(r.id)} active={r.id === activeReportId} />
        ))}
      </div>

      {/* Aggregation bar */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
        {report.dataset === 'sales' ? (
          <>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Total Revenue</p>
              <p className="text-lg font-bold">{fmtDol(getAggValue('amount', 'sum'))}</p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Total Profit</p>
              <p className="text-lg font-bold">{fmtDol(getAggValue('profit', 'sum'))}</p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Orders</p>
              <p className="text-lg font-bold">{fmtNum(getAggValue('amount', 'count'))}</p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Avg Order</p>
              <p className="text-lg font-bold">{fmtDol(getAggValue('amount', 'avg'))}</p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Units Sold</p>
              <p className="text-lg font-bold">{fmtNum(getAggValue('quantity', 'sum'))}</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Headcount</p>
              <p className="text-lg font-bold">{displayData.length}</p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Avg Salary</p>
              <p className="text-lg font-bold">{fmtDol(getAggValue('salary', 'avg'))}</p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Total Payroll</p>
              <p className="text-lg font-bold">{fmtDol(getAggValue('salary', 'sum'))}</p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Avg Rating</p>
              <p className="text-lg font-bold">{getAggValue('rating', 'avg').toFixed(1)}</p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Total Projects</p>
              <p className="text-lg font-bold">{fmtNum(getAggValue('projects', 'sum'))}</p>
            </div>
          </>
        )}
      </div>

      {report.criteria && (
        <div className="mb-4">
          <DynamicPhzCriteria config={report.criteria} data={rawData} onCriteriaApply={handleCriteriaApply} onCriteriaReset={() => setFilteredData(null)} />
        </div>
      )}

      <div style={{ height: 520 }}>
        <DynamicPhzGrid
          data={displayData}
          columns={report.columns}
          height="500px"
          theme={resolved}
          density="compact"
          selectionMode="multi"
          showToolbar showSearch showPagination showCheckboxes showCsvExport
          pageSize={15}
          pageSizeOptions={[10, 15, 25, 50]}
          statusColors={report.statusColors}
          rowBanding hoverHighlight
          gridLines="horizontal"
          allowSorting allowFiltering compactNumbers
          groupBy={report.groupBy ? [report.groupBy] : undefined}
          gridTitle={report.name}
          gridSubtitle={`${displayData.length} records`}
        />
      </div>

      <DynamicPhzGridAdmin open={adminOpen} columns={report.columns} reportName={report.name} statusColors={report.statusColors} onClose={() => setAdminOpen(false)} onSettingsSave={() => setAdminOpen(false)} />
    </div>
  );
}
