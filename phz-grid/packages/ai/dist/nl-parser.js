/**
 * @phozart/ai — Natural Language KPI Parser
 *
 * Tokenizes and extracts structured KPI components from natural language descriptions.
 * Uses pattern matching — no LLM calls.
 */
// --- Aggregation Patterns ---
const AGGREGATION_MAP = [
    { pattern: /\b(total|sum)\b/i, aggregation: 'sum' },
    { pattern: /\b(average|avg|mean)\b/i, aggregation: 'avg' },
    { pattern: /\b(count|number of)\b/i, aggregation: 'count' },
    { pattern: /\b(maximum|max|highest|largest)\b/i, aggregation: 'max' },
    { pattern: /\b(minimum|min|lowest|smallest)\b/i, aggregation: 'min' },
];
// --- Period Patterns ---
const PERIOD_MAP = [
    { pattern: /\bdaily\b/i, period: 'daily' },
    { pattern: /\bweekly\b/i, period: 'weekly' },
    { pattern: /\bmonthly\b/i, period: 'monthly' },
    { pattern: /\bquarterly\b/i, period: 'quarterly' },
    { pattern: /\b(yearly|annual)\b/i, period: 'yearly' },
];
// --- Comparison Patterns ---
const COMPARISON_ABOVE = /\b(above|over|greater than|more than|at least|exceeds?|>=?)\b/i;
const COMPARISON_BELOW = /\b(below|under|less than|fewer than|no more than|at most|<=?)\b/i;
// --- Number Parsing ---
const NUMBER_PATTERN = /\$?([\d,.]+)\s*(K|M|B|%|ms|s)?/i;
function parseNumber(text) {
    const match = text.match(NUMBER_PATTERN);
    if (!match)
        return null;
    let value = parseFloat(match[1].replace(/,/g, ''));
    let unit;
    const suffix = match[2]?.toUpperCase();
    if (suffix === 'K')
        value *= 1_000;
    else if (suffix === 'M')
        value *= 1_000_000;
    else if (suffix === 'B')
        value *= 1_000_000_000;
    else if (suffix === '%')
        unit = 'percent';
    // Check for dollar sign
    if (text.includes('$'))
        unit = 'currency';
    return { value, unit };
}
// --- Direction Inference ---
const LOWER_IS_BETTER_HINTS = /\b(cost|expense|error|defect|churn|latency|time|delay|bug|incident|complaint|bounce|abandon)/i;
function inferDirection(text, comparison) {
    if (comparison === 'below')
        return 'lower_is_better';
    if (LOWER_IS_BETTER_HINTS.test(text))
        return 'lower_is_better';
    return 'higher_is_better';
}
// --- Field Hint Extraction ---
// Words to strip from the field hint
const STRIP_WORDS = /\b(total|sum|average|avg|mean|count|number|of|maximum|max|highest|largest|minimum|min|lowest|smallest|daily|weekly|monthly|quarterly|yearly|annual|above|over|greater|than|more|at|least|exceeds?|below|under|less|fewer|no)\b/gi;
function extractFieldHint(text, threshold) {
    let cleaned = text;
    // Remove number/threshold patterns
    cleaned = cleaned.replace(NUMBER_PATTERN, '');
    cleaned = cleaned.replace(/\$/, '');
    // Remove aggregation, period, comparison words
    cleaned = cleaned.replace(STRIP_WORDS, '');
    // Clean up whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned || text.trim();
}
// --- Name Generation ---
function generateName(text) {
    const cleaned = text.trim();
    if (!cleaned)
        return 'KPI';
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
// --- Main Parser ---
export function parseKPIDescription(text) {
    // Aggregation
    let aggregation = 'sum';
    for (const { pattern, aggregation: agg } of AGGREGATION_MAP) {
        if (pattern.test(text)) {
            aggregation = agg;
            break;
        }
    }
    // Period
    let period;
    for (const { pattern, period: p } of PERIOD_MAP) {
        if (pattern.test(text)) {
            period = p;
            break;
        }
    }
    // Comparison
    let comparison;
    if (COMPARISON_BELOW.test(text)) {
        comparison = 'below';
    }
    else if (COMPARISON_ABOVE.test(text)) {
        comparison = 'above';
    }
    // Threshold + unit
    let threshold;
    let unit;
    // Find the number after the comparison keyword
    const parsed = parseNumber(text);
    if (parsed) {
        threshold = parsed.value;
        unit = parsed.unit;
    }
    // Direction
    const direction = inferDirection(text, comparison);
    // Field hint
    const fieldHint = extractFieldHint(text, threshold);
    // Unit fallback for count
    if (aggregation === 'count' && !unit) {
        unit = 'count';
    }
    // Name
    const name = generateName(text);
    return {
        name,
        aggregation,
        fieldHint,
        comparison,
        threshold,
        period,
        direction,
        unit,
    };
}
//# sourceMappingURL=nl-parser.js.map