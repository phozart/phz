/**
 * @phozart/criteria — Criteria Panel
 *
 * Main facade. Renders header, fields grid, Apply/Reset bar, summary strip, preset manager.
 * Monochrome icons, Phz UI console mode.
 */
import { LitElement, nothing } from 'lit';
import type { CriteriaConfig, SelectionContext, SelectionPreset, SelectionFieldOption } from '@phozart/core';
import './phz-criteria-field.js';
import './phz-criteria-summary.js';
import './phz-preset-manager.js';
export declare class PhzCriteriaPanel extends LitElement {
    static styles: import("lit").CSSResult[];
    criteriaConfig: CriteriaConfig | null;
    selectionContext: SelectionContext;
    presets: SelectionPreset[];
    optionsData: Record<string, SelectionFieldOption[]>;
    currentUserId: string;
    private _pendingContext;
    private _panelExpanded;
    private _validationResult;
    connectedCallback(): void;
    willUpdate(changed: Map<string, unknown>): void;
    private _initDefaults;
    private get _autoApply();
    private get _showSummary();
    private get _showPresets();
    private get _showReset();
    private _getFieldOptions;
    private _onFieldChange;
    private _apply;
    private _reset;
    private _togglePanel;
    private _onPresetLoad;
    private _onSummaryClick;
    render(): import("lit-html").TemplateResult<1> | typeof nothing;
}
//# sourceMappingURL=phz-criteria-panel.d.ts.map