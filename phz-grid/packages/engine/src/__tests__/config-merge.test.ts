import { describe, it, expect } from 'vitest';
import { deepMerge, mergeReportConfigs, createConfigLayerManager } from '../config-merge.js';
import type { ReportConfig } from '../report.js';
import { reportId, dataProductId } from '../types.js';

describe('deepMerge', () => {
  it('merges flat objects', () => {
    const base = { a: 1, b: 2 };
    const override = { b: 3, c: 4 };
    const result = deepMerge(base, override as any);
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('merges nested objects', () => {
    const base = { a: { x: 1, y: 2 }, b: 'hello' };
    const override = { a: { y: 3, z: 4 } };
    const result = deepMerge(base, override as any);
    expect(result).toEqual({ a: { x: 1, y: 3, z: 4 }, b: 'hello' });
  });

  it('overwrites arrays (does not merge)', () => {
    const base = { items: [1, 2, 3] };
    const override = { items: [4, 5] };
    const result = deepMerge(base, override as any);
    expect(result.items).toEqual([4, 5]);
  });

  it('does not mutate base', () => {
    const base = { a: { x: 1 } };
    deepMerge(base, { a: { x: 2 } } as any);
    expect(base.a.x).toBe(1);
  });

  it('skips undefined values', () => {
    const base = { a: 1, b: 2 };
    const override = { a: undefined };
    const result = deepMerge(base, override as any);
    expect(result.a).toBe(1);
  });
});

describe('mergeReportConfigs', () => {
  it('merges system → admin → user layers', () => {
    const system: ReportConfig = {
      id: reportId('r1'),
      name: 'Base Report',
      dataProductId: dataProductId('sales'),
      columns: [{ field: 'region' }],
      pageSize: 25,
      created: 0,
      updated: 0,
    };

    const result = mergeReportConfigs([
      { layer: 'system', config: system },
      { layer: 'admin', config: { name: 'Admin Report', pageSize: 50 } as Partial<ReportConfig> },
      { layer: 'user', config: { pageSize: 100 } as Partial<ReportConfig> },
    ]);

    expect(result.name).toBe('Admin Report');
    expect(result.pageSize).toBe(100);
    expect(result.columns).toHaveLength(1);
  });

  it('respects layer priority regardless of input order', () => {
    const system: ReportConfig = {
      id: reportId('r1'),
      name: 'System',
      dataProductId: dataProductId('sales'),
      columns: [],
      created: 0,
      updated: 0,
    };

    const result = mergeReportConfigs([
      { layer: 'user', config: { name: 'User' } as Partial<ReportConfig> },
      { layer: 'system', config: system },
      { layer: 'admin', config: { name: 'Admin' } as Partial<ReportConfig> },
    ]);

    expect(result.name).toBe('User');
  });
});

describe('ConfigLayerManager', () => {
  it('manages layers and merges', () => {
    const manager = createConfigLayerManager<{ name: string; pageSize: number }>();
    manager.setLayer('system', { name: 'Base', pageSize: 25 });
    manager.setLayer('admin', { pageSize: 50 });
    manager.setLayer('user', { pageSize: 100 });

    const merged = manager.getMerged();
    expect(merged.name).toBe('Base');
    expect(merged.pageSize).toBe(100);
  });

  it('returns individual layers', () => {
    const manager = createConfigLayerManager<{ name: string }>();
    manager.setLayer('admin', { name: 'Admin' });
    expect(manager.getLayer('admin')).toEqual({ name: 'Admin' });
    expect(manager.getLayer('user')).toBeUndefined();
  });

  it('removes layers', () => {
    const manager = createConfigLayerManager<{ name: string }>();
    manager.setLayer('admin', { name: 'Admin' });
    manager.removeLayer('admin');
    expect(manager.getLayer('admin')).toBeUndefined();
  });

  it('lists all layers', () => {
    const manager = createConfigLayerManager<{ name: string }>();
    manager.setLayer('system', { name: 'System' });
    manager.setLayer('user', { name: 'User' });
    expect(manager.getLayers()).toHaveLength(2);
  });
});
