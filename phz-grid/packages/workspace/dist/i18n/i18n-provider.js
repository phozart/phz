/**
 * @phozart/workspace — I18n Provider (H.19)
 *
 * Lightweight i18n interface with a default English provider.
 * Consumers can supply their own I18nProvider (e.g. wrapping i18next)
 * via WorkspaceClientOptions.
 */
export const DEFAULT_STRINGS = {
    // Shell
    'shell.title': 'Workspace',
    'shell.catalog': 'Catalog',
    'shell.explore': 'Explore',
    'shell.create': 'Create New',
    'shell.alerts': 'Alerts',
    'shell.dataSources': 'Data Sources',
    'shell.settings': 'Settings',
    // Filter
    'filter.clearAll': 'Clear all',
    'filter.apply': 'Apply',
    'filter.reset': 'Reset',
    'filter.activeFilters': '{count} active filter(s)',
    'filter.noFilters': 'No filters configured',
    'filter.presets': 'Filter Presets',
    'filter.savePreset': 'Save as Preset',
    'filter.cascading': 'Updating options...',
    // Explorer
    'explorer.rows': 'Rows',
    'explorer.columns': 'Columns',
    'explorer.values': 'Values',
    'explorer.filters': 'Filters',
    'explorer.dragFieldHere': 'Drag a field here',
    'explorer.saveAsReport': 'Save as Report',
    'explorer.addToDashboard': 'Add to Dashboard',
    'explorer.preview': 'Preview',
    'explorer.table': 'Table',
    'explorer.chart': 'Chart',
    'explorer.sql': 'SQL',
    'explorer.showingRows': 'Showing first {shown} of {total} rows',
    // Admin
    'admin.save': 'Save',
    'admin.saveAsDraft': 'Save as Draft',
    'admin.discard': 'Discard',
    'admin.delete': 'Delete',
    'admin.duplicate': 'Duplicate',
    'admin.preview': 'Preview',
    'admin.undo': 'Undo',
    'admin.redo': 'Redo',
    'admin.history': 'History',
    'admin.configure': 'Configure',
    'admin.addWidget': 'Add Widget',
    'admin.removeWidget': 'Remove Widget',
    'admin.widgetSettings': 'Widget Settings',
    // Widget system
    'widget.loading': 'Loading...',
    'widget.error': 'This widget encountered an error.',
    'widget.retry': 'Retry',
    'widget.showDetails': 'Show details',
    'widget.noData': 'No data available',
    'widget.staleData': 'Data updated {time} ago',
    'widget.dataError': 'Unable to load data.',
    // Alerts
    'alerts.title': 'Alerts',
    'alerts.noAlerts': 'All clear — no active alerts',
    'alerts.activeBreaches': '{count} active breach(es)',
    'alerts.acknowledge': 'Acknowledge',
    'alerts.resolve': 'Resolve',
    'alerts.critical': 'Critical',
    'alerts.warning': 'Warning',
    'alerts.info': 'Info',
    'alerts.createRule': 'Create Alert Rule',
    'alerts.editRule': 'Edit Alert Rule',
    'alerts.threshold': 'Threshold',
    'alerts.compound': 'Compound Condition',
    'alerts.cooldown': 'Cooldown',
    'alerts.severity': 'Severity',
    // Templates
    'templates.gallery': 'Template Gallery',
    'templates.startBlank': 'Start Blank',
    'templates.matchScore': '{score}% match',
    'templates.pickTemplate': 'Pick a Template',
    'templates.bindFields': 'Map Your Fields',
    'templates.autoDetected': 'Auto-detected',
    // Data quality
    'quality.fresh': 'Data is fresh',
    'quality.stale': 'Data may be stale',
    'quality.unknown': 'Data freshness unknown',
    'quality.lastRefreshed': 'Last refreshed: {time}',
    'quality.completeness': '{percent}% complete',
    // Data sources
    'datasource.upload': 'Upload File',
    'datasource.connectUrl': 'Connect to URL',
    'datasource.connectApi': 'Connect to API',
    'datasource.refresh': 'Refresh',
    'datasource.remove': 'Remove',
    'datasource.rename': 'Rename',
    'datasource.connected': 'Connected',
    'datasource.error': 'Connection Error',
    'datasource.refreshing': 'Refreshing...',
    // Version history
    'history.title': 'Version History',
    'history.restore': 'Restore this version',
    'history.restoreConfirm': 'Are you sure you want to restore this version?',
    'history.noHistory': 'No version history available',
};
const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi']);
export function createDefaultI18nProvider(locale) {
    const resolvedLocale = locale ?? 'en';
    const lang = resolvedLocale.split('-')[0];
    return {
        locale: resolvedLocale,
        direction: RTL_LOCALES.has(lang) ? 'rtl' : 'ltr',
        t(key, params) {
            let str = DEFAULT_STRINGS[key] ?? key;
            if (params) {
                for (const [k, v] of Object.entries(params)) {
                    str = str.replace(`{${k}}`, String(v));
                }
            }
            return str;
        },
    };
}
export function formatNumber(value, locale, options) {
    return new Intl.NumberFormat(locale, options).format(value);
}
export function formatDate(value, locale, options) {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(locale, options).format(date);
}
//# sourceMappingURL=i18n-provider.js.map