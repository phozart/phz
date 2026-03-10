/**
 * W.7 — Cross-Tier Session Compatibility
 *
 * Shared format for session export/import between browser (OPFS)
 * and phz-local server. ZIP round-trip support.
 */
import type { TableInfo } from './local-data-store.js';
export declare const SESSION_FORMAT_VERSION = 1;
export interface ExportBundle {
    version: number;
    sessionName: string;
    tables: TableInfo[];
    exportedAt: number;
    source?: 'browser' | 'phz-local';
    serverConfig?: Record<string, unknown>;
}
export interface ExportBundleInput {
    sessionName: string;
    tables: TableInfo[];
    source?: 'browser' | 'phz-local';
}
export declare function createExportBundle(input: ExportBundleInput): ExportBundle;
export interface BundleValidation {
    valid: boolean;
    errors: string[];
}
export declare function validateExportBundle(data: unknown): BundleValidation;
export declare function isLocalServerBundle(data: unknown): boolean;
export interface ImportBundle {
    sessionName: string;
    tables: TableInfo[];
    version: number;
    exportedAt: number;
}
export declare function convertBundleForImport(bundle: ExportBundle): ImportBundle;
//# sourceMappingURL=session-compat.d.ts.map