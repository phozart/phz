/**
 * @phozart/phz-workspace — Publish Workflow State Machine
 *
 * Enforces draft -> review -> published lifecycle transitions.
 */
export type PublishStatus = 'draft' | 'review' | 'published';
export interface PublishHistoryEntry {
    from: PublishStatus;
    to: PublishStatus;
    at: number;
    by?: string;
}
export interface PublishState {
    status: PublishStatus;
    history: PublishHistoryEntry[];
}
export declare function initialPublishState(): PublishState;
export declare function canTransition(state: PublishState, target: PublishStatus): boolean;
export declare function submitForReview(state: PublishState, by?: string): PublishState;
export declare function approve(state: PublishState, by?: string): PublishState;
export declare function reject(state: PublishState, by?: string): PublishState;
export declare function unpublish(state: PublishState, by?: string): PublishState;
//# sourceMappingURL=publish-workflow.d.ts.map