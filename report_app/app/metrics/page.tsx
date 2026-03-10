'use client';

import { useMemo, useState, useEffect } from 'react';
import { computeAggregations } from '@/lib/engine';
import { DynamicKPICard, DynamicGauge, DynamicTrendLine } from '@/components/wrappers/DynamicWidgets';

interface MetricDef {
  id: string;
  name: string;
  category: string;
  dataset: 'sales' | 'employees';
  field: string;
  fn: 'sum' | 'avg' | 'min' | 'max' | 'count';
  format: 'currency' | 'number' | 'percent';
  target?: number;
  description: string;
}

const METRICS: MetricDef[] = [
  { id: 'rev-total', name: 'Total Revenue', category: 'Revenue', dataset: 'sales', field: 'amount', fn: 'sum', format: 'currency', target: 5000000, description: 'Sum of all order amounts' },
  { id: 'rev-avg', name: 'Avg Order Value', category: 'Revenue', dataset: 'sales', field: 'amount', fn: 'avg', format: 'currency', target: 3000, description: 'Average revenue per order' },
  { id: 'profit-total', name: 'Total Profit', category: 'Profitability', dataset: 'sales', field: 'profit', fn: 'sum', format: 'currency', target: 2000000, description: 'Sum of all order profits' },
  { id: 'profit-avg', name: 'Avg Profit', category: 'Profitability', dataset: 'sales', field: 'profit', fn: 'avg', format: 'currency', description: 'Average profit per order' },
  { id: 'qty-total', name: 'Units Sold', category: 'Volume', dataset: 'sales', field: 'quantity', fn: 'sum', format: 'number', target: 10000, description: 'Total quantity of items sold' },
  { id: 'disc-avg', name: 'Avg Discount', category: 'Pricing', dataset: 'sales', field: 'discount', fn: 'avg', format: 'percent', description: 'Average discount percentage' },
  { id: 'salary-avg', name: 'Avg Salary', category: 'Workforce', dataset: 'employees', field: 'salary', fn: 'avg', format: 'currency', description: 'Average employee salary' },
  { id: 'salary-total', name: 'Total Payroll', category: 'Workforce', dataset: 'employees', field: 'salary', fn: 'sum', format: 'currency', description: 'Total annual salary expense' },
  { id: 'rating-avg', name: 'Avg Rating', category: 'Performance', dataset: 'employees', field: 'rating', fn: 'avg', format: 'number', target: 4.0, description: 'Average employee performance rating' },
  { id: 'projects-avg', name: 'Avg Projects', category: 'Performance', dataset: 'employees', field: 'projects', fn: 'avg', format: 'number', description: 'Average number of projects per employee' },
];

export default function MetricsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [salesData, setSalesData] = useState<any[]>([]);
  const [employeeData, setEmployeeData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/datasets/sales_orders?mode=page&limit=1000&offset=0')
      .then(r => r.json()).then(body => setSalesData(body.data ?? [])).catch(() => {});
    fetch('/api/datasets/employees?mode=page&limit=1000&offset=0')
      .then(r => r.json()).then(body => setEmployeeData(body.data ?? [])).catch(() => {});
  }, []);

  const salesAggs = useMemo(() => computeAggregations(salesData, {
    fields: [
      { field: 'amount', functions: ['sum', 'avg', 'count', 'min', 'max'] },
      { field: 'profit', functions: ['sum', 'avg'] },
      { field: 'quantity', functions: ['sum', 'avg'] },
      { field: 'discount', functions: ['avg'] },
    ],
  }), [salesData]);

  const empAggs = useMemo(() => computeAggregations(employeeData, {
    fields: [
      { field: 'salary', functions: ['sum', 'avg', 'min', 'max'] },
      { field: 'rating', functions: ['avg', 'min', 'max'] },
      { field: 'projects', functions: ['sum', 'avg'] },
    ],
  }), [employeeData]);

  const getVal = (m: MetricDef): number => {
    const aggs = m.dataset === 'sales' ? salesAggs : empAggs;
    return (aggs as any)?.fieldResults?.[m.field]?.[m.fn] ?? 0;
  };

  const formatVal = (val: number, fmt: string) => {
    if (fmt === 'currency') return val >= 1000000 ? `$${(val / 1000000).toFixed(2)}M` : val >= 1000 ? `$${(val / 1000).toFixed(1)}K` : `$${val.toFixed(0)}`;
    if (fmt === 'percent') return `${val.toFixed(1)}%`;
    return val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val.toFixed(val % 1 === 0 ? 0 : 1);
  };

  const categories = [...new Set(METRICS.map(m => m.category))];
  const filtered = selectedCategory ? METRICS.filter(m => m.category === selectedCategory) : METRICS;

  // Quarterly trend as ChartDataSeries for phz-trend-line
  const quarterlyTrend = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of salesData) {
      const key = `${row.year}-${row.quarter}`;
      map[key] = (map[key] || 0) + row.amount;
    }
    const sorted = Object.entries(map).sort();
    return {
      label: 'Quarterly Revenue',
      data: sorted.map(([x, y]) => ({ x, y })),
    };
  }, [salesData]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Metrics & KPIs</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Track key performance indicators powered by phz-engine aggregations
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${!selectedCategory ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          All ({METRICS.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${selectedCategory === cat ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filtered.map(m => {
          const val = getVal(m);
          const pct = m.target ? Math.min(Math.round((val / m.target) * 100), 100) : null;
          return (
            <div key={m.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{m.category}</p>
                  <h3 className="font-semibold text-sm mt-0.5">{m.name}</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                  {m.dataset} / {m.fn}
                </span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)] mb-1">{formatVal(val, m.format)}</p>
              <p className="text-xs text-[var(--text-muted)] mb-3">{m.description}</p>
              {pct !== null && (
                <div>
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                    <span>Target: {formatVal(m.target!, m.format)}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 80 ? '#22c55e' : pct >= 50 ? '#f97316' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Widget Showcase */}
      <h2 className="text-lg font-semibold mb-4">Widget Showcase</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Revenue KPI</h3>
          <DynamicKPICard
            kpiDefinition={{ id: 'rev', name: 'Revenue', target: 5000000, unit: 'currency' as const, direction: 'higher_is_better' as const, thresholds: { ok: 80, warn: 50 }, deltaComparison: 'previous_period' as const, dimensions: [], dataSource: { type: 'field' as const, field: 'amount' } }}
            value={getVal(METRICS[0])}
            previousValue={getVal(METRICS[0]) * 0.88}
            cardStyle="expanded"
          />
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Target Progress</h3>
          <div className="flex items-center justify-center" style={{ height: 160 }}>
            <DynamicGauge
              value={Math.round((getVal(METRICS[0]) / 5000000) * 100)}
              min={0}
              max={100}
              label="% of Target"
              thresholds={[
                { value: 50, color: '#ef4444', label: 'Behind' },
                { value: 80, color: '#f97316', label: 'On Track' },
                { value: 100, color: '#22c55e', label: 'Achieved' },
              ]}
            />
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Quarterly Trend</h3>
          <DynamicTrendLine
            data={quarterlyTrend}
            lineColor="#22c55e"
          />
        </div>
      </div>
    </div>
  );
}
