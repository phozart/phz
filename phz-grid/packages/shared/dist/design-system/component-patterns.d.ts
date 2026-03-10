/**
 * Component Patterns — Helpers for form density, modals, drawers, empty states,
 * loading skeletons, status badges, and overflow prevention.
 *
 * Extracted from @phozart/phz-workspace styles (S.7).
 * Pure functions and constants only — no Lit/CSS dependencies.
 */
export interface FormDensityClasses {
    label: string;
    input: string;
    toggle: string;
}
/**
 * Get CSS class names for form elements at a given density.
 *
 * @param density - Form density mode
 * @returns Object with class names for label, input, and toggle elements
 */
export declare function getFormDensityClasses(density: 'compact' | 'default'): FormDensityClasses;
export interface ModalClasses {
    backdrop: string;
    container: string;
}
/**
 * Get CSS class names for a modal dialog.
 *
 * @param options - Modal state (open/closed)
 * @returns Object with class names for backdrop and container
 */
export declare function getModalClasses(options: {
    open: boolean;
}): ModalClasses;
export declare const DRAWER_DEFAULTS: {
    readonly width: 400;
    readonly maxWidth: 560;
};
export interface DrawerClasses {
    drawer: string;
}
/**
 * Get CSS class names for a slide-over drawer.
 *
 * @param options - Drawer state and position
 * @returns Object with the drawer class string
 */
export declare function getDrawerClasses(options: {
    open: boolean;
    position: 'left' | 'right';
}): DrawerClasses;
export interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    ctaLabel?: string;
}
/**
 * Get display properties for an empty state by its type key.
 * Falls back to a generic "Nothing here yet" if the type is unknown.
 *
 * @param stateType - Empty state type key
 * @returns Icon, title, description, and optional CTA label
 */
export declare function getEmptyStateProps(stateType: string): EmptyStateProps;
/**
 * Get CSS class for a loading skeleton placeholder.
 *
 * @param variant - Skeleton variant
 * @returns CSS class string
 */
export declare function getSkeletonClass(variant: 'text' | 'card' | 'chart' | 'table'): string;
export interface BadgeVariant {
    bgColor: string;
    textColor: string;
    label: string;
}
export declare const STATUS_BADGE_VARIANTS: Record<string, BadgeVariant>;
export interface OverflowClasses {
    truncate: string;
    minWidth: string;
    wordBreak: string;
}
/**
 * Get CSS utility class names for preventing text overflow in grid cells
 * and widget content areas.
 */
export declare function getOverflowClasses(): OverflowClasses;
//# sourceMappingURL=component-patterns.d.ts.map