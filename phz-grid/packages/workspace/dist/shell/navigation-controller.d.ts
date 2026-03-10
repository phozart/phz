/**
 * @phozart/phz-workspace — Navigation Controller (L.3)
 *
 * Pure functions for workspace navigation state management.
 * Coordinates panel navigation with breadcrumb history.
 */
import { type NavigationStack, type NavItem } from './shell-utils.js';
export interface NavigationTarget {
    panelId: string;
    artifactId?: string;
    label?: string;
    metadata?: Record<string, unknown>;
}
export interface NavigationState {
    activePanel: string;
    breadcrumbs: NavigationStack;
    navItems: NavItem[];
}
export declare function createNavigationState(navItems: NavItem[], initialPanel?: string): NavigationState;
export declare function canNavigateTo(state: NavigationState, target: NavigationTarget): boolean;
export declare function navigateTo(state: NavigationState, target: NavigationTarget): NavigationState;
export declare function goBack(state: NavigationState): NavigationState;
export declare function goForward(state: NavigationState): NavigationState;
//# sourceMappingURL=navigation-controller.d.ts.map