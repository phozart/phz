import { describe, it, expect } from 'vitest';
import { initialCertificationState, verifyArtifact, certifyArtifact, promoteArtifact, revokeEndorsement, startEndorsementAction, commitEndorsementAction, cancelEndorsementAction, sortByEndorsement, filterByEndorsement, getEndorsementBadge, } from '../certification-state.js';
function makeArtifact(id, name) {
    return {
        id,
        type: 'report',
        name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}
describe('certification-state', () => {
    // ------------------------------------------------------------------
    // Basic endorsement actions
    // ------------------------------------------------------------------
    it('verifyArtifact sets level to verified with metadata', () => {
        const state = initialCertificationState();
        const next = verifyArtifact(state, 'art-1', 'alice', 'Looks good');
        expect(next.endorsements['art-1']).toBeDefined();
        expect(next.endorsements['art-1'].level).toBe('verified');
        expect(next.endorsements['art-1'].endorsedBy).toBe('alice');
        expect(next.endorsements['art-1'].endorsementNote).toBe('Looks good');
        expect(next.endorsements['art-1'].endorsedAt).toBeGreaterThan(0);
    });
    it('certifyArtifact sets level to certified', () => {
        const state = initialCertificationState();
        const next = certifyArtifact(state, 'art-2', 'bob');
        expect(next.endorsements['art-2'].level).toBe('certified');
        expect(next.endorsements['art-2'].endorsedBy).toBe('bob');
    });
    it('promoteArtifact sets level to promoted', () => {
        const state = initialCertificationState();
        const next = promoteArtifact(state, 'art-3', 'carol', 'Top quality');
        expect(next.endorsements['art-3'].level).toBe('promoted');
        expect(next.endorsements['art-3'].endorsedBy).toBe('carol');
        expect(next.endorsements['art-3'].endorsementNote).toBe('Top quality');
    });
    it('revokeEndorsement resets level to none', () => {
        let state = initialCertificationState();
        state = certifyArtifact(state, 'art-4', 'dave');
        expect(state.endorsements['art-4'].level).toBe('certified');
        const next = revokeEndorsement(state, 'art-4');
        expect(next.endorsements['art-4'].level).toBe('none');
        expect(next.endorsements['art-4'].endorsedBy).toBeUndefined();
        expect(next.endorsements['art-4'].endorsementNote).toBeUndefined();
    });
    it('revokeEndorsement on unknown artifact is safe (no-op)', () => {
        const state = initialCertificationState();
        const next = revokeEndorsement(state, 'nonexistent');
        expect(next.endorsements['nonexistent'].level).toBe('none');
    });
    // ------------------------------------------------------------------
    // Pending action flow
    // ------------------------------------------------------------------
    it('startEndorsementAction sets pendingAction', () => {
        const state = initialCertificationState();
        const next = startEndorsementAction(state, 'art-5', 'certify');
        expect(next.pendingAction).toEqual({
            artifactId: 'art-5',
            action: 'certify',
        });
    });
    it('commitEndorsementAction applies pending action', () => {
        let state = initialCertificationState();
        state = startEndorsementAction(state, 'art-6', 'promote');
        const next = commitEndorsementAction(state, 'eve', 'Promoted for release');
        expect(next.endorsements['art-6'].level).toBe('promoted');
        expect(next.endorsements['art-6'].endorsedBy).toBe('eve');
        expect(next.endorsements['art-6'].endorsementNote).toBe('Promoted for release');
        expect(next.pendingAction).toBeUndefined();
    });
    it('commitEndorsementAction without pending returns state unchanged', () => {
        const state = initialCertificationState();
        const next = commitEndorsementAction(state, 'eve');
        expect(next).toBe(state);
    });
    it('cancelEndorsementAction clears pendingAction', () => {
        let state = initialCertificationState();
        state = startEndorsementAction(state, 'art-7', 'verify');
        const next = cancelEndorsementAction(state);
        expect(next.pendingAction).toBeUndefined();
    });
    // ------------------------------------------------------------------
    // Sort
    // ------------------------------------------------------------------
    it('sortByEndorsement orders promoted > certified > verified > none', () => {
        const a = makeArtifact('a', 'Alpha');
        const b = makeArtifact('b', 'Beta');
        const c = makeArtifact('c', 'Charlie');
        const d = makeArtifact('d', 'Delta');
        const endorsements = {
            a: { level: 'none' },
            b: { level: 'promoted', endorsedBy: 'x', endorsedAt: 1 },
            c: { level: 'verified', endorsedBy: 'y', endorsedAt: 2 },
            d: { level: 'certified', endorsedBy: 'z', endorsedAt: 3 },
        };
        const sorted = sortByEndorsement([a, b, c, d], endorsements);
        expect(sorted.map(s => s.id)).toEqual(['b', 'd', 'c', 'a']);
    });
    it('sortByEndorsement is stable (preserves order within same level)', () => {
        const a = makeArtifact('a', 'Alpha');
        const b = makeArtifact('b', 'Beta');
        const c = makeArtifact('c', 'Charlie');
        // All three have the same endorsement level (none)
        const endorsements = {};
        const sorted = sortByEndorsement([a, b, c], endorsements);
        expect(sorted.map(s => s.id)).toEqual(['a', 'b', 'c']);
    });
    // ------------------------------------------------------------------
    // Filter
    // ------------------------------------------------------------------
    it('filterByEndorsement with minLevel=certified includes certified and promoted only', () => {
        const a = makeArtifact('a', 'Alpha');
        const b = makeArtifact('b', 'Beta');
        const c = makeArtifact('c', 'Charlie');
        const d = makeArtifact('d', 'Delta');
        const endorsements = {
            a: { level: 'none' },
            b: { level: 'promoted', endorsedBy: 'x', endorsedAt: 1 },
            c: { level: 'verified', endorsedBy: 'y', endorsedAt: 2 },
            d: { level: 'certified', endorsedBy: 'z', endorsedAt: 3 },
        };
        const filtered = filterByEndorsement([a, b, c, d], endorsements, 'certified');
        expect(filtered.map(f => f.id)).toEqual(['b', 'd']);
    });
    it('filterByEndorsement with minLevel=none returns all artifacts', () => {
        const a = makeArtifact('a', 'Alpha');
        const b = makeArtifact('b', 'Beta');
        const filtered = filterByEndorsement([a, b], {}, 'none');
        expect(filtered).toHaveLength(2);
    });
    // ------------------------------------------------------------------
    // Badge
    // ------------------------------------------------------------------
    it('getEndorsementBadge returns correct icon/color/label for each level', () => {
        const none = getEndorsementBadge('none');
        expect(none.icon).toBe('');
        expect(none.label).toBe('');
        const verified = getEndorsementBadge('verified');
        expect(verified.icon).toBe('checkmark');
        expect(verified.color).toBe('blue');
        expect(verified.label).toBe('Verified');
        const certified = getEndorsementBadge('certified');
        expect(certified.icon).toBe('shield');
        expect(certified.color).toBe('green');
        expect(certified.label).toBe('Certified');
        const promoted = getEndorsementBadge('promoted');
        expect(promoted.icon).toBe('star');
        expect(promoted.color).toBe('gold');
        expect(promoted.label).toBe('Promoted');
    });
});
//# sourceMappingURL=certification-state.test.js.map