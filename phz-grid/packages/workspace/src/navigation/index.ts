/**
 * @phozart/workspace — Navigation Module (V)
 */

// NavigationLink (V.1)
export {
  isNavigationLink,
  createNavigationLink,
  resolveNavigationFilters,
  detectCircularLinks,
  type NavigationLink,
  type NavigationSource,
  type NavigationFilterMapping,
  type NavigationOpenBehavior,
} from './navigation-link.js';

// NavigationEditor (V.2)
export {
  createNavigationEditorState,
  setTarget,
  addFilterMapping,
  removeFilterMapping,
  setOpenBehavior,
  getNavigationLink,
  validateNavigationEditorState,
  autoMapFilters,
  type NavigationEditorState,
  type NavigationValidationResult,
} from './navigation-editor.js';

// NavigationEvent (V.3)
export {
  buildNavigationEvent,
  emitNavigationEvent,
  type NavigationFilter,
} from './navigation-event.js';

// ArtifactVisibility (V.4)
export {
  isVisibleToViewer,
  groupByVisibility,
  canTransition,
  transitionVisibility,
  duplicateWithVisibility,
  type ArtifactVisibility,
  type VisibilityMeta,
  type VisibilityGroup,
} from './artifact-visibility.js';

// DefaultPresentation (V.5)
export {
  createDefaultPresentation,
  mergePresentation,
  createPersonalView,
  applyPersonalView,
  type DefaultPresentation,
  type PersonalView,
} from './default-presentation.js';

// GridArtifact (V.6)
export {
  createGridArtifact,
  isGridArtifact,
  gridArtifactToMeta,
  type GridArtifact,
  type GridColumnConfig,
} from './grid-artifact.js';

// NavigationConfig (B-3.14)
export * from './navigation-config-state.js';
