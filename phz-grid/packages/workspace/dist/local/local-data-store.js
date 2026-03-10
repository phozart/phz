/**
 * W.1 + W.4 — LocalDataStore
 *
 * Session management with OPFS persistence, auto-save,
 * resume prompt, table registration, and export/import manifest.
 */
let _idCounter = 0;
export function createSessionMeta(options) {
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
export function registerTable(session, table) {
    return {
        ...session,
        tables: [...session.tables, table],
        updatedAt: Date.now(),
    };
}
export function createSessionList() {
    return { sessions: [] };
}
export function addSession(list, session) {
    return { sessions: [...list.sessions, session] };
}
export function removeSession(list, sessionId) {
    return { sessions: list.sessions.filter(s => s.id !== sessionId) };
}
export function updateSession(list, sessionId, updates) {
    return {
        sessions: list.sessions.map(s => s.id === sessionId ? { ...s, ...updates, updatedAt: Date.now() } : s),
    };
}
// ========================================================================
// Auto-Save Config
// ========================================================================
export const DEFAULT_AUTO_SAVE_CONFIG = {
    intervalMs: 30000,
    enabled: true,
};
export function getResumePrompt(list) {
    if (list.sessions.length === 0) {
        return { hasRecent: false, sessions: [] };
    }
    const sorted = [...list.sessions].sort((a, b) => b.updatedAt - a.updatedAt);
    return { hasRecent: true, sessions: sorted };
}
export function createExportManifest(session) {
    return {
        version: 1,
        sessionName: session.name,
        tables: [...session.tables],
    };
}
export function validateImportManifest(data) {
    if (data == null || typeof data !== 'object') {
        return { valid: false, errors: ['Invalid manifest data'] };
    }
    const obj = data;
    const errors = [];
    if (typeof obj.version !== 'number')
        errors.push('Missing or invalid version');
    if (typeof obj.sessionName !== 'string')
        errors.push('Missing sessionName');
    return errors.length === 0
        ? { valid: true }
        : { valid: false, errors };
}
//# sourceMappingURL=local-data-store.js.map