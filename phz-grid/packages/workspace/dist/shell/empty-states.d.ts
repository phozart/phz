/**
 * @phozart/workspace — Empty States (L.14)
 *
 * Standardized empty state content for workspace panels.
 * Each state provides a title, message, icon, and primary action CTA.
 */
export interface EmptyStateConfig {
    title: string;
    message: string;
    icon: string;
    actionLabel: string;
    actionId: string;
    secondaryActionLabel?: string;
    secondaryActionId?: string;
}
export declare const EMPTY_STATES: Record<string, EmptyStateConfig>;
export declare function getEmptyState(key: string): EmptyStateConfig | undefined;
//# sourceMappingURL=empty-states.d.ts.map