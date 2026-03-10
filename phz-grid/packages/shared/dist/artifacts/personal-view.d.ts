/**
 * @phozart/phz-shared — PersonalView (A-1.04)
 *
 * User personal views that override specific presentation settings
 * on top of admin-defined defaults.
 *
 * Extracted from workspace/navigation/default-presentation.ts.
 */
import type { DefaultPresentation } from './default-presentation.js';
export interface PersonalView {
    id: string;
    userId: string;
    artifactId: string;
    presentation: Partial<DefaultPresentation>;
    filterValues: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}
export declare function createPersonalView(input: {
    userId: string;
    artifactId: string;
    presentation: Partial<DefaultPresentation>;
    filterValues?: Record<string, unknown>;
}): PersonalView;
export declare function applyPersonalView(adminDefaults: DefaultPresentation, personalView: PersonalView | undefined): {
    presentation: DefaultPresentation;
    filterValues: Record<string, unknown>;
};
//# sourceMappingURL=personal-view.d.ts.map