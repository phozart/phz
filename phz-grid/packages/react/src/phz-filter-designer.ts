'use client';
/**
 * @phozart/react — PhzFilterDesigner React Component
 *
 * Wraps the <phz-filter-designer> Web Component for React using @lit/react.
 * Provides admin UI for managing filter definitions, rules, and presets.
 */
import React, {
  createElement,
  forwardRef,
  useRef,
  useImperativeHandle,
} from 'react';
import { createComponent, type EventName } from '@lit/react';
import { PhzFilterDesigner as PhzFilterDesignerElement } from '@phozart/workspace/criteria-admin';

const PhzFilterDesignerLit = createComponent({
  tagName: 'phz-filter-designer',
  elementClass: PhzFilterDesignerElement,
  react: React,
  events: {
    onDefinitionCreateEvent: 'definition-create' as EventName<CustomEvent>,
    onDefinitionUpdateEvent: 'definition-update' as EventName<CustomEvent>,
    onDefinitionDeprecateEvent: 'definition-deprecate' as EventName<CustomEvent>,
    onDefinitionRestoreEvent: 'definition-restore' as EventName<CustomEvent>,
    onDefinitionDuplicateEvent: 'definition-duplicate' as EventName<CustomEvent>,
    onRuleAddEvent: 'rule-add' as EventName<CustomEvent>,
    onRuleRemoveEvent: 'rule-remove' as EventName<CustomEvent>,
    onRuleToggleEvent: 'rule-toggle' as EventName<CustomEvent>,
    onRuleUpdateEvent: 'rule-update' as EventName<CustomEvent>,
    onPresetCreateEvent: 'preset-create' as EventName<CustomEvent>,
    onPresetUpdateEvent: 'preset-update' as EventName<CustomEvent>,
    onPresetDeleteEvent: 'preset-delete' as EventName<CustomEvent>,
    onFilterPresetCreateEvent: 'filter-preset-create' as EventName<CustomEvent>,
    onFilterPresetUpdateEvent: 'filter-preset-update' as EventName<CustomEvent>,
    onFilterPresetDeleteEvent: 'filter-preset-delete' as EventName<CustomEvent>,
    onFilterPresetCopyEvent: 'filter-preset-copy' as EventName<CustomEvent>,
  },
});

/** Imperative API exposed via ref on the PhzFilterDesigner component. */
export interface FilterDesignerApi {
  /** Returns current filter definitions from the designer. */
  getDefinitions(): any[];
  /** Returns current filter rules from the designer. */
  getRules(): any[];
}

export interface PhzFilterDesignerProps {
  // Required
  definitions: any[];

  // Optional data
  rules?: any[];
  sharedPresets?: any[];
  userPresets?: any[];
  availableColumns?: string[];
  data?: Record<string, unknown>[];
  rulePreviewResults?: Record<string, { before: number; after: number }>;
  dataSources?: any[];
  filterPresets?: any[];

  // Definition events
  onDefinitionCreate?: (detail: any) => void;
  onDefinitionUpdate?: (detail: any) => void;
  onDefinitionDeprecate?: (detail: any) => void;
  onDefinitionRestore?: (detail: any) => void;
  onDefinitionDuplicate?: (detail: any) => void;

  // Rule events
  onRuleAdd?: (detail: any) => void;
  onRuleRemove?: (detail: any) => void;
  onRuleToggle?: (detail: any) => void;
  onRuleUpdate?: (detail: any) => void;

  // Preset events (cross-filter)
  onPresetCreate?: (detail: any) => void;
  onPresetUpdate?: (detail: any) => void;
  onPresetDelete?: (detail: any) => void;

  // Preset events (per-filter)
  onFilterPresetCreate?: (detail: any) => void;
  onFilterPresetUpdate?: (detail: any) => void;
  onFilterPresetDelete?: (detail: any) => void;
  onFilterPresetCopy?: (detail: any) => void;

  className?: string;
  style?: React.CSSProperties;
}

function wrapDetail(handler?: (detail: any) => void) {
  return handler ? (e: CustomEvent) => handler(e.detail) : undefined;
}

/**
 * React component wrapping the <phz-filter-designer> Web Component.
 * Forward ref exposes the FilterDesignerApi for imperative operations.
 */
export const PhzFilterDesigner = forwardRef<FilterDesignerApi, PhzFilterDesignerProps>(
  function PhzFilterDesigner(props, ref) {
    const elementRef = useRef<InstanceType<typeof PhzFilterDesignerElement> | null>(null);

    // Expose FilterDesignerApi via ref
    useImperativeHandle(ref, () => ({
      getDefinitions(): any[] {
        const el = elementRef.current as any;
        return el?.definitions ?? [];
      },
      getRules(): any[] {
        const el = elementRef.current as any;
        return el?.rules ?? [];
      },
    }));

    const litProps: Record<string, unknown> = {
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
      if (litProps[key] === undefined) delete litProps[key];
    }

    return createElement(PhzFilterDesignerLit as any, litProps);
  },
);
