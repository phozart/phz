/**
 * @phozart/phz-engine — Aggregation Engine
 *
 * Compute aggregations over row data: sum, avg, min, max, count, first, last.
 */
/**
 * Compute a single aggregation over a set of rows for a given field.
 */
export function computeAggregation(rows, field, fn) {
    if (rows.length === 0)
        return null;
    const values = rows
        .map(r => r[field])
        .filter(v => v !== null && v !== undefined);
    if (values.length === 0)
        return null;
    switch (fn) {
        case 'count':
            return values.length;
        case 'sum': {
            const nums = values.filter(v => typeof v === 'number');
            return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) : null;
        }
        case 'avg': {
            const nums = values.filter(v => typeof v === 'number');
            return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
        }
        case 'min': {
            const nums = values.filter(v => typeof v === 'number');
            if (nums.length === 0)
                return null;
            let min = nums[0];
            for (let i = 1; i < nums.length; i++) {
                if (nums[i] < min)
                    min = nums[i];
            }
            return min;
        }
        case 'max': {
            const nums = values.filter(v => typeof v === 'number');
            if (nums.length === 0)
                return null;
            let max = nums[0];
            for (let i = 1; i < nums.length; i++) {
                if (nums[i] > max)
                    max = nums[i];
            }
            return max;
        }
        case 'first':
            return values[0] ?? null;
        case 'last':
            return values[values.length - 1] ?? null;
        default:
            return null;
    }
}
/**
 * Compute aggregations for multiple fields and functions.
 */
export function computeAggregations(rows, config) {
    const fieldResults = {};
    for (const fieldConfig of config.fields) {
        const results = {};
        for (const fn of fieldConfig.functions) {
            results[fn] = computeAggregation(rows, fieldConfig.field, fn);
        }
        fieldResults[fieldConfig.field] = results;
    }
    return { fieldResults };
}
/**
 * Compute aggregations for each group in a grouped row model.
 */
export function computeGroupAggregations(groups, config) {
    return groups.map(group => {
        const result = computeAggregations(group.rows, config);
        const aggregations = {};
        for (const [field, fns] of Object.entries(result.fieldResults)) {
            for (const [fn, value] of Object.entries(fns)) {
                aggregations[`${field}_${fn}`] = value;
            }
        }
        return {
            ...group,
            aggregations,
            subGroups: group.subGroups
                ? computeGroupAggregations(group.subGroups, config)
                : undefined,
        };
    });
}
//# sourceMappingURL=aggregation.js.map