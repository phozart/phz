/**
 * @phozart/ai — Type Definitions
 *
 * AI toolkit types for schema inference, NL queries, anomaly detection,
 * and data insights.
 */
import type { GridApi, ColumnDefinition, FilterOperator } from '@phozart/core';
export interface JSONSchema7 {
    type?: string | string[];
    properties?: Record<string, JSONSchema7>;
    required?: string[];
    items?: JSONSchema7;
    enum?: unknown[];
    description?: string;
    title?: string;
    $schema?: string;
    $id?: string;
    $ref?: string;
    definitions?: Record<string, JSONSchema7>;
    additionalProperties?: boolean | JSONSchema7;
    [key: string]: unknown;
}
export interface AIConfig {
    provider: AIProvider;
    model?: string;
    apiKey?: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
    enableCaching?: boolean;
    enableLogging?: boolean;
    /** Fields to redact from data samples sent to AI providers. Values are replaced with '[REDACTED]'. */
    redactFields?: string[];
}
export interface AIProvider {
    name: string;
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
    generateStructuredOutput<T>(prompt: string, schema: JSONSchema7): Promise<T>;
    streamCompletion(prompt: string, options?: CompletionOptions): AsyncIterable<CompletionChunk>;
}
export interface AIToolkit {
    getStructuredSchema(): JSONSchema7;
    inferSchema(sampleData: unknown[], options?: InferSchemaOptions): Promise<ColumnDefinition[]>;
    validateSchema(schema: ColumnDefinition[], data: unknown[]): Promise<SchemaValidationResult>;
    executeNaturalLanguageQuery(query: string, options?: NLQueryOptions): Promise<AIQueryResult>;
    explainQuery(sql: string): Promise<string>;
    suggestQueries(context?: string): Promise<string[]>;
    detectAnomalies(column: string, options?: AnomalyDetectionOptions): Promise<AnomalyResult[]>;
    suggestDataTypes(sampleData: unknown[]): Promise<DataTypeSuggestion[]>;
    detectDuplicates(columns?: string[]): Promise<DuplicateResult[]>;
    summarize(options?: SummarizeOptions): Promise<string>;
    generateInsights(columns?: string[]): Promise<Insight[]>;
    suggestFilters(input: string): Promise<FilterSuggestion[]>;
    autoCompleteValue(column: string, partial: string): Promise<string[]>;
    attachToGrid(grid: GridApi): void;
    detachFromGrid(): void;
}
export interface CompletionOptions {
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
    systemPrompt?: string;
}
export interface CompletionResult {
    text: string;
    model: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason: 'stop' | 'length' | 'content_filter';
}
export interface CompletionChunk {
    text: string;
    index: number;
    finishReason?: 'stop' | 'length' | 'content_filter';
}
export interface InferSchemaOptions {
    sampleSize?: number;
    confidence?: number;
    detectDates?: boolean;
    detectEnums?: boolean;
    maxEnumValues?: number;
}
export interface SchemaValidationResult {
    valid: boolean;
    errors: Array<{
        row: number;
        column: string;
        error: string;
    }>;
    warnings: Array<{
        row: number;
        column: string;
        warning: string;
    }>;
    coverage: number;
}
export interface NLQueryOptions {
    schema?: ColumnDefinition[];
    sampleData?: unknown[];
    dialect?: 'duckdb' | 'sqlite' | 'postgres' | 'mysql';
    explainSQL?: boolean;
    dryRun?: boolean;
}
export interface AIQueryResult {
    sql: string;
    explanation?: string;
    data?: unknown[];
    error?: string;
    confidence: number;
}
export interface AnomalyDetectionOptions {
    method?: 'zscore' | 'iqr' | 'isolation_forest' | 'auto';
    threshold?: number;
    sensitivity?: 'low' | 'medium' | 'high';
}
export interface AnomalyResult {
    rowId: string;
    column: string;
    value: unknown;
    score: number;
    reason: string;
    severity: 'low' | 'medium' | 'high';
}
export interface DataTypeSuggestion {
    column: string;
    currentType: string;
    suggestedType: string;
    confidence: number;
    reason: string;
    examples: Array<{
        value: unknown;
        parsedValue: unknown;
    }>;
}
export interface DuplicateResult {
    rowIds: string[];
    columns: string[];
    values: Record<string, unknown>;
    count: number;
}
export interface SummarizeOptions {
    maxLength?: number;
    style?: 'technical' | 'business' | 'casual';
    includeStats?: boolean;
    includeTrends?: boolean;
    columns?: string[];
}
export interface Insight {
    type: 'trend' | 'correlation' | 'outlier' | 'pattern' | 'distribution';
    title: string;
    description: string;
    columns: string[];
    confidence: number;
    visualization?: {
        type: 'line' | 'bar' | 'scatter' | 'heatmap';
        data: unknown[];
    };
}
export interface FilterSuggestion {
    field: string;
    operator: FilterOperator;
    value: unknown;
    displayText: string;
    confidence: number;
}
//# sourceMappingURL=types.d.ts.map