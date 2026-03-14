/**
 * @phozart/workspace — Publish Workflow UX State (B-3.13)
 *
 * Multi-step publish flow: Review -> Validate -> Publish.
 * Supports pre-publish validation checks, rollback support, and version tracking.
 * Builds on the existing publish-workflow.ts with enhanced UX state.
 */
// ========================================================================
// Built-in validation checks
// ========================================================================
export const DEFAULT_CHECKS = [
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
export function initialPublishWorkflowState(artifactId, artifactName, versions = []) {
    return {
        artifactId,
        artifactName,
        phase: 'review',
        checks: DEFAULT_CHECKS.map(c => ({ ...c, status: 'pending' })),
        changelog: '',
        versions,
        currentVersion: versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 0,
    };
}
// ========================================================================
// Phase transitions
// ========================================================================
export function startValidation(state) {
    if (state.phase !== 'review')
        return state;
    return {
        ...state,
        phase: 'validating',
        checks: state.checks.map(c => ({ ...c, status: 'running' })),
    };
}
export function updateCheckResult(state, checkId, status, message) {
    return {
        ...state,
        checks: state.checks.map(c => c.id === checkId ? { ...c, status, message } : c),
    };
}
export function completeValidation(state) {
    if (state.phase !== 'validating')
        return state;
    const hasErrors = state.checks.some(c => c.status === 'failed' && c.severity === 'error');
    if (hasErrors) {
        return { ...state, phase: 'review' };
    }
    return { ...state, phase: 'review' };
}
export function canPublish(state) {
    const errorChecks = state.checks.filter(c => c.severity === 'error');
    return errorChecks.every(c => c.status === 'passed' || c.status === 'skipped');
}
export function startPublish(state) {
    if (!canPublish(state))
        return state;
    return { ...state, phase: 'publishing' };
}
export function completePublish(state, publishedBy, snapshot) {
    if (state.phase !== 'publishing')
        return state;
    const nextVersion = state.currentVersion + 1;
    const version = {
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
export function failPublish(state, error) {
    return { ...state, phase: 'failed', error };
}
// ========================================================================
// Changelog
// ========================================================================
export function setChangelog(state, changelog) {
    return { ...state, changelog };
}
// ========================================================================
// Rollback
// ========================================================================
export function canRollback(state) {
    return state.versions.length > 1;
}
export function selectRollbackTarget(state, version) {
    const target = state.versions.find(v => v.version === version);
    if (!target)
        return state;
    return { ...state, rollbackTargetVersion: version };
}
export function executeRollback(state) {
    if (!state.rollbackTargetVersion)
        return state;
    const target = state.versions.find(v => v.version === state.rollbackTargetVersion);
    if (!target)
        return state;
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
export function resetToReview(state) {
    return {
        ...state,
        phase: 'review',
        checks: state.checks.map(c => ({ ...c, status: 'pending', message: undefined })),
        error: undefined,
    };
}
// ========================================================================
// Getters
// ========================================================================
export function getFailedChecks(state) {
    return state.checks.filter(c => c.status === 'failed');
}
export function getWarningChecks(state) {
    return state.checks.filter(c => c.status === 'failed' && c.severity === 'warning');
}
export function getLatestVersion(state) {
    return state.versions.find(v => v.version === state.currentVersion);
}
export function getVersionHistory(state) {
    return [...state.versions].sort((a, b) => b.version - a.version);
}
export function getCheckSummary(state) {
    let passed = 0;
    let failed = 0;
    let pending = 0;
    for (const c of state.checks) {
        if (c.status === 'passed' || c.status === 'skipped')
            passed++;
        else if (c.status === 'failed')
            failed++;
        else
            pending++;
    }
    return { passed, failed, pending, total: state.checks.length };
}
//# sourceMappingURL=publish-workflow-state.js.map