/** @phozart/grid — Export Progress State (UX-025) */
import { describe, it, expect } from 'vitest';
import {
  createExportProgressState,
  startExport,
  beginProcessing,
  updateExportProgress,
  finalizeExport,
  completeExport,
  failExport,
  cancelExport,
  resetExport,
  getExportProgress,
  getElapsedTime,
  getEstimatedTimeRemaining,
  isExporting,
  type ExportProgressState,
  type ExportStatus,
  type ExportFormat,
} from '../controllers/export-progress-state.js';

describe('Export Progress State (UX-025)', () => {
  // ── createExportProgressState ──

  describe('createExportProgressState', () => {
    it('returns idle state with all defaults', () => {
      const state = createExportProgressState();
      expect(state).toEqual({
        status: 'idle',
        format: null,
        totalRows: 0,
        processedRows: 0,
        startedAt: null,
        error: null,
        fileName: null,
      });
    });
  });

  // ── startExport ──

  describe('startExport', () => {
    it('transitions from idle to preparing with all fields set', () => {
      const state = createExportProgressState();
      const result = startExport(state, 'csv', 10_000, 'report.csv', 1000);
      expect(result).toEqual({
        status: 'preparing',
        format: 'csv',
        totalRows: 10_000,
        processedRows: 0,
        startedAt: 1000,
        error: null,
        fileName: 'report.csv',
      });
    });

    it('sets xlsx format', () => {
      const state = createExportProgressState();
      const result = startExport(state, 'xlsx', 5000, 'data.xlsx', 2000);
      expect(result.format).toBe('xlsx');
      expect(result.fileName).toBe('data.xlsx');
    });

    it('clears previous error when starting a new export', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      state = failExport(state, 'network error');
      expect(state.error).toBe('network error');

      const fresh = startExport(state, 'xlsx', 200, 'g.xlsx', 2000);
      expect(fresh.error).toBeNull();
      expect(fresh.status).toBe('preparing');
    });

    it('returns a new object (immutable)', () => {
      const state = createExportProgressState();
      const result = startExport(state, 'csv', 100, 'f.csv', 1000);
      expect(result).not.toBe(state);
    });
  });

  // ── beginProcessing ──

  describe('beginProcessing', () => {
    it('transitions from preparing to processing', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      const result = beginProcessing(state);
      expect(result.status).toBe('processing');
    });

    it('is a no-op if status is not preparing (returns same ref)', () => {
      const idle = createExportProgressState();
      expect(beginProcessing(idle)).toBe(idle);

      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      const processing = state;
      // calling again on processing should be no-op
      expect(beginProcessing(processing)).toBe(processing);
    });

    it('is a no-op from finalizing', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      state = finalizeExport(state);
      expect(beginProcessing(state)).toBe(state);
    });
  });

  // ── updateExportProgress ──

  describe('updateExportProgress', () => {
    it('updates processedRows during processing', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 1000, 'f.csv', 1000);
      state = beginProcessing(state);
      const result = updateExportProgress(state, 500);
      expect(result.processedRows).toBe(500);
    });

    it('clamps processedRows to totalRows', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      const result = updateExportProgress(state, 999);
      expect(result.processedRows).toBe(100);
    });

    it('clamps processedRows to 0 (no negative)', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      const result = updateExportProgress(state, -5);
      expect(result.processedRows).toBe(0);
    });

    it('is a no-op if status is not processing (returns same ref)', () => {
      const idle = createExportProgressState();
      expect(updateExportProgress(idle, 50)).toBe(idle);

      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      // still preparing
      expect(updateExportProgress(state, 50)).toBe(state);
    });

    it('is a no-op if processedRows has not changed (returns same ref)', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      state = updateExportProgress(state, 50);
      const same = updateExportProgress(state, 50);
      expect(same).toBe(state);
    });

    it('returns a new object when processedRows changes', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      const result = updateExportProgress(state, 25);
      expect(result).not.toBe(state);
    });
  });

  // ── finalizeExport ──

  describe('finalizeExport', () => {
    it('transitions from processing to finalizing and sets processedRows to totalRows', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 1000, 'f.csv', 1000);
      state = beginProcessing(state);
      state = updateExportProgress(state, 800);
      const result = finalizeExport(state);
      expect(result.status).toBe('finalizing');
      expect(result.processedRows).toBe(1000);
    });

    it('is a no-op if status is not processing (returns same ref)', () => {
      const idle = createExportProgressState();
      expect(finalizeExport(idle)).toBe(idle);

      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      // preparing, not processing
      expect(finalizeExport(state)).toBe(state);
    });
  });

  // ── completeExport ──

  describe('completeExport', () => {
    it('transitions from finalizing to complete', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      state = finalizeExport(state);
      const result = completeExport(state);
      expect(result.status).toBe('complete');
    });

    it('is a no-op if status is not finalizing (returns same ref)', () => {
      const idle = createExportProgressState();
      expect(completeExport(idle)).toBe(idle);

      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      // processing, not finalizing
      expect(completeExport(state)).toBe(state);
    });
  });

  // ── failExport ──

  describe('failExport', () => {
    it('sets status to error and records the error message', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      const result = failExport(state, 'disk full');
      expect(result.status).toBe('error');
      expect(result.error).toBe('disk full');
    });

    it('works from preparing status', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      expect(failExport(state, 'err').status).toBe('error');
    });

    it('works from processing status', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      expect(failExport(state, 'err').status).toBe('error');
    });

    it('works from finalizing status', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      state = finalizeExport(state);
      expect(failExport(state, 'err').status).toBe('error');
    });

    it('is a no-op from idle status (returns same ref)', () => {
      const idle = createExportProgressState();
      expect(failExport(idle, 'err')).toBe(idle);
    });

    it('works from complete status (non-idle)', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      state = finalizeExport(state);
      state = completeExport(state);
      const result = failExport(state, 'late error');
      expect(result.status).toBe('error');
      expect(result.error).toBe('late error');
    });

    it('works from cancelled status (non-idle)', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = cancelExport(state);
      const result = failExport(state, 'post-cancel error');
      expect(result.status).toBe('error');
    });

    it('works from error status (can update error message)', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = failExport(state, 'first error');
      const result = failExport(state, 'second error');
      expect(result.error).toBe('second error');
    });
  });

  // ── cancelExport ──

  describe('cancelExport', () => {
    it('transitions from preparing to cancelled', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      const result = cancelExport(state);
      expect(result.status).toBe('cancelled');
    });

    it('transitions from processing to cancelled', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      const result = cancelExport(state);
      expect(result.status).toBe('cancelled');
    });

    it('transitions from finalizing to cancelled', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      state = finalizeExport(state);
      const result = cancelExport(state);
      expect(result.status).toBe('cancelled');
    });

    it('is a no-op from idle (returns same ref)', () => {
      const idle = createExportProgressState();
      expect(cancelExport(idle)).toBe(idle);
    });

    it('is a no-op from complete (returns same ref)', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      state = finalizeExport(state);
      state = completeExport(state);
      expect(cancelExport(state)).toBe(state);
    });

    it('is a no-op from error (returns same ref)', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = failExport(state, 'err');
      expect(cancelExport(state)).toBe(state);
    });

    it('is a no-op from cancelled (returns same ref)', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = cancelExport(state);
      const cancelled = state;
      expect(cancelExport(cancelled)).toBe(cancelled);
    });
  });

  // ── resetExport ──

  describe('resetExport', () => {
    it('resets any state back to idle defaults', () => {
      let state = createExportProgressState();
      state = startExport(state, 'xlsx', 5000, 'data.xlsx', 1000);
      state = beginProcessing(state);
      state = updateExportProgress(state, 2500);
      const result = resetExport(state);
      expect(result).toEqual({
        status: 'idle',
        format: null,
        totalRows: 0,
        processedRows: 0,
        startedAt: null,
        error: null,
        fileName: null,
      });
    });

    it('is a no-op if already idle (returns same ref)', () => {
      const idle = createExportProgressState();
      expect(resetExport(idle)).toBe(idle);
    });

    it('resets from error state', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = failExport(state, 'err');
      const result = resetExport(state);
      expect(result.status).toBe('idle');
      expect(result.error).toBeNull();
    });

    it('resets from complete state', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      state = finalizeExport(state);
      state = completeExport(state);
      const result = resetExport(state);
      expect(result.status).toBe('idle');
    });

    it('resets from cancelled state', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = cancelExport(state);
      const result = resetExport(state);
      expect(result.status).toBe('idle');
    });
  });

  // ── getExportProgress ──

  describe('getExportProgress', () => {
    it('returns 0 for idle state', () => {
      const state = createExportProgressState();
      expect(getExportProgress(state)).toBe(0);
    });

    it('returns 0 when totalRows is 0', () => {
      const state: ExportProgressState = {
        status: 'processing',
        format: 'csv',
        totalRows: 0,
        processedRows: 0,
        startedAt: 1000,
        error: null,
        fileName: 'f.csv',
      };
      expect(getExportProgress(state)).toBe(0);
    });

    it('returns correct percentage rounded', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 300, 'f.csv', 1000);
      state = beginProcessing(state);
      state = updateExportProgress(state, 100);
      expect(getExportProgress(state)).toBe(33); // 100/300 = 33.33 → 33
    });

    it('returns 50 at halfway', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 200, 'f.csv', 1000);
      state = beginProcessing(state);
      state = updateExportProgress(state, 100);
      expect(getExportProgress(state)).toBe(50);
    });

    it('returns 100 when complete', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      state = finalizeExport(state);
      expect(getExportProgress(state)).toBe(100);
    });
  });

  // ── getElapsedTime ──

  describe('getElapsedTime', () => {
    it('returns 0 when startedAt is null', () => {
      const state = createExportProgressState();
      expect(getElapsedTime(state, 5000)).toBe(0);
    });

    it('returns elapsed time since startedAt', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      expect(getElapsedTime(state, 4000)).toBe(3000);
    });
  });

  // ── getEstimatedTimeRemaining ──

  describe('getEstimatedTimeRemaining', () => {
    it('returns 0 when not processing', () => {
      const state = createExportProgressState();
      expect(getEstimatedTimeRemaining(state, 5000)).toBe(0);
    });

    it('returns 0 when processedRows is 0', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 1000, 'f.csv', 1000);
      state = beginProcessing(state);
      expect(getEstimatedTimeRemaining(state, 2000)).toBe(0);
    });

    it('estimates remaining time based on elapsed rate', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 1000, 'f.csv', 1000);
      state = beginProcessing(state);
      state = updateExportProgress(state, 500);
      // elapsed = 3000 - 1000 = 2000ms, processed 500 of 1000
      // rate = 2000 / 500 = 4ms per row, remaining = 500 rows → 2000ms
      expect(getEstimatedTimeRemaining(state, 3000)).toBe(2000);
    });

    it('returns 0 when in preparing status', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 1000, 'f.csv', 1000);
      expect(getEstimatedTimeRemaining(state, 2000)).toBe(0);
    });

    it('returns 0 when in finalizing status', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      state = finalizeExport(state);
      expect(getEstimatedTimeRemaining(state, 2000)).toBe(0);
    });
  });

  // ── isExporting ──

  describe('isExporting', () => {
    it('returns false for idle', () => {
      expect(isExporting(createExportProgressState())).toBe(false);
    });

    it('returns true for preparing', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      expect(isExporting(state)).toBe(true);
    });

    it('returns true for processing', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      expect(isExporting(state)).toBe(true);
    });

    it('returns true for finalizing', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      state = finalizeExport(state);
      expect(isExporting(state)).toBe(true);
    });

    it('returns false for complete', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      state = finalizeExport(state);
      state = completeExport(state);
      expect(isExporting(state)).toBe(false);
    });

    it('returns false for error', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = failExport(state, 'err');
      expect(isExporting(state)).toBe(false);
    });

    it('returns false for cancelled', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = cancelExport(state);
      expect(isExporting(state)).toBe(false);
    });
  });

  // ── Full lifecycle ──

  describe('full lifecycle', () => {
    it('idle → preparing → processing → finalizing → complete → reset', () => {
      let state = createExportProgressState();
      expect(state.status).toBe('idle');

      state = startExport(state, 'xlsx', 10_000, 'report.xlsx', 1000);
      expect(state.status).toBe('preparing');

      state = beginProcessing(state);
      expect(state.status).toBe('processing');

      state = updateExportProgress(state, 5000);
      expect(getExportProgress(state)).toBe(50);
      expect(getEstimatedTimeRemaining(state, 3000)).toBe(2000);

      state = updateExportProgress(state, 8000);
      expect(getExportProgress(state)).toBe(80);

      state = finalizeExport(state);
      expect(state.status).toBe('finalizing');
      expect(state.processedRows).toBe(10_000);
      expect(getExportProgress(state)).toBe(100);

      state = completeExport(state);
      expect(state.status).toBe('complete');
      expect(isExporting(state)).toBe(false);

      state = resetExport(state);
      expect(state.status).toBe('idle');
      expect(state.format).toBeNull();
    });

    it('idle → preparing → processing → cancel → reset', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 500, 'data.csv', 1000);
      state = beginProcessing(state);
      state = updateExportProgress(state, 100);
      state = cancelExport(state);
      expect(state.status).toBe('cancelled');
      expect(isExporting(state)).toBe(false);

      state = resetExport(state);
      expect(state.status).toBe('idle');
    });

    it('idle → preparing → fail → reset', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 500, 'data.csv', 1000);
      state = failExport(state, 'connection lost');
      expect(state.status).toBe('error');
      expect(state.error).toBe('connection lost');

      state = resetExport(state);
      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
    });
  });

  // ── State machine enforcement ──

  describe('state machine guards', () => {
    it('cannot skip from idle directly to processing', () => {
      const idle = createExportProgressState();
      expect(beginProcessing(idle)).toBe(idle);
    });

    it('cannot skip from idle directly to finalizing', () => {
      const idle = createExportProgressState();
      expect(finalizeExport(idle)).toBe(idle);
    });

    it('cannot skip from idle directly to complete', () => {
      const idle = createExportProgressState();
      expect(completeExport(idle)).toBe(idle);
    });

    it('cannot skip from preparing to finalizing', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      expect(finalizeExport(state)).toBe(state);
    });

    it('cannot skip from preparing to complete', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      expect(completeExport(state)).toBe(state);
    });

    it('cannot skip from processing to complete', () => {
      let state = createExportProgressState();
      state = startExport(state, 'csv', 100, 'f.csv', 1000);
      state = beginProcessing(state);
      expect(completeExport(state)).toBe(state);
    });
  });
});
