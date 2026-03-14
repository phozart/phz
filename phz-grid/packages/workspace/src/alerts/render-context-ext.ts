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

export function createRenderContext(input: CreateRenderContextInput): ExtendedRenderContext {
  return {
    data: input.data,
    theme: input.theme,
    locale: input.locale,
    breaches: input.breaches ?? [],
  };
}

export function filterBreachesForWidget(
  breaches: ActiveBreach[],
  widgetId: string,
): ActiveBreach[] {
  return breaches.filter(b =>
    b.breach.widgetId === widgetId || b.breach.widgetId === undefined,
  );
}
