import { useState, useCallback } from 'react';
/**
 * Hook for imperative control of a PhzSelectionCriteria component.
 *
 * @param criteriaRef - Ref to the PhzSelectionCriteria component (CriteriaApi).
 */
export function useCriteria(criteriaRef) {
    const [context, setContextState] = useState(null);
    const getContext = useCallback(() => {
        const api = criteriaRef.current;
        if (!api)
            return null;
        const ctx = api.getContext();
        setContextState(ctx);
        return ctx;
    }, [criteriaRef]);
    const setContext = useCallback((ctx) => {
        const api = criteriaRef.current;
        if (!api)
            return;
        api.setContext(ctx);
        setContextState(ctx);
    }, [criteriaRef]);
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
//# sourceMappingURL=use-criteria.js.map