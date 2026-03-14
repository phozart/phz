/**
 * @phozart/widgets — Chart Renderer Interface
 *
 * Defines the contract that all renderers (SVG, Canvas, Hybrid) implement.
 * The renderer receives a fully computed ChartLayout and produces visual output.
 */

import type { ChartLayout } from './chart-layout.js';

/**
 * Chart renderer interface.
 * SVG renderers return Lit template results; Canvas renderers draw to a 2D context.
 */
export interface IChartRenderer {
  /** Renderer type identifier. */
  readonly type: 'svg' | 'canvas' | 'hybrid';

  /**
   * Render the chart layout.
   * For SVG: returns an SVG tagged template.
   * For Canvas: draws to the provided canvas context.
   */
  render(layout: ChartLayout, options: RenderOptions): unknown;
}

export interface RenderOptions {
  /** Set of hidden series indices (for legend toggle). */
  hiddenSeries: Set<number>;
  /** Currently focused mark for keyboard navigation. */
  focusedMark?: { seriesIndex: number; dataIndex: number } | null;
  /** Enable pattern fills for colorblind safety. */
  patternsEnabled: boolean;
  /** Whether to render with animation. */
  animated: boolean;
}
