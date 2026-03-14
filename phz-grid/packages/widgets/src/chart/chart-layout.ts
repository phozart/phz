/**
 * @phozart/widgets — Chart Layout Computation
 *
 * Pure function: ResolvedChartData → ChartLayout
 *
 * Converts data-space coordinates into pixel-space geometry that the renderer
 * consumes. All data logic is done by this point — the renderer just draws shapes.
 */

import type { ChartSpec, ChartAnnotationSpec } from '@phozart/engine';
import type { ResolvedChartData, ResolvedSeries, ResolvedDataPoint } from './chart-resolve.js';
import { responsiveTickCount } from './chart-scales.js';

// ========================================================================
// Layout Types
// ========================================================================

export interface ChartDimensions {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  plotWidth: number;
  plotHeight: number;
}

export interface BarMark {
  kind: 'bar';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  patternId?: string;
  cornerRadius: number;
  seriesIndex: number;
  dataIndex: number;
  datum: Record<string, unknown>;
  label: string;
  value: number;
}

export interface LineMark {
  kind: 'line';
  path: string;
  color: string;
  strokeWidth: number;
  strokeDash?: number[];
  seriesIndex: number;
}

export interface AreaMark {
  kind: 'area';
  path: string;
  color: string;
  opacity: number;
  seriesIndex: number;
}

export interface PointMark {
  kind: 'point';
  cx: number;
  cy: number;
  r: number;
  color: string;
  filled: boolean;
  seriesIndex: number;
  dataIndex: number;
  datum: Record<string, unknown>;
  label: string;
  value: number;
}

export type ChartMark = BarMark | LineMark | AreaMark | PointMark;

export interface AxisTickMark {
  position: number;
  label: string;
  value: number | string;
}

export interface AxisLayout {
  show: boolean;
  title: string;
  ticks: AxisTickMark[];
  gridLines: boolean;
}

export interface AnnotationLayout {
  type: 'reference-line' | 'threshold-band' | 'target-line' | 'text';
  // For lines
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  // For bands
  y?: number;
  height?: number;
  // For text
  x?: number;
  text?: string;
  anchor?: string;
  // Shared
  label?: string;
  color?: string;
  dashStyle?: string;
  fillColor?: string;
  fillOpacity?: number;
}

export interface LegendEntry {
  seriesIndex: number;
  name: string;
  color: string;
  patternId?: string;
}

export interface ChartLayout {
  dimensions: ChartDimensions;
  marks: ChartMark[];
  xAxis: AxisLayout;
  yAxis: AxisLayout;
  annotations: AnnotationLayout[];
  legend: LegendEntry[];
}

// ========================================================================
// Main Layout Function
// ========================================================================

/**
 * Compute the complete chart layout from resolved data.
 *
 * @param resolved - Data resolution output
 * @param spec - Original chart spec (for axis/annotation config)
 * @param containerWidth - Container width in pixels
 * @param containerHeight - Container height in pixels
 */
export function computeChartLayout(
  resolved: ResolvedChartData,
  spec: ChartSpec,
  containerWidth: number,
  containerHeight: number,
): ChartLayout {
  const padding = resolvePadding(spec, resolved);
  const plotWidth = containerWidth - padding.left - padding.right;
  const plotHeight = containerHeight - padding.top - padding.bottom;

  const dimensions: ChartDimensions = {
    width: containerWidth,
    height: containerHeight,
    padding,
    plotWidth: Math.max(0, plotWidth),
    plotHeight: Math.max(0, plotHeight),
  };

  // Compute marks for each series
  const marks: ChartMark[] = [];
  for (const series of resolved.series) {
    const seriesMarks = computeSeriesMarks(series, resolved, dimensions);
    marks.push(...seriesMarks);
  }

  // Compute axis layouts
  const xAxis = computeXAxisLayout(resolved, dimensions, spec);
  const yAxis = computeYAxisLayout(resolved, dimensions, spec);

  // Compute annotation positions
  const annotations = computeAnnotationLayouts(
    spec.annotations ?? [],
    resolved,
    dimensions,
  );

  // Legend entries
  const legend: LegendEntry[] = resolved.series.map(s => ({
    seriesIndex: s.index,
    name: s.name,
    color: s.color,
    patternId: s.patternId,
  }));

  return { dimensions, marks, xAxis, yAxis, annotations, legend };
}

