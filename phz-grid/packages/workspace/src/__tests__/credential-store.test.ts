import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryCredentialStore } from '../adapters/credential-store.js';
import type { CredentialStore, StoredCredential } from '../adapters/credential-store.js';

describe('CredentialStore', () => {
  let store: MemoryCredentialStore;

  beforeEach(() => {
    store = new MemoryCredentialStore();
  });

  describe('save and load', () => {
    it('saves and loads a bearer token credential', async () => {
      await store.save('conn-1', {
        type: 'bearer',
        token: 'abc123',
      });

      const loaded = await store.load('conn-1');
      expect(loaded).toBeDefined();
      expect(loaded!.type).toBe('bearer');
      expect(loaded!.token).toBe('abc123');
    });

    it('saves and loads a basic auth credential', async () => {
      await store.save('conn-2', {
        type: 'basic',
        username: 'admin',
        password: 'secret',
      });

      const loaded = await store.load('conn-2');
      expect(loaded).toBeDefined();
      expect(loaded!.type).toBe('basic');
      expect(loaded!.username).toBe('admin');
      expect(loaded!.password).toBe('secret');
    });

    it('saves and loads an api-key credential', async () => {
      await store.save('conn-3', {
        type: 'api-key',
        key: 'X-API-Key',
        value: 'key123',
      });

      const loaded = await store.load('conn-3');
      expect(loaded).toBeDefined();
      expect(loaded!.type).toBe('api-key');
      expect(loaded!.key).toBe('X-API-Key');
    });

    it('overwrites existing credential', async () => {
      await store.save('conn-1', { type: 'bearer', token: 'old' });
      await store.save('conn-1', { type: 'bearer', token: 'new' });

      const loaded = await store.load('conn-1');
      expect(loaded!.token).toBe('new');
    });

    it('returns undefined for unknown connectionId', async () => {
      const loaded = await store.load('nonexistent');
      expect(loaded).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('removes a credential', async () => {
      await store.save('conn-1', { type: 'bearer', token: 'abc' });
      await store.delete('conn-1');

      const loaded = await store.load('conn-1');
      expect(loaded).toBeUndefined();
    });

    it('is a no-op for unknown id', async () => {
      // Should not throw
      await store.delete('nonexistent');
    });
  });

  describe('clear', () => {
    it('removes all credentials', async () => {
      await store.save('conn-1', { type: 'bearer', token: 'a' });
      await store.save('conn-2', { type: 'bearer', token: 'b' });
      await store.save('conn-3', { type: 'bearer', token: 'c' });

      await store.clear();

      expect(await store.load('conn-1')).toBeUndefined();
      expect(await store.load('conn-2')).toBeUndefined();
      expect(await store.load('conn-3')).toBeUndefined();
    });
  });

  describe('CredentialStore interface conformance', () => {
    it('MemoryCredentialStore satisfies the CredentialStore interface', () => {
      const asInterface: CredentialStore = store;
      expect(typeof asInterface.save).toBe('function');
      expect(typeof asInterface.load).toBe('function');
      expect(typeof asInterface.delete).toBe('function');
      expect(typeof asInterface.clear).toBe('function');
    });
  });

  describe('StoredCredential discriminated union', () => {
    it('supports custom headers type', async () => {
      await store.save('conn-4', {
        type: 'custom-headers',
        headers: { 'X-Custom': 'value1', 'X-Other': 'value2' },
      });

      const loaded = await store.load('conn-4');
      expect(loaded!.type).toBe('custom-headers');
      expect(loaded!.headers).toEqual({ 'X-Custom': 'value1', 'X-Other': 'value2' });
    });
  });
});
