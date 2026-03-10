/**
 * @phozart/phz-workspace — Preview-as Utils (L.19)
 *
 * Immutable state for viewer context simulation ("preview as" role/user).
 */
import type { ViewerContext } from '../types.js';
export interface PreviewAsState {
    active: boolean;
    context: ViewerContext | undefined;
    recentContexts: ViewerContext[];
}
export declare function createPreviewAsState(): PreviewAsState;
export declare function setPreviewContext(state: PreviewAsState, context: ViewerContext): PreviewAsState;
export declare function clearPreviewContext(state: PreviewAsState): PreviewAsState;
//# sourceMappingURL=preview-as-utils.d.ts.map