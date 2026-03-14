/**
 * @phozart/workspace/all — Full workspace entry point
 *
 * Import this single module to get the unified <phz-workspace> component
 * with all sub-components auto-registered.
 *
 * Usage:
 *   import { PhzWorkspace } from '@phozart/workspace/all';
 *
 *   <phz-workspace
 *     .adapter=${myAdapter}
 *     role="admin"
 *     title="My Analytics"
 *   ></phz-workspace>
 */

// The unified entry component
export { PhzWorkspace } from './phz-workspace.js';

// Re-export everything from main index (types, adapters, utilities)
export * from './index.js';

// Register all sub-module custom elements as side effects
// These register <phz-grid-admin>, <phz-engine-admin>, etc.
import './grid-admin/index.js';
import './engine-admin/index.js';
import './grid-creator/index.js';
import './criteria-admin/index.js';
import './definition-ui/index.js';

// Authoring components: <phz-dashboard-editor>, <phz-report-editor>, etc.
import './authoring/index.js';
