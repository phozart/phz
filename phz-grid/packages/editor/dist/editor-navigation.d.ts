/**
 * @phozart/phz-editor — Editor Navigation (B-2.02)
 *
 * Route/screen management utilities for the editor shell.
 * Maps URL-like paths to EditorScreen values, builds navigation
 * breadcrumbs, and manages deep linking.
 */
import type { EditorScreen, NavigationEntry } from './editor-state.js';
export interface EditorRoute {
    screen: EditorScreen;
    artifactId?: string;
    artifactType?: string;
    params?: Record<string, string>;
}
/**
 * Parse a URL path into an EditorRoute.
 * Returns null if the path does not match any known editor route.
 */
export declare function parseRoute(path: string): EditorRoute | null;
/**
 * Build a URL path for a given route.
 */
export declare function buildRoutePath(route: EditorRoute): string;
export interface Breadcrumb {
    label: string;
    screen: EditorScreen;
    artifactId?: string;
    active: boolean;
}
/**
 * Build breadcrumb trail from navigation history up to the current index.
 * The last breadcrumb is marked as active.
 */
export declare function buildBreadcrumbs(history: NavigationEntry[], historyIndex: number, artifactNames?: Map<string, string>): Breadcrumb[];
/**
 * Get the display label for an EditorScreen.
 */
export declare function getScreenLabel(screen: EditorScreen): string;
/**
 * Build a deep link URL for the editor.
 *
 * @param baseUrl - Application base URL (no trailing slash).
 * @param screen - The target editor screen.
 * @param artifactId - Optional artifact ID.
 * @param params - Optional query parameters.
 */
export declare function buildEditorDeepLink(baseUrl: string, screen: EditorScreen, artifactId?: string, params?: Record<string, string>): string;
//# sourceMappingURL=editor-navigation.d.ts.map