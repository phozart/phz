/**
 * W.7 — Cross-Tier Session Compatibility
 */

import { describe, it, expect } from 'vitest';

describe('Session Compatibility (W.7)', () => {
  describe('SESSION_FORMAT_VERSION', () => {
    it('exports current format version', async () => {
      const { SESSION_FORMAT_VERSION } = await import('../local/session-compat.js');
      expect(SESSION_FORMAT_VERSION).toBe(1);
    });
  });

  describe('createExportBundle()', () => {
    it('creates a valid export bundle structure', async () => {
      const { createExportBundle } = await import('../local/session-compat.js');
      const bundle = createExportBundle({
        sessionName: 'Test Export',
        tables: [{ tableName: 'data', rowCount: 100, sourceFile: 'data.csv' }],
      });
      expect(bundle.version).toBe(1);
      expect(bundle.sessionName).toBe('Test Export');
      expect(bundle.tables).toHaveLength(1);
      expect(bundle.exportedAt).toBeGreaterThan(0);
    });
  });

  describe('validateExportBundle()', () => {
    it('validates a well-formed bundle', async () => {
      const { validateExportBundle } = await import('../local/session-compat.js');
      const result = validateExportBundle({
        version: 1,
        sessionName: 'Valid',
        tables: [],
        exportedAt: Date.now(),
      });
      expect(result.valid).toBe(true);
    });

    it('rejects missing version', async () => {
      const { validateExportBundle } = await import('../local/session-compat.js');
      const result = validateExportBundle({
        sessionName: 'Invalid',
        tables: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects unsupported version', async () => {
      const { validateExportBundle } = await import('../local/session-compat.js');
      const result = validateExportBundle({
        version: 999,
        sessionName: 'Future',
        tables: [],
        exportedAt: Date.now(),
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('isLocalServerBundle()', () => {
    it('returns true for phz-local compatible bundle', async () => {
      const { isLocalServerBundle } = await import('../local/session-compat.js');
      expect(isLocalServerBundle({
        version: 1,
        sessionName: 'Test',
        tables: [],
        exportedAt: Date.now(),
        source: 'phz-local',
      })).toBe(true);
    });

    it('returns false for browser-only bundle', async () => {
      const { isLocalServerBundle } = await import('../local/session-compat.js');
      expect(isLocalServerBundle({
        version: 1,
        sessionName: 'Test',
        tables: [],
        exportedAt: Date.now(),
        source: 'browser',
      })).toBe(false);
    });
  });

  describe('convertBundleForImport()', () => {
    it('strips server-only fields for browser import', async () => {
      const { convertBundleForImport } = await import('../local/session-compat.js');
      const bundle = {
        version: 1,
        sessionName: 'Server Session',
        tables: [{ tableName: 'data', rowCount: 100, sourceFile: 'data.csv' }],
        exportedAt: Date.now(),
        source: 'phz-local' as const,
        serverConfig: { port: 3000 },
      };
      const imported = convertBundleForImport(bundle);
      expect(imported.sessionName).toBe('Server Session');
      expect(imported.tables).toHaveLength(1);
      expect((imported as any).serverConfig).toBeUndefined();
    });
  });
});
