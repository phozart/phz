/**
 * @phozart/phz-workspace — Publish Workflow UX State (B-3.13)
 *
 * Multi-step publish flow: Review -> Validate -> Publish.
 * Supports pre-publish validation checks, rollback support, and version tracking.
 * Builds on the existing publish-workflow.ts with enhanced UX state.
 */
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
    artifactSnapshot?: string;
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
export declare const DEFAULT_CHECKS: Omit<ValidationCheck, 'status'>[];
export declare function initialPublishWorkflowState(artifactId: string, artifactName: string, versions?: PublishVersion[]): PublishWorkflowState;
export declare function startValidation(state: PublishWorkflowState): PublishWorkflowState;
export declare function updateCheckResult(state: PublishWorkflowState, checkId: string, status: 'passed' | 'failed' | 'skipped', message?: string): PublishWorkflowState;
export declare function completeValidation(state: PublishWorkflowState): PublishWorkflowState;
export declare function canPublish(state: PublishWorkflowState): boolean;
export declare function startPublish(state: PublishWorkflowState): PublishWorkflowState;
export declare function completePublish(state: PublishWorkflowState, publishedBy?: string, snapshot?: string): PublishWorkflowState;
export declare function failPublish(state: PublishWorkflowState, error: string): PublishWorkflowState;
export declare function setChangelog(state: PublishWorkflowState, changelog: string): PublishWorkflowState;
export declare function canRollback(state: PublishWorkflowState): boolean;
export declare function selectRollbackTarget(state: PublishWorkflowState, version: number): PublishWorkflowState;
export declare function executeRollback(state: PublishWorkflowState): PublishWorkflowState;
export declare function resetToReview(state: PublishWorkflowState): PublishWorkflowState;
export declare function getFailedChecks(state: PublishWorkflowState): ValidationCheck[];
export declare function getWarningChecks(state: PublishWorkflowState): ValidationCheck[];
export declare function getLatestVersion(state: PublishWorkflowState): PublishVersion | undefined;
export declare function getVersionHistory(state: PublishWorkflowState): PublishVersion[];
export declare function getCheckSummary(state: PublishWorkflowState): {
    passed: number;
    failed: number;
    pending: number;
    total: number;
};
//# sourceMappingURL=publish-workflow-state.d.ts.map