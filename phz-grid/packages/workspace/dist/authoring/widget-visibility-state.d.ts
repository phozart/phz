/**
 * @phozart/phz-workspace — Widget Visibility State
 *
 * Pure functions for conditional widget visibility: types, CRUD, evaluation.
 * Widgets can be shown/hidden based on filter state or data result values.
 */
import type { WidgetVisibilityCondition, VisibilityExpression, VisibilityOperator } from '@phozart/phz-engine';
export type { WidgetVisibilityCondition, VisibilityExpression, VisibilityOperator };
export interface WidgetVisibilityState {
    conditions: Record<string, WidgetVisibilityCondition>;
    editingWidgetId?: string;
    editingDraft?: WidgetVisibilityCondition;
}
export declare function initialWidgetVisibilityState(): WidgetVisibilityState;
export declare function setVisibilityCondition(state: WidgetVisibilityState, widgetId: string, condition: WidgetVisibilityCondition): WidgetVisibilityState;
export declare function removeVisibilityCondition(state: WidgetVisibilityState, widgetId: string): WidgetVisibilityState;
export declare function startEditCondition(state: WidgetVisibilityState, widgetId: string): WidgetVisibilityState;
export declare function commitCondition(state: WidgetVisibilityState): WidgetVisibilityState;
export declare function cancelEditCondition(state: WidgetVisibilityState): WidgetVisibilityState;
export declare function evaluateVisibility(condition: WidgetVisibilityCondition, context: Record<string, unknown>): boolean;
export declare function getVisibleWidgets<T extends {
    id: string;
}>(widgets: T[], conditions: Record<string, WidgetVisibilityCondition>, filterState: Record<string, unknown>): T[];
//# sourceMappingURL=widget-visibility-state.d.ts.map