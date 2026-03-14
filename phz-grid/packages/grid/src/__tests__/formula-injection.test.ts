/**
 * @phozart/grid — Formula injection prevention tests
 */

import { describe, it, expect } from 'vitest';

// We import the CSV exporter module to test sanitizeFormulaInjection indirectly via escapeCSV
// Since sanitizeFormulaInjection is not exported, we test via exportToCSV behavior

describe('formula injection prevention', () => {
  describe('CSV exporter sanitization', () => {
    // Dynamic import to get the module
    async function getExporter() {
      return await import('../export/csv-exporter.js');
    }

    it('prefixes strings starting with = sign', async () => {
      const { exportToCSV } = await getExporter();
      const mockApi = createMockApi([{ val: '=SUM(A1:A10)' }]);
      const result = exportToCSV(mockApi, [{ field: 'val', header: 'Val' }]);
      expect(result).toContain("'=SUM(A1:A10)");
    });

    it('prefixes strings starting with + sign', async () => {
      const { exportToCSV } = await getExporter();
      const mockApi = createMockApi([{ val: '+cmd|' }]);
      const result = exportToCSV(mockApi, [{ field: 'val', header: 'Val' }]);
      expect(result).toContain("'+cmd|");
    });

    it('prefixes strings starting with - sign', async () => {
      const { exportToCSV } = await getExporter();
      const mockApi = createMockApi([{ val: '-1+1' }]);
      const result = exportToCSV(mockApi, [{ field: 'val', header: 'Val' }]);
      expect(result).toContain("'-1+1");
    });

    it('prefixes strings starting with @ sign', async () => {
      const { exportToCSV } = await getExporter();
      const mockApi = createMockApi([{ val: '@SUM(A1)' }]);
      const result = exportToCSV(mockApi, [{ field: 'val', header: 'Val' }]);
      expect(result).toContain("'@SUM(A1)");
    });

    it('prefixes strings starting with pipe | (DDE injection)', async () => {
      const { exportToCSV } = await getExporter();
      const mockApi = createMockApi([{ val: '|cmd' }]);
      const result = exportToCSV(mockApi, [{ field: 'val', header: 'Val' }]);
      // Pipe should be sanitized with a leading apostrophe
      expect(result).toContain("'|cmd");
    });

    it('does not prefix normal strings', async () => {
      const { exportToCSV } = await getExporter();
      const mockApi = createMockApi([{ val: 'hello world' }]);
      const result = exportToCSV(mockApi, [{ field: 'val', header: 'Val' }]);
      expect(result).toContain('hello world');
      expect(result).not.toContain("'hello world");
    });
  });
});

function createMockApi(data: Record<string, unknown>[]) {
  const rows = data.map((d, i) => ({ ...d, __id: `row-${i}` }));
  return {
    getSortedRowModel: () => ({ rows, rowCount: rows.length }),
    getSelection: () => ({ rows: [], cells: [] }),
  } as any;
}
