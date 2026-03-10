'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { DynamicPhzCriteria } from '@/components/wrappers/DynamicGrid';

type Tab = 'definitions' | 'bindings' | 'test';

interface FilterDef {
  id: string;
  label: string;
  type: string;
  dataField: string;
  dataset: string;
  options?: { value: string; label: string }[];
}

interface Binding {
  filterId: string;
  artefactType: 'report' | 'dashboard';
  artefactId: string;
  artefactName: string;
}

const INITIAL_DEFS: FilterDef[] = [
  { id: 'region', label: 'Region', type: 'chip_group', dataField: 'region', dataset: 'sales_orders', options: ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'].map(v => ({ value: v, label: v })) },
  { id: 'category', label: 'Category', type: 'chip_group', dataField: 'category', dataset: 'sales_orders', options: ['Hardware', 'Peripherals', 'Audio', 'Video', 'Accessories', 'Storage', 'Memory'].map(v => ({ value: v, label: v })) },
  { id: 'status', label: 'Order Status', type: 'single_select', dataField: 'status', dataset: 'sales_orders', options: ['completed', 'processing', 'shipped', 'cancelled', 'refunded'].map(v => ({ value: v, label: v })) },
  { id: 'amount_range', label: 'Amount Range', type: 'numeric_range', dataField: 'amount', dataset: 'sales_orders' },
  { id: 'department', label: 'Department', type: 'chip_group', dataField: 'department', dataset: 'employees', options: ['Engineering', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations', 'Product', 'Design'].map(v => ({ value: v, label: v })) },
  { id: 'position', label: 'Position', type: 'multi_select', dataField: 'position', dataset: 'employees', options: ['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP'].map(v => ({ value: v, label: v })) },
  { id: 'emp_status', label: 'Employee Status', type: 'single_select', dataField: 'status', dataset: 'employees', options: ['active', 'on-leave', 'probation', 'inactive'].map(v => ({ value: v, label: v })) },
  { id: 'salary_range', label: 'Salary Range', type: 'numeric_range', dataField: 'salary', dataset: 'employees' },
];

export default function CriteriaPage() {
  const { resolved } = useTheme();
  const [tab, setTab] = useState<Tab>('definitions');
  const [defs, setDefs] = useState<FilterDef[]>(INITIAL_DEFS);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [testArtefact, setTestArtefact] = useState<string>('all-sales');

  // Form state for new definition
  const [newId, setNewId] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('chip_group');
  const [newField, setNewField] = useState('');
  const [newDataset, setNewDataset] = useState('sales_orders');

  const [salesData, setSalesData] = useState<any[]>([]);
  const [employeeData, setEmployeeData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/datasets/sales_orders?mode=page&limit=1000&offset=0')
      .then(r => r.json()).then(body => setSalesData(body.data ?? [])).catch(() => {});
    fetch('/api/datasets/employees?mode=page&limit=1000&offset=0')
      .then(r => r.json()).then(body => setEmployeeData(body.data ?? [])).catch(() => {});
  }, []);

  // Load report/dashboard names for bindings display
  useEffect(() => {
    Promise.all([
      fetch('/api/reports').then(r => r.json()).catch(() => []),
      fetch('/api/dashboards').then(r => r.json()).catch(() => []),
    ]).then(([reports, dashboards]) => {
      const b: Binding[] = [];
      if (Array.isArray(reports)) {
        for (const r of reports) {
          const filters = r.config_json?.filters ?? [];
          for (const fId of filters) {
            b.push({ filterId: fId, artefactType: 'report', artefactId: String(r.id), artefactName: r.name });
          }
        }
      }
      if (Array.isArray(dashboards)) {
        for (const d of dashboards) {
          const filters = d.config_json?.globalFilters ?? [];
          for (const fId of filters) {
            b.push({ filterId: fId, artefactType: 'dashboard', artefactId: String(d.id), artefactName: d.name });
          }
        }
      }
      setBindings(b);
    });
  }, []);

  const handleAddDef = () => {
    if (!newId.trim() || !newLabel.trim() || !newField.trim()) return;
    if (defs.some(d => d.id === newId.trim())) return;
    setDefs(prev => [...prev, { id: newId.trim(), label: newLabel.trim(), type: newType, dataField: newField.trim(), dataset: newDataset }]);
    setNewId('');
    setNewLabel('');
    setNewField('');
  };

  const handleRemoveDef = (id: string) => {
    setDefs(prev => prev.filter(d => d.id !== id));
  };

  // Build test criteria config
  const testCriteriaConfig = useMemo(() => {
    const isSales = testArtefact.includes('sales');
    const dataset = isSales ? 'sales_orders' : 'employees';
    const fields = defs.filter(d => d.dataset === dataset).map(d => {
      const base: any = { id: d.id, label: d.label, type: d.type, dataField: d.dataField };
      if (d.options) base.options = d.options;
      if (d.type === 'numeric_range') {
        base.numericRangeConfig = d.dataField === 'amount'
          ? { min: 0, max: 30000, step: 500, unit: '$', showSlider: true }
          : d.dataField === 'salary'
            ? { min: 50000, max: 300000, step: 5000, unit: '$', showSlider: true }
            : { min: 0, max: 100000, step: 100 };
      }
      if (d.type === 'single_select') base.placeholder = 'All';
      return base;
    });
    return { fields };
  }, [defs, testArtefact]);

  const testData = testArtefact.includes('sales') ? salesData : employeeData;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'definitions', label: 'Definitions' },
    { id: 'bindings', label: 'Bindings' },
    { id: 'test', label: 'Test' },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Criteria Admin</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Manage filter definitions, bindings, and test criteria output
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Definitions tab */}
      {tab === 'definitions' && (
        <div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-4 py-2 text-[var(--text-muted)] text-xs font-medium">ID</th>
                  <th className="text-left px-4 py-2 text-[var(--text-muted)] text-xs font-medium">Label</th>
                  <th className="text-left px-4 py-2 text-[var(--text-muted)] text-xs font-medium">Type</th>
                  <th className="text-left px-4 py-2 text-[var(--text-muted)] text-xs font-medium">Field</th>
                  <th className="text-left px-4 py-2 text-[var(--text-muted)] text-xs font-medium">Dataset</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {defs.map(d => (
                  <tr key={d.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{d.id}</td>
                    <td className="px-4 py-2">{d.label}</td>
                    <td className="px-4 py-2"><span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)]">{d.type}</span></td>
                    <td className="px-4 py-2 font-mono text-xs">{d.dataField}</td>
                    <td className="px-4 py-2 text-xs">{d.dataset}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => handleRemoveDef(d.id)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Add Filter Definition</h3>
            <div className="grid grid-cols-5 gap-3">
              <input value={newId} onChange={e => setNewId(e.target.value)} placeholder="ID" className="px-2 py-1.5 text-sm border border-[var(--border)] bg-[var(--bg-tertiary)] rounded text-[var(--text-primary)]" />
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Label" className="px-2 py-1.5 text-sm border border-[var(--border)] bg-[var(--bg-tertiary)] rounded text-[var(--text-primary)]" />
              <select value={newType} onChange={e => setNewType(e.target.value)} className="px-2 py-1.5 text-sm border border-[var(--border)] bg-[var(--bg-tertiary)] rounded text-[var(--text-primary)]">
                <option value="chip_group">Chip Group</option>
                <option value="single_select">Single Select</option>
                <option value="multi_select">Multi Select</option>
                <option value="numeric_range">Numeric Range</option>
                <option value="date_range">Date Range</option>
              </select>
              <input value={newField} onChange={e => setNewField(e.target.value)} placeholder="Data field" className="px-2 py-1.5 text-sm border border-[var(--border)] bg-[var(--bg-tertiary)] rounded text-[var(--text-primary)]" />
              <div className="flex gap-2">
                <select value={newDataset} onChange={e => setNewDataset(e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-[var(--border)] bg-[var(--bg-tertiary)] rounded text-[var(--text-primary)]">
                  <option value="sales_orders">Sales</option>
                  <option value="employees">Employees</option>
                </select>
                <button onClick={handleAddDef} className="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bindings tab */}
      {tab === 'bindings' && (
        <div>
          {bindings.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-8 text-center">
              <p className="text-[var(--text-muted)]">No bindings yet. Create reports or dashboards with filters to see bindings here.</p>
            </div>
          ) : (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left px-4 py-2 text-[var(--text-muted)] text-xs font-medium">Filter</th>
                    <th className="text-left px-4 py-2 text-[var(--text-muted)] text-xs font-medium">Artefact Type</th>
                    <th className="text-left px-4 py-2 text-[var(--text-muted)] text-xs font-medium">Artefact</th>
                  </tr>
                </thead>
                <tbody>
                  {bindings.map((b, i) => (
                    <tr key={i} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{b.filterId}</td>
                      <td className="px-4 py-2"><span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)]">{b.artefactType}</span></td>
                      <td className="px-4 py-2">{b.artefactName} <span className="text-[var(--text-muted)]">(#{b.artefactId})</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Test tab */}
      {tab === 'test' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-[var(--text-muted)]">Test artefact:</label>
            <select
              value={testArtefact}
              onChange={e => setTestArtefact(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[var(--border)] bg-[var(--bg-secondary)] rounded text-[var(--text-primary)]"
            >
              <option value="all-sales">All Sales Filters</option>
              <option value="all-employees">All Employee Filters</option>
            </select>
          </div>

          {testCriteriaConfig.fields.length > 0 ? (
            <div className="mb-4">
              <DynamicPhzCriteria
                config={testCriteriaConfig}
                data={testData}
                onCriteriaApply={(detail: any) => {
                  const ctx = detail.context ?? detail;
                  console.log('Criteria output:', ctx);
                }}
                onCriteriaReset={() => console.log('Criteria reset')}
              />
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No filter definitions for this dataset.</p>
          )}

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">Resolved Fields</h3>
            <pre className="text-xs text-[var(--text-secondary)] font-mono bg-[var(--bg-tertiary)] p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
              {JSON.stringify(testCriteriaConfig.fields, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
