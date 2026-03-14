import { describe, it, expect } from 'vitest';
import { buildExportQuery } from '../duckdb-export.js';
import type { ExportOptions } from '../duckdb-export.js';

describe('DuckDB Export', () => {
  describe('buildExportQuery', () => {
    it('should build Parquet export query', () => {
      const sql = buildExportQuery('sales', { format: 'parquet' });
      expect(sql).toContain('FORMAT PARQUET');
      expect(sql).toContain('"sales"');
    });

    it('should include compression option for Parquet', () => {
      const sql = buildExportQuery('sales', {
        format: 'parquet',
        compression: 'zstd',
      });
      expect(sql).toContain("COMPRESSION 'ZSTD'");
    });

    it('should include row group size for Parquet', () => {
      const sql = buildExportQuery('sales', {
        format: 'parquet',
        rowGroupSize: 100000,
      });
      expect(sql).toContain('ROW_GROUP_SIZE 100000');
    });

    it('should build Arrow IPC export query', () => {
      const sql = buildExportQuery('sales', { format: 'arrow-ipc' });
      expect(sql).toContain('FORMAT ARROW');
    });

    it('should build CSV export query with header', () => {
      const sql = buildExportQuery('sales', { format: 'csv' });
      expect(sql).toContain('FORMAT CSV');
      expect(sql).toContain('HEADER true');
    });

    it('should build filtered export query', () => {
      const filters = [
        { field: 'region', operator: 'equals' as const, value: 'East' },
      ];
      const sql = buildExportQuery('sales', { format: 'parquet' }, filters);
      expect(sql).toContain('COPY (');
      expect(sql).toContain('FORMAT PARQUET');
    });

    it('should handle no compression for Parquet', () => {
      const sql = buildExportQuery('sales', {
        format: 'parquet',
        compression: 'none',
      });
      expect(sql).not.toContain('COMPRESSION');
    });

    it('should build Parquet with snappy compression', () => {
      const sql = buildExportQuery('sales', {
        format: 'parquet',
        compression: 'snappy',
      });
      expect(sql).toContain("COMPRESSION 'SNAPPY'");
    });
  });
});
