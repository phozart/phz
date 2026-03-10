'use client';

import React, { useEffect, useLayoutEffect, useRef, type FC } from 'react';
import dynamic from 'next/dynamic';

/**
 * Editor shell Lit component wrappers.
 * Importing '@phozart/phz-editor' registers all 9 custom elements:
 * <phz-editor-shell>, <phz-editor-catalog>, <phz-editor-dashboard>,
 * <phz-editor-report>, <phz-editor-explorer>, <phz-measure-palette>,
 * <phz-editor-config-panel>, <phz-sharing-flow>, <phz-alert-subscription>
 */
import { importEditor } from '@/lib/import-guards';

function editorFactory(tag: string): FC<Record<string, any>> {
  function Component(props: Record<string, any>) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => { importEditor(); }, []);

    useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return;
      for (const [key, value] of Object.entries(props)) {
        if (key === 'ref' || key === 'children' || key === 'key' || key === 'style' || key === 'className') continue;
        (el as any)[key] = value;
      }
    });

    return React.createElement(tag, { ref, style: props.style, className: props.className }, props.children);
  }
  Component.displayName = tag;
  return Component;
}

const loading = () => (
  <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>
    Loading editor...
  </div>
);

export const DynamicEditorShell = dynamic(
  () => Promise.resolve(editorFactory('phz-editor-shell')),
  { ssr: false, loading },
);

export const DynamicEditorCatalog = dynamic(
  () => Promise.resolve(editorFactory('phz-editor-catalog')),
  { ssr: false, loading },
);

export const DynamicEditorDashboard = dynamic(
  () => Promise.resolve(editorFactory('phz-editor-dashboard')),
  { ssr: false, loading },
);

export const DynamicEditorReport = dynamic(
  () => Promise.resolve(editorFactory('phz-editor-report')),
  { ssr: false, loading },
);

export const DynamicEditorExplorer = dynamic(
  () => Promise.resolve(editorFactory('phz-editor-explorer')),
  { ssr: false, loading },
);

export const DynamicMeasurePalette = dynamic(
  () => Promise.resolve(editorFactory('phz-measure-palette')),
  { ssr: false, loading },
);
