/**
 * @phozart/phz-workspace — WorkspaceAdapter Interface
 *
 * Extends EngineStorageAdapter + AsyncDefinitionStore with placement and catalog methods.
 */
export function hasHistorySupport(adapter) {
    return 'getArtifactHistory' in adapter && typeof adapter.getArtifactHistory === 'function';
}
export function generateChangeDescription(previous, current) {
    if (previous === undefined || previous === null)
        return 'Initial version';
    const prev = previous;
    const curr = current;
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
    const added = [];
    const removed = [];
    const modified = [];
    for (const key of allKeys) {
        const inPrev = key in prev;
        const inCurr = key in curr;
        if (!inPrev && inCurr) {
            added.push(key);
        }
        else if (inPrev && !inCurr) {
            removed.push(key);
        }
        else if (inPrev && inCurr && JSON.stringify(prev[key]) !== JSON.stringify(curr[key])) {
            modified.push(key);
        }
    }
    const parts = [];
    if (added.length > 0)
        parts.push(`Added ${added.join(', ')}`);
    if (removed.length > 0)
        parts.push(`Removed ${removed.join(', ')}`);
    if (modified.length > 0)
        parts.push(`Modified ${modified.join(', ')}`);
    return parts.length > 0 ? parts.join('. ') : 'No changes';
}
//# sourceMappingURL=workspace-adapter.js.map