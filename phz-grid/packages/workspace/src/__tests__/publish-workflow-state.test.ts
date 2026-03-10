import { describe, it, expect } from 'vitest';
import {
  initialPublishWorkflowState,
  startValidation,
  updateCheckResult,
  completeValidation,
  canPublish,
  startPublish,
  completePublish,
  failPublish,
  setChangelog,
  canRollback,
  selectRollbackTarget,
  executeRollback,
  resetToReview,
  getFailedChecks,
  getWarningChecks,
  getLatestVersion,
  getVersionHistory,
  getCheckSummary,
  DEFAULT_CHECKS,
  type PublishVersion,
} from '../authoring/publish-workflow-state.js';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('initialPublishWorkflowState', () => {
  it('creates state in review phase', () => {
    const state = initialPublishWorkflowState('art-1', 'My Report');
    expect(state.phase).toBe('review');
    expect(state.artifactId).toBe('art-1');
    expect(state.artifactName).toBe('My Report');
    expect(state.checks.length).toBe(DEFAULT_CHECKS.length);
    expect(state.checks.every(c => c.status === 'pending')).toBe(true);
    expect(state.currentVersion).toBe(0);
  });

  it('accepts existing versions', () => {
    const versions: PublishVersion[] = [
      { version: 1, publishedAt: 1000, changelog: 'v1' },
      { version: 2, publishedAt: 2000, changelog: 'v2' },
    ];
    const state = initialPublishWorkflowState('art-1', 'Test', versions);
    expect(state.currentVersion).toBe(2);
    expect(state.versions).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Validation flow
// ---------------------------------------------------------------------------

describe('validation flow', () => {
  it('starts validation', () => {
    let state = initialPublishWorkflowState('art-1', 'Test');
    state = startValidation(state);
    expect(state.phase).toBe('validating');
    expect(state.checks.every(c => c.status === 'running')).toBe(true);
  });

  it('updates check results', () => {
    let state = initialPublishWorkflowState('art-1', 'Test');
    state = startValidation(state);
    state = updateCheckResult(state, 'data-source', 'passed');
    state = updateCheckResult(state, 'name-set', 'failed', 'Name is empty');
    expect(state.checks.find(c => c.id === 'data-source')?.status).toBe('passed');
    expect(state.checks.find(c => c.id === 'name-set')?.status).toBe('failed');
    expect(state.checks.find(c => c.id === 'name-set')?.message).toBe('Name is empty');
  });

  it('completes validation - returns to review', () => {
    let state = initialPublishWorkflowState('art-1', 'Test');
    state = startValidation(state);
    state = completeValidation(state);
    expect(state.phase).toBe('review');
  });
});

// ---------------------------------------------------------------------------
// canPublish
// ---------------------------------------------------------------------------

describe('canPublish', () => {
  it('returns false when error checks are pending', () => {
    const state = initialPublishWorkflowState('art-1', 'Test');
    expect(canPublish(state)).toBe(false);
  });

  it('returns true when all error checks pass', () => {
    let state = initialPublishWorkflowState('art-1', 'Test');
    for (const check of state.checks) {
      if (check.severity === 'error') {
        state = updateCheckResult(state, check.id, 'passed');
      }
    }
    expect(canPublish(state)).toBe(true);
  });

  it('returns true when error checks are skipped', () => {
    let state = initialPublishWorkflowState('art-1', 'Test');
    for (const check of state.checks) {
      if (check.severity === 'error') {
        state = updateCheckResult(state, check.id, 'skipped');
      }
    }
    expect(canPublish(state)).toBe(true);
  });

  it('returns false when any error check fails', () => {
    let state = initialPublishWorkflowState('art-1', 'Test');
    for (const check of state.checks) {
      if (check.severity === 'error') {
        state = updateCheckResult(state, check.id, check.id === 'data-source' ? 'failed' : 'passed');
      }
    }
    expect(canPublish(state)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Publish flow
// ---------------------------------------------------------------------------

describe('publish flow', () => {
  function makePublishableState() {
    let state = initialPublishWorkflowState('art-1', 'Test');
    for (const check of state.checks) {
      if (check.severity === 'error') {
        state = updateCheckResult(state, check.id, 'passed');
      }
    }
    return state;
  }

  it('publishes successfully', () => {
    let state = makePublishableState();
    state = setChangelog(state, 'First release');
    state = startPublish(state);
    expect(state.phase).toBe('publishing');
    state = completePublish(state, 'admin', 'snapshot-data');
    expect(state.phase).toBe('published');
    expect(state.currentVersion).toBe(1);
    expect(state.versions).toHaveLength(1);
    expect(state.versions[0].changelog).toBe('First release');
    expect(state.versions[0].publishedBy).toBe('admin');
  });

  it('fails publish', () => {
    let state = makePublishableState();
    state = startPublish(state);
    state = failPublish(state, 'Network error');
    expect(state.phase).toBe('failed');
    expect(state.error).toBe('Network error');
  });

  it('does not publish when checks fail', () => {
    const state = initialPublishWorkflowState('art-1', 'Test');
    expect(startPublish(state).phase).toBe('review');
  });
});

// ---------------------------------------------------------------------------
// Rollback
// ---------------------------------------------------------------------------

describe('rollback', () => {
  it('canRollback requires multiple versions', () => {
    expect(canRollback(initialPublishWorkflowState('art-1', 'Test'))).toBe(false);
    const versions: PublishVersion[] = [
      { version: 1, publishedAt: 1000, changelog: 'v1' },
      { version: 2, publishedAt: 2000, changelog: 'v2' },
    ];
    const state = initialPublishWorkflowState('art-1', 'Test', versions);
    expect(canRollback(state)).toBe(true);
  });

  it('executes rollback', () => {
    const versions: PublishVersion[] = [
      { version: 1, publishedAt: 1000, changelog: 'v1' },
      { version: 2, publishedAt: 2000, changelog: 'v2' },
    ];
    let state = initialPublishWorkflowState('art-1', 'Test', versions);
    state = selectRollbackTarget(state, 1);
    expect(state.rollbackTargetVersion).toBe(1);
    state = executeRollback(state);
    expect(state.phase).toBe('rolled-back');
    expect(state.currentVersion).toBe(1);
  });

  it('rollback does nothing without target', () => {
    const state = initialPublishWorkflowState('art-1', 'Test');
    expect(executeRollback(state).phase).toBe('review');
  });
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

describe('reset', () => {
  it('resets to review with pending checks', () => {
    let state = initialPublishWorkflowState('art-1', 'Test');
    state = startValidation(state);
    state = updateCheckResult(state, 'data-source', 'passed');
    state = resetToReview(state);
    expect(state.phase).toBe('review');
    expect(state.checks.every(c => c.status === 'pending')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

describe('getters', () => {
  it('getFailedChecks', () => {
    let state = initialPublishWorkflowState('art-1', 'Test');
    state = updateCheckResult(state, 'data-source', 'failed');
    expect(getFailedChecks(state)).toHaveLength(1);
  });

  it('getWarningChecks', () => {
    let state = initialPublishWorkflowState('art-1', 'Test');
    state = updateCheckResult(state, 'perf-check', 'failed');
    expect(getWarningChecks(state)).toHaveLength(1);
  });

  it('getLatestVersion', () => {
    const versions: PublishVersion[] = [
      { version: 1, publishedAt: 1000, changelog: 'v1' },
    ];
    const state = initialPublishWorkflowState('art-1', 'Test', versions);
    expect(getLatestVersion(state)?.version).toBe(1);
  });

  it('getVersionHistory sorted descending', () => {
    const versions: PublishVersion[] = [
      { version: 1, publishedAt: 1000, changelog: 'v1' },
      { version: 2, publishedAt: 2000, changelog: 'v2' },
    ];
    const state = initialPublishWorkflowState('art-1', 'Test', versions);
    const history = getVersionHistory(state);
    expect(history[0].version).toBe(2);
    expect(history[1].version).toBe(1);
  });

  it('getCheckSummary', () => {
    let state = initialPublishWorkflowState('art-1', 'Test');
    state = updateCheckResult(state, 'data-source', 'passed');
    state = updateCheckResult(state, 'name-set', 'failed');
    const summary = getCheckSummary(state);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.pending).toBe(DEFAULT_CHECKS.length - 2);
    expect(summary.total).toBe(DEFAULT_CHECKS.length);
  });
});
