/**
 * @phozart/phz-workspace — URL Filter Sync (O.3)
 *
 * Serializes/deserializes FilterContextState to URL query parameters.
 * Format: f.{field}={operator}:{value}
 *
 * Array values use comma separation: f.region=in:US,EU,APAC
 * Null-check operators omit value: f.email=isNull
 */
const NULL_OPERATORS = new Set(['isNull', 'isNotNull']);
const ARRAY_OPERATORS = new Set(['between', 'notBetween', 'in', 'notIn']);
// ========================================================================
// Serialize
// ========================================================================
export function serializeFilterState(state) {
    const parts = [];
    for (const filter of state.values.values()) {
        const key = `f.${filter.field}`;
        if (NULL_OPERATORS.has(filter.operator)) {
            parts.push(`${key}=${filter.operator}`);
            continue;
        }
        let valueStr;
        if (Array.isArray(filter.value)) {
            valueStr = filter.value.map(v => encodeURIComponent(String(v))).join(',');
        }
        else {
            valueStr = encodeURIComponent(String(filter.value));
        }
        parts.push(`${key}=${filter.operator}:${valueStr}`);
    }
    return parts.join('&');
}
// ========================================================================
// Deserialize
// ========================================================================
export function deserializeFilterState(queryString) {
    const values = new Map();
    const activeFilterIds = new Set();
    if (!queryString || queryString.trim() === '') {
        return {
            values,
            activeFilterIds,
            crossFilters: [],
            lastUpdated: Date.now(),
            source: 'url',
        };
    }
    const pairs = queryString.split('&');
    for (const pair of pairs) {
        const eqIdx = pair.indexOf('=');
        if (eqIdx === -1)
            continue;
        const rawKey = pair.substring(0, eqIdx);
        const rawValue = pair.substring(eqIdx + 1);
        if (!rawKey.startsWith('f.'))
            continue;
        const field = rawKey.substring(2);
        const colonIdx = rawValue.indexOf(':');
        let operator;
        let value;
        if (colonIdx === -1) {
            // No colon — must be a null-check operator
            operator = rawValue;
            value = null;
        }
        else {
            operator = rawValue.substring(0, colonIdx);
            const rawVal = rawValue.substring(colonIdx + 1);
            if (ARRAY_OPERATORS.has(operator)) {
                value = rawVal.split(',').map(v => decodeURIComponent(v));
            }
            else {
                value = decodeURIComponent(rawVal);
            }
        }
        const filterId = `url_${field}`;
        const filter = {
            filterId,
            field,
            operator,
            value,
            label: '',
        };
        values.set(filterId, filter);
        activeFilterIds.add(filterId);
    }
    return {
        values,
        activeFilterIds,
        crossFilters: [],
        lastUpdated: Date.now(),
        source: 'url',
    };
}
//# sourceMappingURL=url-filter-sync.js.map