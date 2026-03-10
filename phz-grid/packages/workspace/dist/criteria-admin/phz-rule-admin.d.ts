/**
 * @phozart/phz-criteria — Rule Admin
 *
 * Admin UI for managing filter rules: CRUD, priority reorder,
 * enable/disable toggle, preview panel, and rule editor modal.
 * CSS prefix: phz-ra-
 *
 * Events:
 * - rule-add: { rule: FilterRule }
 * - rule-remove: { ruleId }
 * - rule-toggle: { ruleId, enabled }
 * - rule-update: { ruleId, patch }
 * - rule-contextmenu: { ruleId, rule, x, y }
 * - rules-bg-contextmenu: { x, y }
 */
import { LitElement } from 'lit';
import type { FilterRule, FilterDefinition } from '@phozart/phz-core';
import './phz-rule-editor-modal.js';
import type { RuleEditorMode } from './phz-rule-editor-modal.js';
export declare class PhzRuleAdmin extends LitElement {
    static styles: import("lit").CSSResult[];
    rules: FilterRule[];
    definitions: FilterDefinition[];
    previewResults: Record<string, {
        before: number;
        after: number;
    }>;
    private _modalOpen;
    private _modalMode;
    private _modalRule;
    render(): import("lit-html").TemplateResult<1>;
    private _renderRule;
    /** Summary tags showing key config details at a glance */
    private _getConfigSummary;
    private _addRule;
    private _editRule;
    private _copyRule;
    /** Called from parent (filter designer) for context menu edit/copy */
    openEditor(rule: FilterRule, mode: RuleEditorMode): void;
    private _handleEditorSave;
    private _handleEditorCancel;
    private _handleEditorDelete;
    private _handleCardContextMenu;
    private _handleBgContextMenu;
    private _dispatchEvent;
}
//# sourceMappingURL=phz-rule-admin.d.ts.map