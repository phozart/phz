/**
 * @phozart/workspace — Empty States (L.14)
 *
 * Standardized empty state content for workspace panels.
 * Each state provides a title, message, icon, and primary action CTA.
 */
export const EMPTY_STATES = {
    'catalog': {
        title: 'No artifacts yet',
        message: 'Create your first report, dashboard, or KPI to get started.',
        icon: '\u2637',
        actionLabel: 'Create New',
        actionId: 'create-artifact',
        secondaryActionLabel: 'Import',
        secondaryActionId: 'import-artifact',
    },
    'template-gallery': {
        title: 'No templates available',
        message: 'Templates help you quickly build dashboards and reports from your data.',
        icon: '\u2728',
        actionLabel: 'Start Blank',
        actionId: 'start-blank',
    },
    'alert-rules': {
        title: 'No alert rules configured',
        message: 'Set up alerts to be notified when your metrics cross important thresholds.',
        icon: '\u26A0',
        actionLabel: 'Create Alert Rule',
        actionId: 'create-alert-rule',
    },
    'active-breaches': {
        title: 'All clear',
        message: 'No active breaches detected. Your metrics are within expected ranges.',
        icon: '\u2713',
        actionLabel: 'View Alert Rules',
        actionId: 'view-alert-rules',
    },
    'widget-picker': {
        title: 'No widgets available',
        message: 'Register widget manifests to make them available for dashboards.',
        icon: '\u25A0',
        actionLabel: 'Browse Widgets',
        actionId: 'browse-widgets',
    },
    'search': {
        title: 'No results found',
        message: 'Try adjusting your search terms or clearing filters.',
        icon: '\u2315',
        actionLabel: 'Clear Search',
        actionId: 'clear-search',
    },
    'dashboard-canvas': {
        title: 'Empty dashboard',
        message: 'Add widgets to build your dashboard layout.',
        icon: '\u2B1A',
        actionLabel: 'Add Widget',
        actionId: 'add-widget',
        secondaryActionLabel: 'Use Template',
        secondaryActionId: 'use-template',
    },
};
export function getEmptyState(key) {
    const state = EMPTY_STATES[key];
    if (!state)
        return undefined;
    return { ...state };
}
//# sourceMappingURL=empty-states.js.map