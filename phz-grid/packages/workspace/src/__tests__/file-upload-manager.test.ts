/**
 * W.2 — FileUploadManager (CSV/Excel/Parquet/JSON)
 */

import { describe, it, expect } from 'vitest';

describe('FileUploadManager (W.2)', () => {
  describe('detectFileFormat()', () => {
    it('detects CSV from extension', async () => {
      const { detectFileFormat } = await import('../local/file-upload-manager.js');
      expect(detectFileFormat('data.csv')).toBe('csv');
    });

    it('detects Excel from .xlsx', async () => {
      const { detectFileFormat } = await import('../local/file-upload-manager.js');
      expect(detectFileFormat('report.xlsx')).toBe('excel');
    });

    it('detects Excel from .xls', async () => {
      const { detectFileFormat } = await import('../local/file-upload-manager.js');
      expect(detectFileFormat('old-report.xls')).toBe('excel');
    });

    it('detects Parquet', async () => {
      const { detectFileFormat } = await import('../local/file-upload-manager.js');
      expect(detectFileFormat('data.parquet')).toBe('parquet');
    });

    it('detects JSON', async () => {
      const { detectFileFormat } = await import('../local/file-upload-manager.js');
      expect(detectFileFormat('config.json')).toBe('json');
    });

    it('returns unknown for unsupported formats', async () => {
      const { detectFileFormat } = await import('../local/file-upload-manager.js');
      expect(detectFileFormat('image.png')).toBe('unknown');
    });
  });

  describe('SUPPORTED_FORMATS', () => {
    it('includes all 4 supported formats', async () => {
      const { SUPPORTED_FORMATS } = await import('../local/file-upload-manager.js');
      expect(SUPPORTED_FORMATS).toContain('csv');
      expect(SUPPORTED_FORMATS).toContain('excel');
      expect(SUPPORTED_FORMATS).toContain('parquet');
      expect(SUPPORTED_FORMATS).toContain('json');
    });
  });

  describe('createUploadOptions()', () => {
    it('returns default CSV options', async () => {
      const { createUploadOptions } = await import('../local/file-upload-manager.js');
      const opts = createUploadOptions('csv');
      expect(opts.delimiter).toBe(',');
      expect(opts.hasHeader).toBe(true);
      expect(opts.encoding).toBe('utf-8');
    });

    it('returns Excel options with sheet index', async () => {
      const { createUploadOptions } = await import('../local/file-upload-manager.js');
      const opts = createUploadOptions('excel');
      expect(opts.sheetIndex).toBe(0);
      expect(opts.hasHeader).toBe(true);
    });

    it('accepts custom overrides', async () => {
      const { createUploadOptions } = await import('../local/file-upload-manager.js');
      const opts = createUploadOptions('csv', { delimiter: ';', hasHeader: false });
      expect(opts.delimiter).toBe(';');
      expect(opts.hasHeader).toBe(false);
    });
  });

  describe('validateFileName()', () => {
    it('accepts valid filenames', async () => {
      const { validateFileName } = await import('../local/file-upload-manager.js');
      expect(validateFileName('data.csv').valid).toBe(true);
    });

    it('rejects empty filenames', async () => {
      const { validateFileName } = await import('../local/file-upload-manager.js');
      expect(validateFileName('').valid).toBe(false);
    });

    it('derives table name from filename', async () => {
      const { validateFileName } = await import('../local/file-upload-manager.js');
      const result = validateFileName('My Sales Data.csv');
      expect(result.tableName).toBe('my_sales_data');
    });
  });

  describe('getAcceptAttribute()', () => {
    it('returns accept string for file input', async () => {
      const { getAcceptAttribute } = await import('../local/file-upload-manager.js');
      const accept = getAcceptAttribute();
      expect(accept).toContain('.csv');
      expect(accept).toContain('.xlsx');
      expect(accept).toContain('.json');
      expect(accept).toContain('.parquet');
    });
  });
});
