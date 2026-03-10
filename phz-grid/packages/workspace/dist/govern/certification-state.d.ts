/**
 * @phozart/phz-workspace — Govern > Certification State (WE-9)
 *
 * Pure functions for artifact endorsement/certification badges.
 * Endorsement levels: none < verified < certified < promoted.
 */
import type { ArtifactMeta } from '../types.js';
export interface ArtifactEndorsement {
    level: 'none' | 'verified' | 'certified' | 'promoted';
    endorsedBy?: string;
    endorsedAt?: number;
    endorsementNote?: string;
    expiresAt?: number;
}
export type EndorsementAction = 'verify' | 'certify' | 'promote' | 'revoke';
export interface CertificationState {
    endorsements: Record<string, ArtifactEndorsement>;
    pendingAction?: {
        artifactId: string;
        action: EndorsementAction;
        note?: string;
    };
}
export declare function initialCertificationState(): CertificationState;
export declare function verifyArtifact(state: CertificationState, artifactId: string, endorsedBy: string, note?: string): CertificationState;
export declare function certifyArtifact(state: CertificationState, artifactId: string, endorsedBy: string, note?: string): CertificationState;
export declare function promoteArtifact(state: CertificationState, artifactId: string, endorsedBy: string, note?: string): CertificationState;
export declare function revokeEndorsement(state: CertificationState, artifactId: string): CertificationState;
export declare function startEndorsementAction(state: CertificationState, artifactId: string, action: EndorsementAction): CertificationState;
export declare function commitEndorsementAction(state: CertificationState, endorsedBy: string, note?: string): CertificationState;
export declare function cancelEndorsementAction(state: CertificationState): CertificationState;
export declare function sortByEndorsement(artifacts: ArtifactMeta[], endorsements: Record<string, ArtifactEndorsement>): ArtifactMeta[];
export declare function filterByEndorsement(artifacts: ArtifactMeta[], endorsements: Record<string, ArtifactEndorsement>, minLevel: ArtifactEndorsement['level']): ArtifactMeta[];
export interface EndorsementBadge {
    icon: string;
    color: string;
    label: string;
}
export declare function getEndorsementBadge(level: ArtifactEndorsement['level']): EndorsementBadge;
//# sourceMappingURL=certification-state.d.ts.map