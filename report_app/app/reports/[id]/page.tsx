'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { DynamicPhzGrid, DynamicPhzCriteria, DynamicPhzGridAdmin } from '@/components/wrappers/DynamicGrid';
import { DATASETS } from '@/lib/datasets-registry';
import { computeAggregations } from '@/lib/engine';

interface SavedReport {
  id: number;
  name: string;
  description: string;
  dataset: string;
  config_json: any;
  created_at: string;
  updated_at: string;
}

interface Preset {
  id: number;
  name: string;
  values_json: any;
}

const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
const CATEGORIES_LIST = ['Hardware', 'Peripherals', 'Audio', 'Video', 'Accessories', 'Storage', 'Memory'];
const PRODUCTS = ['Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Headset', 'Webcam', 'Dock', 'Cable', 'SSD', 'RAM'];
const PAYMENT = ['Credit Card', 'Wire Transfer', 'Purchase Order', 'PayPal'];
const ORDER_STATUS = ['completed', 'processing', 'shipped', 'cancelled', 'refunded'];
const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations', 'Product', 'Design'];
const POSITIONS = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP'];
const EMP_STATUS = ['active', 'on-leave', 'probation', 'inactive'];
const LOCATIONS = ['New York', 'San Francisco', 'London', 'Berlin', 'Tokyo', 'Sydney', 'Toronto', 'Singapore'];

function buildCriteriaConfig(dataset: string, filterIds: string[]) {
  const allDefs: Record<string, Record<string, any>> = {
    sales_orders: {
      region: { id: 'region', label: 'Region', type: 'chip_group', dataField: 'region', options: REGIONS.map(v => ({ value: v, label: v })) },
      category: { id: 'category', label: 'Category', type: 'chip_group', dataField: 'category', options: CATEGORIES_LIST.map(v => ({ value: v, label: v })) },
      status: { id: 'status', label: 'Status', type: 'single_select', dataField: 'status', placeholder: 'All', options: ORDER_STATUS.map(v => ({ value: v, label: v })) },
      amount: { id: 'amount', label: 'Amount', type: 'numeric_range', dataField: 'amount', numericRangeConfig: { min: 0, max: 30000, step: 500, unit: '$', showSlider: true } },
      product: { id: 'product', label: 'Product', type: 'multi_select', dataField: 'product', options: PRODUCTS.map(v => ({ value: v, label: v })) },
      payment_method: { id: 'payment_method', label: 'Payment', type: 'chip_group', dataField: 'paymentMethod', options: PAYMENT.map(v => ({ value: v, label: v })) },
    },
    employees: {
      department: { id: 'department', label: 'Department', type: 'chip_group', dataField: 'department', options: DEPARTMENTS.map(v => ({ value: v, label: v })) },
      position: { id: 'position', label: 'Position', type: 'multi_select', dataField: 'position', options: POSITIONS.map(v => ({ value: v, label: v })) },
      status: { id: 'status', label: 'Status', type: 'single_select', dataField: 'status', placeholder: 'All', options: EMP_STATUS.map(v => ({ value: v, label: v })) },
      salary: { id: 'salary', label: 'Salary Range', type: 'numeric_range', dataField: 'salary', numericRangeConfig: { min: 50000, max: 300000, step: 5000, unit: '$', showSlider: true } },
      location: { id: 'location', label: 'Location', type: 'chip_group', dataField: 'location', options: LOCATIONS.map(v => ({ value: v, label: v })) },
    },
  };

  const defs = allDefs[dataset] ?? {};
  const fields = filterIds.length > 0
    ? filterIds.filter(id => defs[id]).map(id => defs[id])
    : Object.values(defs);

  return fields.length > 0 ? { fields } : null;
}

