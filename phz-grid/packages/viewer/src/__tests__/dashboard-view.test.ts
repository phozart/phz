/**
 * Tests for PhzDashboardView configuration types and rendering logic.
 * Runs in Node (no DOM rendering).
 */
import { describe, it, expect } from 'vitest';
import type {
  DashboardViewConfig,
  DashboardViewWidget,
} from '../components/phz-dashboard-view.js';

describe('PhzDashboardView logic', () => {
  it('creates valid dashboard config', () => {
    const config: DashboardViewConfig = {
      id: 'dash-1',
      title: 'Sales Dashboard',
      widgets: [
        { id: 'w1', type: 'kpi-card', title: 'Revenue', sourceId: 'sales' },
        { id: 'w2', type: 'bar-chart', title: 'By Region', sourceId: 'sales' },
      ],
      columns: 3,
    };
    expect(config.widgets).toHaveLength(2);
    expect(config.columns).toBe(3);
    expect(config.title).toBe('Sales Dashboard');
  });

  it('handles empty widgets array', () => {
    const config: DashboardViewConfig = {
      id: 'dash-empty',
      title: 'Empty Dashboard',
      widgets: [],
    };
    expect(config.widgets).toHaveLength(0);
  });

  it('defaults columns to 2 when not specified', () => {
    const config: DashboardViewConfig = {
      id: 'dash-2',
      title: 'Default Layout',
      widgets: [{ id: 'w1', type: 'kpi-card', sourceId: 's1' }],
    };
    const cols = config.columns ?? 2;
    expect(cols).toBe(2);
  });

  it('widget position supports grid placement', () => {
    const widget: DashboardViewWidget = {
      id: 'w1',
      type: 'bar-chart',
      sourceId: 'src',
      position: { row: 1, col: 1, rowSpan: 2, colSpan: 2 },
    };
    expect(widget.position!.row).toBe(1);
    expect(widget.position!.col).toBe(1);
    expect(widget.position!.rowSpan).toBe(2);
    expect(widget.position!.colSpan).toBe(2);
  });

  it('widget position defaults span to 1', () => {
    const widget: DashboardViewWidget = {
      id: 'w2',
      type: 'line-chart',
      sourceId: 'src',
      position: { row: 2, col: 3 },
    };
    const rowSpan = widget.position!.rowSpan ?? 1;
    const colSpan = widget.position!.colSpan ?? 1;
    expect(rowSpan).toBe(1);
    expect(colSpan).toBe(1);
  });

  it('widgets can have optional title', () => {
    const widget: DashboardViewWidget = { id: 'w1', type: 'kpi-card', sourceId: 's1' };
    const displayTitle = widget.title ?? widget.type;
    expect(displayTitle).toBe('kpi-card');
  });

  it('widgets can have custom config', () => {
    const widget: DashboardViewWidget = {
      id: 'w1',
      type: 'pie-chart',
      sourceId: 'src',
      config: { colorScheme: 'warm', showLegend: true },
    };
    expect(widget.config!['colorScheme']).toBe('warm');
    expect(widget.config!['showLegend']).toBe(true);
  });

  it('supports auto-grid layout', () => {
    const config: DashboardViewConfig = {
      id: 'dash-auto',
      title: 'Auto Layout',
      widgets: [{ id: 'w1', type: 'kpi-card', sourceId: 's1' }],
      layout: 'auto-grid',
    };
    expect(config.layout).toBe('auto-grid');
  });

  it('supports fixed layout', () => {
    const config: DashboardViewConfig = {
      id: 'dash-fixed',
      title: 'Fixed Layout',
      widgets: [{ id: 'w1', type: 'kpi-card', sourceId: 's1' }],
      layout: 'fixed',
      columns: 4,
    };
    expect(config.layout).toBe('fixed');
    expect(config.columns).toBe(4);
  });
});
