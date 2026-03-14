/** @phozart/grid — Export Progress State (UX-025) */

export type ExportStatus = 'idle' | 'preparing' | 'processing' | 'finalizing' | 'complete' | 'error' | 'cancelled';
export type ExportFormat = 'csv' | 'xlsx';

export interface ExportProgressState {
  status: ExportStatus;
  format: ExportFormat | null;
  totalRows: number;
  processedRows: number;
  startedAt: number | null;
  error: string | null;
  fileName: string | null;
}

const IDLE_STATE: ExportProgressState = {
  status: 'idle',
  format: null,
  totalRows: 0,
  processedRows: 0,
  startedAt: null,
  error: null,
  fileName: null,
};

/** Factory — returns a fresh idle export progress state. */
export function createExportProgressState(): ExportProgressState {
  return { ...IDLE_STATE };
}

/** Transition to 'preparing'. Sets format, totalRows, fileName, startedAt, clears error. */
export function startExport(
  state: ExportProgressState,
  format: ExportFormat,
  totalRows: number,
  fileName: string,
  now: number,
): ExportProgressState {
  return {
    ...state,
    status: 'preparing',
    format,
    totalRows,
    processedRows: 0,
    startedAt: now,
    error: null,
    fileName,
  };
}

/** Transition from 'preparing' → 'processing'. No-op if not preparing. */
export function beginProcessing(state: ExportProgressState): ExportProgressState {
  if (state.status !== 'preparing') return state;
  return { ...state, status: 'processing' };
}

/** Update processedRows. Clamped to [0, totalRows]. No-op if not processing or unchanged. */
export function updateExportProgress(state: ExportProgressState, processedRows: number): ExportProgressState {
  if (state.status !== 'processing') return state;
  const clamped = Math.max(0, Math.min(processedRows, state.totalRows));
  if (clamped === state.processedRows) return state;
  return { ...state, processedRows: clamped };
}

/** Transition from 'processing' → 'finalizing'. Sets processedRows = totalRows. No-op if not processing. */
export function finalizeExport(state: ExportProgressState): ExportProgressState {
  if (state.status !== 'processing') return state;
  return { ...state, status: 'finalizing', processedRows: state.totalRows };
}

/** Transition from 'finalizing' → 'complete'. No-op if not finalizing. */
export function completeExport(state: ExportProgressState): ExportProgressState {
  if (state.status !== 'finalizing') return state;
  return { ...state, status: 'complete' };
}

/** Transition to 'error'. Works from any non-idle status. */
export function failExport(state: ExportProgressState, error: string): ExportProgressState {
  if (state.status === 'idle') return state;
  return { ...state, status: 'error', error };
}

/** Transition to 'cancelled'. Only from preparing/processing/finalizing. */
export function cancelExport(state: ExportProgressState): ExportProgressState {
  if (state.status !== 'preparing' && state.status !== 'processing' && state.status !== 'finalizing') return state;
  return { ...state, status: 'cancelled' };
}

/** Reset back to idle. No-op if already idle. */
export function resetExport(state: ExportProgressState): ExportProgressState {
  if (state.status === 'idle') return state;
  return createExportProgressState();
}

/** Progress percentage 0–100. Returns 0 if totalRows is 0. */
export function getExportProgress(state: ExportProgressState): number {
  if (state.totalRows === 0) return 0;
  return Math.round((state.processedRows / state.totalRows) * 100);
}

/** Elapsed time in milliseconds since export started. 0 if startedAt is null. */
export function getElapsedTime(state: ExportProgressState, now: number): number {
  if (state.startedAt === null) return 0;
  return now - state.startedAt;
}

/** Estimated remaining time in ms. 0 if not processing or no rows processed yet. */
export function getEstimatedTimeRemaining(state: ExportProgressState, now: number): number {
  if (state.status !== 'processing' || state.processedRows === 0) return 0;
  const elapsed = getElapsedTime(state, now);
  return (elapsed / state.processedRows) * (state.totalRows - state.processedRows);
}

/** True if currently exporting (preparing, processing, or finalizing). */
export function isExporting(state: ExportProgressState): boolean {
  return state.status === 'preparing' || state.status === 'processing' || state.status === 'finalizing';
}
