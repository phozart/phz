export {
  renderLayoutToCSS,
  generateResponsiveCSS,
  generatePrintCSS,
  computeContainerBreakpoints,
  type LayoutRenderResult,
} from './layout-renderer.js';

export {
  migrateAbsoluteToAutoGrid,
  type AbsoluteWidget,
} from './layout-migration.js';

export {
  generateLayoutHTML,
  generateTabsHTML,
  generateSectionsHTML,
  generateGridHTML,
} from './phz-layout-container.js';

export {
  createWidgetErrorState,
  isRecoverable,
  formatErrorForUser,
  type WidgetErrorState,
} from './widget-error-boundary.js';

export {
  generateSkeletonHTML,
  generateLoadingHTML,
  generateStaleIndicatorHTML,
  generateFreshnessBadgeHTML,
  generateQualityWarningHTML,
  generateStaleDimmingCSS,
  type LoadingState,
} from './loading-renderer.js';

export {
  createLoadingIndicatorState,
  type LoadingIndicatorState,
} from './phz-loading-indicator.js';
