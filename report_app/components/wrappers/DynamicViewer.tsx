'use client';

import React, { useEffect, useLayoutEffect, useRef, type FC } from 'react';
import dynamic from 'next/dynamic';

/**
 * Viewer shell Lit component wrappers.
 * Importing '@phozart/phz-viewer' registers all 9 custom elements:
 * <phz-viewer-shell>, <phz-viewer-catalog>, <phz-viewer-dashboard>,
 * <phz-viewer-report>, <phz-viewer-explorer>, <phz-attention-dropdown>,
 * <phz-filter-bar>, <phz-viewer-error>, <phz-viewer-empty>
 */
import { importViewer } from '@/lib/import-guards';

function viewerFactory(tag: string): FC<Record<string, any>> {
  function Component(props: Record<string, any>) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => { importViewer(); }, []);

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
    Loading viewer...
  </div>
);

export const DynamicViewerShell = dynamic(
  () => Promise.resolve(viewerFactory('phz-viewer-shell')),
  { ssr: false, loading },
);

export const DynamicViewerCatalog = dynamic(
  () => Promise.resolve(viewerFactory('phz-viewer-catalog')),
  { ssr: false, loading },
);

export const DynamicViewerDashboard = dynamic(
  () => Promise.resolve(viewerFactory('phz-viewer-dashboard')),
  { ssr: false, loading },
);

export const DynamicViewerReport = dynamic(
  () => Promise.resolve(viewerFactory('phz-viewer-report')),
  { ssr: false, loading },
);

export const DynamicViewerExplorer = dynamic(
  () => Promise.resolve(viewerFactory('phz-viewer-explorer')),
  { ssr: false, loading },
);
