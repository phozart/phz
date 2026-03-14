/**
 * @phozart/react — PhzSelectionCriteria React Component
 *
 * Wraps the <phz-selection-criteria> Web Component for React using @lit/react.
 * Provides a filter bar + drawer UI with presets, tree selects, date ranges, etc.
 */
import React from 'react';
import type { CriteriaConfig, SelectionContext, SelectionPreset } from '@phozart/core';
/** Imperative API exposed via ref on the PhzSelectionCriteria component. */
export interface CriteriaApi {
    /** Returns the current selection context (field values). */
    getContext(): SelectionContext;
    /** Sets the selection context (field values). */
    setContext(ctx: SelectionContext): void;
    /** Triggers apply (validates + dispatches criteria-apply). */
    apply(): void;
    /** Resets all fields to defaults. */
    reset(): void;
    /** Opens the filter drawer programmatically. */
    openDrawer(): void;
    /** Closes the filter drawer programmatically. */
    closeDrawer(): void;
}
export interface PhzSelectionCriteriaProps {
    config: CriteriaConfig;
    data?: Record<string, unknown>[];
    presets?: SelectionPreset[];
    initialState?: SelectionContext;
    dataSources?: Record<string, any>;
    registryMode?: boolean;
    filterRegistry?: any;
    filterBindings?: any;
    filterStateManager?: any;
    filterRuleEngine?: any;
    criteriaOutputManager?: any;
    artefactId?: string;
    resolvedFields?: any[];
    onCriteriaChange?: (detail: any) => void;
    onCriteriaApply?: (detail: any) => void;
    onCriteriaReset?: (detail: any) => void;
    onPinChange?: (detail: {
        pinned: boolean;
        width: number;
    }) => void;
    className?: string;
    style?: React.CSSProperties;
}
/**
 * React component wrapping the <phz-selection-criteria> Web Component.
 * Forward ref exposes the CriteriaApi for imperative operations.
 */
export declare const PhzSelectionCriteria: React.ForwardRefExoticComponent<PhzSelectionCriteriaProps & React.RefAttributes<CriteriaApi>>;
//# sourceMappingURL=phz-selection-criteria.d.ts.map