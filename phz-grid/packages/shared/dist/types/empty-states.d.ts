/**
 * Empty State Configuration
 *
 * Types and helpers for rendering user-friendly empty states across the grid,
 * dashboard widgets, and workspace shell. Each EmptyScenario maps to a
 * pre-configured title, description, icon, and optional call-to-action.
 */
/**
 * Union of all recognized empty state scenarios.
 *
 * - `no-data`: data source is connected but contains no rows
 * - `no-results`: filters/search yielded zero matches
 * - `no-access`: user is authenticated but lacks access to any items
 * - `not-configured`: widget or component needs initial setup
 * - `loading-failed`: data load attempt failed (distinct from error states)
 * - `first-time`: brand-new user, onboarding prompt
 * - `no-selection`: multi-select or detail panel with nothing selected
 * - `empty-dashboard`: dashboard exists but has no widgets placed
 * - `no-favorites`: user has not favorited/starred any artifacts
 */
export type EmptyScenario = 'no-data' | 'no-results' | 'no-access' | 'not-configured' | 'loading-failed' | 'first-time' | 'no-selection' | 'empty-dashboard' | 'no-favorites';
export interface EmptyStateConfig {
    /** The scenario this config applies to */
    scenario: EmptyScenario;
    /** Icon name (from the shared icon system) or Unicode fallback */
    icon: string;
    /** Short title */
    title: string;
    /** Longer descriptive message */
    description: string;
    /** Label for the primary call-to-action button (if any) */
    actionLabel?: string;
    /** Action identifier dispatched when the user clicks the CTA */
    actionId?: string;
}
/** @deprecated Use EmptyScenario instead */
export type EmptyStateReason = 'no-data' | 'no-results' | 'no-access' | 'not-configured' | 'loading-failed' | 'first-time';
/** @deprecated Use EmptyStateConfig instead */
export interface EmptyState {
    reason: EmptyStateReason;
    title: string;
    message: string;
    icon?: string;
    actionLabel?: string;
    actionTarget?: string;
}
/** @deprecated Use createDefaultEmptyStateConfig instead */
export declare function createEmptyState(reason: EmptyStateReason, title: string, message: string): EmptyState;
/** @deprecated Use createDefaultEmptyStateConfig instead */
export declare const DEFAULT_EMPTY_STATES: Record<EmptyStateReason, EmptyState>;
/**
 * Create a default EmptyStateConfig for a given scenario.
 * Returns a fresh copy so callers can safely mutate it.
 *
 * @param scenario - The empty state scenario (defaults to 'no-data')
 * @returns A new EmptyStateConfig object
 */
export declare function createDefaultEmptyStateConfig(scenario?: EmptyScenario): EmptyStateConfig;
//# sourceMappingURL=empty-states.d.ts.map