// ========================================================================
// Padding Resolution
// ========================================================================

function resolvePadding(
  spec: ChartSpec,
  resolved: ResolvedChartData,
): { top: number; right: number; bottom: number; left: number } {
  const userPadding = spec.appearance?.padding;
  const showYAxis = spec.yAxis?.show !== false;
  const showXAxis = spec.xAxis?.show !== false;

  return {
    top: userPadding?.top ?? 20,
    right: userPadding?.right ?? 20,
    bottom: userPadding?.bottom ?? (showXAxis ? 45 : 20),
    left: userPadding?.left ?? (showYAxis ? 55 : 20),
  };
}

// ========================================================================
// Series Mark Computation
// ========================================================================

function computeSeriesMarks(
  series: ResolvedSeries,
  resolved: ResolvedChartData,
  dims: ChartDimensions,
): ChartMark[] {
  switch (series.type) {
    case 'bar': return computeBarMarks(series, resolved, dims);
    case 'line': return computeLineMarks(series, resolved, dims);
    case 'area': return computeAreaMarks(series, resolved, dims);
    case 'point': return computePointMarks(series, resolved, dims);
    default: return [];
  }
}

// ========================================================================
// Bar Marks
// ========================================================================

function computeBarMarks(
  series: ResolvedSeries,
  resolved: ResolvedChartData,
  dims: ChartDimensions,
): BarMark[] {
  const marks: BarMark[] = [];
  const barConfig = series.markConfig.bar;
  const isHorizontal = barConfig?.orientation === 'horizontal';
  const cornerRadius = barConfig?.cornerRadius ?? 2;
  const barWidthRatio = barConfig?.width ?? 0.8;

  // Count bar series for grouped bars
  const barSeriesCount = resolved.series.filter(s => s.type === 'bar').length;
  const barSeriesIndex = resolved.series.filter(s => s.type === 'bar').indexOf(series);
  const isStacked = !!series.markConfig.stack;

  for (let i = 0; i < series.points.length; i++) {
    const point = series.points[i];
    const pos = resolveXPosition(point.x, resolved, dims);
    const yPos = resolveYPosition(point.y, resolved, dims);
    const y0Pos = point.y0 !== undefined
      ? resolveYPosition(point.y0, resolved, dims)
      : resolveYPosition(0, resolved, dims);

    if (isHorizontal) {
      // Horizontal bars: x-axis is value, y-axis is category
      const bandwidth = resolved.xScale.band?.bandwidth ?? (dims.plotHeight / Math.max(series.points.length, 1));
      const barHeight = bandwidth * barWidthRatio;
      let barY: number;

      if (isStacked) {
        barY = pos - barHeight / 2;
      } else {
        const groupBarHeight = barHeight / barSeriesCount;
        barY = pos - barHeight / 2 + barSeriesIndex * groupBarHeight;
      }

      const barWidth = Math.abs(y0Pos - yPos);

      marks.push({
        kind: 'bar',
        x: dims.padding.left + Math.min(yPos, y0Pos),
        y: dims.padding.top + barY,
        width: Math.max(barWidth, 1),
        height: isStacked ? barHeight : barHeight / barSeriesCount,
        color: series.color,
        patternId: series.patternId,
        cornerRadius,
        seriesIndex: series.index,
        dataIndex: i,
        datum: point.datum,
        label: String(point.x),
        value: point.y0 !== undefined ? point.y - point.y0 : point.y,
      });
    } else {
      // Vertical bars: x-axis is category, y-axis is value
      const bandwidth = resolved.xScale.band?.bandwidth ?? (dims.plotWidth / Math.max(series.points.length, 1));
      const barWidth = bandwidth * barWidthRatio;
      let barX: number;

      if (isStacked) {
        barX = pos - barWidth / 2;
      } else {
        const groupBarWidth = barWidth / barSeriesCount;
        barX = pos - barWidth / 2 + barSeriesIndex * groupBarWidth;
      }

      const barHeight = Math.abs(y0Pos - yPos);

      marks.push({
        kind: 'bar',
        x: dims.padding.left + barX,
        y: dims.padding.top + Math.min(yPos, y0Pos),
        width: isStacked ? barWidth : barWidth / barSeriesCount,
        height: Math.max(barHeight, 1),
        color: series.color,
        patternId: series.patternId,
        cornerRadius,
        seriesIndex: series.index,
        dataIndex: i,
        datum: point.datum,
        label: String(point.x),
        value: point.y0 !== undefined ? point.y - point.y0 : point.y,
      });
    }
  }

  return marks;
}

