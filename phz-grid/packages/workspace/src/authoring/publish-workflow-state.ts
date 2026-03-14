/**
 * @phozart/workspace — Publish Workflow UX State (B-3.13)
 *
 * Multi-step publish flow: Review -> Validate -> Publish.
 * Supports pre-publish validation checks, rollback support, and version tracking.
 * Builds on the existing publish-workflow.ts with enhanced UX state.
 */

// ========================================================================
// Types
// ========================================================================

export type PublishPhase = 'review' | 'validating' | 'publishing' | 'published' | 'failed' | 'rolled-back';

export interface ValidationCheck {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  message?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface PublishVersion {
  version: number;
  publishedAt: number;
  publishedBy?: string;
  changelog: string;
  artifactSnapshot?: string; // serialized snapshot for rollback
}

export interface PublishWorkflowState {
  artifactId: string;
  artifactName: string;
  phase: PublishPhase;
  checks: ValidationCheck[];
  changelog: string;
  versions: PublishVersion[];
  currentVersion: number;
  error?: string;
  rollbackTargetVersion?: number;
}

// ========================================================================
// Built-in validation checks
// ========================================================================

export const DEFAULT_CHECKS: Omit<ValidationCheck, 'status'>[] = [
  { id: 'data-source', label: 'Data source connectivity', severity: 'error' },
  { id: 'filters-valid', label: 'Filter configurations valid', severity: 'error' },
  { id: 'columns-present', label: 'At least one visible column', severity: 'error' },
  { id: 'name-set', label: 'Artifact has a name', severity: 'error' },
  { id: 'permissions', label: 'User has publish permissions', severity: 'error' },
  { id: 'perf-check', label: 'Performance within bounds', severity: 'warning' },
  { id: 'a11y-check', label: 'Accessibility compliance', severity: 'warning' },
  { id: 'mobile-check', label: 'Mobile responsiveness', severity: 'info' },
];

// ========================================================================
// Factory
// ========================================================================

export function initialPublishWorkflowState(
  artifactId: string,
  artifactName: string,
  versions: PublishVersion[] = [],
): PublishWorkflowState {
  return {
    artifactId,
    artifactName,
    phase: 'review',
    checks: DEFAULT_CHECKS.map(c => ({ ...c, status: 'pending' as const })),
    changelog: '',
    versions,
    currentVersion: versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 0,
  };
}

// ========================================================================
// Phase transitions
// ========================================================================

export function startValidation(
  state: PublishWorkflowState,
): PublishWorkflowState {
  if (state.phase !== 'review') return state;
  return {
    ...state,
    phase: 'validating',
    checks: state.checks.map(c => ({ ...c, status: 'running' as const })),
  };
}

export function updateCheckResult(
  state: PublishWorkflowState,
  checkId: string,
  status: 'passed' | 'failed' | 'skipped',
  message?: string,
): PublishWorkflowState {
  return {
    ...state,
    checks: state.checks.map(c =>
      c.id === checkId ? { ...c, status, message } : c,
    ),
  };
}

export function completeValidation(
  state: PublishWorkflowState,
): PublishWorkflowState {
  if (state.phase !== 'validating') return state;

  const hasErrors = state.checks.some(
    c => c.status === 'failed' && c.severity === 'error',
  );

  if (hasErrors) {
    return { ...state, phase: 'review' };
  }

  return { ...state, phase: 'review' };
}

export function canPublish(state: PublishWorkflowState): boolean {
  const errorChecks = state.checks.filter(c => c.severity === 'error');
  return errorChecks.every(c => c.status === 'passed' || c.status === 'skipped');
}

export function startPublish(
  state: PublishWorkflowState,
): PublishWorkflowState {
  if (!canPublish(state)) return state;
  return { ...state, phase: 'publishing' };
}

export function completePublish(
  state: PublishWorkflowState,
  publishedBy?: string,
  snapshot?: string,
): PublishWorkflowState {
  if (state.phase !== 'publishing') return state;

  const nextVersion = state.currentVersion + 1;
  const version: PublishVersion = {
    version: nextVersion,
    publishedAt: Date.now(),
    publishedBy,
    changelog: state.changelog,
    artifactSnapshot: snapshot,
  };

  return {
    ...state,
    phase: 'published',
    versions: [...state.versions, version],
    currentVersion: nextVersion,
    error: undefined,
  };
}

export function failPublish(
  state: PublishWorkflowState,
  error: string,
): PublishWorkflowState {
  return { ...state, phase: 'failed', error };
}

// ========================================================================
// Changelog
// ========================================================================

export function setChangelog(
  state: PublishWorkflowState,
  changelog: string,
): PublishWorkflowState {
  return { ...state, changelog };
}

// ========================================================================
// Rollback
// ========================================================================

export function canRollback(state: PublishWorkflowState): boolean {
  return state.versions.length > 1;
}

export function selectRollbackTarget(
  state: PublishWorkflowState,
  version: number,
): PublishWorkflowState {
  const target = state.versions.find(v => v.version === version);
  if (!target) return state;
  return { ...state, rollbackTargetVersion: version };
}

export function executeRollback(
  state: PublishWorkflowState,
): PublishWorkflowState {
  if (!state.rollbackTargetVersion) return state;
  const target = state.versions.find(v => v.version === state.rollbackTargetVersion);
  if (!target) return state;

  return {
    ...state,
    phase: 'rolled-back',
    currentVersion: state.rollbackTargetVersion,
    rollbackTargetVersion: undefined,
  };
}

// ========================================================================
// Reset (back to review)
// ========================================================================

export function resetToReview(
  state: PublishWorkflowState,
): PublishWorkflowState {
  return {
    ...state,
    phase: 'review',
    checks: state.checks.map(c => ({ ...c, status: 'pending' as const, message: undefined })),
    error: undefined,
  };
}

// ========================================================================
// Getters
// ========================================================================

export function getFailedChecks(
  state: PublishWorkflowState,
): ValidationCheck[] {
  return state.checks.filter(c => c.status === 'failed');
}

export function getWarningChecks(
  state: PublishWorkflowState,
): ValidationCheck[] {
  return state.checks.filter(
    c => c.status === 'failed' && c.severity === 'warning',
  );
}

export function getLatestVersion(
  state: PublishWorkflowState,
): PublishVersion | undefined {
  return state.versions.find(v => v.version === state.currentVersion);
}

export function getVersionHistory(
  state: PublishWorkflowState,
): PublishVersion[] {
  return [...state.versions].sort((a, b) => b.version - a.version);
}

export function getCheckSummary(
  state: PublishWorkflowState,
): { passed: number; failed: number; pending: number; total: number } {
  let passed = 0;
  let failed = 0;
  let pending = 0;
  for (const c of state.checks) {
    if (c.status === 'passed' || c.status === 'skipped') passed++;
    else if (c.status === 'failed') failed++;
    else pending++;
  }
  return { passed, failed, pending, total: state.checks.length };
}
