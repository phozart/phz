/**
 * @phozart/criteria - Rule Editor Modal
 *
 * Modal dialog for creating, editing, and copying filter rules.
 * Shows type-specific form fields with guidance for each rule type.
 * CSS prefix: phz-rem-
 *
 * Events:
 * - rule-editor-save: { rule: FilterRule, mode: 'add' | 'edit' | 'copy' }
 * - rule-editor-cancel: {}
 * - rule-editor-delete: { ruleId: string }
 */
import { LitElement, nothing } from 'lit';
import type { FilterRule, FilterDefinition } from '@phozart/core';
import './fields/phz-combobox.js';
export type RuleEditorMode = 'add' | 'edit' | 'copy';
export declare class PhzRuleEditorModal extends LitElement {
    static styles: import("lit").CSSResult[];
    /** The rule being edited/copied (null for new) */
    rule: FilterRule | null;
    /** Available filter definitions for the definition picker */
    definitions: FilterDefinition[];
    /** Editor mode */
    mode: RuleEditorMode;
    /** Whether the modal is open */
    open: boolean;
    /** Highest existing priority (new rules get this + 1) */
    maxPriority: number;
    private _type;
    private _description;
    private _filterDefId;
    private _priority;
    private _enabled;
    private _pattern;
    private _flags;
    private _vsMode;
    private _vsValues;
    private _tgField;
    private _tgOperator;
    private _tgValue;
    private _tgValues;
    private _customKey;
    private _customParams;
    private _cfConditions;
    private _cfLogic;
    private _cfValueSource;
    private _cfBehavior;
    private _cfActionValues;
    private _cfActionContextKey;
    private _cfElseAction;
    private _errors;
    private _submitted;
    updated(changed: Map<string, unknown>): void;
    private _initFromRule;
    render(): import("lit-html").TemplateResult<1> | typeof nothing;
    private _renderDescriptionField;
    private _renderDefinitionPicker;
    private _renderTypeSelector;
    private _renderTypeInfo;
    private _getTypeGuidance;
    private _renderTypeFields;
    private _renderPatternFields;
    private _renderValueSetFields;
    private _renderTreeGroupFields;
    private _renderCustomFields;
    private _renderCrossFilterFields;
    private _renderCondition;
    private _addCondition;
    private _removeCondition;
    private _updateCondition;
    private _renderPriorityAndEnabled;
    private _validateRegex;
    private _validateJsonParams;
    private _validate;
    private _clearError;
    private _buildConfig;
    private _buildRule;
    private _changeType;
    private _save;
    private _cancel;
    private _delete;
    private _handleBackdropClick;
    private _handleKeydown;
}
//# sourceMappingURL=phz-rule-editor-modal.d.ts.map