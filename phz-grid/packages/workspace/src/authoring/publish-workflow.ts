/**
 * @phozart/workspace — Publish Workflow State Machine
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

export function initialPublishState(): PublishState {
  return { status: 'draft', history: [] };
}

// Valid transitions: draft->review, review->published, review->draft (reject), published->draft (unpublish)
const VALID_TRANSITIONS: Record<PublishStatus, PublishStatus[]> = {
  draft: ['review'],
  review: ['published', 'draft'],
  published: ['draft'],
};

export function canTransition(state: PublishState, target: PublishStatus): boolean {
  return VALID_TRANSITIONS[state.status]?.includes(target) ?? false;
}

function transition(state: PublishState, target: PublishStatus, by?: string): PublishState {
  if (!canTransition(state, target)) return state;
  return {
    status: target,
    history: [...state.history, { from: state.status, to: target, at: Date.now(), by }],
  };
}

export function submitForReview(state: PublishState, by?: string): PublishState {
  return transition(state, 'review', by);
}

export function approve(state: PublishState, by?: string): PublishState {
  return transition(state, 'published', by);
}

export function reject(state: PublishState, by?: string): PublishState {
  return transition(state, 'draft', by);
}

export function unpublish(state: PublishState, by?: string): PublishState {
  return transition(state, 'draft', by);
}
