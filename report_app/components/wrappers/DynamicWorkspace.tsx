'use client';

import React, { useEffect, useLayoutEffect, useRef, type FC } from 'react';
import dynamic from 'next/dynamic';

/**
 * Workspace Lit component wrappers.
 * Uses imperative prop setting via useLayoutEffect to handle
 * React 19 + lazy-loaded custom element property timing.
 *
 * The `all` sub-path registers <phz-workspace> plus all child custom
 * elements (grid-admin, engine-admin, grid-creator, criteria-admin, definition-ui).
 */
import { importWorkspaceAll } from '@/lib/import-guards';

function workspaceFactory(tag: string, importFn: () => Promise<any>): FC<Record<string, any>> {
  function Component(props: Record<string, any>) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => { importFn(); }, []);

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
    Loading workspace component...
  </div>
);

// Main workspace component — full admin shell with sidebar navigation
export const DynamicPhzWorkspace = dynamic(
  () => Promise.resolve(workspaceFactory('phz-workspace', importWorkspaceAll)),
  { ssr: false, loading },
);

// Workspace shell — alternative shell component
export const DynamicWorkspaceShell = dynamic(
  () => Promise.resolve(workspaceFactory('phz-workspace-shell', importWorkspaceAll)),
  { ssr: false, loading },
);

// Catalog browser — artifact list with search
export const DynamicCatalogBrowser = dynamic(
  () => Promise.resolve(workspaceFactory('phz-catalog-browser', importWorkspaceAll)),
  { ssr: false, loading },
);
