/**
 * W.4 — Session Manager Component
 */

import { describe, it, expect } from 'vitest';

describe('Session Manager (W.4)', () => {
  describe('session CRUD', () => {
    it('creates a new session', async () => {
      const { createSessionMeta } = await import('../local/local-data-store.js');
      const session = createSessionMeta({ name: 'Test Session' });
      expect(session.name).toBe('Test Session');
      expect(session.id).toBeTruthy();
    });

    it('renames a session', async () => {
      const { createSessionList, addSession, updateSession, createSessionMeta } = await import('../local/local-data-store.js');
      const session = createSessionMeta({ name: 'Old Name' });
      let list = createSessionList();
      list = addSession(list, session);
      list = updateSession(list, session.id, { name: 'New Name' });
      expect(list.sessions[0].name).toBe('New Name');
    });

    it('deletes a session', async () => {
      const { createSessionList, addSession, removeSession, createSessionMeta } = await import('../local/local-data-store.js');
      const session = createSessionMeta({ name: 'Delete Me' });
      let list = createSessionList();
      list = addSession(list, session);
      list = removeSession(list, session.id);
      expect(list.sessions).toHaveLength(0);
    });
  });

  describe('export/import', () => {
    it('creates export manifest excluding credentials', async () => {
      const { createExportManifest, createSessionMeta, registerTable } = await import('../local/local-data-store.js');
      let session = createSessionMeta({ name: 'Export Test' });
      session = registerTable(session, { tableName: 'sales', rowCount: 100, sourceFile: 'sales.csv' });
      const manifest = createExportManifest(session);
      expect(manifest.sessionName).toBe('Export Test');
      expect(manifest.tables).toHaveLength(1);
      expect(manifest.version).toBe(1);
      expect(manifest.credentials).toBeUndefined();
    });

    it('validates import manifest', async () => {
      const { validateImportManifest } = await import('../local/local-data-store.js');
      const valid = validateImportManifest({
        version: 1,
        sessionName: 'Imported',
        tables: [{ tableName: 'data', rowCount: 50, sourceFile: 'data.csv' }],
      });
      expect(valid.valid).toBe(true);
    });

    it('rejects invalid manifest (missing version)', async () => {
      const { validateImportManifest } = await import('../local/local-data-store.js');
      const result = validateImportManifest({ sessionName: 'Bad' });
      expect(result.valid).toBe(false);
    });
  });
});
