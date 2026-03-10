'use client';

import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import dynamic from 'next/dynamic';
import { ReportAppDataAdapter } from '@/lib/workspace-data-adapter';
import { InMemoryPersistenceAdapter } from '@/lib/stub-persistence-adapter';
import { importViewer, importGrid } from '@/lib/import-guards';

/**
 * Viewer page — mounts the REAL <phz-viewer-shell> Lit web component
 * with slotted screen content.
 *
 * <phz-viewer-shell> provides navigation tabs (Catalog, Dashboard, Report, Explorer)
 * and routes to named slots: <slot name="catalog">, <slot name="dashboard">, etc.
 * The CONSUMER must provide content for each screen as slotted children.
 */

function SlottedPanel({ tag, slotName, ...props }: { tag: string; slotName: string; [key: string]: any }) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    for (const [key, value] of Object.entries(props)) {
      if (key === 'tag' || key === 'slotName') continue;
      (el as any)[key] = value;
    }
  });
  return React.createElement(tag, { ref, slot: slotName, style: { display: 'block', width: '100%' } });
}

/** Shape of the active report being viewed */
interface ActiveReport {
  reportId: string;
  reportTitle: string;
  reportDescription: string;
  columns: { field: string; label: string; visible: boolean; sortable: boolean }[];
  rows: unknown[][];
  totalRows: number;
  // Object-form rows for the <phz-grid> component
  gridData: Record<string, unknown>[];
  // ColumnDefinition[] for the grid (field + header)
  gridColumns: { field: string; header: string; sortable: boolean }[];
}

/**
 * Report panel with a nested <phz-grid> for actual data rendering.
 * <phz-viewer-report> provides the frame (title, pagination, export).
 * <phz-grid> renders the data table as a slotted child.
 */
function ReportPanel({ report, slotName }: { report: ActiveReport | null; slotName: string }) {
  const reportRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = reportRef.current;
    if (!el) return;
    if (report) {
      (el as any).reportId = report.reportId;
      (el as any).reportTitle = report.reportTitle;
      (el as any).reportDescription = report.reportDescription;
      (el as any).columns = report.columns;
      (el as any).rows = report.rows;
      (el as any).totalRows = report.totalRows;
    }
  });

  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el || !report) return;
    (el as any).data = report.gridData;
    (el as any).columns = report.gridColumns;
  });

  return React.createElement(
    'phz-viewer-report',
    {
      ref: reportRef,
      slot: slotName,
      style: { display: 'block', width: '100%' },
    },
    // The grid is slotted inside the report viewer's default <slot>.
    // grid-height sets the scroll container height inside the grid's shadow DOM.
    // Using a fixed value because percentage height collapses when the host is display:block.
    React.createElement('phz-grid', {
      ref: gridRef,
      'grid-height': '500px',
      'show-toolbar': false,
      style: { display: 'block', width: '100%' },
    }),
  );
}

