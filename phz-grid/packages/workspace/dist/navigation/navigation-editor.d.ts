/**
 * @phozart/workspace — NavigationEditor headless state (V.2)
 *
 * Pure state management for authoring navigation links.
 * Supports auto-mapping source fields to target filter definitions.
 */
import type { ArtifactType } from '../types.js';
import type { FilterDefinition } from '../filters/filter-definition.js';
import type { NavigationLink, NavigationFilterMapping, NavigationOpenBehavior } from './navigation-link.js';
export interface NavigationEditorState {
    id?: string;
    sourceArtifactId: string;
    targetArtifactId: string;
    targetArtifactType: ArtifactType;
    label: string;
    description?: string;
    filterMappings: NavigationFilterMapping[];
    openBehavior: NavigationOpenBehavior;
}
export interface NavigationValidationResult {
    valid: boolean;
    errors: string[];
}
export declare function validateNavigationEditorState(state: NavigationEditorState): NavigationValidationResult;
export declare function createNavigationEditorState(sourceArtifactId: string, existingLink?: NavigationLink): NavigationEditorState;
export declare function setTarget(state: NavigationEditorState, targetArtifactId: string, targetArtifactType: ArtifactType, label: string): NavigationEditorState;
export declare function addFilterMapping(state: NavigationEditorState, mapping: NavigationFilterMapping): NavigationEditorState;
export declare function removeFilterMapping(state: NavigationEditorState, index: number): NavigationEditorState;
export declare function setOpenBehavior(state: NavigationEditorState, behavior: NavigationOpenBehavior): NavigationEditorState;
export declare function getNavigationLink(state: NavigationEditorState): NavigationLink;
export declare function autoMapFilters(sourceFields: string[], targetFilterDefinitions: FilterDefinition[]): NavigationFilterMapping[];
//# sourceMappingURL=navigation-editor.d.ts.map