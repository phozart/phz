/**
 * @phozart/phz-ai — KPI Generator
 *
 * Generates KPI configurations from natural language descriptions + data schema.
 * Uses the NL parser for extraction and fuzzy field matching.
 */
import { parseKPIDescription } from './nl-parser.js';
// --- Field Matching ---
function normalizeForMatch(str) {
    return str
        .toLowerCase()
        .replace(/[_-]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .trim();
}
function matchField(hint, fields) {
    const normalizedHint = normalizeForMatch(hint);
    const hintWords = normalizedHint.split(/\s+/);
    // Exact match
    for (const field of fields) {
        if (normalizeForMatch(field.name) === normalizedHint) {
            return field;
        }
    }
    // Partial match: field name contains hint or hint contains field name
    let bestMatch;
    let bestScore = 0;
    for (const field of fields) {
        const normalizedField = normalizeForMatch(field.name);
        const fieldWords = normalizedField.split(/\s+/);
        // Count matching words
        let score = 0;
        for (const hw of hintWords) {
            for (const fw of fieldWords) {
                if (fw.includes(hw) || hw.includes(fw)) {
                    score += Math.min(hw.length, fw.length);
                }
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = field;
        }
    }
    return bestMatch;
}
// --- ID Generation ---
function generateId(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'kpi';
}
// --- Threshold Generation ---
function generateThresholds(target, direction) {
    if (direction === 'higher_is_better') {
        return {
            ok: Math.round(target * 0.9 * 100) / 100,
            warn: Math.round(target * 0.7 * 100) / 100,
        };
    }
    else {
        return {
            ok: Math.round(target * 1.0 * 100) / 100,
            warn: Math.round(target * 1.5 * 100) / 100,
        };
    }
}
// --- Main Generator ---
export function generateKPIConfig(description, schema) {
    const parsed = parseKPIDescription(description);
    // Match field from schema
    const numericFields = schema.filter(f => f.type === 'number');
    const dimensionFields = schema.filter(f => f.type === 'string');
    let matchedField = matchField(parsed.fieldHint, numericFields);
    if (!matchedField) {
        // Try matching against all fields
        matchedField = matchField(parsed.fieldHint, schema);
    }
    if (!matchedField && numericFields.length > 0) {
        // Fallback to first numeric field
        matchedField = numericFields[0];
    }
    const field = matchedField?.name ?? '';
    // Target from threshold, or a sensible default
    const target = parsed.threshold ?? 100;
    // Unit
    let unit = parsed.unit ?? 'custom';
    if (parsed.aggregation === 'count' && unit === 'custom') {
        unit = 'count';
    }
    // Thresholds
    const thresholds = generateThresholds(target, parsed.direction);
    // Dimensions from schema
    const dimensions = dimensionFields.map(f => f.name);
    const id = generateId(parsed.name);
    return {
        id,
        name: parsed.name,
        field,
        aggregation: parsed.aggregation,
        target,
        direction: parsed.direction,
        unit,
        thresholds,
        deltaComparison: 'previous_period',
        dataSource: {
            scoreEndpoint: `/api/kpi/${id}/score`,
            trendEndpoint: `/api/kpi/${id}/trend`,
        },
        dimensions,
    };
}
//# sourceMappingURL=kpi-generator.js.map