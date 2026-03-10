/**
 * @phozart/phz-workspace — Enhanced Config Panel State (Canvas Phase 2A)
 *
 * Rich widget appearance/format/behavior configuration state machine.
 * Wraps the types from @phozart/phz-engine/widget-config-enhanced
 * and provides pure state transition functions.
 */
import type { ContainerAppearance, TitleBarAppearance, ChartAppearance, KpiAppearance, ScorecardAppearance, BottomNAppearance, WidgetBehaviourConfig, Threshold } from '@phozart/phz-engine';
export type EnhancedConfigSection = 'data' | 'appearance' | 'format' | 'overlays' | 'behavior';
export interface FormattingRuleEntry {
    id: string;
    field: string;
    condition: 'gt' | 'lt' | 'eq' | 'between';
    value: number;
    value2?: number;
    style: {
        color?: string;
        background?: string;
        bold?: boolean;
    };
}
export interface OverlayEntry {
    id: string;
    type: 'reference-line' | 'trend-line' | 'threshold-band';
    label?: string;
    value?: number;
    color?: string;
}
export interface EnhancedConfigPanelState {
    activeSection: EnhancedConfigSection;
    widgetId: string;
    widgetType: string;
    container: ContainerAppearance;
    titleBar: TitleBarAppearance;
    chart?: ChartAppearance;
    kpi?: KpiAppearance;
    scorecard?: ScorecardAppearance;
    bottomN?: BottomNAppearance;
    behaviour: WidgetBehaviourConfig;
    formattingRules: FormattingRuleEntry[];
    overlays: OverlayEntry[];
    thresholds: Threshold[];
    dirty: boolean;
    expandedAccordions: string[];
}
export declare function initialEnhancedConfigFromWidget(widgetId: string, widgetType: string, existingConfig?: Record<string, unknown>): EnhancedConfigPanelState;
export declare function setEnhancedConfigSection(state: EnhancedConfigPanelState, section: EnhancedConfigSection): EnhancedConfigPanelState;
export declare function updateEnhancedContainer(state: EnhancedConfigPanelState, patch: Partial<ContainerAppearance>): EnhancedConfigPanelState;
export declare function updateEnhancedTitleBar(state: EnhancedConfigPanelState, patch: Partial<TitleBarAppearance>): EnhancedConfigPanelState;
export declare function updateEnhancedChart(state: EnhancedConfigPanelState, patch: Partial<ChartAppearance>): EnhancedConfigPanelState;
export declare function updateEnhancedKpi(state: EnhancedConfigPanelState, patch: Partial<KpiAppearance>): EnhancedConfigPanelState;
export declare function updateEnhancedScorecard(state: EnhancedConfigPanelState, patch: Partial<ScorecardAppearance>): EnhancedConfigPanelState;
export declare function updateEnhancedBottomN(state: EnhancedConfigPanelState, patch: Partial<BottomNAppearance>): EnhancedConfigPanelState;
export declare function updateEnhancedBehaviour(state: EnhancedConfigPanelState, patch: Partial<WidgetBehaviourConfig>): EnhancedConfigPanelState;
export declare function toggleEnhancedAccordion(state: EnhancedConfigPanelState, id: string): EnhancedConfigPanelState;
export declare function addEnhancedFormattingRule(state: EnhancedConfigPanelState, rule: Omit<FormattingRuleEntry, 'id'>): EnhancedConfigPanelState;
export declare function removeEnhancedFormattingRule(state: EnhancedConfigPanelState, ruleId: string): EnhancedConfigPanelState;
export declare function updateEnhancedFormattingRule(state: EnhancedConfigPanelState, ruleId: string, patch: Partial<FormattingRuleEntry>): EnhancedConfigPanelState;
export declare function addEnhancedOverlay(state: EnhancedConfigPanelState, overlay: Omit<OverlayEntry, 'id'>): EnhancedConfigPanelState;
export declare function removeEnhancedOverlay(state: EnhancedConfigPanelState, overlayId: string): EnhancedConfigPanelState;
export declare function updateEnhancedOverlay(state: EnhancedConfigPanelState, overlayId: string, patch: Partial<OverlayEntry>): EnhancedConfigPanelState;
export declare function addEnhancedThreshold(state: EnhancedConfigPanelState, threshold: Threshold): EnhancedConfigPanelState;
export declare function removeEnhancedThreshold(state: EnhancedConfigPanelState, index: number): EnhancedConfigPanelState;
export declare function applyEnhancedConfigToWidget(state: EnhancedConfigPanelState): Record<string, unknown>;
export declare function markEnhancedConfigClean(state: EnhancedConfigPanelState): EnhancedConfigPanelState;
//# sourceMappingURL=enhanced-config-state.d.ts.map