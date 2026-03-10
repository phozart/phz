import { useState, useCallback, type RefObject } from 'react';
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
export function useFilterDesigner(designerRef: RefObject<FilterDesignerApi | null>): FilterDesignerHookResult {
  const [definitions, setDefinitions] = useState<any[] | null>(null);
  const [rules, setRules] = useState<any[] | null>(null);

  const getDefinitions = useCallback((): any[] | null => {
    const api = designerRef.current;
    if (!api) return null;
    const defs = api.getDefinitions();
    setDefinitions(defs);
    return defs;
  }, [designerRef]);

  const getRules = useCallback((): any[] | null => {
    const api = designerRef.current;
    if (!api) return null;
    const r = api.getRules();
    setRules(r);
    return r;
  }, [designerRef]);

  return { definitions, rules, getDefinitions, getRules };
}
