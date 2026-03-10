/**
 * W.1 — LocalDataStore (OPFS persistence, session management)
 */

import { describe, it, expect } from 'vitest';

describe('LocalDataStore (W.1)', () => {
  describe('SessionMeta type', () => {
    it('creates a valid session meta', async () => {
      const { createSessionMeta } = await import('../local/local-data-store.js');
      const session = createSessionMeta({ name: 'My Session' });
      expect(session.id).toBeTruthy();
      expect(session.name).toBe('My Session');
      expect(session.createdAt).toBeGreaterThan(0);
      expect(session.updatedAt).toBeGreaterThan(0);
      expect(session.tables).toEqual([]);
    });
  });

  describe('session list operations', () => {
    it('adds a session to empty list', async () => {
      const { createSessionList, addSession, createSessionMeta } = await import('../local/local-data-store.js');
      const list = createSessionList();
      const session = createSessionMeta({ name: 'Test' });
      const updated = addSession(list, session);
      expect(updated.sessions).toHaveLength(1);
      expect(updated.sessions[0].name).toBe('Test');
    });

    it('removes a session by id', async () => {
      const { createSessionList, addSession, removeSession, createSessionMeta } = await import('../local/local-data-store.js');
      const session = createSessionMeta({ name: 'ToRemove' });
      let list = createSessionList();
      list = addSession(list, session);
      list = removeSession(list, session.id);
      expect(list.sessions).toHaveLength(0);
    });

    it('updates session metadata', async () => {
      const { createSessionList, addSession, updateSession, createSessionMeta } = await import('../local/local-data-store.js');
      const session = createSessionMeta({ name: 'Original' });
      let list = createSessionList();
      list = addSession(list, session);
      list = updateSession(list, session.id, { name: 'Updated' });
      expect(list.sessions[0].name).toBe('Updated');
    });
  });

  describe('auto-save config', () => {
    it('returns default auto-save interval', async () => {
      const { DEFAULT_AUTO_SAVE_CONFIG } = await import('../local/local-data-store.js');
      expect(DEFAULT_AUTO_SAVE_CONFIG.intervalMs).toBe(30000);
      expect(DEFAULT_AUTO_SAVE_CONFIG.enabled).toBe(true);
    });
  });

  describe('table registration', () => {
    it('registers a table in a session', async () => {
      const { createSessionMeta, registerTable } = await import('../local/local-data-store.js');
      const session = createSessionMeta({ name: 'Test' });
      const updated = registerTable(session, { tableName: 'sales', rowCount: 1000, sourceFile: 'sales.csv' });
      expect(updated.tables).toHaveLength(1);
      expect(updated.tables[0].tableName).toBe('sales');
      expect(updated.tables[0].rowCount).toBe(1000);
    });
  });

  describe('resume prompt', () => {
    it('generates resume prompt data from recent sessions', async () => {
      const { createSessionList, addSession, createSessionMeta, getResumePrompt } = await import('../local/local-data-store.js');
      const session = createSessionMeta({ name: 'Recent Work' });
      let list = createSessionList();
      list = addSession(list, session);
      const prompt = getResumePrompt(list);
      expect(prompt.hasRecent).toBe(true);
      expect(prompt.sessions[0].name).toBe('Recent Work');
    });

    it('returns hasRecent=false for empty list', async () => {
      const { createSessionList, getResumePrompt } = await import('../local/local-data-store.js');
      const list = createSessionList();
      const prompt = getResumePrompt(list);
      expect(prompt.hasRecent).toBe(false);
    });
  });
});
