/**
 * Empty State Configuration
 *
 * Types and helpers for rendering user-friendly empty states across the grid,
 * dashboard widgets, and workspace shell. Each EmptyScenario maps to a
 * pre-configured title, description, icon, and optional call-to-action.
 */
/** @deprecated Use createDefaultEmptyStateConfig instead */
export function createEmptyState(reason, title, message) {
    return { reason, title, message };
}
// ========================================================================
// Default Empty State Configs
// ========================================================================
const DEFAULT_EMPTY_CONFIGS = {
    'no-data': {
        scenario: 'no-data',
        icon: 'sourceDatabase',
        title: 'No data available',
        description: 'There is no data to display. Try adding a data source or importing a file.',
        actionLabel: 'Add Data Source',
        actionId: 'add-data-source',
    },
    'no-results': {
        scenario: 'no-results',
        icon: 'search',
        title: 'No results found',
        description: 'Your search or filters did not match any items. Try broadening your criteria.',
        actionLabel: 'Clear Filters',
        actionId: 'clear-filters',
    },
    'no-access': {
        scenario: 'no-access',
        icon: 'lock',
        title: 'Access restricted',
        description: 'You do not have permission to view this content. Contact your administrator for access.',
    },
    'not-configured': {
        scenario: 'not-configured',
        icon: 'settings',
        title: 'Not configured',
        description: 'This component needs to be set up before it can display content.',
        actionLabel: 'Configure',
        actionId: 'configure',
    },
    'loading-failed': {
        scenario: 'loading-failed',
        icon: 'warning',
        title: 'Loading failed',
        description: 'Something went wrong while loading data. Please try again.',
        actionLabel: 'Retry',
        actionId: 'retry',
    },
    'first-time': {
        scenario: 'first-time',
        icon: 'addCircle',
        title: 'Welcome!',
        description: 'You are all set. Create your first item to get started.',
        actionLabel: 'Get Started',
        actionId: 'get-started',
    },
    'no-selection': {
        scenario: 'no-selection',
        icon: 'columns',
        title: 'Nothing selected',
        description: 'Select an item from the list to view its details here.',
    },
    'empty-dashboard': {
        scenario: 'empty-dashboard',
        icon: 'dashboard',
        title: 'Start building',
        description: 'Drag widgets from the palette or choose a template to get started.',
        actionLabel: 'Browse Templates',
        actionId: 'browse-templates',
    },
    'no-favorites': {
        scenario: 'no-favorites',
        icon: 'pin',
        title: 'No favorites yet',
        description: 'Star items you access frequently to see them here.',
        actionLabel: 'Browse Catalog',
        actionId: 'browse-catalog',
    },
};
/** @deprecated Use createDefaultEmptyStateConfig instead */
export const DEFAULT_EMPTY_STATES = {
    'no-data': {
        reason: 'no-data',
        title: 'No data available',
        message: 'There is no data to display. Try adding a data source.',
    },
    'no-results': {
        reason: 'no-results',
        title: 'No results found',
        message: 'No records match the current filters. Try adjusting your criteria.',
    },
    'no-access': {
        reason: 'no-access',
        title: 'Access restricted',
        message: 'You do not have permission to view this content.',
    },
    'not-configured': {
        reason: 'not-configured',
        title: 'Not configured',
        message: 'This component has not been configured yet.',
    },
    'loading-failed': {
        reason: 'loading-failed',
        title: 'Loading failed',
        message: 'Something went wrong while loading data. Please try again.',
    },
    'first-time': {
        reason: 'first-time',
        title: 'Get started',
        message: 'Welcome! Create your first item to get started.',
    },
};
/**
 * Create a default EmptyStateConfig for a given scenario.
 * Returns a fresh copy so callers can safely mutate it.
 *
 * @param scenario - The empty state scenario (defaults to 'no-data')
 * @returns A new EmptyStateConfig object
 */
export function createDefaultEmptyStateConfig(scenario = 'no-data') {
    const config = DEFAULT_EMPTY_CONFIGS[scenario] ?? DEFAULT_EMPTY_CONFIGS['no-data'];
    return { ...config };
}
//# sourceMappingURL=empty-states.js.map