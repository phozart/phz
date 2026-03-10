import { useState, useCallback } from 'react';
/**
 * Hook for imperative control of a PhzGridAdmin component.
 *
 * @param adminRef - Ref to the PhzGridAdmin component (GridAdminApi).
 */
export function useGridAdmin(adminRef) {
    const [settings, setSettingsState] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const getSettings = useCallback(() => {
        const api = adminRef.current;
        if (!api)
            return null;
        const s = api.getSettings();
        setSettingsState(s);
        return s;
    }, [adminRef]);
    const setSettings = useCallback((presentation) => {
        const api = adminRef.current;
        if (!api)
            return;
        api.setSettings(presentation);
        setSettingsState(presentation);
    }, [adminRef]);
    const open = useCallback(() => {
        const api = adminRef.current;
        if (!api)
            return;
        api.open();
        setIsOpen(true);
    }, [adminRef]);
    const close = useCallback(() => {
        const api = adminRef.current;
        if (!api)
            return;
        api.close();
        setIsOpen(false);
    }, [adminRef]);
    return { settings, isOpen, getSettings, setSettings, open, close };
}
//# sourceMappingURL=use-grid-admin.js.map