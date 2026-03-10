/**
 * @phozart/phz-engine — Window Functions
 *
 * Running totals, moving averages, rank, lag/lead, and row numbering.
 * All functions accept optional partitionBy for grouped windows.
 */
function sortByField(data, field) {
    return [...data].sort((a, b) => {
        const va = a[field];
        const vb = b[field];
        if (va == null && vb == null)
            return 0;
        if (va == null)
            return -1;
        if (vb == null)
            return 1;
        return va < vb ? -1 : va > vb ? 1 : 0;
    });
}
function partition(data, field) {
    const groups = new Map();
    for (const row of data) {
        const key = String(row[field] ?? '__null__');
        if (!groups.has(key))
            groups.set(key, []);
        groups.get(key).push(row);
    }
    return groups;
}
function getNumericValue(row, field) {
    const v = row[field];
    return typeof v === 'number' && !isNaN(v) ? v : null;
}
function applyToPartitions(data, orderField, partitionBy, fn) {
    const ordered = orderField ? sortByField(data, orderField) : [...data];
    if (!partitionBy)
        return fn(ordered);
    const groups = partition(ordered, partitionBy);
    const resultMap = new Map();
    for (const groupRows of groups.values()) {
        const processed = fn(groupRows);
        for (let i = 0; i < groupRows.length; i++) {
            resultMap.set(groupRows[i], processed[i]);
        }
    }
    // Maintain original order
    return ordered.map(row => resultMap.get(row) ?? row);
}
export function runningSum(data, valueField, orderField, partitionBy) {
    if (data.length === 0)
        return [];
    return applyToPartitions(data, orderField, partitionBy, (rows) => {
        let sum = 0;
        return rows.map(row => {
            const v = getNumericValue(row, valueField);
            if (v !== null)
                sum += v;
            return { ...row, _runningSum: sum };
        });
    });
}
export function runningAvg(data, valueField, orderField, partitionBy) {
    if (data.length === 0)
        return [];
    return applyToPartitions(data, orderField, partitionBy, (rows) => {
        let sum = 0;
        let count = 0;
        return rows.map(row => {
            const v = getNumericValue(row, valueField);
            if (v !== null) {
                sum += v;
                count++;
            }
            return { ...row, _runningAvg: count > 0 ? sum / count : 0 };
        });
    });
}
export function movingAverage(data, valueField, windowSize, orderField, partitionBy) {
    if (data.length === 0)
        return [];
    return applyToPartitions(data, orderField, partitionBy, (rows) => {
        return rows.map((row, i) => {
            const start = Math.max(0, i - windowSize + 1);
            let sum = 0;
            let count = 0;
            for (let j = start; j <= i; j++) {
                const v = getNumericValue(rows[j], valueField);
                if (v !== null) {
                    sum += v;
                    count++;
                }
            }
            return { ...row, _movingAvg: count > 0 ? sum / count : 0 };
        });
    });
}
export function movingSum(data, valueField, windowSize, orderField, partitionBy) {
    if (data.length === 0)
        return [];
    return applyToPartitions(data, orderField, partitionBy, (rows) => {
        return rows.map((row, i) => {
            const start = Math.max(0, i - windowSize + 1);
            let sum = 0;
            for (let j = start; j <= i; j++) {
                const v = getNumericValue(rows[j], valueField);
                if (v !== null)
                    sum += v;
            }
            return { ...row, _movingSum: sum };
        });
    });
}
export function rank(data, valueField, order = 'desc', partitionBy) {
    if (data.length === 0)
        return [];
    const process = (rows) => {
        // Get distinct sorted values
        const values = rows
            .map(r => getNumericValue(r, valueField))
            .filter((v) => v !== null);
        const sorted = [...new Set(values)].sort((a, b) => order === 'asc' ? a - b : b - a);
        const rankMap = new Map();
        sorted.forEach((v, i) => rankMap.set(v, i + 1));
        return rows.map(row => {
            const v = getNumericValue(row, valueField);
            return { ...row, _rank: v !== null ? rankMap.get(v) : rows.length };
        });
    };
    if (!partitionBy)
        return process([...data]);
    const groups = partition(data, partitionBy);
    const resultMap = new Map();
    for (const groupRows of groups.values()) {
        const processed = process(groupRows);
        for (let i = 0; i < groupRows.length; i++) {
            resultMap.set(groupRows[i], processed[i]);
        }
    }
    return data.map(row => resultMap.get(row));
}
export function percentRank(data, valueField, partitionBy) {
    if (data.length === 0)
        return [];
    const process = (rows) => {
        if (rows.length === 1) {
            return rows.map(row => ({ ...row, _percentRank: 0 }));
        }
        const values = rows.map(r => getNumericValue(r, valueField) ?? -Infinity);
        const sorted = [...values].sort((a, b) => a - b);
        const n = rows.length;
        return rows.map((row, i) => {
            const v = values[i];
            // Number of values less than current
            const lessThan = sorted.filter(s => s < v).length;
            return { ...row, _percentRank: lessThan / (n - 1) };
        });
    };
    if (!partitionBy)
        return process([...data]);
    const groups = partition(data, partitionBy);
    const resultMap = new Map();
    for (const groupRows of groups.values()) {
        const processed = process(groupRows);
        for (let i = 0; i < groupRows.length; i++) {
            resultMap.set(groupRows[i], processed[i]);
        }
    }
    return data.map(row => resultMap.get(row));
}
export function lag(data, valueField, offset = 1, defaultValue, partitionBy) {
    if (data.length === 0)
        return [];
    const process = (rows) => {
        return rows.map((row, i) => {
            const prev = i - offset >= 0 ? rows[i - offset][valueField] : defaultValue;
            return { ...row, _lag: prev };
        });
    };
    if (!partitionBy)
        return process([...data]);
    const groups = partition(data, partitionBy);
    const resultMap = new Map();
    for (const groupRows of groups.values()) {
        const processed = process(groupRows);
        for (let i = 0; i < groupRows.length; i++) {
            resultMap.set(groupRows[i], processed[i]);
        }
    }
    return data.map(row => resultMap.get(row));
}
export function lead(data, valueField, offset = 1, defaultValue, partitionBy) {
    if (data.length === 0)
        return [];
    const process = (rows) => {
        return rows.map((row, i) => {
            const next = i + offset < rows.length ? rows[i + offset][valueField] : defaultValue;
            return { ...row, _lead: next };
        });
    };
    if (!partitionBy)
        return process([...data]);
    const groups = partition(data, partitionBy);
    const resultMap = new Map();
    for (const groupRows of groups.values()) {
        const processed = process(groupRows);
        for (let i = 0; i < groupRows.length; i++) {
            resultMap.set(groupRows[i], processed[i]);
        }
    }
    return data.map(row => resultMap.get(row));
}
export function rowNumber(data, orderField, partitionBy) {
    if (data.length === 0)
        return [];
    return applyToPartitions(data, orderField, partitionBy, (rows) => {
        return rows.map((row, i) => ({ ...row, _rowNumber: i + 1 }));
    });
}
//# sourceMappingURL=window-functions.js.map