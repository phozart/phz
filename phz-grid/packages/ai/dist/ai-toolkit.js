/**
 * @phozart/phz-ai — AI Toolkit Implementation
 *
 * Schema-as-contract AI toolkit. Uses an AI provider (OpenAI, Anthropic, Google)
 * to provide schema inference, NL queries, anomaly detection, and insights.
 */
const MAX_NL_QUERY_LENGTH = 500;
const ALLOWED_SQL_PREFIXES = /^\s*(SELECT|WITH|EXPLAIN)\b/i;
const FORBIDDEN_SQL_PATTERNS = /[;]|\b(DROP|DELETE|TRUNCATE|ALTER|INSERT|UPDATE|CREATE|EXEC|EXECUTE|GRANT|REVOKE|COPY|ATTACH|INSTALL|LOAD|CALL|PRAGMA)\b/i;
function sanitizeForPrompt(input, maxLength = MAX_NL_QUERY_LENGTH) {
    return input
        .slice(0, maxLength)
        .replace(/[\x00-\x1f]/g, '')
        // Strip XML-like tags that could be used for prompt injection
        .replace(/<\/?[a-zA-Z|_][^>]*>/g, '')
        // Strip ChatML-style delimiters
        .replace(/<\|[^|>]*\|>/g, '')
        // Strip common prompt injection phrases
        .replace(/\b(ignore\s+(above|previous|all)\s+(instructions?|prompts?|rules?))\b/gi, '')
        .replace(/\b(you\s+are\s+now)\b/gi, '')
        .replace(/\b(new\s+instructions?)\b/gi, '')
        .replace(/\b(system\s*prompt)\b/gi, '')
        .replace(/\b(disregard\s+(above|previous|all))\b/gi, '')
        .replace(/"/g, '\\"');
}
class AIToolkitImpl {
    config;
    grid = null;
    constructor(config) {
        this.config = config;
        if (!config.redactFields?.length) {
            console.warn('@phozart/phz-ai: No redactFields configured. Data samples sent to AI providers will include all field values. Set config.redactFields to protect sensitive data.');
        }
    }
    getStructuredSchema() {
        if (!this.grid)
            throw new Error('@phozart/phz-ai: Not attached to grid');
        const state = this.grid.getState();
        const columns = state.columns.order;
        const properties = {};
        for (const field of columns) {
            properties[field] = { type: 'string', description: field };
        }
        return {
            $schema: 'http://json-schema.org/draft-07/schema#',
            type: 'object',
            properties,
            required: columns,
        };
    }
    async inferSchema(sampleData, options) {
        const sampleSize = options?.sampleSize ?? 100;
        const sample = sampleData.slice(0, sampleSize);
        if (sample.length === 0)
            return [];
        // First attempt: use AI to infer rich schema
        const prompt = this.buildInferSchemaPrompt(sample, options);
        try {
            const result = await this.config.provider.generateStructuredOutput(prompt, {
                type: 'object',
                properties: {
                    columns: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                field: { type: 'string' },
                                type: { type: 'string', enum: ['string', 'number', 'boolean', 'date', 'custom'] },
                                header: { type: 'string' },
                            },
                            required: ['field', 'type', 'header'],
                        },
                    },
                },
                required: ['columns'],
            });
            return result.columns.map((c) => ({
                field: c.field,
                header: c.header,
                type: c.type,
                sortable: true,
                filterable: true,
            }));
        }
        catch {
            // Fallback: heuristic-based inference
            return this.heuristicInferSchema(sample);
        }
    }
    async validateSchema(schema, data) {
        const errors = [];
        const warnings = [];
        let checkedCells = 0;
        let validCells = 0;
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            for (const col of schema) {
                checkedCells++;
                const value = row[col.field];
                if (value === null || value === undefined) {
                    warnings.push({ row: i, column: col.field, warning: 'null value' });
                    validCells++;
                    continue;
                }
                if (col.type === 'number' && typeof value !== 'number') {
                    if (!isNaN(Number(value))) {
                        warnings.push({ row: i, column: col.field, warning: `Expected number, got ${typeof value} (coercible)` });
                        validCells++;
                    }
                    else {
                        errors.push({ row: i, column: col.field, error: `Expected number, got ${typeof value}` });
                    }
                }
                else if (col.type === 'boolean' && typeof value !== 'boolean') {
                    errors.push({ row: i, column: col.field, error: `Expected boolean, got ${typeof value}` });
                }
                else {
                    validCells++;
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            coverage: checkedCells > 0 ? validCells / checkedCells : 1,
        };
    }
    async executeNaturalLanguageQuery(query, options) {
        if (!query || query.length > MAX_NL_QUERY_LENGTH) {
            return {
                sql: '',
                error: `Query must be between 1 and ${MAX_NL_QUERY_LENGTH} characters`,
                confidence: 0,
            };
        }
        const schema = options?.schema ?? this.getGridColumns();
        const dialect = options?.dialect ?? 'duckdb';
        // Sanitize query for prompt injection
        const sanitizedQuery = sanitizeForPrompt(query);
        const prompt = `Given a ${dialect} database with columns: ${schema.map((c) => `${c.field} (${c.type ?? 'string'})`).join(', ')}

Convert this natural language query to a read-only SQL SELECT query:
"${sanitizedQuery}"

Return ONLY a SELECT query, no explanation. Never generate DROP, DELETE, INSERT, UPDATE, ALTER, CREATE, TRUNCATE, EXEC, GRANT, or REVOKE statements.`;
        try {
            const result = await this.config.provider.generateCompletion(prompt, {
                temperature: this.config.temperature ?? 0,
                maxTokens: this.config.maxTokens ?? 500,
            });
            const sql = result.text.trim().replace(/^```sql\n?/i, '').replace(/\n?```$/i, '').trim();
            // Validate the generated SQL is read-only
            if (!ALLOWED_SQL_PREFIXES.test(sql)) {
                return {
                    sql,
                    error: 'Generated SQL is not a SELECT query. Only read-only queries are allowed.',
                    confidence: 0,
                };
            }
            if (FORBIDDEN_SQL_PATTERNS.test(sql)) {
                return {
                    sql,
                    error: 'Generated SQL contains forbidden statements. Only read-only queries are allowed.',
                    confidence: 0,
                };
            }
            const response = {
                sql,
                confidence: 0.8,
            };
            if (options?.explainSQL) {
                response.explanation = await this.explainQuery(sql);
            }
            return response;
        }
        catch (err) {
            return {
                sql: '',
                error: err instanceof Error ? err.message : 'Unknown error',
                confidence: 0,
            };
        }
    }
    async explainQuery(sql) {
        const result = await this.config.provider.generateCompletion(`Explain this SQL query in plain English:\n${sanitizeForPrompt(sql, 2000)}`, { temperature: 0.3, maxTokens: 300 });
        return result.text.trim();
    }
    async suggestQueries(context) {
        const columns = this.getGridColumns();
        const prompt = `Given a dataset with columns: ${columns.map((c) => c.field).join(', ')}
${context ? `Context: ${sanitizeForPrompt(context)}` : ''}

Suggest 5 useful analytical queries a user might want to run. Return as a JSON array of strings.`;
        try {
            const result = await this.config.provider.generateStructuredOutput(prompt, {
                type: 'object',
                properties: { queries: { type: 'array', items: { type: 'string' } } },
                required: ['queries'],
            });
            return result.queries;
        }
        catch {
            return [];
        }
    }
    async detectAnomalies(column, options) {
        if (!this.grid)
            return [];
        const data = this.grid.getData();
        const values = data.map((row) => row[column]);
        const numericValues = values.map(Number).filter((v) => !isNaN(v));
        if (numericValues.length === 0)
            return [];
        const method = options?.method ?? 'auto';
        const threshold = options?.threshold ?? 2;
        if (method === 'iqr' || method === 'auto') {
            return this.detectAnomaliesIQR(column, data, values, numericValues, threshold);
        }
        // Z-score method
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const std = Math.sqrt(numericValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / numericValues.length);
        if (std === 0)
            return [];
        const anomalies = [];
        for (let i = 0; i < data.length; i++) {
            const v = Number(values[i]);
            if (isNaN(v))
                continue;
            const zscore = Math.abs((v - mean) / std);
            if (zscore > threshold) {
                const row = data[i];
                anomalies.push({
                    rowId: String(row['__id'] ?? i),
                    column,
                    value: values[i],
                    score: zscore,
                    reason: `Z-score ${zscore.toFixed(2)} exceeds threshold ${threshold}`,
                    severity: zscore > threshold * 2 ? 'high' : zscore > threshold * 1.5 ? 'medium' : 'low',
                });
            }
        }
        return anomalies;
    }
    async suggestDataTypes(sampleData) {
        if (sampleData.length === 0)
            return [];
        const first = sampleData[0];
        const suggestions = [];
        for (const [column, value] of Object.entries(first)) {
            const currentType = typeof value;
            const allValues = sampleData.map((r) => r[column]);
            const suggestion = this.suggestType(column, allValues, currentType);
            if (suggestion)
                suggestions.push(suggestion);
        }
        return suggestions;
    }
    async detectDuplicates(columns) {
        if (!this.grid)
            return [];
        const data = this.grid.getData();
        const keys = columns ?? Object.keys((data[0] ?? {})).filter((k) => k !== '__id');
        const seen = new Map();
        for (const row of data) {
            const r = row;
            const key = keys.map((k) => String(r[k] ?? '')).join('|||');
            if (!seen.has(key))
                seen.set(key, []);
            seen.get(key).push({ rowId: String(r['__id'] ?? ''), row: r });
        }
        const duplicates = [];
        for (const [, entries] of seen) {
            if (entries.length > 1) {
                const values = {};
                for (const k of keys)
                    values[k] = entries[0].row[k];
                duplicates.push({
                    rowIds: entries.map((e) => e.rowId),
                    columns: keys,
                    values,
                    count: entries.length,
                });
            }
        }
        return duplicates;
    }
    async summarize(options) {
        if (!this.grid)
            return '';
        const data = this.grid.getData();
        const columns = options?.columns ?? Object.keys((data[0] ?? {})).filter((k) => k !== '__id');
        const sample = data.slice(0, 50);
        const prompt = `Summarize this dataset (${data.length} rows, columns: ${columns.join(', ')}).
Style: ${options?.style ?? 'business'}
Max length: ${options?.maxLength ?? 200} words
${options?.includeStats ? 'Include basic statistics.' : ''}
${options?.includeTrends ? 'Mention any apparent trends.' : ''}

Sample data: ${JSON.stringify(this.redactSample(sample.slice(0, 10)))}`;
        const result = await this.config.provider.generateCompletion(prompt, {
            temperature: 0.5,
            maxTokens: options?.maxLength ? options.maxLength * 2 : 400,
        });
        return result.text.trim();
    }
    async generateInsights(columns) {
        if (!this.grid)
            return [];
        const data = this.grid.getData();
        const cols = columns ?? Object.keys((data[0] ?? {})).filter((k) => k !== '__id');
        const prompt = `Analyze this dataset and generate insights.
Columns: ${cols.join(', ')}
Row count: ${data.length}
Sample: ${JSON.stringify(this.redactSample(data.slice(0, 5)))}

Return insights as JSON array with objects having: type, title, description, columns, confidence`;
        try {
            const result = await this.config.provider.generateStructuredOutput(prompt, {
                type: 'object',
                properties: {
                    insights: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', enum: ['trend', 'correlation', 'outlier', 'pattern', 'distribution'] },
                                title: { type: 'string' },
                                description: { type: 'string' },
                                columns: { type: 'array', items: { type: 'string' } },
                                confidence: { type: 'number' },
                            },
                            required: ['type', 'title', 'description', 'columns', 'confidence'],
                        },
                    },
                },
                required: ['insights'],
            });
            return result.insights;
        }
        catch {
            return [];
        }
    }
    async suggestFilters(input) {
        const columns = this.getGridColumns();
        const prompt = `Given columns: ${columns.map((c) => `${c.field} (${c.type ?? 'string'})`).join(', ')}

The user typed: "${sanitizeForPrompt(input)}"

Suggest filters that match. Return JSON array with objects: field, operator, value, displayText, confidence.
Valid operators: equals, notEquals, contains, startsWith, greaterThan, lessThan, between, isNull, isNotNull`;
        try {
            const result = await this.config.provider.generateStructuredOutput(prompt, {
                type: 'object',
                properties: {
                    filters: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                field: { type: 'string' },
                                operator: { type: 'string' },
                                value: {},
                                displayText: { type: 'string' },
                                confidence: { type: 'number' },
                            },
                            required: ['field', 'operator', 'displayText', 'confidence'],
                        },
                    },
                },
                required: ['filters'],
            });
            return result.filters;
        }
        catch {
            return [];
        }
    }
    async autoCompleteValue(column, partial) {
        if (!this.grid)
            return [];
        const data = this.grid.getData();
        const values = new Set();
        for (const row of data) {
            const v = String(row[column] ?? '');
            if (v.toLowerCase().startsWith(partial.toLowerCase())) {
                values.add(v);
                if (values.size >= 20)
                    break;
            }
        }
        return Array.from(values);
    }
    redactSample(data) {
        const fields = this.config.redactFields;
        if (!fields || fields.length === 0)
            return data;
        const redactSet = new Set(fields);
        return data.map(row => {
            const r = { ...row };
            for (const field of redactSet) {
                if (field in r)
                    r[field] = '[REDACTED]';
            }
            return r;
        });
    }
    attachToGrid(grid) {
        this.grid = grid;
    }
    detachFromGrid() {
        this.grid = null;
    }
    // --- Private Helpers ---
    getGridColumns() {
        if (!this.grid)
            return [];
        const state = this.grid.getState();
        return state.columns.order.map((field) => ({
            field,
            header: field,
            type: 'string',
            sortable: true,
            filterable: true,
        }));
    }
    buildInferSchemaPrompt(sample, options) {
        return `Analyze this data sample and infer the column schema.
${options?.detectDates ? 'Detect date columns.' : ''}
${options?.detectEnums ? `Detect enum columns (max ${options?.maxEnumValues ?? 20} values).` : ''}

Sample data (${sample.length} rows):
${JSON.stringify(this.redactSample(sample.slice(0, 5)), null, 2)}

Return columns with: field, type (string/number/boolean/date/custom), header (human-readable name).`;
    }
    heuristicInferSchema(sample) {
        if (sample.length === 0)
            return [];
        const first = sample[0];
        return Object.keys(first).map((field) => {
            const values = sample.map((r) => r[field]);
            const type = this.inferColumnType(values);
            return {
                field,
                header: field.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim(),
                type,
                sortable: true,
                filterable: true,
            };
        });
    }
    inferColumnType(values) {
        const nonNull = values.filter((v) => v !== null && v !== undefined);
        if (nonNull.length === 0)
            return 'string';
        const types = nonNull.map((v) => typeof v);
        if (types.every((t) => t === 'number'))
            return 'number';
        if (types.every((t) => t === 'boolean'))
            return 'boolean';
        // Check for date strings
        const datePattern = /^\d{4}-\d{2}-\d{2}/;
        if (nonNull.every((v) => typeof v === 'string' && datePattern.test(v)))
            return 'date';
        return 'string';
    }
    detectAnomaliesIQR(column, data, values, numericValues, multiplier) {
        const sorted = [...numericValues].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lower = q1 - multiplier * iqr;
        const upper = q3 + multiplier * iqr;
        const anomalies = [];
        for (let i = 0; i < data.length; i++) {
            const v = Number(values[i]);
            if (isNaN(v))
                continue;
            if (v < lower || v > upper) {
                const row = data[i];
                const deviation = v < lower ? (lower - v) / iqr : (v - upper) / iqr;
                anomalies.push({
                    rowId: String(row['__id'] ?? i),
                    column,
                    value: values[i],
                    score: deviation,
                    reason: `Value ${v} outside IQR range [${lower.toFixed(2)}, ${upper.toFixed(2)}]`,
                    severity: deviation > 3 ? 'high' : deviation > 1.5 ? 'medium' : 'low',
                });
            }
        }
        return anomalies;
    }
    suggestType(column, values, currentType) {
        const nonNull = values.filter((v) => v !== null && v !== undefined);
        if (nonNull.length === 0)
            return null;
        // Check if strings that look like numbers
        if (currentType === 'string') {
            const numericCount = nonNull.filter((v) => !isNaN(Number(v))).length;
            if (numericCount / nonNull.length > 0.9) {
                return {
                    column,
                    currentType: 'string',
                    suggestedType: 'number',
                    confidence: numericCount / nonNull.length,
                    reason: `${numericCount}/${nonNull.length} values are numeric`,
                    examples: nonNull.slice(0, 3).map((v) => ({ value: v, parsedValue: Number(v) })),
                };
            }
            // Check for dates
            const datePattern = /^\d{4}-\d{2}-\d{2}/;
            const dateCount = nonNull.filter((v) => typeof v === 'string' && datePattern.test(v)).length;
            if (dateCount / nonNull.length > 0.9) {
                return {
                    column,
                    currentType: 'string',
                    suggestedType: 'date',
                    confidence: dateCount / nonNull.length,
                    reason: `${dateCount}/${nonNull.length} values are ISO date strings`,
                    examples: nonNull.slice(0, 3).map((v) => ({ value: v, parsedValue: new Date(v).toISOString() })),
                };
            }
            // Check for booleans
            const boolValues = new Set(['true', 'false', '0', '1', 'yes', 'no']);
            const boolCount = nonNull.filter((v) => boolValues.has(String(v).toLowerCase())).length;
            if (boolCount / nonNull.length > 0.9) {
                return {
                    column,
                    currentType: 'string',
                    suggestedType: 'boolean',
                    confidence: boolCount / nonNull.length,
                    reason: `${boolCount}/${nonNull.length} values are boolean-like`,
                    examples: nonNull.slice(0, 3).map((v) => ({ value: v, parsedValue: ['true', '1', 'yes'].includes(String(v).toLowerCase()) })),
                };
            }
        }
        return null;
    }
}
export function createAIToolkit(config) {
    return new AIToolkitImpl(config);
}
//# sourceMappingURL=ai-toolkit.js.map