/**
 * W.7 — Cross-Tier Session Compatibility
 *
 * Shared format for session export/import between browser (OPFS)
 * and phz-local server. ZIP round-trip support.
 */

import type { TableInfo } from './local-data-store.js';

// ========================================================================
// Version
// ========================================================================

export const SESSION_FORMAT_VERSION = 1;

// ========================================================================
// Export Bundle
// ========================================================================

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

export function createExportBundle(input: ExportBundleInput): ExportBundle {
  return {
    version: SESSION_FORMAT_VERSION,
    sessionName: input.sessionName,
    tables: [...input.tables],
    exportedAt: Date.now(),
    source: input.source,
  };
}

// ========================================================================
// Validation
// ========================================================================

export interface BundleValidation {
  valid: boolean;
  errors: string[];
}

export function validateExportBundle(data: unknown): BundleValidation {
  if (data == null || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid bundle data'] };
  }
  const obj = data as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof obj.version !== 'number') {
    errors.push('Missing or invalid version');
  } else if (obj.version > SESSION_FORMAT_VERSION) {
    errors.push(`Unsupported version: ${obj.version}. Max supported: ${SESSION_FORMAT_VERSION}`);
  }

  if (typeof obj.sessionName !== 'string') {
    errors.push('Missing sessionName');
  }

  return errors.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, errors };
}

// ========================================================================
// Source Detection
// ========================================================================

export function isLocalServerBundle(data: unknown): boolean {
  if (data == null || typeof data !== 'object') return false;
  return (data as Record<string, unknown>).source === 'phz-local';
}

// ========================================================================
// Import Conversion
// ========================================================================

export interface ImportBundle {
  sessionName: string;
  tables: TableInfo[];
  version: number;
  exportedAt: number;
}

export function convertBundleForImport(bundle: ExportBundle): ImportBundle {
  return {
    version: bundle.version,
    sessionName: bundle.sessionName,
    tables: [...bundle.tables],
    exportedAt: bundle.exportedAt,
  };
}
