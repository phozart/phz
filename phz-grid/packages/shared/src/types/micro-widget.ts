/**
 * @phozart/phz-shared — MicroWidgetCellConfig (7A-B)
 *
 * Types and pure functions for micro-widget cell rendering inside
 * grid table cells. Supports sparklines, gauges, deltas, and status
 * indicators at cell scale without Lit or DOM dependencies.
 */

// ========================================================================
// Display mode & widget type unions
// ========================================================================

/**
 * How the micro-widget is rendered inside the cell.
 * - 'value-only': Formatted number + colored status dot
 * - 'sparkline': SVG polyline from array data
 * - 'delta': Value + arrow + percentage change
 * - 'gauge-arc': SVG semi-circle arc with fill
 */
export type MicroWidgetDisplayMode = 'value-only' | 'sparkline' | 'delta' | 'gauge-arc';

/**
 * Which full-size widget type the micro-widget corresponds to.
 */
export type MicroWidgetType = 'trend-line' | 'gauge' | 'kpi-card' | 'scorecard';

// ========================================================================
// MicroWidgetCellConfig
// ========================================================================

/**
 * Configuration for micro-widget rendering inside a grid cell.
 * Stored as part of column config and persisted with the grid definition.
 */
export interface MicroWidgetCellConfig {
  /** Which full-size widget type this cell renderer emulates. */
  widgetType: MicroWidgetType;
  /** Data binding for the micro-widget. */
  dataBinding: {
    /** Field whose value is the primary metric. */
    valueField: string;
    /** Optional comparison field for delta calculations. */
    compareField?: string;
    /** Optional field containing sparkline array data. */
    sparklineField?: string;
  };
  /** How the micro-widget is rendered. */
  displayMode: MicroWidgetDisplayMode;
  /** Optional threshold configuration for status coloring. */
  thresholds?: {
    /** Value at or above which the status is 'warning'. */
    warning?: number;
    /** Value at or above which the status is 'critical'. */
    critical?: number;
  };
}

// ========================================================================
// SparklineDataBinding
// ========================================================================

/**
 * Describes how sparkline data points are sourced.
 * - 'inline-array': the cell value is already an array of numbers
 * - 'group-aggregate': aggregate from grouped rows
 */
export interface SparklineDataBinding {
  /** Where the data comes from. */
  source: 'inline-array' | 'group-aggregate';
  /** Field name to read data from. */
  field: string;
  /** Aggregation function when source is 'group-aggregate'. */
  aggregation?: string;
  /** Maximum number of data points to render (default 20). */
  points?: number;
}

// ========================================================================
// MicroWidgetRenderResult
// ========================================================================

/**
 * The output of a micro-widget renderer. Contains an SVG or HTML string
 * and the dimensions used for rendering.
 */
export interface MicroWidgetRenderResult {
  /** SVG or HTML string for the cell content. */
  html: string;
  /** Width of the rendered content in pixels. */
  width: number;
  /** Height of the rendered content in pixels. */
  height: number;
}

// ========================================================================
// MicroWidgetRenderer interface
// ========================================================================

/**
 * A micro-widget renderer produces HTML/SVG string output from cell data.
 * Renderers are pure functions — no DOM APIs, no Lit, no side effects.
 */
export interface MicroWidgetRenderer {
  /**
   * Render the micro-widget for a cell.
   *
   * @param config - The micro-widget cell configuration.
   * @param value - The cell's current value (number, array, or null).
   * @param width - Available cell width in pixels.
   * @param height - Available cell height in pixels.
   * @returns The render result containing HTML/SVG string and dimensions.
   */
  render(config: MicroWidgetCellConfig, value: unknown, width: number, height: number): MicroWidgetRenderResult;

  /**
   * Check whether this renderer can produce output at the given column width.
   *
   * @param config - The micro-widget cell configuration.
   * @param columnWidth - The column width in pixels.
   * @returns True if the renderer can produce meaningful output.
   */
  canRender(config: MicroWidgetCellConfig, columnWidth: number): boolean;
}

// ========================================================================
// CellRendererRegistry
// ========================================================================

/**
 * Registry for micro-widget renderers. The grid defines the registry
 * interface; shells populate it with widget renderers at mount time.
 * This avoids circular build-time dependencies between grid and widgets.
 */
export interface CellRendererRegistry {
  /** Register a renderer for a given type key. */
  register(type: string, renderer: MicroWidgetRenderer): void;
  /** Retrieve a renderer by type key, or null if not registered. */
  get(type: string): MicroWidgetRenderer | null;
  /** Check whether a renderer is registered for the given type key. */
  has(type: string): boolean;
  /** Return all registered type keys. */
  getRegisteredTypes(): string[];
}

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
export function createCellRendererRegistry(): CellRendererRegistry {
  const renderers = new Map<string, MicroWidgetRenderer>();

  return {
    register(type: string, renderer: MicroWidgetRenderer): void {
      renderers.set(type, renderer);
    },

    get(type: string): MicroWidgetRenderer | null {
      return renderers.get(type) ?? null;
    },

    has(type: string): boolean {
      return renderers.has(type);
    },

    getRegisteredTypes(): string[] {
      return Array.from(renderers.keys());
    },
  };
}
