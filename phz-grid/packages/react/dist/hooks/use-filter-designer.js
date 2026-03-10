import { useState, useCallback } from 'react';
/**
 * Hook for imperative control of a PhzFilterDesigner component.
 *
 * @param designerRef - Ref to the PhzFilterDesigner component (FilterDesignerApi).
 */
export function useFilterDesigner(designerRef) {
    const [definitions, setDefinitions] = useState(null);
    const [rules, setRules] = useState(null);
    const getDefinitions = useCallback(() => {
        const api = designerRef.current;
        if (!api)
            return null;
        const defs = api.getDefinitions();
        setDefinitions(defs);
        return defs;
    }, [designerRef]);
    const getRules = useCallback(() => {
        const api = designerRef.current;
        if (!api)
            return null;
        const r = api.getRules();
        setRules(r);
        return r;
    }, [designerRef]);
    return { definitions, rules, getDefinitions, getRules };
}
//# sourceMappingURL=use-filter-designer.js.map