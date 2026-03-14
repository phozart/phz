import { type RefObject } from 'react';
import type { SelectionContext } from '@phozart/core';
import type { CriteriaApi } from '../phz-selection-criteria.js';
export interface CriteriaHookResult {
    /** Current selection context (updated when user calls getContext). */
    context: SelectionContext | null;
    /** Imperative: get current selection context. */
    getContext: () => SelectionContext | null;
    /** Imperative: set selection context. */
    setContext: (ctx: SelectionContext) => void;
    /** Imperative: trigger apply (validate + dispatch). */
    apply: () => void;
    /** Imperative: reset all fields to defaults. */
    reset: () => void;
    /** Imperative: open the filter drawer. */
    openDrawer: () => void;
    /** Imperative: close the filter drawer. */
    closeDrawer: () => void;
}
/**
 * Hook for imperative control of a PhzSelectionCriteria component.
 *
 * @param criteriaRef - Ref to the PhzSelectionCriteria component (CriteriaApi).
 */
export declare function useCriteria(criteriaRef: RefObject<CriteriaApi | null>): CriteriaHookResult;
//# sourceMappingURL=use-criteria.d.ts.map