/**
 * @phozart/phz-shared — InteractionBus (A-1.05)
 *
 * Pub/sub event bus for cross-widget interactions.
 * Widgets emit events (drill-through, cross-filter, etc.) and other
 * widgets or the shell can subscribe to react.
 *
 * Extracted from workspace/interaction-bus.ts.
 */
export type WidgetEvent = {
    type: 'drill-through';
    sourceWidgetId: string;
    field: string;
    value: unknown;
} | {
    type: 'cross-filter';
    sourceWidgetId: string;
    filters: unknown[];
} | {
    type: 'clear-cross-filter';
    sourceWidgetId: string;
} | {
    type: 'selection-change';
    sourceWidgetId: string;
    selectedRows: unknown[];
} | {
    type: 'time-range-change';
    sourceWidgetId: string;
    from: Date;
    to: Date;
} | {
    type: 'navigate';
    targetArtifactId: string;
    filters?: unknown[];
} | {
    type: 'export-request';
    sourceWidgetId: string;
    format: 'csv' | 'png' | 'pdf';
};
export interface InteractionBus {
    emit(event: WidgetEvent): void;
    on<T extends WidgetEvent['type']>(type: T, handler: (event: Extract<WidgetEvent, {
        type: T;
    }>) => void): () => void;
    off<T extends WidgetEvent['type']>(type: T, handler: (event: Extract<WidgetEvent, {
        type: T;
    }>) => void): void;
}
export declare function createInteractionBus(): InteractionBus;
//# sourceMappingURL=interaction-bus.d.ts.map