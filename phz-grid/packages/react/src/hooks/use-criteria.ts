import { useState, useCallback, type RefObject } from 'react';
import type { SelectionContext } from '@phozart/phz-core';
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
export function useCriteria(criteriaRef: RefObject<CriteriaApi | null>): CriteriaHookResult {
  const [context, setContextState] = useState<SelectionContext | null>(null);

  const getContext = useCallback((): SelectionContext | null => {
    const api = criteriaRef.current;
    if (!api) return null;
    const ctx = api.getContext();
    setContextState(ctx);
    return ctx;
  }, [criteriaRef]);

  const setContext = useCallback(
    (ctx: SelectionContext) => {
      const api = criteriaRef.current;
      if (!api) return;
      api.setContext(ctx);
      setContextState(ctx);
    },
    [criteriaRef],
  );

  const apply = useCallback(() => {
    criteriaRef.current?.apply();
  }, [criteriaRef]);

  const reset = useCallback(() => {
    criteriaRef.current?.reset();
  }, [criteriaRef]);

  const openDrawer = useCallback(() => {
    criteriaRef.current?.openDrawer();
  }, [criteriaRef]);

  const closeDrawer = useCallback(() => {
    criteriaRef.current?.closeDrawer();
  }, [criteriaRef]);

  return { context, getContext, setContext, apply, reset, openDrawer, closeDrawer };
}
