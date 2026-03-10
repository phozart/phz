'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';
import {
  DynamicKPICard, DynamicBarChart, DynamicLineChart, DynamicPieChart,
  DynamicGauge, DynamicTrendLine, DynamicFunnelChart, DynamicScatterChart,
} from '@/components/wrappers/DynamicWidgets';
import { computeAggregations } from '@/lib/engine';

interface SavedDashboard {
  id: number;
  name: string;
  description: string;
  config_json: any;
  updated_at: string;
}

export default function DashboardsPage() {
  const { resolved } = useTheme();
  const [savedDashboards, setSavedDashboards] = useState<SavedDashboard[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/dashboards')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSavedDashboards(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/datasets/sales_orders?mode=page&limit=1000&offset=0')
      .then(r => r.json())
      .then(body => setSalesData(body.data ?? []))
      .catch(() => {});
  }, []);

  const aggs = useMemo(() => computeAggregations(salesData, {
    fields: [
      { field: 'amount', functions: ['sum', 'avg', 'count', 'min', 'max'] },
      { field: 'profit', functions: ['sum', 'avg'] },
      { field: 'quantity', functions: ['sum'] },
      { field: 'discount', functions: ['avg'] },
    ],
  }), [salesData]);

  const getVal = (field: string, fn: string): number => (aggs as any)?.fieldResults?.[field]?.[fn] ?? 0;

  const barData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of salesData) map[row.region] = (map[row.region] || 0) + row.amount;
    return { label: 'Revenue', data: Object.entries(map).map(([x, y]) => ({ x, y })) };
  }, [salesData]);

  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of salesData) map[row.category] = (map[row.category] || 0) + row.amount;
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  }, [salesData]);

  const lineData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of salesData) {
      const key = `${row.year} ${row.quarter}`;
      map[key] = (map[key] || 0) + row.amount;
    }
    return [{ label: 'Revenue', points: Object.entries(map).sort().map(([x, y]) => ({ x, y })), color: '#22c55e' }];
  }, [salesData]);

  const trendData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of salesData) {
      const key = `${row.year} ${row.quarter}`;
      map[key] = (map[key] || 0) + row.amount;
    }
    return { label: 'Quarterly Revenue', data: Object.entries(map).sort().map(([x, y]) => ({ x, y })) };
  }, [salesData]);

  const funnelData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of salesData) map[row.product] = (map[row.product] || 0) + row.amount;
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([stage, value]) => ({ stage, value }));
  }, [salesData]);

  const scatterData = useMemo(() =>
    salesData.slice(0, 200).map(r => ({ x: r.unitPrice, y: r.quantity, label: r.product })),
  [salesData]);

  const profitMargin = Math.round((getVal('profit', 'sum') / getVal('amount', 'sum')) * 100);

  const revenueKPI = useMemo(() => ({
    id: 'rev', name: 'Total Revenue', target: 5000000,
    unit: 'currency' as const, direction: 'higher_is_better' as const,
    thresholds: { ok: 80, warn: 50 }, deltaComparison: 'previous_period' as const,
    dimensions: [], dataSource: { type: 'field' as const, field: 'amount' },
  }), []);

  const profitKPI = useMemo(() => ({
    id: 'profit', name: 'Total Profit', target: 2000000,
    unit: 'currency' as const, direction: 'higher_is_better' as const,
    thresholds: { ok: 80, warn: 50 }, deltaComparison: 'previous_period' as const,
    dimensions: [], dataSource: { type: 'field' as const, field: 'profit' },
  }), []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Delete this dashboard?')) return;
    await fetch(`/api/dashboards/${id}`, { method: 'DELETE' });
    setSavedDashboards(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboards</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Interactive charts and KPI visualizations
          </p>
        </div>
        <Link href="/dashboards/new" className="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded-md font-medium">
          + New Dashboard
        </Link>
      </div>

      {/* Saved Dashboards */}
      {savedDashboards.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Saved Dashboards</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {savedDashboards.map(d => (
              <Link
                key={d.id}
                href={`/dashboards/${d.id}`}
                className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--accent)] transition-colors block relative group"
              >
                <h3 className="font-semibold text-sm">{d.name}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{d.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-[var(--text-muted)]">{new Date(d.updated_at).toLocaleDateString()}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                    {(d.config_json?.widgets ?? []).length} widgets
                  </span>
                </div>
                <button
                  onClick={(e) => handleDelete(d.id, e)}
                  className="absolute top-2 right-2 text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  x
                </button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Demo Dashboard */}
      <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Demo Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <DynamicKPICard kpiDefinition={revenueKPI} value={getVal('amount', 'sum')} previousValue={getVal('amount', 'sum') * 0.89} cardStyle="compact" />
        <DynamicKPICard kpiDefinition={profitKPI} value={getVal('profit', 'sum')} previousValue={getVal('profit', 'sum') * 0.92} cardStyle="compact" />
        <DynamicKPICard kpiDefinition={{ id: 'aov', name: 'Avg Order Value', target: 3000, unit: 'currency' as const, direction: 'higher_is_better' as const, thresholds: { ok: 80, warn: 50 }, deltaComparison: 'none' as const, dimensions: [], dataSource: { type: 'field' as const, field: 'amount' } }} value={Math.round(getVal('amount', 'avg'))} cardStyle="compact" />
        <DynamicKPICard kpiDefinition={{ id: 'orders', name: 'Total Orders', target: 1200, unit: 'count' as const, direction: 'higher_is_better' as const, thresholds: { ok: 80, warn: 50 }, deltaComparison: 'none' as const, dimensions: [], dataSource: { type: 'field' as const, field: 'amount' } }} value={getVal('amount', 'count')} cardStyle="compact" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4"><DynamicBarChart data={barData} chartTitle="Revenue by Region" maxBars={10} colors={['#f97316']} /></div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4"><DynamicPieChart data={pieData} title="Revenue by Category" donut={false} showLegend /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4"><DynamicLineChart data={lineData} title="Quarterly Revenue Trend" showGrid showAxis showLegend={false} /></div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Profit Margin</h3>
          <div className="flex items-center justify-center" style={{ height: 280 }}>
            <DynamicGauge value={profitMargin} min={0} max={100} label="Profit %" thresholds={[{ value: 30, color: '#ef4444', label: 'Low' }, { value: 60, color: '#f97316', label: 'Medium' }, { value: 100, color: '#22c55e', label: 'High' }]} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Revenue Trend</h3>
          <DynamicTrendLine data={trendData} lineColor="#818cf8" />
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4"><DynamicFunnelChart data={funnelData} title="Top Products" showLabels showPercentage /></div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4"><DynamicScatterChart data={scatterData} title="Price vs Quantity (first 200)" showGrid showAxis /></div>
      </div>
    </div>
  );
}
