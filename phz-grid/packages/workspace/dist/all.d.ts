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
export { PhzWorkspace } from './phz-workspace.js';
export * from './index.js';
import './grid-admin/index.js';
import './engine-admin/index.js';
import './grid-creator/index.js';
import './criteria-admin/index.js';
import './definition-ui/index.js';
import './authoring/index.js';
//# sourceMappingURL=all.d.ts.map