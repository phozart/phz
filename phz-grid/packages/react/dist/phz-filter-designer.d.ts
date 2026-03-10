/**
 * @phozart/phz-react — PhzFilterDesigner React Component
 *
 * Wraps the <phz-filter-designer> Web Component for React using @lit/react.
 * Provides admin UI for managing filter definitions, rules, and presets.
 */
import React from 'react';
/** Imperative API exposed via ref on the PhzFilterDesigner component. */
export interface FilterDesignerApi {
    /** Returns current filter definitions from the designer. */
    getDefinitions(): any[];
    /** Returns current filter rules from the designer. */
    getRules(): any[];
}
export interface PhzFilterDesignerProps {
    definitions: any[];
    rules?: any[];
    sharedPresets?: any[];
    userPresets?: any[];
    availableColumns?: string[];
    data?: Record<string, unknown>[];
    rulePreviewResults?: Record<string, {
        before: number;
        after: number;
    }>;
    dataSources?: any[];
    filterPresets?: any[];
    onDefinitionCreate?: (detail: any) => void;
    onDefinitionUpdate?: (detail: any) => void;
    onDefinitionDeprecate?: (detail: any) => void;
    onDefinitionRestore?: (detail: any) => void;
    onDefinitionDuplicate?: (detail: any) => void;
    onRuleAdd?: (detail: any) => void;
    onRuleRemove?: (detail: any) => void;
    onRuleToggle?: (detail: any) => void;
    onRuleUpdate?: (detail: any) => void;
    onPresetCreate?: (detail: any) => void;
    onPresetUpdate?: (detail: any) => void;
    onPresetDelete?: (detail: any) => void;
    onFilterPresetCreate?: (detail: any) => void;
    onFilterPresetUpdate?: (detail: any) => void;
    onFilterPresetDelete?: (detail: any) => void;
    onFilterPresetCopy?: (detail: any) => void;
    className?: string;
    style?: React.CSSProperties;
}
/**
 * React component wrapping the <phz-filter-designer> Web Component.
 * Forward ref exposes the FilterDesignerApi for imperative operations.
 */
export declare const PhzFilterDesigner: React.ForwardRefExoticComponent<PhzFilterDesignerProps & React.RefAttributes<FilterDesignerApi>>;
//# sourceMappingURL=phz-filter-designer.d.ts.map