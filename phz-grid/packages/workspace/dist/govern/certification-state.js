/**
 * @phozart/phz-workspace — Govern > Certification State (WE-9)
 *
 * Pure functions for artifact endorsement/certification badges.
 * Endorsement levels: none < verified < certified < promoted.
 */
// ========================================================================
// Level ordering
// ========================================================================
const LEVEL_ORDER = {
    none: 0,
    verified: 1,
    certified: 2,
    promoted: 3,
};
// ========================================================================
// Factory
// ========================================================================
export function initialCertificationState() {
    return { endorsements: {} };
}
// ========================================================================
// Direct endorsement actions
// ========================================================================
function applyEndorsement(state, artifactId, level, endorsedBy, note) {
    return {
        ...state,
        endorsements: {
            ...state.endorsements,
            [artifactId]: {
                level,
                endorsedBy,
                endorsedAt: Date.now(),
                endorsementNote: note,
            },
        },
    };
}
export function verifyArtifact(state, artifactId, endorsedBy, note) {
    return applyEndorsement(state, artifactId, 'verified', endorsedBy, note);
}
export function certifyArtifact(state, artifactId, endorsedBy, note) {
    return applyEndorsement(state, artifactId, 'certified', endorsedBy, note);
}
export function promoteArtifact(state, artifactId, endorsedBy, note) {
    return applyEndorsement(state, artifactId, 'promoted', endorsedBy, note);
}
export function revokeEndorsement(state, artifactId) {
    return {
        ...state,
        endorsements: {
            ...state.endorsements,
            [artifactId]: { level: 'none' },
        },
    };
}
// ========================================================================
// Pending action flow
// ========================================================================
export function startEndorsementAction(state, artifactId, action) {
    return { ...state, pendingAction: { artifactId, action } };
}
export function commitEndorsementAction(state, endorsedBy, note) {
    if (!state.pendingAction)
        return state;
    const { artifactId, action } = state.pendingAction;
    let next;
    switch (action) {
        case 'verify':
            next = verifyArtifact(state, artifactId, endorsedBy, note);
            break;
        case 'certify':
            next = certifyArtifact(state, artifactId, endorsedBy, note);
            break;
        case 'promote':
            next = promoteArtifact(state, artifactId, endorsedBy, note);
            break;
        case 'revoke':
            next = revokeEndorsement(state, artifactId);
            break;
    }
    return { ...next, pendingAction: undefined };
}
export function cancelEndorsementAction(state) {
    return { ...state, pendingAction: undefined };
}
// ========================================================================
// Sort & filter
// ========================================================================
function getLevel(endorsements, id) {
    return LEVEL_ORDER[endorsements[id]?.level ?? 'none'];
}
export function sortByEndorsement(artifacts, endorsements) {
    return [...artifacts].sort((a, b) => getLevel(endorsements, b.id) - getLevel(endorsements, a.id));
}
export function filterByEndorsement(artifacts, endorsements, minLevel) {
    const min = LEVEL_ORDER[minLevel];
    return artifacts.filter(a => getLevel(endorsements, a.id) >= min);
}
const BADGES = {
    none: { icon: '', color: '', label: '' },
    verified: { icon: 'checkmark', color: 'blue', label: 'Verified' },
    certified: { icon: 'shield', color: 'green', label: 'Certified' },
    promoted: { icon: 'star', color: 'gold', label: 'Promoted' },
};
export function getEndorsementBadge(level) {
    return BADGES[level];
}
//# sourceMappingURL=certification-state.js.map