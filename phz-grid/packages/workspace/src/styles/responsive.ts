/**
 * S.2 — Responsive Viewport Breakpoints
 *
 * @deprecated Import from '@phozart/shared/design-system' instead.
 * These re-exports will be removed in v16.
 */

// Re-export WorkspaceRole from shell-roles (workspace-specific; shared defines its own)
export type { WorkspaceRole, LegacyWorkspaceRole } from '../shell/shell-roles.js';

/**
 * @deprecated Import from '@phozart/shared/design-system' instead.
 * These re-exports will be removed in v16.
 */
export {
  BREAKPOINT_VALUES,
  getViewportBreakpoint,
  getBreakpointClasses,
  getBottomTabItems,
  type ViewportBreakpoint,
  type BreakpointClasses,
  type BottomTabItem,
} from '@phozart/shared/design-system';
