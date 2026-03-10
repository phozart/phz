/**
 * W.5 — Demo App Scaffolding
 */

import { describe, it, expect } from 'vitest';

describe('Demo App (W.5)', () => {
  describe('SAMPLE_DATASETS', () => {
    it('exports at least 3 sample datasets', async () => {
      const { SAMPLE_DATASETS } = await import('../local/demo-datasets.js');
      expect(SAMPLE_DATASETS.length).toBeGreaterThanOrEqual(3);
    });

    it('each dataset has id, name, description, and columns', async () => {
      const { SAMPLE_DATASETS } = await import('../local/demo-datasets.js');
      for (const ds of SAMPLE_DATASETS) {
        expect(ds.id).toBeTruthy();
        expect(ds.name).toBeTruthy();
        expect(ds.description).toBeTruthy();
        expect(ds.columns.length).toBeGreaterThan(0);
      }
    });

    it('includes sales dataset', async () => {
      const { SAMPLE_DATASETS } = await import('../local/demo-datasets.js');
      const sales = SAMPLE_DATASETS.find(d => d.id === 'sales');
      expect(sales).toBeDefined();
      expect(sales!.columns.length).toBeGreaterThan(0);
    });

    it('includes inventory dataset', async () => {
      const { SAMPLE_DATASETS } = await import('../local/demo-datasets.js');
      const inventory = SAMPLE_DATASETS.find(d => d.id === 'inventory');
      expect(inventory).toBeDefined();
    });

    it('includes employees dataset', async () => {
      const { SAMPLE_DATASETS } = await import('../local/demo-datasets.js');
      const employees = SAMPLE_DATASETS.find(d => d.id === 'employees');
      expect(employees).toBeDefined();
    });
  });

  describe('generateSampleRows()', () => {
    it('generates requested number of rows', async () => {
      const { SAMPLE_DATASETS, generateSampleRows } = await import('../local/demo-datasets.js');
      const rows = generateSampleRows(SAMPLE_DATASETS[0], 10);
      expect(rows).toHaveLength(10);
    });

    it('rows match column count', async () => {
      const { SAMPLE_DATASETS, generateSampleRows } = await import('../local/demo-datasets.js');
      const ds = SAMPLE_DATASETS[0];
      const rows = generateSampleRows(ds, 5);
      for (const row of rows) {
        expect(row.length).toBe(ds.columns.length);
      }
    });
  });
});
