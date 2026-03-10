'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { DynamicPhzGrid, DynamicPhzCriteria } from '@/components/wrappers/DynamicGrid';
import { DATASETS, listDatasets } from '@/lib/datasets-registry';
import type { DatasetDefinition, DatasetColumn } from '@/lib/datasets-registry';

const DATASET_LIST = listDatasets();

interface DatasetMeta {
  id: string;
  rowCount: number | null;
  loading: boolean;
}

export default function DatasetsPage() {
  const { resolved } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [meta, setMeta] = useState<Record<string, DatasetMeta>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [filteredData, setFilteredData] = useState<any[] | null>(null);
  const [previewLimit, setPreviewLimit] = useState(100);

  // Fetch row counts for all datasets on mount
  useEffect(() => {
    for (const ds of DATASET_LIST) {
      setMeta(prev => ({ ...prev, [ds.id]: { id: ds.id, rowCount: null, loading: true } }));
      fetch(`/api/datasets/${ds.id}?mode=count`)
        .then(r => r.json())
        .then(body => {
          setMeta(prev => ({ ...prev, [ds.id]: { id: ds.id, rowCount: Number(body.count), loading: false } }));
        })
        .catch(() => {
          setMeta(prev => ({ ...prev, [ds.id]: { id: ds.id, rowCount: null, loading: false } }));
        });
    }
  }, []);

  const selected = selectedId ? DATASETS[selectedId] : null;
  const displayData = filteredData ?? previewData;

  const loadPreview = useCallback(async (dsId: string, limit: number) => {
    setPreviewLoading(true);
    setPreviewData([]);
    setFilteredData(null);
    try {
      const resp = await fetch(`/api/datasets/${dsId}?mode=page&limit=${limit}&offset=0`);
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error ?? `HTTP ${resp.status}`);
      setPreviewData(body.data ?? []);
    } catch {
      setPreviewData([]);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const selectDataset = (id: string) => {
    setSelectedId(id);
    setPreviewData([]);
    setFilteredData(null);
  };

  const handleCriteriaApply = (detail: any) => {
    const ctx = detail.context ?? detail;
    if (!ctx || !ctx.activeFilters || Object.keys(ctx.activeFilters).length === 0) {
      setFilteredData(null);
      return;
    }
    let result = [...previewData] as Record<string, any>[];
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
  };

  const typeIcon = (type?: string) => {
    switch (type) {
      case 'number': return '#';
      case 'date': return '📅';
      case 'boolean': return '☑';
      default: return 'Aa';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Datasets</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Available data sources — browse schema and preview records from PostgreSQL
        </p>
      </div>

      {/* Dataset cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {DATASET_LIST.map(ds => {
          const m = meta[ds.id];
          const isSelected = selectedId === ds.id;
          return (
            <button
              key={ds.id}
              onClick={() => selectDataset(ds.id)}
              className={`text-left p-5 rounded-lg border transition-colors ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{ds.name}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{ds.description}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  {m?.loading ? (
                    <span className="text-xs text-[var(--text-muted)] animate-pulse">counting...</span>
                  ) : m?.rowCount != null ? (
                    <span className="text-lg font-bold text-[var(--text-primary)]">{m.rowCount.toLocaleString()}</span>
                  ) : m && !m.loading ? (
                    <span className="text-xs text-red-400">offline</span>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">—</span>
                  )}
                  <p className="text-[10px] text-[var(--text-muted)]">rows</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                  {ds.columns.length} columns
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                  {ds.criteria.fields.length} filters
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-mono">
                  {ds.sourceTable}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected dataset detail */}
      {selected && (
        <div className="space-y-4">
          {/* Schema table */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold">
                {selected.name} — Schema
              </h2>
              <span className="text-xs text-[var(--text-muted)]">{selected.columns.length} fields</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-4 py-2 text-[var(--text-muted)] text-xs font-medium w-8">Type</th>
                  <th className="text-left px-4 py-2 text-[var(--text-muted)] text-xs font-medium">Field</th>
                  <th className="text-left px-4 py-2 text-[var(--text-muted)] text-xs font-medium">Header</th>
                  <th className="text-left px-4 py-2 text-[var(--text-muted)] text-xs font-medium">Width</th>
                  <th className="text-center px-4 py-2 text-[var(--text-muted)] text-xs font-medium">Sortable</th>
                  <th className="text-center px-4 py-2 text-[var(--text-muted)] text-xs font-medium">Filterable</th>
                  <th className="text-center px-4 py-2 text-[var(--text-muted)] text-xs font-medium">Editable</th>
                </tr>
              </thead>
              <tbody>
                {selected.columns.map((col: DatasetColumn) => (
                  <tr key={col.field} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2 text-center text-xs">{typeIcon(col.type)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{col.field}</td>
                    <td className="px-4 py-2">{col.header}</td>
                    <td className="px-4 py-2 text-xs text-[var(--text-muted)]">{col.width}px</td>
                    <td className="px-4 py-2 text-center">{col.sortable ? <span className="text-green-400 text-xs">yes</span> : <span className="text-[var(--text-muted)] text-xs">—</span>}</td>
                    <td className="px-4 py-2 text-center">{col.filterable ? <span className="text-green-400 text-xs">yes</span> : <span className="text-[var(--text-muted)] text-xs">—</span>}</td>
                    <td className="px-4 py-2 text-center">{col.editable ? <span className="text-green-400 text-xs">yes</span> : <span className="text-[var(--text-muted)] text-xs">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Criteria fields */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold">Available Filters</h2>
              <span className="text-xs text-[var(--text-muted)]">{selected.criteria.fields.length} definitions</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
              {selected.criteria.fields.map(f => (
                <div key={f.id} className="border border-[var(--border)] rounded-lg p-3 bg-[var(--bg-tertiary)]">
                  <p className="text-xs font-semibold">{f.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{f.type} on <span className="font-mono">{f.dataField}</span></p>
                  {f.options && (
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">{f.options.length} options</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status colors */}
          {Object.keys(selected.statusColors).length > 0 && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
              <h2 className="text-sm font-semibold mb-3">Status Colors</h2>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(selected.statusColors).map(([status, colors]) => (
                  <div key={status} className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ background: colors.bg }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: colors.dot }} />
                    <span className="text-xs font-medium" style={{ color: colors.color }}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data preview */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold">Data Preview</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">Rows:</span>
                {[50, 100, 500, 1000].map(n => (
                  <button
                    key={n}
                    onClick={() => { setPreviewLimit(n); loadPreview(selected.id, n); }}
                    disabled={previewLoading}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                      previewData.length > 0 && previewLimit === n
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                {previewLoading && <span className="text-xs text-[var(--accent)] animate-pulse">Loading...</span>}
              </div>
            </div>

            {previewData.length > 0 && (
              <div className="p-4">
                <div className="mb-3">
                  <DynamicPhzCriteria
                    config={selected.criteria}
                    data={previewData}
                    onCriteriaApply={handleCriteriaApply}
                    onCriteriaReset={() => setFilteredData(null)}
                  />
                </div>
                <div className="text-xs text-[var(--text-muted)] mb-2">
                  {displayData.length} of {(meta[selected.id]?.rowCount ?? previewData.length).toLocaleString()} records
                </div>
                <div style={{ height: 500 }}>
                  <DynamicPhzGrid
                    data={displayData}
                    columns={selected.columns}
                    height="480px"
                    theme={resolved}
                    density="compact"
                    selectionMode="multi"
                    showToolbar
                    showSearch
                    showPagination
                    showCheckboxes
                    showDensityToggle
                    showCsvExport
                    pageSize={20}
                    pageSizeOptions={[10, 20, 50, 100]}
                    statusColors={selected.statusColors}
                    rowBanding
                    hoverHighlight
                    gridLines="horizontal"
                    allowSorting
                    allowFiltering
                    compactNumbers
                    gridTitle={`${selected.name} — Preview`}
                    gridSubtitle={`${displayData.length} records from PostgreSQL`}
                  />
                </div>
              </div>
            )}

            {previewData.length === 0 && !previewLoading && (
              <div className="p-8 text-center">
                <p className="text-sm text-[var(--text-muted)]">Click a row count button above to load a data preview</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!selected && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">Select a dataset above to view its schema and preview data</p>
        </div>
      )}
    </div>
  );
}
