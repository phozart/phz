/**
 * @phozart/collab — Collaboration Session Implementation
 *
 * Real-time collaboration using Yjs CRDTs. Manages presence,
 * change tracking, conflict resolution, and Yjs document mapping.
 */
import type { CollabConfig, CollabSession, YDoc, YGridDocument } from './types.js';
export declare function createCollabSession(config: CollabConfig): CollabSession;
export declare function getYGridDocument(doc: YDoc): YGridDocument;
//# sourceMappingURL=collab-session.d.ts.map