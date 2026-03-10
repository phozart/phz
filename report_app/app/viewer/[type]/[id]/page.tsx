'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { DynamicPhzGrid, DynamicPhzCriteria } from '@/components/wrappers/DynamicGrid';
import { DATASETS } from '@/lib/datasets-registry';
import { computeAggregations } from '@/lib/engine';

interface Artifact {
  id: number;
  name: string;
  description: string;
  dataset?: string;
  config_json: any;
  created_at: string;
  updated_at: string;
}

export default function ArtifactViewPage() {
  const params = useParams();
  const router = useRouter();
  const { resolved: theme } = useTheme();

  const artifactType = params.type as 'report' | 'dashboard';
  const artifactId = params.id as string;

  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[] | null>(null);

  // Fetch artifact
  useEffect(() => {
    const endpoint = artifactType === 'report'
      ? `/api/reports/${artifactId}`
      : `/api/dashboards/${artifactId}`;

    fetch(endpoint)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(setArtifact)
      .catch(() => router.push('/viewer'))
      .finally(() => setLoading(false));
  }, [artifactType, artifactId, router]);

  // Fetch data
  const datasetId = artifact?.dataset ?? artifact?.config_json?.source ?? 'sales_orders';
  useEffect(() => {
    if (!artifact) return;
    fetch(`/api/datasets/${datasetId}?mode=page&limit=1000&offset=0`)
      .then(r => r.json())
      .then(result => setData(result.data ?? []))
      .catch(() => setData([]));
  }, [artifact, datasetId]);

  const dataset = DATASETS[datasetId];
  const config = artifact?.config_json ?? {};
  const displayData = filteredData ?? data;

  // Criteria config for filters
  const criteriaConfig = useMemo(() => {
    if (!dataset) return null;
    const filterIds: string[] = config.filters ?? [];
    const fields = filterIds.length > 0
      ? dataset.criteria.fields.filter(f => filterIds.includes(f.id))
      : dataset.criteria.fields;
    return fields.length > 0 ? { fields } : null;
  }, [dataset, config.filters]);

  const handleCriteriaApply = useCallback((detail: any) => {
    const ctx = detail.context ?? detail;
    if (!ctx?.activeFilters || Object.keys(ctx.activeFilters).length === 0) {
      setFilteredData(null);
      return;
    }
    let result = [...data] as Record<string, any>[];
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
  }, [data]);

  if (loading) {
    return <div className="p-8 text-[var(--text-muted)]">Loading...</div>;
  }

  if (!artifact) {
    return <div className="p-8 text-[var(--text-muted)]">Artifact not found</div>;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/viewer')}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          &larr; Back
        </button>
        <span className={`w-2.5 h-2.5 rounded-full ${artifactType === 'report' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">{artifactType}</span>
      </div>

      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{artifact.name}</h1>
      <p className="text-sm text-[var(--text-muted)] mb-1">{artifact.description}</p>
      <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] mb-6">
        <span className="px-2 py-0.5 rounded bg-[var(--bg-tertiary)]">{dataset?.name ?? datasetId}</span>
        <span>Updated {new Date(artifact.updated_at).toLocaleString()}</span>
        <span>{displayData.length} records</span>
      </div>

      {/* Render Report */}
      {artifactType === 'report' && (
        <ReportView
          config={config}
          data={data}
          displayData={displayData}
          dataset={dataset}
          theme={theme}
          artifactName={artifact.name}
          criteriaConfig={criteriaConfig}
          onCriteriaApply={handleCriteriaApply}
          onCriteriaReset={() => setFilteredData(null)}
        />
      )}

      {/* Render Dashboard */}
      {artifactType === 'dashboard' && (
        <DashboardView
          config={config}
          data={data}
          displayData={displayData}
          dataset={dataset}
          theme={theme}
          criteriaConfig={criteriaConfig}
          onCriteriaApply={handleCriteriaApply}
          onCriteriaReset={() => setFilteredData(null)}
        />
      )}
    </div>
  );
}

// ---- Report View ----
function ReportView({ config, data, displayData, dataset, theme, artifactName, criteriaConfig, onCriteriaApply, onCriteriaReset }: {
  config: any; data: any[]; displayData: any[]; dataset: any; theme: string; artifactName: string;
  criteriaConfig: any; onCriteriaApply: (d: any) => void; onCriteriaReset: () => void;
}) {
  const allColumns: any[] = dataset?.columns ?? [];
  const columns = config.columns?.length > 0
    ? allColumns.filter((c: any) => config.columns.includes(c.field))
    : allColumns;
  const statusColors = dataset?.statusColors ?? {};

  const isSales = dataset?.id === 'sales_orders';
  const aggregations = useMemo(() => {
    if (isSales) {
      return computeAggregations(displayData, {
        fields: [
          { field: 'amount', functions: ['sum', 'avg', 'count'] },
          { field: 'profit', functions: ['sum'] },
          { field: 'quantity', functions: ['sum'] },
        ],
      });
    }
    return computeAggregations(displayData, {
      fields: [
        { field: 'salary', functions: ['sum', 'avg'] },
        { field: 'rating', functions: ['avg'] },
        { field: 'projects', functions: ['sum'] },
      ],
    });
  }, [displayData, isSales]);

  const getAgg = (field: string, fn: string) =>
    (aggregations as any)?.fieldResults?.[field]?.[fn] ?? 0;

  const fmtDol = (n: number) =>
    '$' + (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : n.toFixed(0));

  return (
    <>
      {/* KPI bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {isSales ? (
          <>
            <KPI label="Revenue" value={fmtDol(getAgg('amount', 'sum'))} />
            <KPI label="Profit" value={fmtDol(getAgg('profit', 'sum'))} />
            <KPI label="Orders" value={displayData.length.toLocaleString()} />
            <KPI label="Avg Order" value={fmtDol(getAgg('amount', 'avg'))} />
          </>
        ) : (
          <>
            <KPI label="Headcount" value={displayData.length.toLocaleString()} />
            <KPI label="Avg Salary" value={fmtDol(getAgg('salary', 'avg'))} />
            <KPI label="Payroll" value={fmtDol(getAgg('salary', 'sum'))} />
            <KPI label="Avg Rating" value={getAgg('rating', 'avg').toFixed(1)} />
          </>
        )}
      </div>

      {/* Criteria filters */}
      {criteriaConfig && (
        <div className="mb-4">
          <DynamicPhzCriteria
            config={criteriaConfig}
            data={data}
            onCriteriaApply={onCriteriaApply}
            onCriteriaReset={onCriteriaReset}
          />
        </div>
      )}

      {/* Grid */}
      <div style={{ height: 520 }}>
        <DynamicPhzGrid
          data={displayData}
          columns={columns}
          height="500px"
          theme={theme}
          density="compact"
          showToolbar
          showSearch
          showPagination
          showCsvExport
          pageSize={25}
          pageSizeOptions={[10, 25, 50, 100]}
          statusColors={statusColors}
          rowBanding
          hoverHighlight
          gridLines="horizontal"
          allowSorting
          allowFiltering
          compactNumbers
          groupBy={config.groupBy ? [config.groupBy] : undefined}
          gridTitle={artifactName}
          gridSubtitle={`${displayData.length} records`}
        />
      </div>
    </>
  );
}

// ---- Dashboard View ----
function DashboardView({ config, data, displayData, dataset, theme, criteriaConfig, onCriteriaApply, onCriteriaReset }: {
  config: any; data: any[]; displayData: any[]; dataset: any; theme: string;
  criteriaConfig: any; onCriteriaApply: (d: any) => void; onCriteriaReset: () => void;
}) {
  const widgets: any[] = config.widgets ?? [];
  const allColumns: any[] = dataset?.columns ?? [];

  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : n.toFixed(0);

  const computeMetric = (field: string, agg: string = 'sum') => {
    const vals = displayData.map(r => Number(r[field])).filter(n => !isNaN(n));
    if (vals.length === 0) return '--';
    if (agg === 'sum') return fmt(vals.reduce((a, b) => a + b, 0));
    if (agg === 'avg') return fmt(vals.reduce((a, b) => a + b, 0) / vals.length);
    if (agg === 'count') return fmt(vals.length);
    if (agg === 'min') return fmt(Math.min(...vals));
    if (agg === 'max') return fmt(Math.max(...vals));
    return '--';
  };

  const computeBarData = (field: string, dimension?: string) => {
    if (!dimension || displayData.length === 0) return [];
    const groups = new Map<string, number>();
    for (const row of displayData) {
      const key = String(row[dimension] ?? '');
      groups.set(key, (groups.get(key) ?? 0) + (Number(row[field]) || 0));
    }
    return [...groups.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([label, value]) => ({ label, value }));
  };

  return (
    <>
      {/* Criteria filters */}
      {criteriaConfig && (
        <div className="mb-4">
          <DynamicPhzCriteria
            config={criteriaConfig}
            data={data}
            onCriteriaApply={onCriteriaApply}
            onCriteriaReset={onCriteriaReset}
          />
        </div>
      )}

      {widgets.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-[var(--text-muted)]">This dashboard has no widgets configured.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {widgets.map((w: any) => {
            const span = w.span ?? 1;
            const colSpanClass = span >= 3 ? 'col-span-full' : span === 2 ? 'md:col-span-2' : '';

            return (
              <div
                key={w.id}
                className={`bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 ${colSpanClass}`}
              >
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">
                  {w.title || w.type}
                </p>

                {/* KPI widget */}
                {(w.type === 'kpi' || w.type === 'kpi-card' || w.type === 'metrics') && w.field && (
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {computeMetric(w.field, w.aggregation ?? 'sum')}
                  </p>
                )}

                {/* Metrics widget (all value fields) */}
                {w.type === 'metrics' && !w.field && (
                  <div className="grid grid-cols-3 gap-3">
                    {allColumns.filter(c => c.type === 'number').slice(0, 6).map(col => (
                      <div key={col.field}>
                        <p className="text-[10px] text-[var(--text-muted)]">{col.header}</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">{computeMetric(col.field)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bar chart widget */}
                {(w.type === 'bar' || w.type === 'bar-chart') && (() => {
                  const dim = w.dimension ?? allColumns.find(c => c.type === 'string' && c.field !== 'status')?.field;
                  const bars = computeBarData(w.field ?? allColumns.find(c => c.type === 'number')?.field ?? '', dim);
                  const maxVal = Math.max(...bars.map(b => b.value), 1);
                  return (
                    <div className="space-y-1.5">
                      {bars.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px]">
                          <span className="w-20 truncate text-[var(--text-muted)] text-right">{b.label}</span>
                          <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-4 overflow-hidden">
                            <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${(b.value / maxVal) * 100}%` }} />
                          </div>
                          <span className="w-12 text-[var(--text-secondary)] text-right">{fmt(b.value)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Table widget */}
                {(w.type === 'table' || w.type === 'data-table') && (
                  <div className="text-xs text-[var(--text-muted)]">
                    {displayData.length} records
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">{label}</p>
      <p className="text-xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
    </div>
  );
}