// ========================================================================
// Line Marks
// ========================================================================

function computeLineMarks(
  series: ResolvedSeries,
  resolved: ResolvedChartData,
  dims: ChartDimensions,
): ChartMark[] {
  const marks: ChartMark[] = [];
  const lineConfig = series.markConfig.line;
  const strokeWidth = lineConfig?.strokeWidth ?? 2;
  const strokeDash = lineConfig?.strokeDash;

  // Build path
  const positioned = series.points.map((p, i) => ({
    px: dims.padding.left + resolveXPosition(p.x, resolved, dims),
    py: dims.padding.top + resolveYPosition(p.y, resolved, dims),
    point: p,
    index: i,
  }));

  if (positioned.length > 0) {
    const pathD = buildPathD(positioned.map(p => ({ x: p.px, y: p.py })), lineConfig?.curve ?? 'linear');
    marks.push({
      kind: 'line',
      path: pathD,
      color: series.color,
      strokeWidth,
      strokeDash,
      seriesIndex: series.index,
    });

    // Add point markers
    for (const p of positioned) {
      marks.push({
        kind: 'point',
        cx: p.px,
        cy: p.py,
        r: 4,
        color: series.color,
        filled: true,
        seriesIndex: series.index,
        dataIndex: p.index,
        datum: p.point.datum,
        label: String(p.point.x),
        value: p.point.y,
      });
    }
  }

  return marks;
}

// ========================================================================
// Area Marks
// ========================================================================

function computeAreaMarks(
  series: ResolvedSeries,
  resolved: ResolvedChartData,
  dims: ChartDimensions,
): ChartMark[] {
  const marks: ChartMark[] = [];
  const areaConfig = series.markConfig.area;
  const opacity = areaConfig?.opacity ?? 0.3;
  const strokeWidth = areaConfig?.strokeWidth ?? 2;
  const curve = areaConfig?.curve ?? 'linear';

  const positioned = series.points.map((p, i) => ({
    px: dims.padding.left + resolveXPosition(p.x, resolved, dims),
    py: dims.padding.top + resolveYPosition(p.y, resolved, dims),
    py0: dims.padding.top + (p.y0 !== undefined
      ? resolveYPosition(p.y0, resolved, dims)
      : resolveYPosition(0, resolved, dims)),
    point: p,
    index: i,
  }));

  if (positioned.length > 0) {
    // Area fill path
    const topLine = positioned.map(p => ({ x: p.px, y: p.py }));
    const bottomLine = [...positioned].reverse().map(p => ({ x: p.px, y: p.py0 }));
    const areaPathD = `${buildPathD(topLine, curve)} L${bottomLine.map((p, i) => `${i === 0 ? '' : ' L'}${p.x},${p.y}`).join('')} Z`;

    marks.push({
      kind: 'area',
      path: areaPathD,
      color: series.color,
      opacity,
      seriesIndex: series.index,
    });

    // Line on top
    marks.push({
      kind: 'line',
      path: buildPathD(topLine, curve),
      color: series.color,
      strokeWidth,
      seriesIndex: series.index,
    });

    // Point markers
    for (const p of positioned) {
      marks.push({
        kind: 'point',
        cx: p.px,
        cy: p.py,
        r: 3,
        color: series.color,
        filled: true,
        seriesIndex: series.index,
        dataIndex: p.index,
        datum: p.point.datum,
        label: String(p.point.x),
        value: p.point.y,
      });
    }
  }

  return marks;
}

// ========================================================================
// Point Marks
// ========================================================================

function computePointMarks(
  series: ResolvedSeries,
  resolved: ResolvedChartData,
  dims: ChartDimensions,
): PointMark[] {
  const pointConfig = series.markConfig.point;
  const r = pointConfig?.size ?? 4;
  const filled = pointConfig?.filled !== false;

  return series.points.map((p, i) => ({
    kind: 'point' as const,
    cx: dims.padding.left + resolveXPosition(p.x, resolved, dims),
    cy: dims.padding.top + resolveYPosition(p.y, resolved, dims),
    r,
    color: series.color,
    filled,
    seriesIndex: series.index,
    dataIndex: i,
    datum: p.datum,
    label: String(p.x),
    value: p.y,
  }));
}

