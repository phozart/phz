'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

/**
 * Nav items for the workspace shell sidebar.
 * Icons use unicode chars — the shell's ICONS map falls back to rendering
 * the icon value directly when it's not a known key.
 */
const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '◆' },
  { id: 'datasets', label: 'Datasets', icon: '▤' },
  { id: 'explorer', label: 'Explorer', icon: '⊞' },
  { id: 'scale', label: 'Scale Test', icon: '▥' },
  { id: 'reports', label: 'Reports', icon: '▧' },
  { id: 'dashboards', label: 'Dashboards', icon: '◫' },
  { id: 'criteria', label: 'Criteria', icon: '◇' },
  { id: 'metrics', label: 'Metrics', icon: '◈' },
  { id: 'studio', label: 'Studio', icon: '◉' },
];

/** Panel ID → Next.js route */
const PANEL_ROUTES: Record<string, string> = {
  home: '/',
  datasets: '/datasets',
  explorer: '/explore',
  scale: '/scale',
  reports: '/reports',
  dashboards: '/dashboards',
  criteria: '/criteria',
  metrics: '/metrics',
  studio: '/studio',
};

/** Pathname → panel ID (handles sub-routes) */
function routeToPanel(pathname: string): string {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/datasets')) return 'datasets';
  if (pathname.startsWith('/explore')) return 'explorer';
  if (pathname.startsWith('/scale')) return 'scale';
  if (pathname.startsWith('/reports')) return 'reports';
  if (pathname.startsWith('/dashboards')) return 'dashboards';
  if (pathname.startsWith('/criteria')) return 'criteria';
  if (pathname.startsWith('/metrics')) return 'metrics';
  if (pathname.startsWith('/studio')) return 'studio';
  return 'home';
}

function ShellLayout({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [activePanel, setActivePanel] = useState(() => routeToPanel(pathname));

  // Sync activePanel when pathname changes (e.g., from <Link> clicks within pages)
  useEffect(() => {
    setActivePanel(routeToPanel(pathname));
  }, [pathname]);

  // Import shell sub-path (registers phz-workspace-shell custom element)
  // Using sub-path to avoid barrel import conflict between alerts/filters
  useEffect(() => {
    // @ts-ignore — sub-path has no type declarations, but webpack alias resolves it
    import('@phozart/phz-workspace/shell');
  }, []);

  // Imperatively set properties on the Lit element (React 19 + custom element timing)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    (el as any).navItems = NAV_ITEMS;
    (el as any).activePanel = activePanel;
  });

  // Listen for panel-change events → Next.js navigation
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) => {
      const panelId = (e as CustomEvent).detail.panelId;
      const route = PANEL_ROUTES[panelId];
      if (route) {
        setActivePanel(panelId); // Immediately sync slot attribute
        router.push(route);
      }
    };
    el.addEventListener('panel-change', handler);
    return () => el.removeEventListener('panel-change', handler);
  }, [router]);

  return React.createElement(
    'phz-workspace-shell',
    { ref, style: { display: 'flex', height: '100%', width: '100%' } },
    // Slotted content — slot name must match shell's activePanel to be visible
    React.createElement(
      'div',
      {
        slot: activePanel,
        style: {
          height: '100%',
          overflowY: 'auto',
          background: 'var(--bg-primary)',
        },
      },
      children,
    ),
  );
}

export const WorkspaceShellLayout = dynamic(
  () => Promise.resolve(ShellLayout),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ width: 220, background: '#1C1917', flexShrink: 0 }} />
        <div style={{ flex: 1, padding: 24, color: 'var(--text-muted)', fontSize: 12 }}>
          Loading workspace...
        </div>
      </div>
    ),
  },
);
