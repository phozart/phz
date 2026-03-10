'use client';

import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import dynamic from 'next/dynamic';
import { ReportAppDataAdapter } from '@/lib/workspace-data-adapter';
import { InMemoryWorkspaceAdapter } from '@/lib/stub-workspace-adapter';
import { importWorkspaceAll, importAuthoring } from '@/lib/import-guards';
import { getEngine } from '@/lib/engine';

/**
 * Workspace page — mounts the REAL <phz-workspace> Lit web component
 * with slotted child panels.
 *
 * <phz-workspace> provides the shell (header, sidebar navigation, content routing).
 * The CONSUMER must provide the panel components as slotted children:
 *   <phz-grid-admin slot="grid-admin" />
 *   <phz-engine-admin slot="engine-admin" />
 *   <phz-dashboard-builder slot="dashboards" />
 *   etc.
 */

type WorkspaceRole = 'admin' | 'author';

/**
 * Helper: creates a custom element with a slot attribute and
 * imperatively sets complex object properties.
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

  return React.createElement(tag, {
    ref,
    slot: slotName,
    style: { display: 'block', width: '100%' },
  });
}

/**
 * The workspace host: loads all required modules, creates the
 * <phz-workspace> element with slotted children.
 */
function WorkspaceHost({ workspaceRole, adapter, dataAdapter, engine }: {
  workspaceRole: WorkspaceRole;
  adapter: any;
  dataAdapter: any;
  engine: any;
}) {
  const hostRef = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [sampleData, setSampleData] = useState<Record<string, unknown>[]>([]);
  const [availableFields, setAvailableFields] = useState<{ field: string; label: string }[]>([]);
  const [dataSourceSchema, setDataSourceSchema] = useState<any>(null);

  // Import all workspace modules to register custom elements.
  // Uses guarded import to prevent HMR duplicate registration errors.
  useEffect(() => {
    Promise.all([importWorkspaceAll(), importAuthoring()]).then(() => setLoaded(true));
  }, []);

  // Fetch a small sample from sales_orders to derive field metadata
  // for the report editor (availableFields) and dashboard editor (schema).
  useEffect(() => {
    fetch('/api/datasets/sales_orders?mode=page&limit=50')
      .then(r => r.json())
      .then(result => {
        const rows = result.data ?? result.rows ?? [];
        if (!rows.length) return;
        setSampleData(rows);

        // Derive field list from first row
        const firstRow = rows[0];
        const fields = Object.keys(firstRow).map(key => ({
          field: key,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        }));
        setAvailableFields(fields);

        // Derive schema with inferred types
        const schemaFields = Object.entries(firstRow).map(([key, value]) => {
          let dataType: string = 'string';
          if (typeof value === 'number') dataType = 'number';
          else if (typeof value === 'boolean') dataType = 'boolean';
          else if (typeof value === 'string' && !isNaN(Date.parse(value)) && /\d{4}-\d{2}/.test(value)) dataType = 'date';
          return { name: key, dataType };
        });
        setDataSourceSchema({ dataSourceId: 'sales_orders', fields: schemaFields });
      })
      .catch(() => {});
  }, []);

  // Listen for save events from the workbench editors.
  // phz-report-editor dispatches 'save-report' with { state, gridConfig }
  // phz-dashboard-editor dispatches 'save-dashboard' with { state }
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const dashboardHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const state = detail?.state;
      if (!state) return;
      adapter.saveDashboard({
        id: state.id ?? `dashboard-${Date.now()}`,
        name: state.name ?? 'Untitled Dashboard',
        description: state.description ?? '',
        layout: state.layout,
        widgets: state.widgets,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log('[workspace] Dashboard saved:', state.name);
    };

    const reportHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const state = detail?.state;
      if (!state) return;
      adapter.saveReport({
        id: state.id ?? `report-${Date.now()}`,
        name: state.name ?? 'Untitled Report',
        description: state.description ?? '',
        dataProductId: state.dataSourceId ?? '',
        columns: state.columns ?? [],
        filters: state.filters ?? [],
        sort: state.sort ?? null,
        aggregation: null,
        drillThrough: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log('[workspace] Report saved:', state.name);
    };

    el.addEventListener('save-dashboard', dashboardHandler);
    el.addEventListener('save-report', reportHandler);
    return () => {
      el.removeEventListener('save-dashboard', dashboardHandler);
      el.removeEventListener('save-report', reportHandler);
    };
  }, [adapter, loaded]);

  // Set complex properties on the host element
  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    (el as any).adapter = adapter;
    (el as any).dataAdapter = dataAdapter;
    (el as any).workspaceRole = workspaceRole;
    (el as any).title = 'PHZ Report Studio';
  }, [adapter, dataAdapter, workspaceRole, loaded]);

  if (!loaded) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>
        Loading workspace modules...
      </div>
    );
  }

  // Create <phz-workspace> with slotted children for each panel
  return React.createElement(
    'phz-workspace',
    {
      ref: hostRef,
      'workspace-role': workspaceRole,
      title: 'PHZ Report Studio',
      style: { width: '100%', height: '100%' },
    },
    // Slotted children — each matches a panel ID in the workspace's PANELS map
    React.createElement(SlottedPanel, { tag: 'phz-catalog-browser', slotName: 'catalog', adapter }),
    React.createElement(SlottedPanel, { tag: 'phz-grid-admin', slotName: 'grid-admin' }),
    React.createElement(SlottedPanel, { tag: 'phz-engine-admin', slotName: 'engine-admin', adapter, engine }),
    React.createElement(SlottedPanel, { tag: 'phz-grid-creator', slotName: 'grid-creator' }),
    React.createElement(SlottedPanel, { tag: 'phz-dashboard-editor', slotName: 'dashboards', adapter: dataAdapter, dataSourceId: 'sales_orders', schema: dataSourceSchema }),
    React.createElement(SlottedPanel, { tag: 'phz-report-editor', slotName: 'reports', adapter: dataAdapter, dataSourceId: 'sales_orders', availableFields }),
    React.createElement(SlottedPanel, { tag: 'phz-criteria-admin', slotName: 'criteria-admin', adapter, dataAdapter }),
    React.createElement(SlottedPanel, { tag: 'phz-connection-editor', slotName: 'connectors' }),
  );
}

