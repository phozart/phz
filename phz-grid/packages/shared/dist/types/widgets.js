/**
 * @phozart/phz-shared — Widget types (A-1.18 through A-1.21)
 *
 * Shared widget position, dashboard widget, widget view,
 * expandable config, container box config, and decision tree types.
 */
/** Determine the best switching mode based on view count. */
export function getViewSwitchingMode(viewCount) {
    if (viewCount <= 2)
        return 'toggle';
    if (viewCount <= 5)
        return 'tabs';
    return 'dropdown';
}
/** Create a default expandable widget configuration. */
export function createDefaultExpandableConfig(overrides) {
    return {
        expandable: true,
        defaultExpanded: false,
        animationDurationMs: 200,
        showToggle: true,
        collapsedMaxHeight: 0,
        ...overrides,
    };
}
/** Create a default container box configuration. */
export function createDefaultContainerBoxConfig(overrides) {
    return {
        background: 'var(--phz-surface, #ffffff)',
        borderRadius: 8,
        padding: 16,
        shadow: 'var(--phz-shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
        border: '1px solid var(--phz-border, #e5e7eb)',
        minHeight: 120,
        showHeader: true,
        clipOverflow: false,
        ...overrides,
    };
}
/**
 * Evaluate the status of a node based on its children's statuses.
 * - All children complete => complete
 * - Any child error => error
 * - Any child active => active
 * - Otherwise => pending
 */
export function evaluateNodeStatus(node, allNodes) {
    if (node.children.length === 0)
        return node.status;
    const childStatuses = node.children
        .map(id => allNodes.get(id)?.status ?? 'pending');
    if (childStatuses.every(s => s === 'complete'))
        return 'complete';
    if (childStatuses.every(s => s === 'skipped'))
        return 'skipped';
    if (childStatuses.some(s => s === 'error'))
        return 'error';
    if (childStatuses.some(s => s === 'active'))
        return 'active';
    return 'pending';
}
//# sourceMappingURL=widgets.js.map