export default function ReportViewPage() {
  const params = useParams();
  const router = useRouter();
  const { resolved } = useTheme();
  const reportId = params.id as string;

  const [report, setReport] = useState<SavedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [filteredData, setFilteredData] = useState<any[] | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [lastCriteria, setLastCriteria] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/reports/${reportId}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(data => { setReport(data); setEditName(data.name); setEditDesc(data.description); })
      .catch(() => router.push('/reports'))
      .finally(() => setLoading(false));

    fetch(`/api/presets?report_id=${reportId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPresets(data); })
      .catch(() => {});
  }, [reportId, router]);

  const [salesData, setSalesData] = useState<any[]>([]);
  const [employeeData, setEmployeeData] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/datasets/sales_orders?mode=page&limit=1000&offset=0').then(r => r.json()),
      fetch('/api/datasets/employees?mode=page&limit=1000&offset=0').then(r => r.json()),
    ]).then(([sales, emp]) => {
      setSalesData(sales.data ?? []);
      setEmployeeData(emp.data ?? []);
    }).catch(() => {});
  }, []);

  const config = report?.config_json ?? {};
  const isSales = report?.dataset === 'sales_orders';
  const rawData = isSales ? salesData : employeeData;
  const allColumns = isSales ? DATASETS.sales_orders.columns : DATASETS.employees.columns;
  const columns = config.columns?.length > 0
    ? allColumns.filter(c => config.columns.includes(c.field))
    : allColumns;
  const statusColors = isSales ? DATASETS.sales_orders.statusColors : DATASETS.employees.statusColors;
  const displayData = filteredData ?? rawData;

  const criteriaConfig = useMemo(
    () => report ? buildCriteriaConfig(report.dataset, config.filters ?? []) : null,
    [report, config.filters],
  );

  const aggregations = useMemo(() => {
    if (!report) return null;
    if (isSales) {
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
  }, [displayData, report, isSales]);

  const handleCriteriaApply = useCallback((detail: any) => {
    const ctx = detail.context ?? detail;
    setLastCriteria(ctx);
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
      } else if (filter.type === 'numeric_range') {
        const { min, max } = filter.value as { min: number; max: number };
        result = result.filter(r => r[field] >= min && r[field] <= max);
      }
    }
    setFilteredData(result);
  }, [rawData]);

  const handleSave = async () => {
    if (!report) return;
    await fetch(`/api/reports/${report.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, description: editDesc, dataset: report.dataset, config_json: config }),
    });
    setReport({ ...report, name: editName, description: editDesc });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!report || !confirm('Delete this report?')) return;
    await fetch(`/api/reports/${report.id}`, { method: 'DELETE' });
    router.push('/reports');
  };

  const handleSavePreset = async () => {
    if (!presetName.trim() || !lastCriteria) return;
    const resp = await fetch('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: presetName.trim(), report_id: Number(reportId), values_json: lastCriteria }),
    });
    if (resp.ok) {
      const preset = await resp.json();
      setPresets(prev => [preset, ...prev]);
      setPresetName('');
    }
  };

  const getAggValue = (field: string, fn: string) => {
    return (aggregations as any)?.fieldResults?.[field]?.[fn] ?? 0;
  };

  const fmtDol = (n: number) => '$' + (n >= 1000000 ? `${(n / 1000000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toFixed(0));

  if (loading) {
    return <div className="p-8 text-[var(--text-muted)]">Loading report...</div>;
  }

  if (!report) {
    return <div className="p-8 text-[var(--text-muted)]">Report not found</div>;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          {editing ? (
            <div className="space-y-2">
              <input value={editName} onChange={e => setEditName(e.target.value)} className="text-2xl font-bold bg-transparent border-b border-[var(--accent)] outline-none text-[var(--text-primary)]" />
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} className="block w-full text-sm bg-transparent border border-[var(--border)] rounded px-2 py-1 text-[var(--text-secondary)]" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{report.name}</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">{report.description}</p>
            </>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">{report.dataset}</span>
            <span className="text-[10px] text-[var(--text-muted)]">Updated {new Date(report.updated_at).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={handleSave} className="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded-md">Save</button>
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-md">Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-md hover:text-[var(--text-primary)]">Edit</button>
              <button onClick={() => setAdminOpen(true)} className="px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-md hover:text-[var(--text-primary)]">Customize</button>
              <button onClick={handleDelete} className="px-3 py-1.5 text-sm bg-red-900/30 text-red-400 rounded-md hover:bg-red-900/50">Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Aggregation bar */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
        {isSales ? (
          <>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Revenue</p>
              <p className="text-lg font-bold">{fmtDol(getAggValue('amount', 'sum'))}</p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Profit</p>
              <p className="text-lg font-bold">{fmtDol(getAggValue('profit', 'sum'))}</p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Orders</p>
              <p className="text-lg font-bold">{displayData.length}</p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Avg Order</p>
              <p className="text-lg font-bold">{fmtDol(getAggValue('amount', 'avg'))}</p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Units</p>
              <p className="text-lg font-bold">{getAggValue('quantity', 'sum').toLocaleString()}</p>
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
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Payroll</p>
              <p className="text-lg font-bold">{fmtDol(getAggValue('salary', 'sum'))}</p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Avg Rating</p>
              <p className="text-lg font-bold">{getAggValue('rating', 'avg').toFixed(1)}</p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase">Projects</p>
              <p className="text-lg font-bold">{getAggValue('projects', 'sum')}</p>
            </div>
          </>
        )}
      </div>

      {/* Criteria bar */}
      {criteriaConfig && (
        <div className="mb-4">
          <DynamicPhzCriteria
            config={criteriaConfig}
            data={rawData}
            onCriteriaApply={handleCriteriaApply}
            onCriteriaReset={() => { setFilteredData(null); setLastCriteria(null); }}
          />
        </div>
      )}

      {/* Presets */}
      {criteriaConfig && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-[var(--text-muted)]">Presets:</span>
          {presets.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setLastCriteria(p.values_json);
                handleCriteriaApply(p.values_json);
              }}
              className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded hover:text-[var(--text-primary)]"
            >
              {p.name}
            </button>
          ))}
          {lastCriteria && (
            <div className="flex gap-1 ml-auto">
              <input
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                placeholder="Preset name..."
                className="px-2 py-1 text-xs border border-[var(--border)] bg-[var(--bg-secondary)] rounded text-[var(--text-primary)]"
              />
              <button onClick={handleSavePreset} disabled={!presetName.trim()} className="px-2 py-1 text-xs bg-[var(--accent)] text-white rounded disabled:opacity-50">
                Save Preset
              </button>
            </div>
          )}
        </div>
      )}

      {/* Record count */}
      <div className="text-xs text-[var(--text-muted)] mb-2">
        {displayData.length} of {rawData.length} records
      </div>

      {/* Grid */}
      <div style={{ height: 520 }}>
        <DynamicPhzGrid
          data={displayData}
          columns={columns}
          height="500px"
          theme={resolved}
          density="compact"
          selectionMode="multi"
          showToolbar
          showSearch
          showPagination
          showCheckboxes
          showCsvExport
          pageSize={15}
          pageSizeOptions={[10, 15, 25, 50]}
          statusColors={statusColors}
          rowBanding
          hoverHighlight
          gridLines="horizontal"
          allowSorting
          allowFiltering
          compactNumbers
          groupBy={config.groupBy ? [config.groupBy] : undefined}
          gridTitle={report.name}
          gridSubtitle={`${displayData.length} records`}
        />
      </div>

      <DynamicPhzGridAdmin
        open={adminOpen}
        columns={columns}
        reportName={report.name}
        statusColors={statusColors}
        onClose={() => setAdminOpen(false)}
        onSettingsSave={() => setAdminOpen(false)}
      />
    </div>
  );
}
