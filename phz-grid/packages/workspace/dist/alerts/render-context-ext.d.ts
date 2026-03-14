/**
 * @phozart/workspace — Extended RenderContext (N.4)
 *
 * Extends the base RenderContext with breach information,
 * maintaining backward compatibility (breaches defaults to []).
 */
import type { ActiveBreach } from '../types.js';
import type { RenderContext } from '../registry/widget-registry.js';
export interface ExtendedRenderContext extends RenderContext {
    breaches: ActiveBreach[];
}
export interface CreateRenderContextInput {
    data: Record<string, unknown>[];
    theme: Record<string, string>;
    locale: string;
    breaches?: ActiveBreach[];
}
export declare function createRenderContext(input: CreateRenderContextInput): ExtendedRenderContext;
export declare function filterBreachesForWidget(breaches: ActiveBreach[], widgetId: string): ActiveBreach[];
//# sourceMappingURL=render-context-ext.d.ts.map