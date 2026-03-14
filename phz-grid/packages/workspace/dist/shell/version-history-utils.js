/**
 * @phozart/workspace — Version History Utils (L.17)
 *
 * Formatting and diff utilities for the version history panel.
 */
function formatRelativeTime(diffMs) {
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60)
        return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}
export function formatVersionSummary(summary, now) {
    const currentTime = now ?? Date.now();
    const diffMs = currentTime - summary.savedAt;
    return {
        version: summary.version,
        savedAt: summary.savedAt,
        savedBy: summary.savedBy,
        changeDescription: summary.changeDescription,
        timeAgo: formatRelativeTime(diffMs),
    };
}
export function computeChangeSummary(previous, current) {
    const changes = [];
    const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);
    for (const key of allKeys) {
        const inPrev = key in previous;
        const inCurr = key in current;
        if (!inPrev && inCurr) {
            changes.push(`Added ${key}`);
        }
        else if (inPrev && !inCurr) {
            changes.push(`Removed ${key}`);
        }
        else if (inPrev && inCurr && JSON.stringify(previous[key]) !== JSON.stringify(current[key])) {
            changes.push(`Modified ${key}`);
        }
    }
    return changes;
}
//# sourceMappingURL=version-history-utils.js.map