'use client';

import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import dynamic from 'next/dynamic';
import { importEditor } from '@/lib/import-guards';
import { ReportAppDataAdapter } from '@/lib/workspace-data-adapter';
import { InMemoryPersistenceAdapter } from '@/lib/stub-persistence-adapter';

/**
 * Author page — mounts the REAL <phz-editor-shell> Lit web component
 * with slotted screen content.
 *
 * <phz-editor-shell> provides navigation (Catalog, Dashboard, Report, Explorer)
 * with edit-mode toggle, undo/redo, and breadcrumbs. Content is rendered via
 * named slots matching the current screen.
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

function EditorHost({ theme, locale, dataAdapter, persistenceAdapter }: {
  theme: string;
  locale: string;
  dataAdapter: any;
  persistenceAdapter: any;
}) {
  const hostRef = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);

  useEffect(() => {
    importEditor().then(() => setLoaded(true));
  }, []);

  // Load catalog items from persistence adapter for the editor catalog
  useEffect(() => {
    if (!persistenceAdapter) return;
    persistenceAdapter.list().then((result: any) => {
      // Convert persistence items to CatalogItem shape expected by phz-editor-catalog
      const items = (result.items ?? result ?? []).map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        type: a.type,
        visibility: 'published' as const,
        ownerId: a.ownerId ?? 'system',
        ownerName: a.ownerName ?? 'System',
        updatedAt: a.updatedAt ?? Date.now(),
        createdAt: a.createdAt ?? Date.now(),
        tags: a.tags ?? [],
      }));
      setCatalogItems(items);
    });
  }, [persistenceAdapter]);

  // Bridge artifact-select events from editor catalog to shell navigation.
  // The catalog dispatches 'artifact-select' when a card is clicked.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.type) return;
      const screenMap: Record<string, string> = {
        report: 'report',
        dashboard: 'dashboard-edit',
      };
      const screen = screenMap[detail.type] ?? 'catalog';
      (el as any).navigate(screen, detail.id, detail.type);
      console.log('[editor] Navigating to', screen, 'for artifact', detail.id);
    };
    el.addEventListener('artifact-select', handler);
    return () => el.removeEventListener('artifact-select', handler);
  }, [loaded]);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    (el as any).theme = theme;
    (el as any).locale = locale;
  }, [theme, locale, loaded]);

  if (!loaded) {
    return <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>Loading editor modules...</div>;
  }

  const editorConfig = { dataAdapter, persistenceAdapter };

  return React.createElement(
    'phz-editor-shell',
    { ref: hostRef, style: { display: 'block', width: '100%', height: '100%' } },
    // Slotted children for each screen
    React.createElement(SlottedPanel, { tag: 'phz-editor-catalog', slotName: 'catalog', items: catalogItems, config: editorConfig }),
    React.createElement(SlottedPanel, { tag: 'phz-editor-dashboard', slotName: 'dashboard-edit', config: editorConfig }),
    React.createElement(SlottedPanel, { tag: 'phz-editor-report', slotName: 'report-edit', config: editorConfig }),
    React.createElement(SlottedPanel, { tag: 'phz-editor-explorer', slotName: 'explorer', config: editorConfig }),
    React.createElement(SlottedPanel, { tag: 'phz-measure-palette', slotName: 'measures' }),
    React.createElement(SlottedPanel, { tag: 'phz-editor-config-panel', slotName: 'config' }),
  );
}

const DynamicEditorHost = dynamic(
  () => Promise.resolve(EditorHost),
  { ssr: false, loading: () => <div style={{ padding: 24, color: 'var(--text-muted)' }}>Loading...</div> },
);

export default function AuthorPage() {
  const { resolved } = useTheme();

  const dataAdapter = useMemo(() => new ReportAppDataAdapter(''), []);
  const persistenceAdapter = useMemo(() => new InMemoryPersistenceAdapter(), []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Authoring Shell</span>
        <span className="text-xs text-[var(--text-muted)] ml-auto">
          Real <code className="font-mono text-[var(--accent)]">&lt;phz-editor-shell&gt;</code> + slotted screens
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <DynamicEditorHost
          theme={resolved === 'dark' ? 'dark' : 'light'}
          locale="en"
          dataAdapter={dataAdapter}
          persistenceAdapter={persistenceAdapter}
        />
      </div>
    </div>
  );
}