function ViewerHost({ config, viewerContext, theme }: {
  config: any;
  viewerContext: any;
  theme: string;
}) {
  const hostRef = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [activeReport, setActiveReport] = useState<ActiveReport | null>(null);

  useEffect(() => {
    Promise.all([importViewer(), importGrid()]).then(() => setLoaded(true));
  }, []);

  // Load artifacts from persistence adapter for the catalog
  useEffect(() => {
    if (!config.persistenceAdapter) return;
    config.persistenceAdapter.list().then((result: any) => {
      // Convert persistence items to VisibilityMeta shape expected by phz-viewer-catalog
      const items = (result.items ?? result ?? []).map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        description: a.description,
        visibility: 'published' as const,
        ownerId: a.ownerId ?? 'system',
      }));
      setArtifacts(items);
    });
  }, [config.persistenceAdapter]);

  // Bridge catalog-select events to shell navigation + load report/dashboard data.
  // The catalog dispatches 'catalog-select' when a card is clicked,
  // but the shell doesn't auto-listen — the consumer must call shell.navigate()
  // AND load data for the target component.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const handler = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.artifactType) return;
      // Map artifact type to the correct viewer screen
      const screenMap: Record<string, string> = {
        report: 'report',
        'grid-definition': 'report',
        dashboard: 'dashboard',
      };
      const screen = screenMap[detail.artifactType] ?? 'catalog';
      (el as any).navigate(screen, detail.artifactId, detail.artifactType);
      console.log('[viewer] Navigating to', screen, 'for', detail.artifactName);

      // For reports, load the artifact definition and fetch actual data
      if (screen === 'report' && detail.artifactId) {
        try {
          const artifact = await config.persistenceAdapter.load(detail.artifactId);
          if (!artifact) {
            console.warn('[viewer] Report artifact not found:', detail.artifactId);
            return;
          }
          const dataSource = artifact.data?.dataSource ?? 'sales_orders';
          const colNames: string[] = artifact.data?.columns ?? [];

          // Build ReportColumnView[] from the stored column names
          const columns = colNames.map((name: string) => ({
            field: name,
            label: name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1'),
            visible: true,
            sortable: true,
          }));

          // Fetch data from the API
          const resp = await fetch(`/api/datasets/${dataSource}?mode=page&limit=100`);
          const result = await resp.json();
          const allRows = result.data ?? result.rows ?? [];

          // Convert object rows to array-of-arrays matching column order
          const rows = allRows.map((row: Record<string, unknown>) =>
            colNames.map(col => row[col] ?? null)
          );

          // ColumnDefinition shape for <phz-grid>
          const gridColumns = colNames.map((name: string) => ({
            field: name,
            header: name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1'),
            sortable: true,
          }));

          setActiveReport({
            reportId: artifact.id,
            reportTitle: artifact.name,
            reportDescription: artifact.description ?? '',
            columns,
            rows,
            totalRows: result.totalCount ?? rows.length,
            gridData: allRows,
            gridColumns,
          });

          console.log('[viewer] Report loaded:', artifact.name, `(${rows.length} rows, ${columns.length} cols)`);
        } catch (err) {
          console.error('[viewer] Failed to load report:', err);
        }
      }
    };
    el.addEventListener('catalog-select', handler);
    return () => el.removeEventListener('catalog-select', handler);
  }, [loaded, config.persistenceAdapter]);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    (el as any).config = config;
    (el as any).viewerContext = viewerContext;
    (el as any).theme = theme;
  }, [config, viewerContext, theme, loaded]);

  if (!loaded) {
    return <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>Loading viewer modules...</div>;
  }

  return React.createElement(
    'phz-viewer-shell',
    { ref: hostRef, style: { display: 'block', width: '100%', height: '100%' } },
    // Slotted children for each screen
    React.createElement(SlottedPanel, {
      tag: 'phz-viewer-catalog',
      slotName: 'catalog',
      artifacts,
      config,
      viewerContext,
    }),
    React.createElement(SlottedPanel, {
      tag: 'phz-viewer-dashboard',
      slotName: 'dashboard',
      config,
      viewerContext,
    }),
    React.createElement(ReportPanel, {
      report: activeReport,
      slotName: 'report',
    }),
    React.createElement(SlottedPanel, {
      tag: 'phz-viewer-explorer',
      slotName: 'explorer',
      config,
      viewerContext,
    }),
  );
}

const DynamicViewerHost = dynamic(
  () => Promise.resolve(ViewerHost),
  { ssr: false, loading: () => <div style={{ padding: 24, color: 'var(--text-muted)' }}>Loading...</div> },
);

export default function ViewerPage() {
  const { resolved } = useTheme();

  const config = useMemo(() => ({
    dataAdapter: new ReportAppDataAdapter(''),
    persistenceAdapter: new InMemoryPersistenceAdapter(),
    features: {
      explorer: true,
      attentionItems: true,
      filterBar: true,
      keyboardShortcuts: true,
      mobileResponsive: true,
      urlRouting: false,
    },
    branding: {
      title: 'PHZ Viewer',
      theme: resolved === 'dark' ? 'dark' : 'light',
      locale: 'en',
    },
    initialScreen: 'catalog',
  }), [resolved]);

  const viewerContext = useMemo(() => ({
    userId: 'analyst-demo',
    roles: ['analyst'],
    attributes: {},
  }), []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Read-Only Shell</span>
        <span className="text-xs text-[var(--text-muted)] ml-auto">
          Real <code className="font-mono text-[var(--accent)]">&lt;phz-viewer-shell&gt;</code> + slotted screens
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <DynamicViewerHost
          config={config}
          viewerContext={viewerContext}
          theme={resolved === 'dark' ? 'dark' : 'light'}
        />
      </div>
    </div>
  );
}
