/**
 * @phozart/phz-ai — Dashboard Generator Tests
 *
 * Tests for generating dashboard configs from data schema + NL prompt.
 */

import { describe, it, expect } from 'vitest';
import { generateDashboardConfig } from '../dashboard-generator.js';
import type { DashboardGeneratorInput, GeneratedDashboard } from '../dashboard-generator.js';

describe('generateDashboardConfig', () => {
  it('generates a dashboard from schema with measures and dimensions', () => {
    const input: DashboardGeneratorInput = {
      fields: [
        { name: 'revenue', type: 'number' },
        { name: 'region', type: 'string' },
        { name: 'date', type: 'date' },
      ],
      prompt: 'show me sales overview',
    };
    const result = generateDashboardConfig(input);
    expect(result.name).toBeTruthy();
    expect(result.widgets.length).toBeGreaterThan(0);
    expect(result.layout.columns).toBeGreaterThanOrEqual(1);
    expect(result.placements.length).toBe(result.widgets.length);
  });

  it('creates KPI cards for numeric fields', () => {
    const input: DashboardGeneratorInput = {
      fields: [
        { name: 'revenue', type: 'number' },
        { name: 'cost', type: 'number' },
      ],
      prompt: 'show revenue and cost KPIs',
    };
    const result = generateDashboardConfig(input);
    const kpiWidgets = result.widgets.filter(w => w.type === 'kpi-card');
    expect(kpiWidgets.length).toBeGreaterThan(0);
  });

  it('creates trend lines when temporal fields are present', () => {
    const input: DashboardGeneratorInput = {
      fields: [
        { name: 'revenue', type: 'number' },
        { name: 'date', type: 'date' },
      ],
      prompt: 'show revenue trends',
    };
    const result = generateDashboardConfig(input);
    const trendWidgets = result.widgets.filter(w => w.type === 'trend-line');
    expect(trendWidgets.length).toBeGreaterThan(0);
  });

  it('creates bar charts when dimensions are present', () => {
    const input: DashboardGeneratorInput = {
      fields: [
        { name: 'revenue', type: 'number' },
        { name: 'region', type: 'string' },
      ],
      prompt: 'show revenue by region',
    };
    const result = generateDashboardConfig(input);
    const barWidgets = result.widgets.filter(w => w.type === 'bar-chart');
    expect(barWidgets.length).toBeGreaterThan(0);
  });

  it('uses custom name from options', () => {
    const input: DashboardGeneratorInput = {
      fields: [{ name: 'revenue', type: 'number' }],
      prompt: 'KPI overview',
      options: { name: 'My Custom Dashboard' },
    };
    const result = generateDashboardConfig(input);
    expect(result.name).toBe('My Custom Dashboard');
  });

  it('respects maxWidgets option', () => {
    const input: DashboardGeneratorInput = {
      fields: [
        { name: 'revenue', type: 'number' },
        { name: 'cost', type: 'number' },
        { name: 'profit', type: 'number' },
        { name: 'region', type: 'string' },
        { name: 'date', type: 'date' },
      ],
      prompt: 'full overview',
      options: { maxWidgets: 3 },
    };
    const result = generateDashboardConfig(input);
    expect(result.widgets.length).toBeLessThanOrEqual(3);
  });

  it('returns valid placements matching widgets', () => {
    const input: DashboardGeneratorInput = {
      fields: [
        { name: 'revenue', type: 'number' },
        { name: 'region', type: 'string' },
      ],
      prompt: 'overview',
    };
    const result = generateDashboardConfig(input);
    const widgetIds = new Set(result.widgets.map(w => w.id));
    for (const p of result.placements) {
      expect(widgetIds.has(p.widgetId)).toBe(true);
    }
  });

  it('handles empty fields gracefully', () => {
    const input: DashboardGeneratorInput = {
      fields: [],
      prompt: 'show me something',
    };
    const result = generateDashboardConfig(input);
    expect(result.widgets).toHaveLength(0);
    expect(result.placements).toHaveLength(0);
  });

  it('generates unique widget IDs', () => {
    const input: DashboardGeneratorInput = {
      fields: [
        { name: 'revenue', type: 'number' },
        { name: 'cost', type: 'number' },
        { name: 'region', type: 'string' },
        { name: 'date', type: 'date' },
      ],
      prompt: 'full dashboard',
    };
    const result = generateDashboardConfig(input);
    const ids = result.widgets.map(w => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes data table when only dimension fields exist', () => {
    const input: DashboardGeneratorInput = {
      fields: [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'status', type: 'string' },
      ],
      prompt: 'show contacts',
    };
    const result = generateDashboardConfig(input);
    const dataTables = result.widgets.filter(w => w.type === 'data-table');
    expect(dataTables.length).toBeGreaterThan(0);
  });
});
