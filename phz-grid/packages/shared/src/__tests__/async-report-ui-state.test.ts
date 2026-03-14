/**
 * Tests for Async Report UI State (C-2.01)
 */
import { describe, it, expect } from 'vitest';
import {
  createAsyncReportUIState,
  addJob,
  updateJobStatus,
  removeJob,
  getCompletedJobs,
  getActiveJobs,
} from '../coordination/async-report-ui-state.js';
import type { AsyncReportJob } from '@phozart/shared/types';

// --- Test helpers ---

function makeJob(overrides?: Partial<AsyncReportJob>): AsyncReportJob {
  return {
    id: `job_${Math.random().toString(36).slice(2, 8)}`,
    reportId: 'report_1',
    status: 'queued',
    progress: 0,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('createAsyncReportUIState', () => {
  it('creates default state', () => {
    const state = createAsyncReportUIState();
    expect(state.jobs).toEqual([]);
    expect(state.activeJobId).toBeNull();
    expect(state.pollingIntervalMs).toBe(3000);
    expect(state.polling).toBe(false);
  });

  it('accepts overrides', () => {
    const state = createAsyncReportUIState({ pollingIntervalMs: 5000, polling: true });
    expect(state.pollingIntervalMs).toBe(5000);
    expect(state.polling).toBe(true);
  });
});

describe('addJob', () => {
  it('adds a job to empty state', () => {
    const state = createAsyncReportUIState();
    const job = makeJob({ id: 'j1' });
    const next = addJob(state, job);

    expect(next.jobs).toHaveLength(1);
    expect(next.jobs[0].id).toBe('j1');
    expect(next.activeJobId).toBe('j1');
    expect(next.polling).toBe(true);
  });

  it('replaces existing job with same ID', () => {
    const state = createAsyncReportUIState();
    const job1 = makeJob({ id: 'j1', progress: 0 });
    const job2 = makeJob({ id: 'j1', progress: 50 });
    const next = addJob(addJob(state, job1), job2);

    expect(next.jobs).toHaveLength(1);
    expect(next.jobs[0].progress).toBe(50);
  });

  it('does not overwrite existing activeJobId', () => {
    let state = createAsyncReportUIState();
    state = addJob(state, makeJob({ id: 'j1' }));
    state = addJob(state, makeJob({ id: 'j2' }));

    expect(state.activeJobId).toBe('j1');
  });
});

describe('updateJobStatus', () => {
  it('updates status and progress', () => {
    let state = createAsyncReportUIState();
    state = addJob(state, makeJob({ id: 'j1' }));
    state = updateJobStatus(state, 'j1', 'running', 30);

    expect(state.jobs[0].status).toBe('running');
    expect(state.jobs[0].progress).toBe(30);
    expect(state.jobs[0].startedAt).toBeDefined();
  });

  it('sets completedAt on terminal status', () => {
    let state = createAsyncReportUIState();
    state = addJob(state, makeJob({ id: 'j1' }));
    state = updateJobStatus(state, 'j1', 'complete', 100);

    expect(state.jobs[0].completedAt).toBeDefined();
    expect(state.polling).toBe(false);
  });

  it('returns state unchanged for unknown job ID', () => {
    const state = createAsyncReportUIState();
    const next = updateJobStatus(state, 'unknown', 'running');
    expect(next).toBe(state);
  });

  it('stops polling when all jobs are terminal', () => {
    let state = createAsyncReportUIState();
    state = addJob(state, makeJob({ id: 'j1' }));
    state = addJob(state, makeJob({ id: 'j2' }));
    state = updateJobStatus(state, 'j1', 'complete');
    expect(state.polling).toBe(true); // j2 still active

    state = updateJobStatus(state, 'j2', 'failed');
    expect(state.polling).toBe(false);
  });

  it('keeps progress when not provided', () => {
    let state = createAsyncReportUIState();
    state = addJob(state, makeJob({ id: 'j1', progress: 42 }));
    state = updateJobStatus(state, 'j1', 'running');
    expect(state.jobs[0].progress).toBe(42);
  });

  it('sets completedAt for cancelled status', () => {
    let state = createAsyncReportUIState();
    state = addJob(state, makeJob({ id: 'j1' }));
    state = updateJobStatus(state, 'j1', 'cancelled');
    expect(state.jobs[0].completedAt).toBeDefined();
  });

  it('sets completedAt for expired status', () => {
    let state = createAsyncReportUIState();
    state = addJob(state, makeJob({ id: 'j1' }));
    state = updateJobStatus(state, 'j1', 'expired');
    expect(state.jobs[0].completedAt).toBeDefined();
  });

  it('does not overwrite startedAt on second running update', () => {
    let state = createAsyncReportUIState();
    state = addJob(state, makeJob({ id: 'j1' }));
    state = updateJobStatus(state, 'j1', 'running', 10);
    const startedAt = state.jobs[0].startedAt;
    state = updateJobStatus(state, 'j1', 'running', 50);
    expect(state.jobs[0].startedAt).toBe(startedAt);
  });
});

describe('removeJob', () => {
  it('removes a job', () => {
    let state = createAsyncReportUIState();
    state = addJob(state, makeJob({ id: 'j1' }));
    state = removeJob(state, 'j1');
    expect(state.jobs).toHaveLength(0);
    expect(state.activeJobId).toBeNull();
  });

  it('clears activeJobId when active job is removed', () => {
    let state = createAsyncReportUIState();
    state = addJob(state, makeJob({ id: 'j1' }));
    state = addJob(state, makeJob({ id: 'j2' }));
    state = removeJob(state, 'j1');
    expect(state.activeJobId).toBeNull();
  });

  it('keeps activeJobId when non-active job is removed', () => {
    let state = createAsyncReportUIState();
    state = addJob(state, makeJob({ id: 'j1' }));
    state = addJob(state, makeJob({ id: 'j2' }));
    state = removeJob(state, 'j2');
    expect(state.activeJobId).toBe('j1');
  });

  it('stops polling when no active jobs remain', () => {
    let state = createAsyncReportUIState();
    state = addJob(state, makeJob({ id: 'j1' }));
    state = removeJob(state, 'j1');
    expect(state.polling).toBe(false);
  });
});

describe('getCompletedJobs', () => {
  it('returns only completed jobs', () => {
    let state = createAsyncReportUIState();
    state = addJob(state, makeJob({ id: 'j1' }));
    state = addJob(state, makeJob({ id: 'j2' }));
    state = updateJobStatus(state, 'j1', 'complete');

    const completed = getCompletedJobs(state);
    expect(completed).toHaveLength(1);
    expect(completed[0].id).toBe('j1');
  });

  it('returns empty for no completed jobs', () => {
    const state = createAsyncReportUIState();
    expect(getCompletedJobs(state)).toEqual([]);
  });
});

describe('getActiveJobs', () => {
  it('returns queued and running jobs', () => {
    let state = createAsyncReportUIState();
    state = addJob(state, makeJob({ id: 'j1', status: 'queued' }));
    state = addJob(state, makeJob({ id: 'j2', status: 'queued' }));
    state = addJob(state, makeJob({ id: 'j3', status: 'queued' }));
    state = updateJobStatus(state, 'j2', 'running');
    state = updateJobStatus(state, 'j3', 'complete');

    const active = getActiveJobs(state);
    expect(active).toHaveLength(2);
    expect(active.map(j => j.id).sort()).toEqual(['j1', 'j2']);
  });

  it('returns empty when all jobs are terminal', () => {
    let state = createAsyncReportUIState();
    state = addJob(state, makeJob({ id: 'j1' }));
    state = updateJobStatus(state, 'j1', 'failed');
    expect(getActiveJobs(state)).toEqual([]);
  });
});
