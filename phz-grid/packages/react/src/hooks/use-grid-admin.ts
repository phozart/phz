import { useState, useCallback, type RefObject } from 'react';
import type { ReportPresentation } from '@phozart/engine';
import type { GridAdminApi } from '../phz-grid-admin.js';

export interface GridAdminHookResult {
  /** Current admin settings (updated when user calls getSettings). */
  settings: ReportPresentation | null;
  /** Whether the admin panel is open. */
  isOpen: boolean;
  /** Imperative: get current settings from the admin panel. */
  getSettings: () => ReportPresentation | null;
  /** Imperative: set settings on the admin panel. */
  setSettings: (presentation: ReportPresentation) => void;
  /** Imperative: open the admin panel. */
  open: () => void;
  /** Imperative: close the admin panel. */
  close: () => void;
}

/**
 * Hook for imperative control of a PhzGridAdmin component.
 *
 * @param adminRef - Ref to the PhzGridAdmin component (GridAdminApi).
 */
export function useGridAdmin(adminRef: RefObject<GridAdminApi | null>): GridAdminHookResult {
  const [settings, setSettingsState] = useState<ReportPresentation | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const getSettings = useCallback((): ReportPresentation | null => {
    const api = adminRef.current;
    if (!api) return null;
    const s = api.getSettings();
    setSettingsState(s);
    return s;
  }, [adminRef]);

  const setSettings = useCallback(
    (presentation: ReportPresentation) => {
      const api = adminRef.current;
      if (!api) return;
      api.setSettings(presentation);
      setSettingsState(presentation);
    },
    [adminRef],
  );

  const open = useCallback(() => {
    const api = adminRef.current;
    if (!api) return;
    api.open();
    setIsOpen(true);
  }, [adminRef]);

  const close = useCallback(() => {
    const api = adminRef.current;
    if (!api) return;
    api.close();
    setIsOpen(false);
  }, [adminRef]);

  return { settings, isOpen, getSettings, setSettings, open, close };
}