const DynamicWorkspaceHost = dynamic(
  () => Promise.resolve(WorkspaceHost),
  { ssr: false, loading: () => <div style={{ padding: 24, color: 'var(--text-muted)' }}>Loading...</div> },
);

export default function WorkspacePage() {
  const { resolved } = useTheme();
  const [role, setRole] = useState<WorkspaceRole>('admin');
  const [ready, setReady] = useState(false);

  const workspaceAdapter = useMemo(() => new InMemoryWorkspaceAdapter(), []);
  const dataAdapter = useMemo(() => new ReportAppDataAdapter(''), []);
  const engine = useMemo(() => getEngine(), []);

  useEffect(() => {
    workspaceAdapter.initialize().then(() => setReady(true));
  }, [workspaceAdapter]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        Initializing workspace...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Role switcher toolbar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Role</span>
        <div className="flex gap-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-0.5">
          {(['admin', 'author'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${
                role === r
                  ? 'bg-[var(--accent)] text-white font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--text-muted)] ml-auto">
          Real <code className="font-mono text-[var(--accent)]">&lt;phz-workspace&gt;</code> + slotted panels
        </span>
      </div>

      {/* The actual web component with slotted children */}
      <div className="flex-1 overflow-hidden">
        <DynamicWorkspaceHost
          workspaceRole={role}
          adapter={workspaceAdapter}
          dataAdapter={dataAdapter}
          engine={engine}
        />
      </div>
    </div>
  );
}
