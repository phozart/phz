'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface WidgetDef {
  id: string;
  type: string;
  label: string;
  description: string;
  icon: string;
}

const WIDGET_GALLERY: WidgetDef[] = [
  { id: 'kpi', type: 'kpi_card', label: 'KPI Card', description: 'Single metric with target and trend', icon: '1' },
  { id: 'bar', type: 'bar_chart', label: 'Bar Chart', description: 'Compare values across categories', icon: '|' },
  { id: 'line', type: 'line_chart', label: 'Line Chart', description: 'Show trends over time', icon: '/' },
  { id: 'pie', type: 'pie_chart', label: 'Pie Chart', description: 'Show proportions of a whole', icon: 'O' },
  { id: 'gauge', type: 'gauge', label: 'Gauge', description: 'Progress toward a target', icon: 'G' },
  { id: 'trend', type: 'trend_line', label: 'Trend Line', description: 'Sparkline showing direction', icon: '~' },
  { id: 'funnel', type: 'funnel_chart', label: 'Funnel', description: 'Stages in a process', icon: 'V' },
  { id: 'scatter', type: 'scatter_chart', label: 'Scatter', description: 'Relationship between two variables', icon: '.' },
  { id: 'grid', type: 'data_grid', label: 'Data Grid', description: 'Tabular data view', icon: '#' },
];

const FILTER_OPTIONS = [
  { id: 'region', label: 'Region' },
  { id: 'category', label: 'Category' },
  { id: 'status', label: 'Status' },
  { id: 'date_range', label: 'Date Range' },
  { id: 'product', label: 'Product' },
];

interface WidgetConfig {
  widgetId: string;
  type: string;
  title: string;
  dataField: string;
  aggregation: string;
}

export default function NewDashboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedWidgets, setSelectedWidgets] = useState<WidgetConfig[]>([]);
  const [globalFilters, setGlobalFilters] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const toggleWidget = (def: WidgetDef) => {
    const exists = selectedWidgets.find(w => w.widgetId === def.id);
    if (exists) {
      setSelectedWidgets(prev => prev.filter(w => w.widgetId !== def.id));
    } else {
      setSelectedWidgets(prev => [...prev, {
        widgetId: def.id,
        type: def.type,
        title: def.label,
        dataField: 'amount',
        aggregation: 'sum',
      }]);
    }
  };

  const updateWidget = (widgetId: string, updates: Partial<WidgetConfig>) => {
    setSelectedWidgets(prev => prev.map(w => w.widgetId === widgetId ? { ...w, ...updates } : w));
  };

  const toggleFilter = (id: string) => {
    const next = new Set(globalFilters);
    if (next.has(id)) next.delete(id); else next.add(id);
    setGlobalFilters(next);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const config = {
        widgets: selectedWidgets,
        globalFilters: [...globalFilters],
        layout: selectedWidgets.map((w, i) => ({ widgetId: w.widgetId, x: (i % 3) * 4, y: Math.floor(i / 3) * 4, w: 4, h: 4 })),
      };
      const resp = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), config_json: config }),
      });
      if (resp.ok) {
        const dashboard = await resp.json();
        router.push(`/dashboards/${dashboard.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">New Dashboard</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">Step {step} of 4</p>

      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'}`} />
        ))}
      </div>

      {/* Step 1: Name */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Name Your Dashboard</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Dashboard Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Executive Overview" className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description..." rows={3} className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm resize-none" />
          </div>
        </div>
      )}

      {/* Step 2: Widgets */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Pick Widgets</h2>
          <div className="grid grid-cols-3 gap-3">
            {WIDGET_GALLERY.map(def => {
              const selected = selectedWidgets.some(w => w.widgetId === def.id);
              return (
                <button
                  key={def.id}
                  onClick={() => toggleWidget(def)}
                  className={`text-left p-4 rounded-lg border transition-colors ${
                    selected ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <span className="text-lg font-mono">{def.icon}</span>
                  <h3 className="font-semibold text-sm mt-1">{def.label}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{def.description}</p>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-3">{selectedWidgets.length} widgets selected</p>
        </div>
      )}

      {/* Step 3: Configure */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Configure Widgets</h2>
          {selectedWidgets.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No widgets selected. Go back to pick some.</p>
          ) : (
            <div className="space-y-3">
              {selectedWidgets.map(w => (
                <div key={w.widgetId} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">{w.type}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Title</label>
                      <input value={w.title} onChange={e => updateWidget(w.widgetId, { title: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-[var(--border)] bg-[var(--bg-tertiary)] rounded text-[var(--text-primary)]" />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Data Field</label>
                      <select value={w.dataField} onChange={e => updateWidget(w.widgetId, { dataField: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-[var(--border)] bg-[var(--bg-tertiary)] rounded text-[var(--text-primary)]">
                        <option value="amount">Amount</option>
                        <option value="profit">Profit</option>
                        <option value="quantity">Quantity</option>
                        <option value="discount">Discount</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Aggregation</label>
                      <select value={w.aggregation} onChange={e => updateWidget(w.widgetId, { aggregation: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-[var(--border)] bg-[var(--bg-tertiary)] rounded text-[var(--text-primary)]">
                        <option value="sum">Sum</option>
                        <option value="avg">Average</option>
                        <option value="count">Count</option>
                        <option value="min">Min</option>
                        <option value="max">Max</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Filters & Save */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Global Filters</h2>
            <div className="space-y-2">
              {FILTER_OPTIONS.map(f => (
                <label key={f.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  globalFilters.has(f.id) ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] bg-[var(--bg-secondary)]'
                }`}>
                  <input type="checkbox" checked={globalFilters.has(f.id)} onChange={() => toggleFilter(f.id)} className="accent-[var(--accent)]" />
                  <span className="text-sm font-medium">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">Summary</h3>
            <div className="text-xs text-[var(--text-secondary)] space-y-1">
              <p>Name: {name || '(untitled)'}</p>
              <p>Widgets: {selectedWidgets.length}</p>
              <p>Global filters: {globalFilters.size}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="px-4 py-2 rounded-md text-sm bg-[var(--bg-tertiary)] text-[var(--text-secondary)] disabled:opacity-30">
          Back
        </button>
        {step < 4 ? (
          <button onClick={() => setStep(step + 1)} className="px-4 py-2 rounded-md text-sm bg-[var(--accent)] text-white font-medium">
            Next
          </button>
        ) : (
          <button onClick={handleSave} disabled={!name.trim() || saving} className="px-6 py-2 rounded-md text-sm bg-[var(--accent)] text-white font-medium disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Dashboard'}
          </button>
        )}
      </div>
    </div>
  );
}
