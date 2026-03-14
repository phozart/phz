/**
 * @phozart/workspace — Navigation Module (V)
 */
// NavigationLink (V.1)
export { isNavigationLink, createNavigationLink, resolveNavigationFilters, detectCircularLinks, } from './navigation-link.js';
// NavigationEditor (V.2)
export { createNavigationEditorState, setTarget, addFilterMapping, removeFilterMapping, setOpenBehavior, getNavigationLink, validateNavigationEditorState, autoMapFilters, } from './navigation-editor.js';
// NavigationEvent (V.3)
export { buildNavigationEvent, emitNavigationEvent, } from './navigation-event.js';
// ArtifactVisibility (V.4)
export { isVisibleToViewer, groupByVisibility, canTransition, transitionVisibility, duplicateWithVisibility, } from './artifact-visibility.js';
// DefaultPresentation (V.5)
export { createDefaultPresentation, mergePresentation, createPersonalView, applyPersonalView, } from './default-presentation.js';
// GridArtifact (V.6)
export { createGridArtifact, isGridArtifact, gridArtifactToMeta, } from './grid-artifact.js';
// NavigationConfig (B-3.14)
export * from './navigation-config-state.js';
//# sourceMappingURL=index.js.map