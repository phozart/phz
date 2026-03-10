'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useWorkspace } from '@/components/WorkspaceProvider';
import { useTheme } from '@/components/ThemeProvider';
import dynamic from 'next/dynamic';

const DynamicPhzGrid = dynamic(
  () => import('@phozart/phz-react/grid').then(m => m.PhzGrid),
  { ssr: false },
);

// Workspace explore imports
import {
  createFieldPalette,
  groupFieldsByType,
  searchFields,
  createDropZoneState,
  addFieldToZone,
  removeFieldFromZone,
  getDefaultAggregation,
  suggestChartType,
  toExploreQuery,
  exploreToReport,
  type DropZoneState,
  type ZoneName,
  type PaletteField,
} from '@phozart/phz-workspace/explore';

import { analyzeSchema } from '@phozart/phz-workspace/templates';

type DataSourceId = string;

export default function ExplorePage() {
  const { dataAdapter, schemas, loading: workspaceLoading } = useWorkspace();
  const { resolved: theme } = useTheme();

  const [selectedSource, setSelectedSource] = useState<DataSourceId>('sales_orders');
  const [dropZones, setDropZones] = useState<DropZoneState>(createDropZoneState());
  const [fieldSearch, setFieldSearch] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [chartSuggestion, setChartSuggestion] = useState<string | null>(null);

  const schema = schemas[selectedSource];

  const palette = useMemo(() => {
    if (!schema) return null;
    return createFieldPalette(schema.fields);
  }, [schema]);

  const fieldGroups = useMemo(() => {
    if (!schema) return new Map<string, any[]>();
    const fields = fieldSearch ? searchFields(schema.fields, fieldSearch) : schema.fields;
    return groupFieldsByType(fields);
  }, [schema, fieldSearch]);

  const schemaProfile = useMemo(() => {
    if (!schema) return null;
    return analyzeSchema(schema);
  }, [schema]);

  // Run preview query when drop zones change
  useEffect(() => {
    const dims = dropZones.rows;
    const vals = dropZones.values;
    if (dims.length === 0 && vals.length === 0) {
      setPreviewData([]);
      setChartSuggestion(null);
      return;
    }

    setPreviewLoading(true);
    const exploreQuery = toExploreQuery(dropZones, { limit: 5000 });

    dataAdapter.execute({
      source: selectedSource,
      fields: ['*'],
      limit: 5000,
    }).then(result => {
      // Client-side grouping from the raw data
      const rawRows = result.rows.map(row => {
        const obj: Record<string, unknown> = {};
        result.columns.forEach((col, i) => { obj[col.name] = row[i]; });
        return obj;
      });

      // If we have group-by dimensions, aggregate
      if (dims.length > 0 && vals.length > 0) {
        const groups = new Map<string, Record<string, unknown>>();
        for (const row of rawRows) {
          const key = dims.map(d => String(row[d.field] ?? '')).join('|');
          if (!groups.has(key)) {
            const base: Record<string, unknown> = {};
            dims.forEach(d => { base[d.field] = row[d.field]; });
            vals.forEach(v => { base[v.field] = 0; base[`${v.field}_count`] = 0; });
            groups.set(key, base);
          }
          const g = groups.get(key)!;
          vals.forEach(v => {
            const num = Number(row[v.field]) || 0;
            const agg = v.aggregation ?? 'sum';
            if (agg === 'sum' || agg === 'avg') {
              (g[v.field] as number) += num;
              (g[`${v.field}_count`] as number) += 1;
            } else if (agg === 'count') {
              (g[v.field] as number) += 1;
            } else if (agg === 'min') {
              g[v.field] = Math.min(g[v.field] as number || Infinity, num);
            } else if (agg === 'max') {
              g[v.field] = Math.max(g[v.field] as number || -Infinity, num);
            }
          });
        }
        // Fix averages
        const aggregated = [...groups.values()].map(g => {
          vals.forEach(v => {
            if ((v.aggregation ?? 'sum') === 'avg') {
              const count = g[`${v.field}_count`] as number;
              if (count > 0) g[v.field] = Math.round(((g[v.field] as number) / count) * 100) / 100;
            }
            delete g[`${v.field}_count`];
          });
          return g;
        });
        setPreviewData(aggregated);
      } else if (dims.length > 0) {
        // Just show distinct values for dimensions
        const seen = new Set<string>();
        const rows: Record<string, unknown>[] = [];
        for (const row of rawRows) {
          const key = dims.map(d => String(row[d.field])).join('|');
          if (!seen.has(key)) {
            seen.add(key);
            const obj: Record<string, unknown> = {};
            dims.forEach(d => { obj[d.field] = row[d.field]; });
            rows.push(obj);
          }
        }
        setPreviewData(rows.slice(0, 500));
      } else {
        // Just values — show raw data with those fields
        setPreviewData(rawRows.slice(0, 500).map(row => {
          const obj: Record<string, unknown> = {};
          vals.forEach(v => { obj[v.field] = row[v.field]; });
          return obj;
        }));
      }

      // Suggest chart type based on the ExploreQuery
      const fieldTypes = schema
        ? Object.fromEntries(schema.fields.map(f => [f.name, f.dataType]))
        : undefined;
      const suggestion = suggestChartType(exploreQuery, fieldTypes ? { fieldTypes } : undefined);
      setChartSuggestion(suggestion);
    }).catch(() => {
      setPreviewData([]);
    }).finally(() => {
      setPreviewLoading(false);
    });
  }, [dropZones, selectedSource, dataAdapter, schema]);

  const handleAddField = useCallback((field: PaletteField, zone: ZoneName) => {
    setDropZones(prev => {
      const entry = zone === 'values'
        ? { field: field.name, aggregation: getDefaultAggregation(field.dataType) }
        : { field: field.name };
      return addFieldToZone(prev, zone, entry as any);
    });
  }, []);

  const handleRemoveField = useCallback((zone: ZoneName, fieldName: string) => {
    setDropZones(prev => removeFieldFromZone(prev, zone, fieldName));
  }, []);

  const handleSaveAsReport = useCallback(() => {
    if (dropZones.rows.length === 0 && dropZones.values.length === 0) return;
    const query = toExploreQuery(dropZones);
    const reportName = `Explore — ${new Date().toLocaleString()}`;
    const artifact = exploreToReport(query, reportName, selectedSource);
    // Save via API
    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: artifact.name,
        description: `Auto-generated from Explorer: ${dropZones.rows.map(d => d.field).join(', ')}`,
        dataset: selectedSource,
        config: { columns: [...dropZones.rows.map(d => d.field), ...dropZones.values.map(v => v.field)] },
      }),
    }).then(r => r.json()).then(() => {
      alert('Report saved!');
    }).catch(() => alert('Failed to save report'));
  }, [dropZones, selectedSource]);

  // Build grid columns from preview data
  const gridColumns = useMemo(() => {
    if (previewData.length === 0) return [];
    return Object.keys(previewData[0]).map(key => ({
      field: key,
      header: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
      width: key === 'id' ? 70 : 130,
      type: typeof previewData[0][key] === 'number' ? 'number' as const : 'string' as const,
      sortable: true,
    }));
  }, [previewData]);

  if (workspaceLoading) {
    return <div className="p-8 text-[var(--text-muted)]">Loading workspace...</div>;
  }

  return (
    <div className="flex h-full">
      {/* Field Palette Sidebar */}
      <div className="w-64 shrink-0 border-r border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold mb-2">Data Source</h2>
          <select
            value={selectedSource}
            onChange={e => {
              setSelectedSource(e.target.value);
              setDropZones(createDropZoneState());
            }}
            className="w-full text-xs bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md px-2 py-1.5 text-[var(--text-primary)]"
          >
            {Object.keys(schemas).map(id => (
              <option key={id} value={id}>{schemas[id].name}</option>
            ))}
          </select>
        </div>

        <div className="p-4 border-b border-[var(--border)]">
          <input
            type="text"
            placeholder="Search fields..."
            value={fieldSearch}
            onChange={e => setFieldSearch(e.target.value)}
            className="w-full text-xs bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md px-2 py-1.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {[...fieldGroups.entries()].map(([type, fields]) => (
            <div key={type} className="mb-3">
              <p className="px-2 py-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">
                {type === 'number' ? 'Measures' : type === 'date' ? 'Time' : type === 'string' ? 'Dimensions' : 'Other'}
              </p>
              {fields.map((field: any) => {
                const paletteField: PaletteField = palette?.fields.find(p => p.name === field.name) ?? { name: field.name, dataType: field.dataType, typeIcon: field.dataType, draggable: true };
                return (
                  <div
                    key={field.name}
                    className="group flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-[var(--bg-tertiary)] cursor-pointer"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      type === 'number' ? 'bg-blue-500' : type === 'date' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <span className="text-[var(--text-secondary)] flex-1 truncate">{field.name}</span>
                    <span className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                      <button
                        onClick={() => handleAddField(paletteField, 'rows')}
                        className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        title="Add to rows"
                      >R</button>
                      <button
                        onClick={() => handleAddField(paletteField, 'values')}
                        className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                        title="Add to values"
                      >V</button>
                      <button
                        onClick={() => handleAddField(paletteField, 'filters')}
                        className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                        title="Add to filters"
                      >F</button>
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
          {schemaProfile && (
            <div className="mt-4 px-2 text-[10px] text-[var(--text-muted)] space-y-0.5">
              <p>{schemaProfile.suggestedMeasures.length} measures detected</p>
              <p>{schemaProfile.suggestedDimensions.length} dimensions detected</p>
              {schemaProfile.hasTimeSeries && <p>Time series available</p>}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Drop Zone Bar */}
        <div className="border-b border-[var(--border)] bg-[var(--bg-secondary)] p-3">
          <div className="flex gap-4">
            {/* Rows zone */}
            <DropZone
              label="Rows"
              color="emerald"
              items={dropZones.rows.map(d => ({ label: d.field, field: d.field }))}
              onRemove={f => handleRemoveField('rows', f)}
            />
            {/* Values zone */}
            <DropZone
              label="Values"
              color="blue"
              items={dropZones.values.map(v => ({ label: `${v.aggregation ?? 'sum'}(${v.field})`, field: v.field }))}
              onRemove={f => handleRemoveField('values', f)}
            />
            {/* Filters zone */}
            <DropZone
              label="Filters"
              color="amber"
              items={dropZones.filters.map(f => ({ label: f.field, field: f.field }))}
              onRemove={f => handleRemoveField('filters', f)}
            />
          </div>

          <div className="flex items-center gap-3 mt-2">
            {chartSuggestion && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)]">
                Suggested: {chartSuggestion}
              </span>
            )}
            <button
              onClick={() => setDropZones(createDropZoneState())}
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >Clear all</button>
            {previewData.length > 0 && (
              <button
                onClick={handleSaveAsReport}
                className="text-[10px] px-2 py-0.5 rounded bg-[var(--accent)] text-white hover:opacity-90"
              >Save as Report</button>
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto p-4">
          {previewLoading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              Querying...
            </div>
          ) : previewData.length > 0 ? (
            <div className="h-full min-h-[400px]">
              <DynamicPhzGrid
                data={previewData}
                columns={gridColumns}
                height={500}
                theme={theme}
                density="dense"
                showToolbar={true}
                showSearch={true}
                showPagination={previewData.length > 50}
                pageSize={50}
                allowSorting={true}
                compactNumbers={true}
                gridTitle={`Explorer — ${selectedSource}`}
                gridSubtitle={`${previewData.length} rows${dropZones.values.length > 0 ? ` (grouped by ${dropZones.rows.map(d => d.field).join(', ')})` : ''}`}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-4xl mb-4 opacity-30">⊞</div>
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">Visual Query Explorer</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-xs">
                Add fields from the palette to Rows, Values, or Filters to start exploring your data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DropZone({
  label,
  color,
  items,
  onRemove,
}: {
  label: string;
  color: 'emerald' | 'blue' | 'amber';
  items: { label: string; field: string }[];
  onRemove: (field: string) => void;
}) {
  const dotColor = color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-500' : 'bg-amber-500';
  const chipBg = color === 'emerald' ? 'bg-emerald-500/15 text-emerald-400' : color === 'blue' ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400';

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1 min-h-[26px] px-2 py-1 rounded border border-dashed border-[var(--border)] bg-[var(--bg-primary)]">
        {items.length === 0 ? (
          <span className="text-[10px] text-[var(--text-muted)] italic py-0.5">Drop fields here</span>
        ) : (
          items.map((item, i) => (
            <span key={i} className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${chipBg}`}>
              {item.label}
              <button onClick={() => onRemove(item.field)} className="opacity-60 hover:opacity-100">&times;</button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
