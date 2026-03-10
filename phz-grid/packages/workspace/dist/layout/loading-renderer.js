/**
 * @phozart/phz-workspace — Loading & Quality Renderer (K.4 + K.7)
 *
 * Generates loading skeletons from LayoutNode structure,
 * freshness badges, quality warnings, and stale dimming CSS.
 */
const DEFAULT_SKELETON_HEIGHT = 150;
// --- K.4: Skeleton & Loading ---
export function generateSkeletonHTML(node) {
    switch (node.kind) {
        case 'widget': {
            const height = node.minHeight ?? DEFAULT_SKELETON_HEIGHT;
            return `<div class="phz-skeleton" data-widget-id="${node.widgetId}" style="min-height: ${height}px;" aria-busy="true" aria-label="Loading widget"></div>`;
        }
        case 'auto-grid': {
            const gridStyle = `display: grid; grid-template-columns: repeat(auto-fill, minmax(${node.minItemWidth}px, 1fr)); gap: ${node.gap}px;`;
            const children = node.children.map(c => generateSkeletonHTML(c)).join('\n');
            return `<div class="phz-auto-grid" style="${gridStyle}">\n${children}\n</div>`;
        }
        case 'tabs': {
            const children = node.tabs.flatMap(t => t.children.map(c => generateSkeletonHTML(c))).join('\n');
            return `<div class="phz-skeleton-tabs">\n${children}\n</div>`;
        }
        case 'sections': {
            const children = node.sections.flatMap(s => s.children.map(c => generateSkeletonHTML(c))).join('\n');
            return `<div class="phz-skeleton-sections">\n${children}\n</div>`;
        }
        default:
            return '';
    }
}
export function generateLoadingHTML(state) {
    switch (state.behavior) {
        case 'spinner':
            return `<div class="phz-loading-spinner" data-widget-id="${state.widgetId}" aria-busy="true" aria-label="Loading"><div class="phz-spinner"></div></div>`;
        case 'skeleton':
            return `<div class="phz-skeleton" data-widget-id="${state.widgetId}" aria-busy="true" aria-label="Loading widget"></div>`;
        case 'previous':
            return '';
    }
}
export function generateStaleIndicatorHTML(widgetId, freshnessStatus) {
    if (freshnessStatus !== 'stale')
        return '';
    return `<div class="phz-stale-indicator" data-widget-id="${widgetId}" role="status" aria-label="Data may be outdated">stale</div>`;
}
// --- K.7: Quality Rendering ---
export function generateFreshnessBadgeHTML(widgetId, quality) {
    if (!quality)
        return '';
    const status = quality.freshnessStatus ?? 'unknown';
    const ts = quality.lastRefreshed ?? '';
    return `<div class="phz-freshness-badge" data-widget-id="${widgetId}" data-status="${status}" data-last-refreshed="${ts}" aria-label="Data freshness: ${status}">${status}</div>`;
}
export function generateQualityWarningHTML(widgetId, quality) {
    if (!quality)
        return '';
    if (!quality.issues || quality.issues.length === 0)
        return '';
    const completenessInfo = quality.completeness !== undefined
        ? `<span class="phz-completeness">${Math.round(quality.completeness * 100)}% complete</span>`
        : '';
    const issueItems = quality.issues.map(issue => `<li class="phz-quality-issue" data-severity="${issue.severity}"${issue.field ? ` data-field="${issue.field}"` : ''}>${issue.message}</li>`).join('\n');
    return `<div class="phz-quality-warning" data-widget-id="${widgetId}" role="alert">
${completenessInfo}
<ul class="phz-quality-issues">
${issueItems}
</ul>
</div>`;
}
export function generateStaleDimmingCSS(widgetId) {
    return `[data-widget-id="${widgetId}"].phz-stale { opacity: 0.6; filter: grayscale(0.2); transition: opacity 0.3s ease; }`;
}
//# sourceMappingURL=loading-renderer.js.map