/**
 * W.1 + W.4 — LocalDataStore
 *
 * Session management with OPFS persistence, auto-save,
 * resume prompt, table registration, and export/import manifest.
 */

// ========================================================================
// Table Info
// ========================================================================

export interface TableInfo {
  tableName: string;
  rowCount: number;
  sourceFile: string;
}

// ========================================================================
// Session Meta
// ========================================================================

export interface SessionMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  tables: TableInfo[];
}

let _idCounter = 0;

export function createSessionMeta(options: { name: string }): SessionMeta {
  const now = Date.now();
  return {
    id: `session-${now}-${++_idCounter}`,
    name: options.name,
    createdAt: now,
    updatedAt: now,
    tables: [],
  };
}

// ========================================================================
// Table Registration
// ========================================================================

export function registerTable(session: SessionMeta, table: TableInfo): SessionMeta {
  return {
    ...session,
    tables: [...session.tables, table],
    updatedAt: Date.now(),
  };
}

// ========================================================================
// Session List
// ========================================================================

export interface SessionList {
  sessions: SessionMeta[];
}

export function createSessionList(): SessionList {
  return { sessions: [] };
}

export function addSession(list: SessionList, session: SessionMeta): SessionList {
  return { sessions: [...list.sessions, session] };
}

export function removeSession(list: SessionList, sessionId: string): SessionList {
  return { sessions: list.sessions.filter(s => s.id !== sessionId) };
}

export function updateSession(
  list: SessionList,
  sessionId: string,
  updates: Partial<Pick<SessionMeta, 'name'>>,
): SessionList {
  return {
    sessions: list.sessions.map(s =>
      s.id === sessionId ? { ...s, ...updates, updatedAt: Date.now() } : s,
    ),
  };
}

// ========================================================================
// Auto-Save Config
// ========================================================================

export const DEFAULT_AUTO_SAVE_CONFIG = {
  intervalMs: 30000,
  enabled: true,
} as const;

// ========================================================================
// Resume Prompt
// ========================================================================

export interface ResumePrompt {
  hasRecent: boolean;
  sessions: SessionMeta[];
}

export function getResumePrompt(list: SessionList): ResumePrompt {
  if (list.sessions.length === 0) {
    return { hasRecent: false, sessions: [] };
  }
  const sorted = [...list.sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  return { hasRecent: true, sessions: sorted };
}

// ========================================================================
// Export Manifest
// ========================================================================

export interface ExportManifest {
  version: number;
  sessionName: string;
  tables: TableInfo[];
  credentials?: undefined;
}

export function createExportManifest(session: SessionMeta): ExportManifest {
  return {
    version: 1,
    sessionName: session.name,
    tables: [...session.tables],
  };
}

// ========================================================================
// Import Validation
// ========================================================================

export interface ImportValidation {
  valid: boolean;
  errors?: string[];
}

export function validateImportManifest(data: unknown): ImportValidation {
  if (data == null || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid manifest data'] };
  }
  const obj = data as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof obj.version !== 'number') errors.push('Missing or invalid version');
  if (typeof obj.sessionName !== 'string') errors.push('Missing sessionName');

  return errors.length === 0
    ? { valid: true }
    : { valid: false, errors };
}