// ========================================================================
// Position Resolution
// ========================================================================

function resolveXPosition(
  value: string | number,
  resolved: ResolvedChartData,
  dims: ChartDimensions,
): number {
  const { xScale } = resolved;

  if (xScale.type === 'band' && xScale.band) {
    return xScale.band.positions.get(String(value)) ?? 0;
  }

  if (xScale.type === 'linear' && xScale.linear) {
    const { min, max } = xScale.linear;
    const range = max - min || 1;
    return ((Number(value) - min) / range) * dims.plotWidth;
  }

  if (xScale.type === 'time' && xScale.time) {
    return xScale.time.scale(typeof value === 'number' ? value : new Date(String(value)).getTime());
  }

  return 0;
}

function resolveYPosition(
  value: number,
  resolved: ResolvedChartData,
  dims: ChartDimensions,
): number {
  const { min, max } = resolved.yScale;
  const range = max - min || 1;
  // Y is inverted: higher values → lower pixel position
  return dims.plotHeight - ((value - min) / range) * dims.plotHeight;
}

// ========================================================================
// Path Building
// ========================================================================

function buildPathD(
  points: { x: number; y: number }[],
  curve: string = 'linear',
): string {
  if (points.length === 0) return '';

  if (curve === 'step' || curve === 'step-after') {
    return buildStepPath(points);
  }

  if (curve === 'step-before') {
    return buildStepBeforePath(points);
  }

  if (curve === 'monotone') {
    return buildMonotonePath(points);
  }

  // Default: linear
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
}

function buildStepPath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = points[i - 1];
    return `H${p.x} V${p.y}`;
  }).join(' ');
}

function buildStepBeforePath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => {
    if (i === 0) return `M${p.x},${p.y}`;
    return `V${p.y} H${p.x}`;
  }).join(' ');
}

function buildMonotonePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return points.map(p => `M${p.x},${p.y}`).join('');
  if (points.length === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;

  let path = `M${points[0].x},${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const p0 = points[Math.max(i - 2, 0)];
    const p1 = points[i - 1];
    const p2 = points[i];
    const p3 = points[Math.min(i + 1, points.length - 1)];

    // Catmull-Rom to cubic bezier conversion
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return path;
}

// ========================================================================
// Axis Layout
// ========================================================================

function computeXAxisLayout(
  resolved: ResolvedChartData,
  dims: ChartDimensions,
  spec: ChartSpec,
): AxisLayout {
  const show = spec.xAxis?.show !== false;
  const gridLines = spec.xAxis?.gridLines ?? false;
  const tickCount = spec.xAxis?.tickCount ?? responsiveTickCount(dims.plotWidth);

  let ticks: AxisTickMark[];

  if (resolved.xScale.type === 'band' && resolved.xScale.band) {
    ticks = resolved.xScale.band.domain.map(cat => ({
      position: dims.padding.left + (resolved.xScale.band!.positions.get(cat) ?? 0),
      label: cat,
      value: cat,
    }));

    // Limit labels if too many
    if (ticks.length > tickCount * 1.5) {
      const step = Math.ceil(ticks.length / tickCount);
      ticks = ticks.filter((_, i) => i % step === 0 || i === ticks.length - 1);
    }
  } else if (resolved.xScale.type === 'linear' && resolved.xScale.linear) {
    const scale = resolved.xScale.linear;
    const range = scale.max - scale.min || 1;
    ticks = scale.ticks.map(v => ({
      position: dims.padding.left + ((v - scale.min) / range) * dims.plotWidth,
      label: formatNumber(v),
      value: v,
    }));
  } else if (resolved.xScale.type === 'time' && resolved.xScale.time) {
    const timeScale = resolved.xScale.time;
    ticks = timeScale.ticks.map(d => ({
      position: dims.padding.left + timeScale.scale(d.getTime()),
      label: formatDate(d),
      value: d.getTime(),
    }));
  } else {
    ticks = [];
  }

  return { show, title: resolved.xTitle, ticks, gridLines };
}

function computeYAxisLayout(
  resolved: ResolvedChartData,
  dims: ChartDimensions,
  spec: ChartSpec,
): AxisLayout {
  const show = spec.yAxis?.show !== false;
  const gridLines = spec.yAxis?.gridLines !== false; // Default true for y-axis

  const { min, max, ticks: tickValues } = resolved.yScale;
  const range = max - min || 1;

  const ticks: AxisTickMark[] = tickValues.map(v => ({
    position: dims.padding.top + dims.plotHeight - ((v - min) / range) * dims.plotHeight,
    label: formatNumber(v),
    value: v,
  }));

  return { show, title: resolved.yTitle, ticks, gridLines };
}

// ========================================================================
// Annotation Layout
// ========================================================================

function computeAnnotationLayouts(
  annotations: ChartAnnotationSpec[],
  resolved: ResolvedChartData,
  dims: ChartDimensions,
): AnnotationLayout[] {
  return annotations.map(ann => computeAnnotationLayout(ann, resolved, dims));
}

function computeAnnotationLayout(
  ann: ChartAnnotationSpec,
  resolved: ResolvedChartData,
  dims: ChartDimensions,
): AnnotationLayout {
  const { min: yMin, max: yMax } = resolved.yScale;
  const yRange = yMax - yMin || 1;

  switch (ann.type) {
    case 'reference-line': {
      if (ann.axis === 'y') {
        const y = dims.padding.top + dims.plotHeight - ((ann.value - yMin) / yRange) * dims.plotHeight;
        return {
          type: 'reference-line',
          x1: dims.padding.left,
          y1: y,
          x2: dims.padding.left + dims.plotWidth,
          y2: y,
          label: ann.label,
          color: ann.color ?? '#78716C',
          dashStyle: ann.dashStyle ?? 'dashed',
        };
      }
      // x-axis reference line
      const xPos = resolveXPosition(ann.value, resolved, dims);
      return {
        type: 'reference-line',
        x1: dims.padding.left + xPos,
        y1: dims.padding.top,
        x2: dims.padding.left + xPos,
        y2: dims.padding.top + dims.plotHeight,
        label: ann.label,
        color: ann.color ?? '#78716C',
        dashStyle: ann.dashStyle ?? 'dashed',
      };
    }

    case 'threshold-band': {
      const yTop = dims.padding.top + dims.plotHeight - ((Math.min(ann.max, yMax) - yMin) / yRange) * dims.plotHeight;
      const yBottom = dims.padding.top + dims.plotHeight - ((Math.max(ann.min, yMin) - yMin) / yRange) * dims.plotHeight;
      return {
        type: 'threshold-band',
        x: dims.padding.left,
        y: yTop,
        height: yBottom - yTop,
        label: ann.label,
        fillColor: ann.fillColor ?? ann.color ?? 'rgba(234, 179, 8, 0.15)',
        fillOpacity: ann.fillOpacity ?? 0.15,
      };
    }

    case 'target-line': {
      const y = dims.padding.top + dims.plotHeight - ((ann.value - yMin) / yRange) * dims.plotHeight;
      return {
        type: 'target-line',
        x1: dims.padding.left,
        y1: y,
        x2: dims.padding.left + dims.plotWidth,
        y2: y,
        label: ann.label ?? 'Target',
        color: ann.color ?? '#EF4444',
        dashStyle: ann.dashStyle ?? 'dashed',
      };
    }

    case 'text': {
      const xPos = typeof ann.x === 'number'
        ? dims.padding.left + ann.x
        : dims.padding.left + (resolved.xScale.band?.positions.get(String(ann.x)) ?? 0);
      const yPos = dims.padding.top + dims.plotHeight - ((ann.y - yMin) / yRange) * dims.plotHeight;
      return {
        type: 'text',
        x: xPos,
        y: yPos,
        text: ann.text,
        anchor: ann.anchor ?? 'middle',
        color: ann.color ?? '#44403C',
      };
    }

    default: {
      const _exhaustive: never = ann;
      return { type: 'reference-line' };
    }
  }
}

// ========================================================================
// Formatting Helpers
// ========================================================================

function formatNumber(value: number): string {
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toFixed(1);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
