import { type RefObject } from 'react';
import type { ReportPresentation } from '@phozart/phz-engine';
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
export declare function useGridAdmin(adminRef: RefObject<GridAdminApi | null>): GridAdminHookResult;
//# sourceMappingURL=use-grid-admin.d.ts.map