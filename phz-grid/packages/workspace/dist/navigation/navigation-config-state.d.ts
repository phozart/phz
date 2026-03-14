/**
 * @phozart/workspace — Navigation Config State (B-3.14)
 *
 * Pure functions for NavigationLink configuration UI.
 * Supports auto-mapping suggestions, circular navigation detection,
 * and link testing/preview.
 */
import type { ArtifactMeta, ArtifactType } from '../types.js';
import type { NavigationFilterMapping } from './navigation-link.js';
export interface NavigationLinkConfig {
    id: string;
    sourceArtifactId: string;
    targetArtifactId: string;
    targetArtifactType: ArtifactType;
    label: string;
    description?: string;
    filterMappings: NavigationFilterMapping[];
    openBehavior: 'same-panel' | 'new-tab' | 'modal' | 'slide-over';
    triggerType: 'click' | 'double-click' | 'context-menu' | 'button' | 'link' | 'drill';
}
export interface AutoMappingSuggestion {
    sourceField: string;
    targetFilterId: string;
    targetFilterLabel: string;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
}
export interface LinkTestResult {
    linkId: string;
    reachable: boolean;
    circularDetected: boolean;
    filterMappingsValid: boolean;
    errors: string[];
}
export interface NavigationConfigState {
    links: NavigationLinkConfig[];
    selectedLinkId?: string;
    editingLink?: NavigationLinkConfig;
    artifacts: ArtifactMeta[];
    autoMappingSuggestions: AutoMappingSuggestion[];
    testResults: Map<string, LinkTestResult>;
    search: string;
}
export declare function initialNavigationConfigState(artifacts?: ArtifactMeta[]): NavigationConfigState;
export declare function setNavSearch(state: NavigationConfigState, search: string): NavigationConfigState;
export declare function getFilteredLinks(state: NavigationConfigState): NavigationLinkConfig[];
export declare function createLink(state: NavigationConfigState, sourceArtifactId: string, targetArtifactId: string, targetArtifactType: ArtifactType, label: string): NavigationConfigState;
export declare function updateLink(state: NavigationConfigState, link: NavigationLinkConfig): NavigationConfigState;
export declare function deleteLink(state: NavigationConfigState, linkId: string): NavigationConfigState;
export declare function selectLink(state: NavigationConfigState, linkId: string): NavigationConfigState;
export declare function clearLinkSelection(state: NavigationConfigState): NavigationConfigState;
export declare function setEditingTarget(state: NavigationConfigState, targetArtifactId: string, targetArtifactType: ArtifactType): NavigationConfigState;
export declare function setEditingLabel(state: NavigationConfigState, label: string): NavigationConfigState;
export declare function setEditingOpenBehavior(state: NavigationConfigState, openBehavior: NavigationLinkConfig['openBehavior']): NavigationConfigState;
export declare function setEditingTriggerType(state: NavigationConfigState, triggerType: NavigationLinkConfig['triggerType']): NavigationConfigState;
export declare function addEditingFilterMapping(state: NavigationConfigState, mapping: NavigationFilterMapping): NavigationConfigState;
export declare function removeEditingFilterMapping(state: NavigationConfigState, index: number): NavigationConfigState;
export declare function generateAutoMappingSuggestions(sourceFields: string[], targetFields: Array<{
    id: string;
    label: string;
    field: string;
}>): AutoMappingSuggestion[];
export declare function applySuggestions(state: NavigationConfigState, suggestions: AutoMappingSuggestion[]): NavigationConfigState;
export declare function checkCircularNavigation(links: NavigationLinkConfig[]): string[][];
export declare function testLink(state: NavigationConfigState, linkId: string): NavigationConfigState;
export declare function testAllLinks(state: NavigationConfigState): NavigationConfigState;
export interface NavigationConfigValidation {
    valid: boolean;
    errors: string[];
}
export declare function validateNavigationConfig(state: NavigationConfigState): NavigationConfigValidation;
/**
 * Reset the link counter. Exposed only for testing determinism.
 * @internal
 */
export declare function _resetLinkCounter(): void;
//# sourceMappingURL=navigation-config-state.d.ts.map