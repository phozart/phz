/**
 * @phozart/phz-workspace — Navigation Module (V)
 */
export { isNavigationLink, createNavigationLink, resolveNavigationFilters, detectCircularLinks, type NavigationLink, type NavigationSource, type NavigationFilterMapping, type NavigationOpenBehavior, } from './navigation-link.js';
export { createNavigationEditorState, setTarget, addFilterMapping, removeFilterMapping, setOpenBehavior, getNavigationLink, validateNavigationEditorState, autoMapFilters, type NavigationEditorState, type NavigationValidationResult, } from './navigation-editor.js';
export { buildNavigationEvent, emitNavigationEvent, type NavigationFilter, } from './navigation-event.js';
export { isVisibleToViewer, groupByVisibility, canTransition, transitionVisibility, duplicateWithVisibility, type ArtifactVisibility, type VisibilityMeta, type VisibilityGroup, } from './artifact-visibility.js';
export { createDefaultPresentation, mergePresentation, createPersonalView, applyPersonalView, type DefaultPresentation, type PersonalView, } from './default-presentation.js';
export { createGridArtifact, isGridArtifact, gridArtifactToMeta, type GridArtifact, type GridColumnConfig, } from './grid-artifact.js';
export * from './navigation-config-state.js';
//# sourceMappingURL=index.d.ts.map