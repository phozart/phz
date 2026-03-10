/**
 * @phozart/phz-grid-admin — Table Settings Component
 *
 * 6 collapsible sections to configure all aspects of the grid's appearance
 * and behavior. Emits `table-settings-change` events with { section, key, value }.
 */
import { LitElement } from 'lit';
import { DEFAULT_TABLE_SETTINGS } from '@phozart/phz-engine';
import type { TableSettings } from '@phozart/phz-engine';
export { DEFAULT_TABLE_SETTINGS };
export type { TableSettings };
export declare class PhzAdminTableSettings extends LitElement {
    static styles: import("lit").CSSResult[];
    settings: TableSettings;
    columnFields: string[];
    columnTypes: Record<string, string>;
    private _activeTab;
    /** Merge incoming settings with defaults so the UI always has valid values. */
    private get s();
    private emit;
    private renderToggle;
    private renderBtnGroup;
    private renderContainerSection;
    private renderTitleBarSection;
    private renderToolbarSection;
    private renderGridOptionsSection;
    /**
     * Build a field-to-level lookup from groupByLevels.
     * Returns Map<field, levelNumber (1-based)>.
     */
    private _getFieldLevelMap;
    /**
     * Rebuild groupByLevels from the field-level map and emit both groupByLevels and groupByFields.
     */
    private _emitGroupLevels;
    private renderRowGroupingSection;
    private renderGroupTotalsOverrides;
    private renderAggregationSection;
    private renderBehaviourSection;
    private renderColumnGroupEditor;
    private renderGridLinesSection;
    private renderTypographySection;
    private renderTypeAlignRow;
    private renderSectionColorsSection;
    private _renderTabSwitcher;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-admin-table-settings': PhzAdminTableSettings;
    }
}
//# sourceMappingURL=phz-admin-table-settings.d.ts.map