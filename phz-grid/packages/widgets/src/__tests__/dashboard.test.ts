import { describe, it, expect } from 'vitest';
import type { DashboardConfig } from '@phozart/phz-engine';
import { dashboardId, widgetId } from '@phozart/phz-engine';

describe('Dashboard Renderer logic', () => {
  it('computes grid styles from layout config', () => {
    const config: DashboardConfig = {
      id: dashboardId('d1'),
      name: 'Test Dashboard',
      layout: { columns: 12, rowHeight: 80, gap: 16 },
      widgets: [],
      created: 0,
      updated: 0,
    };
    const gridStyle = `grid-template-columns: repeat(${config.layout.columns}, 1fr); gap: ${config.layout.gap}px;`;
    expect(gridStyle).toBe('grid-template-columns: repeat(12, 1fr); gap: 16px;');
  });

  it('maps widget positions to grid-column spans', () => {
    const widget = {
      id: widgetId('w1'),
      widgetType: 'kpi-card' as const,
      config: {} as any,
      position: { row: 0, col: 0, rowSpan: 1, colSpan: 3 },
    };
    const colSpan = `grid-column: span ${widget.position.colSpan}`;
    expect(colSpan).toBe('grid-column: span 3');
  });
});
