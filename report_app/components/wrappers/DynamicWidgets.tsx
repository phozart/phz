'use client';

import React, { useEffect, useLayoutEffect, useRef, type FC } from 'react';
import dynamic from 'next/dynamic';

/**
 * Web Component wrapper that handles the timing issue between React and
 * Lit custom element registration. React 19 sets properties on custom
 * elements only if the property exists on the element instance at render
 * time. Since we lazy-load @phozart/phz-widgets, the CE class may not
 * be registered when React first creates the element, causing complex
 * props (objects, arrays) to be set as attributes (stringified to
 * "[object Object]") instead of properties.
 *
 * Fix: use a ref + useLayoutEffect to imperatively set all props as
 * properties on the element, bypassing React's attribute/property
 * detection entirely.
 */
function widgetFactory(tag: string): FC<Record<string, any>> {
  function Widget(props: Record<string, any>) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => { import('@phozart/phz-widgets'); }, []);

    // Set all props as element properties (not attributes)
    useLayoutEffect(() => {
      const el = ref.current;
      if (!el) return;
      for (const [key, value] of Object.entries(props)) {
        if (key === 'ref' || key === 'children' || key === 'key') continue;
        (el as any)[key] = value;
      }
    });

    return React.createElement(tag, { ref });
  }
  Widget.displayName = tag;
  return Widget;
}

const loading = () => (
  <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
    Loading widget...
  </div>
);

export const DynamicKPICard       = dynamic(() => Promise.resolve(widgetFactory('phz-kpi-card')), { ssr: false, loading });
export const DynamicBarChart      = dynamic(() => Promise.resolve(widgetFactory('phz-bar-chart')), { ssr: false, loading });
export const DynamicLineChart     = dynamic(() => Promise.resolve(widgetFactory('phz-line-chart')), { ssr: false, loading });
export const DynamicPieChart      = dynamic(() => Promise.resolve(widgetFactory('phz-pie-chart')), { ssr: false, loading });
export const DynamicGauge         = dynamic(() => Promise.resolve(widgetFactory('phz-gauge')), { ssr: false, loading });
export const DynamicTrendLine     = dynamic(() => Promise.resolve(widgetFactory('phz-trend-line')), { ssr: false, loading });
export const DynamicHeatmap       = dynamic(() => Promise.resolve(widgetFactory('phz-heatmap')), { ssr: false, loading });
export const DynamicFunnelChart   = dynamic(() => Promise.resolve(widgetFactory('phz-funnel-chart')), { ssr: false, loading });
export const DynamicWaterfallChart= dynamic(() => Promise.resolve(widgetFactory('phz-waterfall-chart')), { ssr: false, loading });
export const DynamicScatterChart  = dynamic(() => Promise.resolve(widgetFactory('phz-scatter-chart')), { ssr: false, loading });
export const DynamicStatusTable   = dynamic(() => Promise.resolve(widgetFactory('phz-status-table')), { ssr: false, loading });
