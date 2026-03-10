/**
 * @phozart/phz-collab — sessionId path traversal validation tests
 */

import { describe, it, expect } from 'vitest';
import { createCollabSession, WebRTCSyncProvider } from '../index.js';
import type { CollabConfig } from '../index.js';

describe('sessionId path traversal prevention', () => {
  describe('createCollabSession', () => {
    it('rejects sessionId containing path traversal characters', () => {
      const config: CollabConfig = {
        sessionId: '../../etc/passwd',
        userId: 'user-1',
        userName: 'Alice',
      };
      expect(() => createCollabSession(config)).toThrow(/invalid session/i);
    });

    it('rejects sessionId containing slashes', () => {
      const config: CollabConfig = {
        sessionId: 'room/sub',
        userId: 'user-1',
        userName: 'Alice',
      };
      expect(() => createCollabSession(config)).toThrow(/invalid session/i);
    });

    it('rejects sessionId containing dots', () => {
      const config: CollabConfig = {
        sessionId: 'room..name',
        userId: 'user-1',
        userName: 'Alice',
      };
      expect(() => createCollabSession(config)).toThrow(/invalid session/i);
    });

    it('rejects sessionId containing spaces', () => {
      const config: CollabConfig = {
        sessionId: 'room name',
        userId: 'user-1',
        userName: 'Alice',
      };
      expect(() => createCollabSession(config)).toThrow(/invalid session/i);
    });

    it('rejects sessionId exceeding max length', () => {
      const config: CollabConfig = {
        sessionId: 'a'.repeat(129),
        userId: 'user-1',
        userName: 'Alice',
      };
      expect(() => createCollabSession(config)).toThrow(/invalid session/i);
    });

    it('accepts valid sessionId with alphanumeric, hyphens, underscores', () => {
      const config: CollabConfig = {
        sessionId: 'my-session_123',
        userId: 'user-1',
        userName: 'Alice',
      };
      expect(() => createCollabSession(config)).not.toThrow();
    });

    it('accepts config without sessionId (auto-generated)', () => {
      const config: CollabConfig = {
        userId: 'user-1',
        userName: 'Alice',
      };
      expect(() => createCollabSession(config)).not.toThrow();
    });
  });

  describe('WebRTCSyncProvider', () => {
    it('rejects sessionId containing path traversal on connect', async () => {
      const provider = new WebRTCSyncProvider({ signalingServer: 'ws://localhost:5678' });
      const mockDoc = { getArray: () => ({}), getMap: () => ({}) } as any;

      await expect(
        provider.connect(mockDoc, '../../etc/passwd'),
      ).rejects.toThrow(/invalid session/i);
    });

    it('rejects sessionId with slashes on connect', async () => {
      const provider = new WebRTCSyncProvider({ signalingServer: 'ws://localhost:5678' });
      const mockDoc = { getArray: () => ({}), getMap: () => ({}) } as any;

      await expect(
        provider.connect(mockDoc, 'room/sub'),
      ).rejects.toThrow(/invalid session/i);
    });
  });
});
