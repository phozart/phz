'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DATASETS } from '@/lib/datasets-registry';

type Dataset = 'sales_orders' | 'employees';

const DATASET_LIST: { id: Dataset; label: string; columns: any[] }[] = [
  { id: 'sales_orders', label: 'Sales Orders', columns: DATASETS.sales_orders.columns },
  { id: 'employees', label: 'Employees', columns: DATASETS.employees.columns },
];

const FILTER_DEFS: Record<Dataset, { id: string; label: string; type: string; dataField: string }[]> = {
  sales_orders: [
    { id: 'region', label: 'Region', type: 'chip_group', dataField: 'region' },
    { id: 'category', label: 'Category', type: 'chip_group', dataField: 'category' },
    { id: 'status', label: 'Status', type: 'single_select', dataField: 'status' },
    { id: 'amount', label: 'Amount Range', type: 'numeric_range', dataField: 'amount' },
    { id: 'product', label: 'Product', type: 'multi_select', dataField: 'product' },
    { id: 'payment_method', label: 'Payment Method', type: 'chip_group', dataField: 'payment_method' },
  ],
  employees: [
    { id: 'department', label: 'Department', type: 'chip_group', dataField: 'department' },
    { id: 'position', label: 'Position', type: 'multi_select', dataField: 'position' },
    { id: 'status', label: 'Status', type: 'single_select', dataField: 'status' },
    { id: 'salary', label: 'Salary Range', type: 'numeric_range', dataField: 'salary' },
    { id: 'location', label: 'Location', type: 'chip_group', dataField: 'location' },
  ],
};

export default function NewReportPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [dataset, setDataset] = useState<Dataset>('sales_orders');
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const ds = DATASET_LIST.find(d => d.id === dataset)!;
  const columns = ds.columns;
  const filters = FILTER_DEFS[dataset];

  const toggleColumn = (field: string) => {
    const next = new Set(selectedColumns);
    if (next.has(field)) next.delete(field); else next.add(field);
    setSelectedColumns(next);
  };

  const toggleFilter = (id: string) => {
    const next = new Set(selectedFilters);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedFilters(next);
  };

  const selectAllColumns = () => setSelectedColumns(new Set(columns.map(c => c.field)));

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const config = {
        columns: [...selectedColumns],
        filters: [...selectedFilters],
        groupBy: groupBy || undefined,
        sort: sortField ? { field: sortField, direction: sortDir } : undefined,
      };
      const resp = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), dataset, config_json: config }),
      });
      if (resp.ok) {
        const report = await resp.json();
        router.push(`/reports/${report.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">New Report</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">Step {step} of 5</p>

      {/* Progress bar */}
      <div className="flex gap-1 mb-8">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'}`} />
        ))}
      </div>

      {/* Step 1: Dataset */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Choose Dataset</h2>
          <div className="grid grid-cols-2 gap-4">
            {DATASET_LIST.map(d => (
              <button
                key={d.id}
                onClick={() => { setDataset(d.id); setSelectedColumns(new Set()); setSelectedFilters(new Set()); }}
                className={`text-left p-5 rounded-lg border transition-colors ${
                  dataset === d.id ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]'
                }`}
              >
                <h3 className="font-semibold">{d.label}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">{d.columns.length} columns</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Columns */}
      {step === 2 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Select Columns</h2>
            <button onClick={selectAllColumns} className="text-xs text-[var(--accent)] hover:underline">Select All</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {columns.map(col => (
              <label key={col.field} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedColumns.has(col.field) ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] bg-[var(--bg-secondary)]'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedColumns.has(col.field)}
                  onChange={() => toggleColumn(col.field)}
                  className="accent-[var(--accent)]"
                />
                <div>
                  <p className="text-sm font-medium">{col.header}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{col.type ?? 'string'}</p>
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-3">{selectedColumns.size} of {columns.length} selected</p>
        </div>
      )}

      {/* Step 3: Criteria */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Configure Criteria</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">Choose which filters to bind to this report</p>
          <div className="space-y-2">
            {filters.map(f => (
              <label key={f.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedFilters.has(f.id) ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] bg-[var(--bg-secondary)]'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedFilters.has(f.id)}
                  onChange={() => toggleFilter(f.id)}
                  className="accent-[var(--accent)]"
                />
                <div>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{f.type} on {f.dataField}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Grouping & Sort */}
      {step === 4 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Grouping & Sorting</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Group By</label>
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm"
              >
                <option value="">None</option>
                {columns.filter(c => c.type === 'string').map(c => (
                  <option key={c.field} value={c.field}>{c.header}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Default Sort</label>
              <div className="flex gap-2">
                <select
                  value={sortField}
                  onChange={e => setSortField(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm"
                >
                  <option value="">None</option>
                  {columns.filter(c => c.sortable).map(c => (
                    <option key={c.field} value={c.field}>{c.header}</option>
                  ))}
                </select>
                <select
                  value={sortDir}
                  onChange={e => setSortDir(e.target.value as 'asc' | 'desc')}
                  className="px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Name & Save */}
      {step === 5 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Name & Save</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Report Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Q4 Sales by Region"
                className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm resize-none"
              />
            </div>

            {/* Summary */}
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2">Summary</h3>
              <div className="text-xs text-[var(--text-secondary)] space-y-1">
                <p>Dataset: {dataset}</p>
                <p>Columns: {selectedColumns.size || 'All'}</p>
                <p>Filters: {selectedFilters.size || 'None'}</p>
                <p>Group by: {groupBy || 'None'}</p>
                <p>Sort: {sortField ? `${sortField} ${sortDir}` : 'Default'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-4 py-2 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-secondary)] disabled:opacity-30"
        >
          Back
        </button>
        {step < 5 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-4 py-2 rounded-md text-sm bg-[var(--accent)] text-white font-medium"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-6 py-2 rounded-md text-sm bg-[var(--accent)] text-white font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Report'}
          </button>
        )}
      </div>
    </div>
  );
}
