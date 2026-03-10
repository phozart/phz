/**
 * Tests for Phase 5: Edit Options & Persistence
 *
 * Task 5.1: Save event listener → WorkspaceAdapter.saveArtifact()
 * Task 5.2: Auto-save wiring → WorkspaceAdapter
 * Task 5.3: Undo/redo state restore → component re-render
 * Task 5.4: Publish workflow validation runner
 * Task 5.5: Conflict detection on concurrent edits
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createSaveEventBridge,
  createAutoSaveWiring,
  createUndoRedoWiring,
  createConflictDetector,
} from '../coordination/persistence-wiring.js';

describe('persistence-wiring', () => {
  // =====================================================================
  // Task 5.1: Save event bridge
  // =====================================================================
  describe('createSaveEventBridge', () => {
    it('handles save-report event by calling adapter.saveReport()', async () => {
      const adapter = { saveReport: vi.fn().mockResolvedValue(undefined) };
      const bridge = createSaveEventBridge(adapter as any);

      await bridge.handleSaveEvent('save-report', {
        state: { name: 'Test Report', columns: [], filters: [] },
        gridConfig: {},
      });

      expect(adapter.saveReport).toHaveBeenCalledTimes(1);
    });

    it('handles save-dashboard event by calling adapter.saveDashboard()', async () => {
      const adapter = { saveDashboard: vi.fn().mockResolvedValue(undefined) };
      const bridge = createSaveEventBridge(adapter as any);

      await bridge.handleSaveEvent('save-dashboard', {
        state: { name: 'Test Dashboard', widgets: [] },
      });

      expect(adapter.saveDashboard).toHaveBeenCalledTimes(1);
    });

    it('calls onSaveComplete callback on success', async () => {
      const adapter = { saveReport: vi.fn().mockResolvedValue(undefined) };
      const onComplete = vi.fn();
      const bridge = createSaveEventBridge(adapter as any, { onSaveComplete: onComplete });

      await bridge.handleSaveEvent('save-report', { state: {}, gridConfig: {} });

      expect(onComplete).toHaveBeenCalledWith('save-report', true, undefined);
    });

    it('calls onSaveComplete with error on failure', async () => {
      const adapter = { saveReport: vi.fn().mockRejectedValue(new Error('Network error')) };
      const onComplete = vi.fn();
      const bridge = createSaveEventBridge(adapter as any, { onSaveComplete: onComplete });

      await bridge.handleSaveEvent('save-report', { state: {}, gridConfig: {} });

      expect(onComplete).toHaveBeenCalledWith('save-report', false, 'Network error');
    });
  });

  // =====================================================================
  // Task 5.2: Auto-save wiring
  // =====================================================================
  describe('createAutoSaveWiring', () => {
    it('triggers save after debounce period on state change', async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const wiring = createAutoSaveWiring(saveFn, { debounceMs: 50 });

      wiring.onStateChanged({ name: 'test', dirty: true });

      // Should NOT save immediately
      expect(saveFn).not.toHaveBeenCalled();

      // Wait for debounce
      await new Promise(r => setTimeout(r, 100));

      expect(saveFn).toHaveBeenCalledTimes(1);

      wiring.destroy();
    });

    it('does not save when state is not dirty', async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const wiring = createAutoSaveWiring(saveFn, { debounceMs: 50 });

      wiring.onStateChanged({ name: 'test', dirty: false });

      await new Promise(r => setTimeout(r, 100));

      expect(saveFn).not.toHaveBeenCalled();

      wiring.destroy();
    });

    it('cancels pending save on destroy', async () => {
      const saveFn = vi.fn().mockResolvedValue(undefined);
      const wiring = createAutoSaveWiring(saveFn, { debounceMs: 100 });

      wiring.onStateChanged({ name: 'test', dirty: true });
      wiring.destroy();

      await new Promise(r => setTimeout(r, 150));

      expect(saveFn).not.toHaveBeenCalled();
    });
  });

  // =====================================================================
  // Task 5.3: Undo/redo wiring
  // =====================================================================
  describe('createUndoRedoWiring', () => {
    it('pushes state snapshots and allows undo', () => {
      const wiring = createUndoRedoWiring<{ count: number }>();

      wiring.push({ count: 1 });
      wiring.push({ count: 2 });
      wiring.push({ count: 3 });

      expect(wiring.canUndo).toBe(true);
      const undone = wiring.undo();
      expect(undone).toEqual({ count: 2 });
    });

    it('allows redo after undo', () => {
      const wiring = createUndoRedoWiring<{ count: number }>();

      wiring.push({ count: 1 });
      wiring.push({ count: 2 });
      wiring.undo();

      expect(wiring.canRedo).toBe(true);
      const redone = wiring.redo();
      expect(redone).toEqual({ count: 2 });
    });

    it('clears redo stack on new push', () => {
      const wiring = createUndoRedoWiring<{ count: number }>();

      wiring.push({ count: 1 });
      wiring.push({ count: 2 });
      wiring.undo();
      wiring.push({ count: 3 });

      expect(wiring.canRedo).toBe(false);
    });

    it('notifies listeners on undo/redo', () => {
      const listener = vi.fn();
      const wiring = createUndoRedoWiring<{ count: number }>();
      wiring.onStateRestore(listener);

      wiring.push({ count: 1 });
      wiring.push({ count: 2 });
      wiring.undo();

      expect(listener).toHaveBeenCalledWith({ count: 1 });
    });
  });

  // =====================================================================
  // Task 5.5: Conflict detection
  // =====================================================================
  describe('createConflictDetector', () => {
    it('detects no conflict when versions match', () => {
      const detector = createConflictDetector();

      detector.setLocalVersion(5);
      const result = detector.check(5);

      expect(result.conflict).toBe(false);
    });

    it('detects conflict when remote version is ahead', () => {
      const detector = createConflictDetector();

      detector.setLocalVersion(3);
      const result = detector.check(5);

      expect(result.conflict).toBe(true);
      expect(result.localVersion).toBe(3);
      expect(result.remoteVersion).toBe(5);
    });

    it('updates local version on successful save', () => {
      const detector = createConflictDetector();

      detector.setLocalVersion(3);
      detector.onSaveSuccess(4);

      const result = detector.check(4);
      expect(result.conflict).toBe(false);
    });
  });
});
