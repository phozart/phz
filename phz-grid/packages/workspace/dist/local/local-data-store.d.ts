/**
 * W.1 + W.4 — LocalDataStore
 *
 * Session management with OPFS persistence, auto-save,
 * resume prompt, table registration, and export/import manifest.
 */
export interface TableInfo {
    tableName: string;
    rowCount: number;
    sourceFile: string;
}
export interface SessionMeta {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    tables: TableInfo[];
}
export declare function createSessionMeta(options: {
    name: string;
}): SessionMeta;
export declare function registerTable(session: SessionMeta, table: TableInfo): SessionMeta;
export interface SessionList {
    sessions: SessionMeta[];
}
export declare function createSessionList(): SessionList;
export declare function addSession(list: SessionList, session: SessionMeta): SessionList;
export declare function removeSession(list: SessionList, sessionId: string): SessionList;
export declare function updateSession(list: SessionList, sessionId: string, updates: Partial<Pick<SessionMeta, 'name'>>): SessionList;
export declare const DEFAULT_AUTO_SAVE_CONFIG: {
    readonly intervalMs: 30000;
    readonly enabled: true;
};
export interface ResumePrompt {
    hasRecent: boolean;
    sessions: SessionMeta[];
}
export declare function getResumePrompt(list: SessionList): ResumePrompt;
export interface ExportManifest {
    version: number;
    sessionName: string;
    tables: TableInfo[];
    credentials?: undefined;
}
export declare function createExportManifest(session: SessionMeta): ExportManifest;
export interface ImportValidation {
    valid: boolean;
    errors?: string[];
}
export declare function validateImportManifest(data: unknown): ImportValidation;
//# sourceMappingURL=local-data-store.d.ts.map