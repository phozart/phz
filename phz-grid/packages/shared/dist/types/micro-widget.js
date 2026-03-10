/**
 * @phozart/phz-shared — MicroWidgetCellConfig (7A-B)
 *
 * Types and pure functions for micro-widget cell rendering inside
 * grid table cells. Supports sparklines, gauges, deltas, and status
 * indicators at cell scale without Lit or DOM dependencies.
 */
// ========================================================================
// createCellRendererRegistry factory
// ========================================================================
/**
 * Create a new Map-based CellRendererRegistry.
 *
 * The registry uses runtime registration (not build-time imports) so
 * that packages higher in the dependency chain (grid) do not need to
 * import packages lower in the chain (widgets) at build time.
 */
export function createCellRendererRegistry() {
    const renderers = new Map();
    return {
        register(type, renderer) {
            renderers.set(type, renderer);
        },
        get(type) {
            return renderers.get(type) ?? null;
        },
        has(type) {
            return renderers.has(type);
        },
        getRegisteredTypes() {
            return Array.from(renderers.keys());
        },
    };
}
//# sourceMappingURL=micro-widget.js.map