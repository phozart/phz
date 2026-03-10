'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { useWorkspace } from '@/components/WorkspaceProvider';
import {
  DynamicKPICard, DynamicBarChart, DynamicLineChart, DynamicPieChart,
  DynamicGauge, DynamicTrendLine, DynamicFunnelChart, DynamicScatterChart,
} from '@/components/wrappers/DynamicWidgets';
import { DynamicPhzGrid } from '@/components/wrappers/DynamicGrid';
import { DATASETS } from '@/lib/datasets-registry';
import { computeAggregations } from '@/lib/engine';
import { createFilterContext } from '@phozart/phz-workspace/filters';

interface SavedDashboard {
  id: number;
  name: string;
  description: string;
  config_json: any;
  created_at: string;
  updated_at: string;
}

interface WidgetConfig {
  widgetId: string;
  type: string;
  title: string;
  dataField: string;
  aggregation: string;
}

export default function DashboardViewPage() {
  const params = useParams();
  const router = useRouter();
  const { resolved } = useTheme();
  const dashboardId = params.id as string;

  const [dashboard, setDashboard] = useState<SavedDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Global filter state — powered by @phozart/phz-workspace/filters
  const filterCtx = useMemo(() => createFilterContext({
    dashboardFilters: [
      {
        id: 'region-filter', field: 'region', dataSourceId: 'sales_orders',
        label: 'Region', filterType: 'multi-select', required: false, appliesTo: [],
      },
      {
        id: 'category-filter', field: 'category', dataSourceId: 'sales_orders',
        label: 'Category', filterType: 'multi-select', required: false, appliesTo: [],
      },
    ],
  }), []);

  const [regionFilter, setRegionFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [filterVersion, setFilterVersion] = useState(0);

  // Sync local state with FilterContext
  useEffect(() => {
    const unsub = filterCtx.subscribe(() => {
      setFilterVersion(v => v + 1);
    });
    return unsub;
  }, [filterCtx]);

  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/dashboards/${dashboardId}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(data => { setDashboard(data); setEditName(data.name); setEditDesc(data.description); })
      .catch(() => router.push('/dashboards'))
      .finally(() => setLoading(false));
  }, [dashboardId, router]);

  useEffect(() => {
    fetch('/api/datasets/sales_orders?mode=page&limit=1000&offset=0')
      .then(r => r.json())
      .then(body => setSalesData(body.data ?? []))
      .catch(() => {});
  }, []);

  const filteredData = useMemo(() => {
    let data = salesData;
    if (regionFilter.length > 0) data = data.filter(r => regionFilter.includes(r.region));
    if (categoryFilter.length > 0) data = data.filter(r => categoryFilter.includes(r.category));
    return data;
  }, [salesData, regionFilter, categoryFilter]);

  const aggs = useMemo(() => computeAggregations(filteredData, {
    fields: [
      { field: 'amount', functions: ['sum', 'avg', 'count', 'min', 'max'] },
      { field: 'profit', functions: ['sum', 'avg'] },
      { field: 'quantity', functions: ['sum'] },
    ],
  }), [filteredData]);

  const getVal = (field: string, fn: string): number => (aggs as any)?.fieldResults?.[field]?.[fn] ?? 0;

  const barData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of filteredData) map[row.region] = (map[row.region] || 0) + row.amount;
    return { label: 'Revenue', data: Object.entries(map).map(([x, y]) => ({ x, y })) };
  }, [filteredData]);

  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of filteredData) map[row.category] = (map[row.category] || 0) + row.amount;
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  }, [filteredData]);

  const lineData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of filteredData) {
      const key = `${row.year} ${row.quarter}`;
      map[key] = (map[key] || 0) + row.amount;
    }
    return [{ label: 'Revenue', points: Object.entries(map).sort().map(([x, y]) => ({ x, y })), color: '#22c55e' }];
  }, [filteredData]);

  const trendData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of filteredData) {
      const key = `${row.year} ${row.quarter}`;
      map[key] = (map[key] || 0) + row.amount;
    }
    return { label: 'Revenue', data: Object.entries(map).sort().map(([x, y]) => ({ x, y })) };
  }, [filteredData]);

  const handleSave = async () => {
    if (!dashboard) return;
    await fetch(`/api/dashboards/${dashboard.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, description: editDesc, config_json: dashboard.config_json }),
    });
    setDashboard({ ...dashboard, name: editName, description: editDesc });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!dashboard || !confirm('Delete this dashboard?')) return;
    await fetch(`/api/dashboards/${dashboard.id}`, { method: 'DELETE' });
    router.push('/dashboards');
  };

  const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
  const CATEGORIES = ['Hardware', 'Peripherals', 'Audio', 'Video', 'Accessories', 'Storage', 'Memory'];

  const toggleRegion = (r: string) => {
    setRegionFilter(prev => {
      const next = prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r];
      if (next.length > 0) {
        filterCtx.setFilter({ filterId: 'region-filter', field: 'region', operator: 'in', value: next, label: `Region: ${next.join(', ')}` });
      } else {
        filterCtx.clearFilter('region-filter');
      }
      return next;
    });
  };
  const toggleCategory = (c: string) => {
    setCategoryFilter(prev => {
      const next = prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c];
      if (next.length > 0) {
        filterCtx.setFilter({ filterId: 'category-filter', field: 'category', operator: 'in', value: next, label: `Category: ${next.join(', ')}` });
      } else {
        filterCtx.clearFilter('category-filter');
      }
      return next;
    });
  };

  const profitMargin = Math.round((getVal('profit', 'sum') / (getVal('amount', 'sum') || 1)) * 100);

  if (loading) return <div className="p-8 text-[var(--text-muted)]">Loading dashboard...</div>;
  if (!dashboard) return <div className="p-8 text-[var(--text-muted)]">Dashboard not found</div>;

  const config = dashboard.config_json ?? {};
  const widgets: WidgetConfig[] = config.widgets ?? [];
  const hasGlobalFilters = (config.globalFilters ?? []).length > 0;

  const kpiDef = (id: string, name: string, target: number) => ({
    id, name, target, unit: 'currency' as const, direction: 'higher_is_better' as const,
    thresholds: { ok: 80, warn: 50 }, deltaComparison: 'none' as const, dimensions: [],
    dataSource: { type: 'field' as const, field: 'amount' },
  });

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
              <h1 className="text-2xl font-bold">{dashboard.name}</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">{dashboard.description}</p>
            </>
          )}
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
              <button onClick={handleDelete} className="px-3 py-1.5 text-sm bg-red-900/30 text-red-400 rounded-md hover:bg-red-900/50">Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Global Filter Bar */}
      {hasGlobalFilters && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 mb-6">
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-3">Global Filters</h3>
          <div className="flex flex-wrap gap-4">
            {(config.globalFilters as string[]).includes('region') && (
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Region</label>
                <div className="flex gap-1 flex-wrap">
                  {REGIONS.map(r => (
                    <button key={r} onClick={() => toggleRegion(r)} className={`px-2 py-0.5 text-xs rounded transition-colors ${regionFilter.includes(r) ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(config.globalFilters as string[]).includes('category') && (
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Category</label>
                <div className="flex gap-1 flex-wrap">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => toggleCategory(c)} className={`px-2 py-0.5 text-xs rounded transition-colors ${categoryFilter.includes(c) ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(regionFilter.length > 0 || categoryFilter.length > 0) && (
              <button onClick={() => { setRegionFilter([]); setCategoryFilter([]); filterCtx.clearAll(); }} className="self-end text-xs text-[var(--accent)] hover:underline">
                Clear All
              </button>
            )}
          </div>
          {(regionFilter.length > 0 || categoryFilter.length > 0) && (
            <div className="flex items-center gap-3 mt-2">
              <p className="text-xs text-[var(--text-muted)]">{filteredData.length} of {salesData.length} records</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                FilterContext active ({filterCtx.resolveFilters().length} filter{filterCtx.resolveFilters().length !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Render widgets */}
      {widgets.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {widgets.map(w => (
            <div key={w.widgetId} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-2">{w.title}</h3>
              {w.type === 'kpi_card' && (
                <DynamicKPICard kpiDefinition={kpiDef(w.widgetId, w.title, 5000000)} value={getVal(w.dataField, w.aggregation)} cardStyle="compact" />
              )}
              {w.type === 'gauge' && (
                <DynamicGauge value={profitMargin} min={0} max={100} label={w.title} thresholds={[{ value: 30, color: '#ef4444', label: 'Low' }, { value: 60, color: '#f97316', label: 'Med' }, { value: 100, color: '#22c55e', label: 'High' }]} />
              )}
              {(w.type === 'bar_chart' || w.type === 'line_chart' || w.type === 'pie_chart' || w.type === 'trend_line' || w.type === 'funnel_chart' || w.type === 'scatter_chart') && (
                <p className="text-xs text-[var(--text-muted)]">
                  {w.aggregation}({w.dataField}) = {getVal(w.dataField, w.aggregation).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Default dashboard layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <DynamicKPICard kpiDefinition={kpiDef('rev', 'Revenue', 5000000)} value={getVal('amount', 'sum')} previousValue={getVal('amount', 'sum') * 0.89} cardStyle="compact" />
            <DynamicKPICard kpiDefinition={kpiDef('profit', 'Profit', 2000000)} value={getVal('profit', 'sum')} previousValue={getVal('profit', 'sum') * 0.92} cardStyle="compact" />
            <DynamicKPICard kpiDefinition={{ ...kpiDef('aov', 'Avg Order', 3000), unit: 'currency' as const }} value={Math.round(getVal('amount', 'avg'))} cardStyle="compact" />
            <DynamicKPICard kpiDefinition={{ ...kpiDef('orders', 'Orders', 1200), unit: 'count' as const }} value={getVal('amount', 'count')} cardStyle="compact" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
              <DynamicBarChart data={barData} chartTitle="Revenue by Region" maxBars={10} colors={['#f97316']} />
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
              <DynamicPieChart data={pieData} title="Revenue by Category" donut={false} showLegend />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
              <DynamicLineChart data={lineData} title="Quarterly Revenue" showGrid showAxis showLegend={false} />
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Profit Margin</h3>
              <div className="flex items-center justify-center" style={{ height: 280 }}>
                <DynamicGauge value={profitMargin} min={0} max={100} label="Profit %" thresholds={[{ value: 30, color: '#ef4444', label: 'Low' }, { value: 60, color: '#f97316', label: 'Medium' }, { value: 100, color: '#22c55e', label: 'High' }]} />
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Revenue Trend</h3>
            <DynamicTrendLine data={trendData} lineColor="#818cf8" />
          </div>
        </>
      )}
    </div>
  );
}
