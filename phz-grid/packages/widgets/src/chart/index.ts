/**
 * @phozart/widgets — Unified Chart Module
 *
 * Barrel export for the chart subsystem: scales, resolution, layout, renderers.
 */

// Scale computation
export { computeNiceScale, computeBandScale, computeTimeScale, responsiveTickCount } from './chart-scales.js';
export type { LinearScaleResult, BandScaleResult, TimeScaleResult } from './chart-scales.js';

// Data resolution
export { resolveChartData } from './chart-resolve.js';
export type { ResolvedChartData, ResolvedSeries, ResolvedDataPoint, ResolvedXScale, XScaleType } from './chart-resolve.js';

// Layout computation
export { computeChartLayout } from './chart-layout.js';
export type {
  ChartLayout, ChartDimensions, ChartMark,
  BarMark, LineMark, AreaMark, PointMark,
  AxisLayout, AxisTickMark, AnnotationLayout, LegendEntry,
} from './chart-layout.js';

// Renderer interface
export type { IChartRenderer, RenderOptions } from './chart-renderer.js';

// SVG renderer
export { renderSVGChart } from './svg-renderer.js';
export type { SVGEventHandlers } from './svg-renderer.js';

// Pattern fills (a11y)
export { renderPatternDefs, getPatternFill, CHART_PATTERNS } from './chart-patterns.js';
export type { PatternDef } from './chart-patterns.js';

// Keyboard navigation
export { nextFocusedMark, buildMarkAnnouncement } from './chart-keyboard.js';
export type { FocusedMark } from './chart-keyboard.js';

// Canvas renderer
export { CanvasChartRenderer, autoSelectRenderer } from './canvas-renderer.js';

// Backward compatibility converters
export { convertBarChartPropsToSpec } from './bar-chart-compat.js';
export { convertLineChartPropsToSpec } from './line-chart-compat.js';
