/**
 * Tests for AsyncReport types and helpers.
 */
import {
  isTerminalStatus,
  createAsyncReportJob,
  isAsyncReportExpired,
  hasAsyncSupport,
} from '@phozart/shared/types';
import type { AsyncReportStatus, AsyncReportJob } from '@phozart/shared/types';

// ========================================================================
// isTerminalStatus
// ========================================================================

describe('isTerminalStatus', () => {
  it.each([
    ['complete', true],
    ['failed', true],
    ['cancelled', true],
    ['expired', true],
    ['queued', false],
    ['running', false],
  ] as [AsyncReportStatus, boolean][])('status "%s" => %s', (status, expected) => {
    expect(isTerminalStatus(status)).toBe(expected);
  });
});

// ========================================================================
// createAsyncReportJob
// ========================================================================

describe('createAsyncReportJob', () => {
  it('creates a job with correct defaults', () => {
    const job = createAsyncReportJob('report-123');
    expect(job.reportId).toBe('report-123');
    expect(job.status).toBe('queued');
    expect(job.progress).toBe(0);
    expect(job.id).toMatch(/^arj_/);
    expect(typeof job.createdAt).toBe('number');
    expect(job.startedAt).toBeUndefined();
    expect(job.completedAt).toBeUndefined();
    expect(job.expiresAt).toBeUndefined();
    expect(job.error).toBeUndefined();
    expect(job.resultUrl).toBeUndefined();
  });

  it('generates unique IDs', () => {
    const j1 = createAsyncReportJob('r1');
    const j2 = createAsyncReportJob('r2');
    expect(j1.id).not.toBe(j2.id);
  });
});

// ========================================================================
// isAsyncReportExpired
// ========================================================================

describe('isAsyncReportExpired', () => {
  it('returns false when expiresAt is not set', () => {
    const job: AsyncReportJob = {
      id: 'arj_1',
      reportId: 'r1',
      status: 'complete',
      progress: 100,
      createdAt: 1000,
    };
    expect(isAsyncReportExpired(job)).toBe(false);
  });

  it('returns false when expiresAt is undefined', () => {
    const job: AsyncReportJob = {
      id: 'arj_1',
      reportId: 'r1',
      status: 'complete',
      progress: 100,
      createdAt: 1000,
      expiresAt: undefined,
    };
    expect(isAsyncReportExpired(job)).toBe(false);
  });

  it('returns true when current time >= expiresAt', () => {
    const job: AsyncReportJob = {
      id: 'arj_1',
      reportId: 'r1',
      status: 'complete',
      progress: 100,
      createdAt: 1000,
      expiresAt: 5000,
    };
    expect(isAsyncReportExpired(job, 5000)).toBe(true);
    expect(isAsyncReportExpired(job, 6000)).toBe(true);
  });

  it('returns false when current time < expiresAt', () => {
    const job: AsyncReportJob = {
      id: 'arj_1',
      reportId: 'r1',
      status: 'complete',
      progress: 100,
      createdAt: 1000,
      expiresAt: 5000,
    };
    expect(isAsyncReportExpired(job, 4999)).toBe(false);
  });

  it('uses Date.now() when now is not provided', () => {
    const future = Date.now() + 100_000;
    const job: AsyncReportJob = {
      id: 'arj_1',
      reportId: 'r1',
      status: 'complete',
      progress: 100,
      createdAt: 1000,
      expiresAt: future,
    };
    expect(isAsyncReportExpired(job)).toBe(false);
  });
});

// ========================================================================
// hasAsyncSupport
// ========================================================================

describe('hasAsyncSupport', () => {
  it('returns true when executeQueryAsync is a function', () => {
    const adapter = { executeQueryAsync: () => {} };
    expect(hasAsyncSupport(adapter)).toBe(true);
  });

  it('returns false when executeQueryAsync is missing', () => {
    const adapter = { execute: () => {} };
    expect(hasAsyncSupport(adapter)).toBe(false);
  });

  it('returns false when executeQueryAsync is not a function', () => {
    const adapter = { executeQueryAsync: 'not-a-function' };
    expect(hasAsyncSupport(adapter)).toBe(false);
  });

  it('returns false for empty object', () => {
    expect(hasAsyncSupport({})).toBe(false);
  });
});
