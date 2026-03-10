/**
 * React Dashboard Example
 *
 * Demonstrates integrating @phozart/phz-engine + @phozart/phz-widgets
 * with a React application.
 *
 * Prerequisites (package.json):
 * {
 *   "dependencies": {
 *     "@phozart/phz-engine": "^0.1.0",
 *     "@phozart/phz-widgets": "^0.1.0",
 *     "react": "^18.0.0",
 *     "react-dom": "^18.0.0"
 *   }
 * }
 *
 * Usage:
 *   import { SalesDashboard } from './react-dashboard';
 *   // In your app: <SalesDashboard />
 */

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  createBIEngine,
  type BIEngine,
  type KPIDefinition,
  type DashboardConfig,
  type WidgetPlacement,
} from '@phozart/phz-engine';

// Import widgets to register custom elements (side-effect import)
import '@phozart/phz-widgets';

// -- Data types --

interface SalesRecord {
  region: string;
  month: string;
  revenue: number;
  customers: number;
  category: string;
}

// -- Sample data --

const SALES_DATA: SalesRecord[] = [
  { region: 'North', month: 'Jan', revenue: 42000, customers: 120, category: 'Software' },
  { region: 'South', month: 'Jan', revenue: 38000, customers: 95,  category: 'Hardware' },
  { region: 'East',  month: 'Jan', revenue: 55000, customers: 140, category: 'Software' },
  { region: 'West',  month: 'Jan', revenue: 61000, customers: 165, category: 'Services' },
  { region: 'North', month: 'Feb', revenue: 45000, customers: 130, category: 'Software' },
  { region: 'South', month: 'Feb', revenue: 41000, customers: 102, category: 'Hardware' },
  { region: 'East',  month: 'Feb', revenue: 58000, customers: 148, category: 'Software' },
  { region: 'West',  month: 'Feb', revenue: 63000, customers: 170, category: 'Services' },
  { region: 'North', month: 'Mar', revenue: 48000, customers: 135, category: 'Services' },
  { region: 'South', month: 'Mar', revenue: 43000, customers: 110, category: 'Software' },
  { region: 'East',  month: 'Mar', revenue: 60000, customers: 155, category: 'Hardware' },
  { region: 'West',  month: 'Mar', revenue: 67000, customers: 180, category: 'Software' },
];

// -- KPI Definitions --

const KPI_DEFINITIONS: KPIDefinition[] = [
  {
    id: 'total-revenue' as any,
    name: 'Total Revenue',
    dataProductId: 'sales' as any,
    field: 'revenue',
    aggregation: 'sum',
    unit: 'currency',
    direction: 'up',
    target: 500000,
    thresholds: { green: 400000, amber: 300000, red: 0 },
  },
  {
    id: 'total-customers' as any,
    name: 'Total Customers',
    dataProductId: 'sales' as any,
    field: 'customers',
    aggregation: 'sum',
    unit: 'count',
    direction: 'up',
    target: 1500,
    thresholds: { green: 1200, amber: 900, red: 0 },
  },
];

// -- React wrapper for Web Components --
// phz-widgets are standard Web Components. In React, pass complex properties
// via refs since React doesn't natively handle Web Component properties.

function useWebComponentRef<T extends HTMLElement>(
  props: Record<string, unknown>,
): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    for (const [key, value] of Object.entries(props)) {
      (el as any)[key] = value;
    }
  }, [props]);

  return ref;
}

// -- KPI Card Component --

function KPICard({
  kpiDefinition,
  value,
  previousValue,
  trendData,
}: {
  kpiDefinition: KPIDefinition;
  value: number;
  previousValue?: number;
  trendData?: number[];
}) {
  const ref = useWebComponentRef<HTMLElement>({
    kpiDefinition,
    value,
    previousValue,
    trendData,
  });

  return React.createElement('phz-kpi-card', { ref });
}

// -- Bar Chart Component --

function BarChart({
  data,
  rankOrder = 'desc',
  maxBars = 10,
}: {
  data: { field: string; label: string; data: { x: string; y: number; label: string }[] };
  rankOrder?: 'asc' | 'desc';
  maxBars?: number;
}) {
  const ref = useWebComponentRef<HTMLElement>({ data, rankOrder, maxBars });
  return React.createElement('phz-bar-chart', { ref });
}

// -- Trend Line Component --

function TrendLine({
  data,
  target,
  kpiDefinition,
}: {
  data: { field: string; label: string; data: { x: string; y: number; label: string }[] };
  target?: number;
  kpiDefinition?: KPIDefinition;
}) {
  const ref = useWebComponentRef<HTMLElement>({ data, target, kpiDefinition });
  return React.createElement('phz-trend-line', { ref });
}

// -- Main Dashboard --

export function SalesDashboard() {
  // Create the engine once
  const engine = useMemo(() => createBIEngine({
    initialKPIs: KPI_DEFINITIONS,
  }), []);

  // Compute aggregates
  const totalRevenue = useMemo(
    () => SALES_DATA.reduce((sum, r) => sum + r.revenue, 0),
    [],
  );
  const totalCustomers = useMemo(
    () => SALES_DATA.reduce((sum, r) => sum + r.customers, 0),
    [],
  );

  // Region chart data
  const regionData = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of SALES_DATA) {
      totals[row.region] = (totals[row.region] || 0) + row.revenue;
    }
    return {
      field: 'revenue',
      label: 'Revenue by Region',
      data: Object.entries(totals).map(([region, total]) => ({
        x: region, y: total, label: region,
      })),
    };
  }, []);

  // Monthly trend data
  const monthlyData = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of SALES_DATA) {
      totals[row.month] = (totals[row.month] || 0) + row.revenue;
    }
    return {
      field: 'revenue',
      label: 'Monthly Revenue',
      data: Object.entries(totals).map(([month, total]) => ({
        x: month, y: total, label: month,
      })),
    };
  }, []);

  // Handle drill-through events from widgets
  const handleDrillThrough = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    console.log('Drill-through from React:', detail);
  }, []);

  useEffect(() => {
    document.addEventListener('drill-through', handleDrillThrough);
    return () => document.removeEventListener('drill-through', handleDrillThrough);
  }, [handleDrillThrough]);

  const revenueKPI = engine.kpis.get('total-revenue' as any)!;
  const customersKPI = engine.kpis.get('total-customers' as any)!;

  return (
    <div style={{ padding: 24, background: '#FAFAF9', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 20, marginBottom: 24 }}>Sales Dashboard (React)</h1>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
        <KPICard
          kpiDefinition={revenueKPI}
          value={totalRevenue}
          previousValue={totalRevenue * 0.92}
          trendData={[400000, 420000, 440000, 460000, 480000, totalRevenue]}
        />
        <KPICard
          kpiDefinition={customersKPI}
          value={totalCustomers}
          previousValue={totalCustomers * 0.95}
          trendData={[1100, 1200, 1300, 1400, 1500, totalCustomers]}
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <BarChart data={regionData} rankOrder="desc" maxBars={5} />
        <TrendLine data={monthlyData} target={200000} kpiDefinition={revenueKPI} />
      </div>
    </div>
  );
}
