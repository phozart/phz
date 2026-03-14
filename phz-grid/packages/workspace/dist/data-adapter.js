/**
 * @phozart/workspace — DataAdapter Interface & Related Types
 *
 * Defines the contract for data sources, queries, aggregations,
 * time intelligence, data quality, and query coordination.
 *
 * NOTE: The workspace DataAdapter, DataQuery, and DataResult are extended
 * versions of the shared types (with pivotBy, windows, strategy, quality).
 * Do NOT replace these with shared re-exports — they are workspace-specific
 * supersets. The coordinator types below ARE re-exported from shared.
 */
export function computeFreshnessStatus(lastRefreshed, thresholdMinutes) {
    const ts = Date.parse(lastRefreshed);
    if (isNaN(ts))
        return 'unknown';
    const elapsedMs = Date.now() - ts;
    const thresholdMs = thresholdMinutes * 60 * 1000;
    return elapsedMs <= thresholdMs ? 'fresh' : 'stale';
}
/**
 * Type guard: returns true when result has a non-empty Arrow IPC buffer.
 */
export function hasArrowBuffer(result) {
    if (result == null || typeof result !== 'object')
        return false;
    return result.arrowBuffer instanceof ArrayBuffer && result.arrowBuffer.byteLength > 0;
}
// ========================================================================
// QueryCoordinator — batches concurrent widget data queries
// ========================================================================
/**
 * @deprecated Import CoordinatorQuery from '@phozart/shared/coordination' instead.
 * This re-export will be removed in v16.
 */
export { defaultQueryCoordinatorConfig, isQueryCoordinatorConfig, } from '@phozart/shared/coordination';
// --- helpers ---
function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfWeek(d, weekStartDay) {
    const day = d.getDay();
    const startDow = weekStartDay === 'sunday' ? 0 : 1;
    const diff = (day - startDow + 7) % 7;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
}
function fiscalQuarterStart(d, fiscalYearStartMonth) {
    const month0 = d.getMonth();
    const fyStart0 = fiscalYearStartMonth - 1;
    const offsetFromFY = (month0 - fyStart0 + 12) % 12;
    const quarterIndex = Math.floor(offsetFromFY / 3);
    const quarterStartOffset = quarterIndex * 3;
    const quarterStartMonth0 = (fyStart0 + quarterStartOffset) % 12;
    let year = d.getFullYear();
    if (quarterStartMonth0 > month0) {
        year -= 1;
    }
    return new Date(year, quarterStartMonth0, 1);
}
// --- Default Periods ---
export const DEFAULT_RELATIVE_PERIODS = [
    {
        id: 'today',
        label: 'Today',
        calculate: (ref) => {
            const d = startOfDay(ref);
            return { from: d, to: d };
        },
    },
    {
        id: 'yesterday',
        label: 'Yesterday',
        calculate: (ref) => {
            const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - 1);
            return { from: d, to: d };
        },
    },
    {
        id: 'this-week',
        label: 'This Week',
        calculate: (ref, config) => {
            const from = startOfWeek(ref, config.weekStartDay);
            const to = startOfDay(ref);
            return { from, to };
        },
    },
    {
        id: 'last-week',
        label: 'Last Week',
        calculate: (ref, config) => {
            const thisWeekStart = startOfWeek(ref, config.weekStartDay);
            const from = new Date(thisWeekStart.getFullYear(), thisWeekStart.getMonth(), thisWeekStart.getDate() - 7);
            const to = new Date(thisWeekStart.getFullYear(), thisWeekStart.getMonth(), thisWeekStart.getDate() - 1);
            return { from, to };
        },
    },
    {
        id: 'this-month',
        label: 'This Month',
        calculate: (ref) => {
            const from = new Date(ref.getFullYear(), ref.getMonth(), 1);
            const to = startOfDay(ref);
            return { from, to };
        },
    },
    {
        id: 'last-month',
        label: 'Last Month',
        calculate: (ref) => {
            const from = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
            const to = new Date(ref.getFullYear(), ref.getMonth(), 0);
            return { from, to };
        },
    },
    {
        id: 'this-quarter',
        label: 'This Quarter',
        calculate: (ref, config) => {
            const from = fiscalQuarterStart(ref, config.fiscalYearStartMonth);
            const to = startOfDay(ref);
            return { from, to };
        },
    },
    {
        id: 'last-quarter',
        label: 'Last Quarter',
        calculate: (ref, config) => {
            const thisQStart = fiscalQuarterStart(ref, config.fiscalYearStartMonth);
            const prevQEnd = new Date(thisQStart.getFullYear(), thisQStart.getMonth(), thisQStart.getDate() - 1);
            const from = fiscalQuarterStart(prevQEnd, config.fiscalYearStartMonth);
            return { from, to: prevQEnd };
        },
    },
    {
        id: 'this-year',
        label: 'This Year',
        calculate: (ref, config) => {
            const fyStart0 = config.fiscalYearStartMonth - 1;
            let yearStart = ref.getFullYear();
            if (ref.getMonth() < fyStart0) {
                yearStart -= 1;
            }
            const from = new Date(yearStart, fyStart0, 1);
            const to = startOfDay(ref);
            return { from, to };
        },
    },
    {
        id: 'last-year',
        label: 'Last Year',
        calculate: (ref, config) => {
            const fyStart0 = config.fiscalYearStartMonth - 1;
            let currentFYStart = ref.getFullYear();
            if (ref.getMonth() < fyStart0) {
                currentFYStart -= 1;
            }
            const prevFYStart = currentFYStart - 1;
            const from = new Date(prevFYStart, fyStart0, 1);
            const to = new Date(currentFYStart, fyStart0, 0);
            return { from, to };
        },
    },
    {
        id: 'last-7-days',
        label: 'Last 7 Days',
        calculate: (ref) => {
            const to = startOfDay(ref);
            const from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 6);
            return { from, to };
        },
    },
    {
        id: 'last-30-days',
        label: 'Last 30 Days',
        calculate: (ref) => {
            const to = startOfDay(ref);
            const from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 29);
            return { from, to };
        },
    },
    {
        id: 'last-90-days',
        label: 'Last 90 Days',
        calculate: (ref) => {
            const to = startOfDay(ref);
            const from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 89);
            return { from, to };
        },
    },
    {
        id: 'last-365-days',
        label: 'Last 365 Days',
        calculate: (ref) => {
            const to = startOfDay(ref);
            const from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 364);
            return { from, to };
        },
    },
];
export function resolvePeriod(periodId, config, referenceDate) {
    const ref = referenceDate ?? new Date();
    const period = config.relativePeriods.find(p => p.id === periodId);
    if (!period) {
        throw new Error(`Unknown period ID: "${periodId}"`);
    }
    return period.calculate(ref, config);
}
//# sourceMappingURL=data-adapter.js.map