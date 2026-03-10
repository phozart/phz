/**
 * @phozart/phz-core — Enterprise State Types
 *
 * DuckDB, AI, Collaboration, and Analytics state types.
 * Extracted from state.ts for modular imports.
 */
import type { CellPosition } from './cell.js';
import type { FilterOperator } from './state.js';
export interface DuckDBState {
    connection: DuckDBConnectionState;
    tables: string[];
    schemaCache: DuckDBSchemaCache;
    activeQuery: DuckDBQuery | null;
    queryHistory: DuckDBQueryHistoryEntry[];
}
export interface DuckDBConnectionState {
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
    error?: string;
}
export interface DuckDBQuery {
    sql: string;
    startTime: number;
    progress: number;
}
export interface DuckDBQueryResult {
    data: unknown[];
    schema: DuckDBColumn[];
    rowCount: number;
    executionTime: number;
    fromCache: boolean;
}
export interface DuckDBColumn {
    name: string;
    type: string;
    nullable: boolean;
}
export interface DuckDBSchemaCache {
    tables: Map<string, DuckDBTableSchema>;
    lastUpdated: number;
}
export interface DuckDBTableSchema {
    name: string;
    columns: DuckDBColumn[];
    rowCount: number;
}
export interface DuckDBQueryHistoryEntry {
    sql: string;
    executionTime: number;
    rowCount: number;
    timestamp: number;
}
export interface AIState {
    provider: AIProviderConfig | null;
    status: AIStatus;
    chatHistory: AIChatMessage[];
}
export interface AIProviderConfig {
    name: string;
    model?: string;
    baseURL?: string;
}
export interface AIChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}
export interface AIGeneratedQuery {
    sql: string;
    explanation: string;
    confidence: number;
}
export interface AIInferredSchema {
    columns: AIInferredColumn[];
    confidence: number;
}
export interface AIInferredColumn {
    name: string;
    type: string;
    nullable: boolean;
    description?: string;
}
export interface AIAnomaly {
    rowId: string;
    column: string;
    value: unknown;
    score: number;
    type: AIAnomalyType;
    reason: string;
}
export type AIAnomalyType = 'outlier' | 'missing' | 'inconsistent' | 'duplicate' | 'format';
export interface AIStatus {
    connected: boolean;
    processing: boolean;
    error?: string;
}
export interface CollaborationState {
    session: CollaborationSession | null;
    users: Map<string, CollaborationUser>;
    syncStatus: SyncStatus;
}
export interface CollaborationSession {
    sessionId: string;
    createdAt: number;
    connectedUsers: number;
}
export interface CollaborationUser {
    userId: string;
    userName: string;
    userColor: string;
    cursor?: CellPosition;
    online: boolean;
    lastActivity: number;
}
export interface SyncStatus {
    state: 'synced' | 'syncing' | 'offline' | 'error';
    pendingChanges: number;
    lastSyncTime: number;
}
export interface ChangeOperation {
    id: string;
    type: ChangeOperationType;
    userId: string;
    timestamp: number;
    data: unknown;
}
export type ChangeOperationType = 'cell-update' | 'row-add' | 'row-delete' | 'column-update' | 'state-change';
export interface ConflictResolution {
    conflictId: string;
    resolution: 'local' | 'remote' | 'merge' | 'custom';
    customValue?: unknown;
}
export interface AnalyticsState {
    grouping?: GroupingConfig;
    pivot?: PivotConfig;
    aggregation?: AggregationConfig;
    conditionalFormatting: ConditionalFormattingRule[];
    charts: ChartConfig[];
}
export interface GroupingConfig {
    fields: string[];
    expandedGroups: Set<string>;
}
export interface PivotConfig {
    rowFields: string[];
    columnFields: string[];
    valueFields: PivotValueField[];
}
export interface PivotValueField {
    field: string;
    aggregation: AggregationFunction;
    label?: string;
}
export interface AggregationConfig {
    fields: Array<{
        field: string;
        functions: AggregationFunction[];
    }>;
}
export type AggregationFunction = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'first' | 'last';
export interface ConditionalFormattingRule {
    id: string;
    type: ConditionalFormattingType;
    field: string;
    condition: ConditionalFormattingCondition;
    style: CellStyleConfig;
    priority: number;
}
export type ConditionalFormattingType = 'cell' | 'row' | 'column';
export interface ConditionalFormattingCondition {
    operator: FilterOperator;
    value: unknown;
    value2?: unknown;
}
export interface CellStyleConfig {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    icon?: string;
}
export interface ChartConfig {
    id: string;
    type: ChartType;
    title?: string;
    options: ChartOptions;
}
export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'heatmap';
export interface ChartOptions {
    xAxis?: ChartAxisConfig;
    yAxis?: ChartAxisConfig;
    series: Array<{
        field: string;
        label?: string;
    }>;
}
export interface ChartAxisConfig {
    field: string;
    label?: string;
    min?: number;
    max?: number;
}
export interface EnterpriseState {
    duckdb?: DuckDBState;
    ai?: AIState;
    collaboration?: CollaborationState;
    analytics?: AnalyticsState;
}
//# sourceMappingURL=enterprise-state.d.ts.map