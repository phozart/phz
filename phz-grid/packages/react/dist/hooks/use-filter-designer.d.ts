import { type RefObject } from 'react';
import type { FilterDesignerApi } from '../phz-filter-designer.js';
export interface FilterDesignerHookResult {
    /** Current definitions (updated when user calls getDefinitions). */
    definitions: any[] | null;
    /** Current rules (updated when user calls getRules). */
    rules: any[] | null;
    /** Imperative: get current definitions from the designer. */
    getDefinitions: () => any[] | null;
    /** Imperative: get current rules from the designer. */
    getRules: () => any[] | null;
}
/**
 * Hook for imperative control of a PhzFilterDesigner component.
 *
 * @param designerRef - Ref to the PhzFilterDesigner component (FilterDesignerApi).
 */
export declare function useFilterDesigner(designerRef: RefObject<FilterDesignerApi | null>): FilterDesignerHookResult;
//# sourceMappingURL=use-filter-designer.d.ts.map