/**
 * @phozart/phz-shared — PersonalView (A-1.04)
 *
 * User personal views that override specific presentation settings
 * on top of admin-defined defaults.
 *
 * Extracted from workspace/navigation/default-presentation.ts.
 */
import { mergePresentation } from './default-presentation.js';
let counter = 0;
function generateId() {
    return `pv_${Date.now()}_${++counter}`;
}
export function createPersonalView(input) {
    const now = Date.now();
    return {
        id: generateId(),
        userId: input.userId,
        artifactId: input.artifactId,
        presentation: { ...input.presentation },
        filterValues: input.filterValues ? { ...input.filterValues } : {},
        createdAt: now,
        updatedAt: now,
    };
}
// ========================================================================
// Apply personal view over admin defaults
// ========================================================================
export function applyPersonalView(adminDefaults, personalView) {
    if (!personalView) {
        return { presentation: adminDefaults, filterValues: {} };
    }
    return {
        presentation: mergePresentation(adminDefaults, personalView.presentation),
        filterValues: { ...personalView.filterValues },
    };
}
//# sourceMappingURL=personal-view.js.map