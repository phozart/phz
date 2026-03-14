/**
 * @phozart/grid — Micro-Widget Cell Resolver (7A-B)
 *
 * State machine for resolving micro-widget cell rendering.
 * Checks column width, registry availability, and falls back
 * to plain text when rendering is not possible.
 *
 * Pure functions only — no DOM, no Lit, no side effects.
 */
import type { MicroWidgetCellConfig, MicroWidgetRenderResult, CellRendererRegistry } from '@phozart/shared/types';
/**
 * Attempt to resolve and invoke a micro-widget renderer for a cell.
 *
 * Returns the render result if:
 * 1. The registry has a renderer for the config's displayMode
 * 2. The renderer's canRender() returns true for the column width
 *
 * Returns null otherwise (caller should fall back to text).
 *
 * @param config - The micro-widget cell configuration.
 * @param value - The cell's current value.
 * @param columnWidth - The column width in pixels.
 * @param rowHeight - The row height in pixels.
 * @param registry - The cell renderer registry.
 * @returns The render result, or null if rendering is not possible.
 */
export declare function resolveCellRenderer(config: MicroWidgetCellConfig, value: unknown, columnWidth: number, rowHeight: number, registry: CellRendererRegistry): MicroWidgetRenderResult | null;
/**
 * Produce a plain-text fallback when the micro-widget renderer is
 * unavailable or the column is too narrow.
 *
 * @param config - The micro-widget cell configuration.
 * @param value - The cell's current value.
 * @returns A plain string representation of the value.
 */
export declare function getMicroWidgetFallbackText(config: MicroWidgetCellConfig, value: unknown): string;
//# sourceMappingURL=micro-widget-cell.d.ts.map