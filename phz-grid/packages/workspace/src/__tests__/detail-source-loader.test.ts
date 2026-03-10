/**
 * T.5 — Detail source loading
 * Trigger matching, filter mapping, parallel loading.
 */
import { describe, it, expect, vi } from 'vitest';
import type { DetailSourceConfig } from '../types.js';
import type { DataAdapter, DataResult } from '../data-adapter.js';
import {
  createDetailSourceLoader,
  type DetailSourceLoader,
  type DetailLoadContext,
} from '../coordination/detail-source-loader.js';

function mockDataAdapter(overrides?: Partial<DataAdapter>): DataAdapter {
  return {
    execute: vi.fn(async () => ({
      columns: [{ name: 'orderId', dataType: 'string' }, { name: 'amount', dataType: 'number' }],
      rows: [['O1', 100], ['O2', 200]],
      metadata: { totalRows: 2, truncated: false, queryTimeMs: 5 },
    })),
    getSchema: vi.fn(async () => ({ id: 'test', name: 'Test', fields: [] })),
    listDataSources: vi.fn(async () => []),
    getDistinctValues: vi.fn(async () => ({ values: [], totalCount: 0, truncated: false })),
    getFieldStats: vi.fn(async () => ({ distinctCount: 0, nullCount: 0, totalCount: 0 })),
    ...overrides,
  };
}

const sources: DetailSourceConfig[] = [
  {
    id: 'orders',
    name: 'Order Details',
    dataSourceId: 'order-db',
    filterMapping: [
      { sourceField: 'region', targetField: 'order_region' },
      { sourceField: 'product', targetField: 'product_id' },
    ],
    baseQuery: { source: 'order-db', fields: ['orderId', 'amount', 'order_region'] },
    trigger: 'user-action',
    renderMode: 'panel',
  },
  {
    id: 'breaches',
    name: 'Breach Details',
    dataSourceId: 'alerts-db',
    filterMapping: [{ sourceField: 'kpiId', targetField: 'alert_kpi' }],
    baseQuery: { source: 'alerts-db', fields: ['breachId', 'severity'] },
    trigger: { type: 'breach' },
    renderMode: 'modal',
  },
  {
    id: 'drill-orders',
    name: 'Drill-through Orders',
    dataSourceId: 'order-db',
    filterMapping: [{ sourceField: 'category', targetField: 'product_category' }],
    baseQuery: { source: 'order-db', fields: ['orderId', 'category', 'total'] },
    preloadQuery: { source: 'order-db', fields: ['orderId'] },
    trigger: { type: 'drill-through', fromWidgetTypes: ['bar-chart'] },
    maxRows: 500,
  },
];

describe('DetailSourceLoader (T.5)', () => {
  describe('getAvailableSources', () => {
    it('returns user-action sources for user-action trigger', () => {
      const adapter = mockDataAdapter();
      const loader = createDetailSourceLoader(sources, adapter);
      const available = loader.getAvailableSources('user-action');
      expect(available).toHaveLength(1);
      expect(available[0].id).toBe('orders');
    });

    it('returns breach sources for breach trigger', () => {
      const adapter = mockDataAdapter();
      const loader = createDetailSourceLoader(sources, adapter);
      const available = loader.getAvailableSources({ type: 'breach' });
      expect(available).toHaveLength(1);
      expect(available[0].id).toBe('breaches');
    });

    it('returns drill-through sources for matching trigger', () => {
      const adapter = mockDataAdapter();
      const loader = createDetailSourceLoader(sources, adapter);
      const available = loader.getAvailableSources({ type: 'drill-through', fromWidgetTypes: ['bar-chart'] });
      expect(available).toHaveLength(1);
      expect(available[0].id).toBe('drill-orders');
    });

    it('returns empty array for unmatched trigger', () => {
      const adapter = mockDataAdapter();
      const loader = createDetailSourceLoader(sources, adapter);
      const available = loader.getAvailableSources({ type: 'drill-through', fromWidgetTypes: ['pie-chart'] });
      expect(available).toHaveLength(0);
    });
  });

  describe('loadDetail', () => {
    it('loads detail data with mapped filters', async () => {
      const adapter = mockDataAdapter();
      const loader = createDetailSourceLoader(sources, adapter);

      const context: DetailLoadContext = {
        currentFilters: { region: 'US', product: 'Widget' },
      };

      const result = await loader.loadDetail('orders', context);
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();

      // Verify the query had mapped filters
      const call = (adapter.execute as ReturnType<typeof vi.fn>).mock.calls[0];
      const query = call[0];
      expect(query.filters).toBeDefined();
      // Mapped: region -> order_region, product -> product_id
      expect(query.filters.order_region).toBe('US');
      expect(query.filters.product_id).toBe('Widget');
    });

    it('includes clickedRow context in filter mapping', async () => {
      const adapter = mockDataAdapter();
      const loader = createDetailSourceLoader(sources, adapter);

      const context: DetailLoadContext = {
        currentFilters: { region: 'US' },
        clickedRow: { region: 'EU', product: 'Gadget' },
      };

      const result = await loader.loadDetail('orders', context);
      expect(result).toBeDefined();
    });

    it('throws for unknown source id', async () => {
      const adapter = mockDataAdapter();
      const loader = createDetailSourceLoader(sources, adapter);

      await expect(
        loader.loadDetail('nonexistent', { currentFilters: {} }),
      ).rejects.toThrow('Unknown detail source');
    });

    it('fires preloadQuery and baseQuery in parallel when both defined', async () => {
      let callCount = 0;
      const adapter = mockDataAdapter({
        execute: vi.fn(async () => {
          callCount++;
          return {
            columns: [{ name: 'orderId', dataType: 'string' }],
            rows: [['O1']],
            metadata: { totalRows: 1, truncated: false, queryTimeMs: 3 },
          };
        }),
      });

      const loader = createDetailSourceLoader(sources, adapter);

      // drill-orders has preloadQuery
      const result = await loader.loadDetail('drill-orders', { currentFilters: {} });
      expect(result).toBeDefined();
      // Should call execute twice (preload + base)
      expect(adapter.execute).toHaveBeenCalledTimes(2);
    });

    it('respects maxRows on base query', async () => {
      const adapter = mockDataAdapter();
      const loader = createDetailSourceLoader(sources, adapter);

      await loader.loadDetail('drill-orders', { currentFilters: {} });

      const calls = (adapter.execute as ReturnType<typeof vi.fn>).mock.calls;
      // The base query should have limit = maxRows
      const baseCall = calls.find((c: unknown[]) => {
        const q = c[0] as { fields: string[] };
        return q.fields.length > 1; // base has more fields than preload
      });
      expect(baseCall).toBeDefined();
      expect((baseCall![0] as { limit?: number }).limit).toBe(500);
    });
  });

  describe('destroy', () => {
    it('cleans up without error', () => {
      const adapter = mockDataAdapter();
      const loader = createDetailSourceLoader(sources, adapter);
      expect(() => loader.destroy()).not.toThrow();
    });
  });
});
