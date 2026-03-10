'use client';
/**
 * @phozart/phz-react — PhzFilterDesigner React Component
 *
 * Wraps the <phz-filter-designer> Web Component for React using @lit/react.
 * Provides admin UI for managing filter definitions, rules, and presets.
 */
import React, { createElement, forwardRef, useRef, useImperativeHandle, } from 'react';
import { createComponent } from '@lit/react';
import { PhzFilterDesigner as PhzFilterDesignerElement } from '@phozart/phz-workspace/criteria-admin';
const PhzFilterDesignerLit = createComponent({
    tagName: 'phz-filter-designer',
    elementClass: PhzFilterDesignerElement,
    react: React,
    events: {
        onDefinitionCreateEvent: 'definition-create',
        onDefinitionUpdateEvent: 'definition-update',
        onDefinitionDeprecateEvent: 'definition-deprecate',
        onDefinitionRestoreEvent: 'definition-restore',
        onDefinitionDuplicateEvent: 'definition-duplicate',
        onRuleAddEvent: 'rule-add',
        onRuleRemoveEvent: 'rule-remove',
        onRuleToggleEvent: 'rule-toggle',
        onRuleUpdateEvent: 'rule-update',
        onPresetCreateEvent: 'preset-create',
        onPresetUpdateEvent: 'preset-update',
        onPresetDeleteEvent: 'preset-delete',
        onFilterPresetCreateEvent: 'filter-preset-create',
        onFilterPresetUpdateEvent: 'filter-preset-update',
        onFilterPresetDeleteEvent: 'filter-preset-delete',
        onFilterPresetCopyEvent: 'filter-preset-copy',
    },
});
function wrapDetail(handler) {
    return handler ? (e) => handler(e.detail) : undefined;
}
/**
 * React component wrapping the <phz-filter-designer> Web Component.
 * Forward ref exposes the FilterDesignerApi for imperative operations.
 */
export const PhzFilterDesigner = forwardRef(function PhzFilterDesigner(props, ref) {
    const elementRef = useRef(null);
    // Expose FilterDesignerApi via ref
    useImperativeHandle(ref, () => ({
        getDefinitions() {
            const el = elementRef.current;
            return el?.definitions ?? [];
        },
        getRules() {
            const el = elementRef.current;
            return el?.rules ?? [];
        },
    }));
    const litProps = {
        ref: elementRef,
        definitions: props.definitions,
        rules: props.rules,
        sharedPresets: props.sharedPresets,
        userPresets: props.userPresets,
        availableColumns: props.availableColumns,
        data: props.data,
        rulePreviewResults: props.rulePreviewResults,
        dataSources: props.dataSources,
        filterPresets: props.filterPresets,
        onDefinitionCreateEvent: wrapDetail(props.onDefinitionCreate),
        onDefinitionUpdateEvent: wrapDetail(props.onDefinitionUpdate),
        onDefinitionDeprecateEvent: wrapDetail(props.onDefinitionDeprecate),
        onDefinitionRestoreEvent: wrapDetail(props.onDefinitionRestore),
        onDefinitionDuplicateEvent: wrapDetail(props.onDefinitionDuplicate),
        onRuleAddEvent: wrapDetail(props.onRuleAdd),
        onRuleRemoveEvent: wrapDetail(props.onRuleRemove),
        onRuleToggleEvent: wrapDetail(props.onRuleToggle),
        onRuleUpdateEvent: wrapDetail(props.onRuleUpdate),
        onPresetCreateEvent: wrapDetail(props.onPresetCreate),
        onPresetUpdateEvent: wrapDetail(props.onPresetUpdate),
        onPresetDeleteEvent: wrapDetail(props.onPresetDelete),
        onFilterPresetCreateEvent: wrapDetail(props.onFilterPresetCreate),
        onFilterPresetUpdateEvent: wrapDetail(props.onFilterPresetUpdate),
        onFilterPresetDeleteEvent: wrapDetail(props.onFilterPresetDelete),
        onFilterPresetCopyEvent: wrapDetail(props.onFilterPresetCopy),
        class: props.className,
        style: props.style,
    };
    // Remove undefined entries so Lit defaults are not overwritten
    for (const key of Object.keys(litProps)) {
        if (litProps[key] === undefined)
            delete litProps[key];
    }
    return createElement(PhzFilterDesignerLit, litProps);
});
//# sourceMappingURL=phz-filter-designer.js.map