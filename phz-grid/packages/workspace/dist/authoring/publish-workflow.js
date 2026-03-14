/**
 * @phozart/workspace — Publish Workflow State Machine
 *
 * Enforces draft -> review -> published lifecycle transitions.
 */
export function initialPublishState() {
    return { status: 'draft', history: [] };
}
// Valid transitions: draft->review, review->published, review->draft (reject), published->draft (unpublish)
const VALID_TRANSITIONS = {
    draft: ['review'],
    review: ['published', 'draft'],
    published: ['draft'],
};
export function canTransition(state, target) {
    return VALID_TRANSITIONS[state.status]?.includes(target) ?? false;
}
function transition(state, target, by) {
    if (!canTransition(state, target))
        return state;
    return {
        status: target,
        history: [...state.history, { from: state.status, to: target, at: Date.now(), by }],
    };
}
export function submitForReview(state, by) {
    return transition(state, 'review', by);
}
export function approve(state, by) {
    return transition(state, 'published', by);
}
export function reject(state, by) {
    return transition(state, 'draft', by);
}
export function unpublish(state, by) {
    return transition(state, 'draft', by);
}
//# sourceMappingURL=publish-workflow.js.map