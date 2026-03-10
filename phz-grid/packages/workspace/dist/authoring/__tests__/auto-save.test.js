import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAutoSave } from '../auto-save.js';
describe('AutoSaveController', () => {
    let controller;
    let currentState;
    beforeEach(() => {
        vi.useFakeTimers();
        currentState = { version: 1 };
        controller = createAutoSave({
            debounceMs: 1000,
            getState: () => currentState,
        });
    });
    afterEach(() => {
        controller.dispose();
        vi.useRealTimers();
    });
    describe('initial state', () => {
        it('starts with status "idle"', () => {
            expect(controller.status).toBe('idle');
        });
        it('starts with lastSavedAt undefined', () => {
            expect(controller.lastSavedAt).toBeUndefined();
        });
    });
    describe('markDirty', () => {
        it('sets status to "dirty"', () => {
            controller.markDirty();
            expect(controller.status).toBe('dirty');
        });
    });
    describe('debounced save', () => {
        it('calls save handler after debounce period', async () => {
            const handler = vi.fn().mockResolvedValue(undefined);
            controller.onSave(handler);
            controller.markDirty();
            expect(handler).not.toHaveBeenCalled();
            await vi.advanceTimersByTimeAsync(1000);
            expect(handler).toHaveBeenCalledOnce();
        });
        it('passes current state to save handler', async () => {
            const handler = vi.fn().mockResolvedValue(undefined);
            controller.onSave(handler);
            currentState = { version: 42 };
            controller.markDirty();
            await vi.advanceTimersByTimeAsync(1000);
            expect(handler).toHaveBeenCalledWith({ version: 42 });
        });
        it('transitions status to "saving" during save', async () => {
            let statusDuringSave;
            const handler = vi.fn().mockImplementation(async () => {
                statusDuringSave = controller.status;
            });
            controller.onSave(handler);
            controller.markDirty();
            await vi.advanceTimersByTimeAsync(1000);
            expect(statusDuringSave).toBe('saving');
        });
        it('transitions status to "saved" after successful save', async () => {
            const handler = vi.fn().mockResolvedValue(undefined);
            controller.onSave(handler);
            controller.markDirty();
            await vi.advanceTimersByTimeAsync(1000);
            expect(controller.status).toBe('saved');
        });
        it('sets lastSavedAt after successful save', async () => {
            const handler = vi.fn().mockResolvedValue(undefined);
            controller.onSave(handler);
            controller.markDirty();
            const before = Date.now();
            await vi.advanceTimersByTimeAsync(1000);
            expect(controller.lastSavedAt).toBeGreaterThanOrEqual(before);
        });
        it('resets debounce timer on repeated markDirty calls', async () => {
            const handler = vi.fn().mockResolvedValue(undefined);
            controller.onSave(handler);
            controller.markDirty();
            await vi.advanceTimersByTimeAsync(500);
            controller.markDirty(); // restart debounce
            await vi.advanceTimersByTimeAsync(500);
            expect(handler).not.toHaveBeenCalled(); // still waiting
            await vi.advanceTimersByTimeAsync(500);
            expect(handler).toHaveBeenCalledOnce();
        });
        it('does not call save when no handler is registered', async () => {
            controller.markDirty();
            await vi.advanceTimersByTimeAsync(1000);
            // No error, status remains dirty since doSave returns early
            // (no handler to call, so status does not transition)
        });
    });
    describe('error handling', () => {
        it('sets status to "error" when save handler throws', async () => {
            const handler = vi.fn().mockRejectedValue(new Error('network failure'));
            controller.onSave(handler);
            controller.markDirty();
            await vi.advanceTimersByTimeAsync(1000);
            expect(controller.status).toBe('error');
        });
        it('does not set lastSavedAt on error', async () => {
            const handler = vi.fn().mockRejectedValue(new Error('fail'));
            controller.onSave(handler);
            controller.markDirty();
            await vi.advanceTimersByTimeAsync(1000);
            expect(controller.lastSavedAt).toBeUndefined();
        });
    });
    describe('pause and resume', () => {
        it('pause() prevents save from firing', async () => {
            const handler = vi.fn().mockResolvedValue(undefined);
            controller.onSave(handler);
            controller.markDirty();
            controller.pause();
            await vi.advanceTimersByTimeAsync(2000);
            expect(handler).not.toHaveBeenCalled();
        });
        it('resume() re-schedules save if dirty', async () => {
            const handler = vi.fn().mockResolvedValue(undefined);
            controller.onSave(handler);
            controller.markDirty();
            controller.pause();
            await vi.advanceTimersByTimeAsync(2000);
            expect(handler).not.toHaveBeenCalled();
            controller.resume();
            await vi.advanceTimersByTimeAsync(1000);
            expect(handler).toHaveBeenCalledOnce();
        });
        it('resume() does not schedule save if not dirty', async () => {
            const handler = vi.fn().mockResolvedValue(undefined);
            controller.onSave(handler);
            // Status is 'idle', never called markDirty
            controller.pause();
            controller.resume();
            await vi.advanceTimersByTimeAsync(2000);
            expect(handler).not.toHaveBeenCalled();
        });
        it('markDirty during pause does not schedule save', async () => {
            const handler = vi.fn().mockResolvedValue(undefined);
            controller.onSave(handler);
            controller.pause();
            controller.markDirty();
            await vi.advanceTimersByTimeAsync(2000);
            expect(handler).not.toHaveBeenCalled();
            expect(controller.status).toBe('dirty');
        });
    });
    describe('dispose', () => {
        it('clears pending timers', async () => {
            const handler = vi.fn().mockResolvedValue(undefined);
            controller.onSave(handler);
            controller.markDirty();
            controller.dispose();
            await vi.advanceTimersByTimeAsync(2000);
            expect(handler).not.toHaveBeenCalled();
        });
        it('clears the save handler', async () => {
            const handler = vi.fn().mockResolvedValue(undefined);
            controller.onSave(handler);
            controller.dispose();
            // Re-create to verify handler was cleared
            controller.markDirty();
            await vi.advanceTimersByTimeAsync(2000);
            expect(handler).not.toHaveBeenCalled();
        });
    });
    describe('default debounce', () => {
        it('uses 2000ms debounce by default', async () => {
            const defaultController = createAutoSave({ getState: () => ({}) });
            const handler = vi.fn().mockResolvedValue(undefined);
            defaultController.onSave(handler);
            defaultController.markDirty();
            await vi.advanceTimersByTimeAsync(1999);
            expect(handler).not.toHaveBeenCalled();
            await vi.advanceTimersByTimeAsync(1);
            expect(handler).toHaveBeenCalledOnce();
            defaultController.dispose();
        });
    });
});
//# sourceMappingURL=auto-save.test.js.map