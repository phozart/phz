/**
 * @phozart/workspace — Config Panel Component
 *
 * 5-section accordion panel for rich widget configuration.
 * Backward-compatible: renders old 3-tab panel when only `config` is set,
 * renders enhanced accordion panel when `enhancedConfig` is provided.
 *
 * Sections: Data | Appearance | Format | Overlays | Behavior
 */
import { LitElement } from 'lit';
import type { WidgetConfigPanelState } from './widget-config-state.js';
import type { EnhancedConfigPanelState } from './enhanced-config-state.js';
import './phz-color-picker.js';
import './phz-shadow-picker.js';
import './phz-slider-input.js';
export declare class PhzConfigPanel extends LitElement {
    /** Legacy 3-tab config (backward compat) */
    config?: WidgetConfigPanelState;
    /** Enhanced 5-section accordion config */
    enhancedConfig?: EnhancedConfigPanelState;
    static styles: import("lit").CSSResult;
    private _emit;
    private _setTab;
    private _updateTitle;
    private _updateSubtitle;
    private _removeFilter;
    private _emitEnhanced;
    render(): import("lit-html").TemplateResult<1>;
    private _renderLegacyContent;
    private _renderEnhanced;
    private _renderEnhancedSection;
    private _renderDataSection;
    private _isAccordionOpen;
    private _renderAccordion;
    private _renderAppearanceSection;
    private _renderContainerAccordion;
    private _renderTitleBarAccordion;
    private _renderChartAccordion;
    private _renderKpiAccordion;
    private _renderScorecardAccordion;
    private _renderFormatSection;
    private _renderOverlaysSection;
    private _renderBehaviorSection;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-config-panel': PhzConfigPanel;
    }
}
//# sourceMappingURL=phz-config-panel.d.ts.map