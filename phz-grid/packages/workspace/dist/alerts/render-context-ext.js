/**
 * @phozart/phz-workspace — Extended RenderContext (N.4)
 *
 * Extends the base RenderContext with breach information,
 * maintaining backward compatibility (breaches defaults to []).
 */
export function createRenderContext(input) {
    return {
        data: input.data,
        theme: input.theme,
        locale: input.locale,
        breaches: input.breaches ?? [],
    };
}
export function filterBreachesForWidget(breaches, widgetId) {
    return breaches.filter(b => b.breach.widgetId === widgetId || b.breach.widgetId === undefined);
}
//# sourceMappingURL=render-context-ext.js.map