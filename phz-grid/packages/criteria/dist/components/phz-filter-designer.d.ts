/**
 * @phozart/phz-criteria — Filter Designer
 *
 * Single place for creating and managing reusable filter definitions,
 * filter rules, and shared presets. Three tabs: Definitions, Rules, Presets.
 *
 * Features:
 * - Right-click context menus on all panels and items
 * - Auto-save on all edits (debounced, with visual confirmation)
 * - Built-in guidance panels for business administrators
 *
 * Composes engine-admin's <phz-filter-studio> via dynamic import for rich
 * definition editing; falls back to an inline form if engine-admin isn't installed.
 * Editing drawer is provided by <phz-filter-drawer>.
 *
 * CSS prefix: phz-fd-
 *
 * Events:
 * - definition-create: { definition: FilterDefinition }
 * - definition-update: { id, patch }
 * - definition-deprecate: { id }
 * - definition-restore: { id }
 * - definition-duplicate: { id, definition }
 * - rule-add / rule-remove / rule-toggle / rule-update  (re-dispatched from phz-rule-admin)
 * - preset-create / preset-update / preset-delete        (re-dispatched from phz-preset-admin)
 */
import { LitElement } from 'lit';
import type { FilterDefinition, FilterRule, SelectionPreset, FilterDataSource, FilterDefinitionPreset } from '@phozart/phz-core';
import './phz-rule-admin.js';
import './phz-preset-admin.js';
import './phz-filter-drawer.js';
import './fields/phz-combobox.js';
type DesignerTab = 'definitions' | 'rules' | 'presets';
interface CtxMenuItem {
    id: string;
    label: string;
    icon?: string;
    disabled?: boolean;
    separator?: boolean;
    variant?: 'default' | 'danger';
}
export declare const HELP: Record<DesignerTab, {
    title: string;
    body: string;
    tips: string[];
}>;
/** Build context menu items for a definition card */
export declare function buildDefContextItems(def: FilterDefinition): CtxMenuItem[];
/** Build context menu items for a rule card */
export declare function buildRuleContextItems(rule: FilterRule, isFirst: boolean, isLast: boolean): CtxMenuItem[];
/** Build context menu items for a preset card */
export declare function buildPresetContextItems(preset: SelectionPreset, scope: string): CtxMenuItem[];
/** Build background context menu items */
export declare function buildBgContextItems(tab: DesignerTab, helpOpen: boolean): CtxMenuItem[];
export declare class PhzFilterDesigner extends LitElement {
    static styles: import("lit").CSSResult[];
    definitions: FilterDefinition[];
    rules: FilterRule[];
    sharedPresets: SelectionPreset[];
    userPresets: SelectionPreset[];
    availableColumns: string[];
    data: Record<string, unknown>[];
    rulePreviewResults: Record<string, {
        before: number;
        after: number;
    }>;
    dataSources: FilterDataSource[];
    filterPresets: FilterDefinitionPreset[];
    private _tab;
    private _searchTerm;
    private _drawerOpen;
    private _drawerMode;
    private _editingDef;
    private _hasStudio;
    private _studioChecked;
    private _newLabel;
    private _newType;
    private _newSession;
    private _showNewForm;
    private _newDataSourceId;
    private _newValueField;
    private _newLabelTemplate;
    private _editingId;
    private _editingLabel;
    private _ctxOpen;
    private _ctxX;
    private _ctxY;
    private _ctxItems;
    private _ctxFocusIdx;
    private _ctxTargetId;
    private _ctxTargetData;
    private _helpOpen;
    private _saveStatus;
    private _toastVisible;
    private _toastMessage;
    private _autoSaveTimer;
    private _saveStatusTimer;
    private _toastTimer;
    private _ctxCleanup;
    disconnectedCallback(): void;
    private _clearTimers;
    render(): import("lit-html").TemplateResult<1>;
    private _renderStudioModal;
    private _handleStudioSave;
    private _onModalKeydown;
    private _renderHelp;
    private _renderDefinitions;
    private _renderDefinitionCard;
    private _renderNewForm;
    private _renderRules;
    private _renderPresets;
    private _renderInlineEditor;
    private _handleEditorChange;
    private _scheduleAutoSave;
    private _flushAutoSave;
    private _renderContextMenu;
    private _handleCtxKeydown;
    private _openContextMenu;
    private _closeContextMenu;
    private _addCtxListeners;
    private _removeCtxListeners;
    private _handleRootContextMenu;
    private _handleDefContextMenu;
    private _handleRuleContextMenu;
    private _handleRulesBgContextMenu;
    private _handlePresetContextMenu;
    private _handlePresetsBgContextMenu;
    private _handleFilterPresetContextMenu;
    private _redispatch;
    private _selectCtxItem;
    private _openRuleEditor;
    private _showToast;
    private _handleNewDataSourceChange;
    private _renderNewTemplatePreview;
    private _handleNewClick;
    private _openEditor;
    private _checkStudio;
    private _closeDrawer;
    private _commitLabelEdit;
    private _createDefinition;
    private _dispatchEvent;
}
export {};
//# sourceMappingURL=phz-filter-designer.d.ts.map