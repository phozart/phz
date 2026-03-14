/**
 * @phozart/widgets — SVG Chart Renderer
 *
 * Takes a ChartLayout and returns Lit SVG tagged templates.
 * Renders bars, lines, areas, points, axes, grid lines, annotations, and patterns.
 */

import { svg, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import type {
  ChartLayout, ChartMark, BarMark, LineMark, AreaMark, PointMark,
  AxisLayout, AnnotationLayout, LegendEntry,
} from './chart-layout.js';
import type { RenderOptions } from './chart-renderer.js';
import { renderPatternDefs, getPatternFill } from './chart-patterns.js';

/**
 * Render a complete chart as SVG.
 */
export function renderSVGChart(
  layout: ChartLayout,
  options: RenderOptions,
  handlers: SVGEventHandlers,
): TemplateResult {
  const { dimensions } = layout;
  const visibleMarks = layout.marks.filter(m => !options.hiddenSeries.has(m.seriesIndex));

  // Collect pattern definitions needed
  const patternDefs = collectPatternDefs(visibleMarks, options.patternsEnabled);

  return svg`
    <svg class="phz-chart-svg"
         viewBox="0 0 ${dimensions.width} ${dimensions.height}"
         preserveAspectRatio="xMidYMid meet"
         role="img"
         aria-label="${handlers.chartLabel ?? 'Chart'}"
         @keydown=${handlers.onKeyDown}>

      <desc>${handlers.chartDescription ?? ''}</desc>

      ${patternDefs.length > 0 ? renderPatternDefs(patternDefs) : nothing}

      <!-- Grid lines (behind data) -->
      ${renderGridLines(layout)}

      <!-- Annotations (behind data marks) -->
      ${renderAnnotations(layout.annotations)}

      <!-- Data marks -->
      ${renderMarks(visibleMarks, options, handlers)}

      <!-- Axes (on top of grid, behind tooltip interaction areas) -->
      ${renderAxes(layout)}
    </svg>
  `;
}

// ========================================================================
// Event Handler Types
// ========================================================================

export interface SVGEventHandlers {
  chartLabel?: string;
  chartDescription?: string;
  onMarkClick?: (mark: BarMark | PointMark) => void;
  onMarkHover?: (e: MouseEvent, mark: BarMark | PointMark) => void;
  onMarkLeave?: () => void;
  onMarkFocus?: (e: FocusEvent, mark: BarMark | PointMark) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
}

// ========================================================================
// Grid Lines
// ========================================================================

function renderGridLines(layout: ChartLayout): TemplateResult {
  const { xAxis, yAxis, dimensions } = layout;
  const { padding, plotWidth, plotHeight } = dimensions;

  return svg`
    <g class="phz-chart-grid">
      ${yAxis.gridLines ? yAxis.ticks.map(tick => svg`
        <line
          x1="${padding.left}" y1="${tick.position}"
          x2="${padding.left + plotWidth}" y2="${tick.position}"
          stroke="var(--phz-chart-grid-line, #E7E5E4)"
          stroke-width="1"
          opacity="0.6" />
      `) : nothing}

      ${xAxis.gridLines ? xAxis.ticks.map(tick => svg`
        <line
          x1="${tick.position}" y1="${padding.top}"
          x2="${tick.position}" y2="${padding.top + plotHeight}"
          stroke="var(--phz-chart-grid-line, #E7E5E4)"
          stroke-width="1"
          opacity="0.6" />
      `) : nothing}
    </g>
  `;
}

// ========================================================================
// Axes
// ========================================================================

function renderAxes(layout: ChartLayout): TemplateResult {
  const { xAxis, yAxis, dimensions } = layout;
  const { padding, plotWidth, plotHeight } = dimensions;

  return svg`
    <g class="phz-chart-axes">
      ${xAxis.show ? svg`
        <!-- X axis line -->
        <line
          x1="${padding.left}" y1="${padding.top + plotHeight}"
          x2="${padding.left + plotWidth}" y2="${padding.top + plotHeight}"
          stroke="var(--phz-chart-axis-line, #A8A29E)"
          stroke-width="1" />

        <!-- X axis ticks -->
        ${xAxis.ticks.map(tick => svg`
          <text
            x="${tick.position}" y="${padding.top + plotHeight + 20}"
            text-anchor="middle"
            fill="var(--phz-chart-text, #78716C)"
            font-size="10"
            font-family="Inter, system-ui, sans-serif">${tick.label}</text>
        `)}

        <!-- X axis title -->
        ${xAxis.title ? svg`
          <text
            x="${padding.left + plotWidth / 2}"
            y="${dimensions.height - 4}"
            text-anchor="middle"
            fill="var(--phz-chart-text, #44403C)"
            font-size="11"
            font-weight="500"
            font-family="Inter, system-ui, sans-serif">${xAxis.title}</text>
        ` : nothing}
      ` : nothing}

      ${yAxis.show ? svg`
        <!-- Y axis line -->
        <line
          x1="${padding.left}" y1="${padding.top}"
          x2="${padding.left}" y2="${padding.top + plotHeight}"
          stroke="var(--phz-chart-axis-line, #A8A29E)"
          stroke-width="1" />

        <!-- Y axis ticks -->
        ${yAxis.ticks.map(tick => svg`
          <text
            x="${padding.left - 8}" y="${tick.position + 4}"
            text-anchor="end"
            fill="var(--phz-chart-text, #78716C)"
            font-size="10"
            font-family="Inter, system-ui, sans-serif">${tick.label}</text>
        `)}

        <!-- Y axis title -->
        ${yAxis.title ? svg`
          <text
            x="${14}"
            y="${padding.top + plotHeight / 2}"
            text-anchor="middle"
            fill="var(--phz-chart-text, #44403C)"
            font-size="11"
            font-weight="500"
            font-family="Inter, system-ui, sans-serif"
            transform="rotate(-90, 14, ${padding.top + plotHeight / 2})">${yAxis.title}</text>
        ` : nothing}
      ` : nothing}
    </g>
  `;
}

// ========================================================================
// Data Marks
// ========================================================================

function renderMarks(
  marks: ChartMark[],
  options: RenderOptions,
  handlers: SVGEventHandlers,
): TemplateResult {
  return svg`
    <g class="phz-chart-marks">
      ${marks.map(mark => renderMark(mark, options, handlers))}
    </g>
  `;
}

function renderMark(
  mark: ChartMark,
  options: RenderOptions,
  handlers: SVGEventHandlers,
): TemplateResult {
  switch (mark.kind) {
    case 'bar': return renderBarMark(mark, options, handlers);
    case 'line': return renderLineMark(mark, options);
    case 'area': return renderAreaMark(mark, options);
    case 'point': return renderPointMark(mark, options, handlers);
    default: return svg``;
  }
}

function renderBarMark(
  mark: BarMark,
  options: RenderOptions,
  handlers: SVGEventHandlers,
): TemplateResult {
  const fill = options.patternsEnabled && mark.patternId
    ? getPatternFill(mark.patternId, mark.color)
    : mark.color;

  const isFocused = options.focusedMark?.seriesIndex === mark.seriesIndex
    && options.focusedMark?.dataIndex === mark.dataIndex;

  return svg`
    <rect
      class="phz-chart-bar"
      x="${mark.x}" y="${mark.y}"
      width="${mark.width}" height="${mark.height}"
      fill="${fill}"
      rx="${mark.cornerRadius}"
      tabindex="0"
      role="button"
      aria-label="${mark.label}: ${mark.value.toLocaleString()}"
      style="${isFocused ? 'outline: 2px solid #3B82F6; outline-offset: 2px;' : ''}"
      @click=${() => handlers.onMarkClick?.(mark)}
      @mouseenter=${(e: MouseEvent) => handlers.onMarkHover?.(e, mark)}
      @mouseleave=${() => handlers.onMarkLeave?.()}
      @focus=${(e: FocusEvent) => handlers.onMarkFocus?.(e, mark)}>
      <title>${mark.label}: ${mark.value.toLocaleString()}</title>
    </rect>
  `;
}

function renderLineMark(mark: LineMark, options: RenderOptions): TemplateResult {
  const dashArray = mark.strokeDash ? mark.strokeDash.join(',') : undefined;

  return svg`
    <path
      class="phz-chart-line"
      d="${mark.path}"
      fill="none"
      stroke="${mark.color}"
      stroke-width="${mark.strokeWidth}"
      stroke-linecap="round"
      stroke-linejoin="round"
      ${dashArray ? svg`stroke-dasharray="${dashArray}"` : nothing} />
  `;
}

function renderAreaMark(mark: AreaMark, _options: RenderOptions): TemplateResult {
  return svg`
    <path
      class="phz-chart-area"
      d="${mark.path}"
      fill="${mark.color}"
      opacity="${mark.opacity}" />
  `;
}

function renderPointMark(
  mark: PointMark,
  options: RenderOptions,
  handlers: SVGEventHandlers,
): TemplateResult {
  const isFocused = options.focusedMark?.seriesIndex === mark.seriesIndex
    && options.focusedMark?.dataIndex === mark.dataIndex;

  return svg`
    <circle
      class="phz-chart-point"
      cx="${mark.cx}" cy="${mark.cy}" r="${mark.r}"
      fill="${mark.filled ? mark.color : 'var(--phz-chart-bg, #FFFFFF)'}"
      stroke="${mark.color}" stroke-width="1.5"
      tabindex="0"
      role="button"
      aria-label="${mark.label}: ${mark.value.toLocaleString()}"
      style="cursor:pointer;${isFocused ? 'outline: 2px solid #3B82F6; outline-offset: 2px;' : ''}"
      @click=${() => handlers.onMarkClick?.(mark)}
      @mouseenter=${(e: MouseEvent) => handlers.onMarkHover?.(e, mark)}
      @mouseleave=${() => handlers.onMarkLeave?.()}
      @focus=${(e: FocusEvent) => handlers.onMarkFocus?.(e, mark)}>
      <title>${mark.label}: ${mark.value.toLocaleString()}</title>
    </circle>
  `;
}

// ========================================================================
// Annotations
// ========================================================================

function renderAnnotations(annotations: AnnotationLayout[]): TemplateResult {
  if (annotations.length === 0) return svg``;

  return svg`
    <g class="phz-chart-annotations">
      ${annotations.map(ann => renderAnnotation(ann))}
    </g>
  `;
}

function renderAnnotation(ann: AnnotationLayout): TemplateResult {
  switch (ann.type) {
    case 'reference-line':
    case 'target-line': {
      const dashArray = ann.dashStyle === 'dashed' ? '6,3'
        : ann.dashStyle === 'dotted' ? '2,3' : undefined;
      return svg`
        <g>
          <line
            x1="${ann.x1}" y1="${ann.y1}" x2="${ann.x2}" y2="${ann.y2}"
            stroke="${ann.color ?? '#78716C'}"
            stroke-width="1.5"
            ${dashArray ? svg`stroke-dasharray="${dashArray}"` : nothing} />
          ${ann.label ? svg`
            <text
              x="${(ann.x2 ?? 0) - 4}" y="${(ann.y1 ?? 0) - 4}"
              text-anchor="end"
              fill="${ann.color ?? '#78716C'}"
              font-size="10"
              font-family="Inter, system-ui, sans-serif">${ann.label}</text>
          ` : nothing}
        </g>
      `;
    }

    case 'threshold-band':
      return svg`
        <g>
          <rect
            x="${ann.x}" y="${ann.y}"
            width="100%" height="${ann.height}"
            fill="${ann.fillColor ?? 'rgba(234, 179, 8, 0.15)'}"
            opacity="${ann.fillOpacity ?? 0.15}" />
          ${ann.label ? svg`
            <text
              x="${(ann.x ?? 0) + 4}" y="${(ann.y ?? 0) + 12}"
              fill="${ann.color ?? '#78716C'}"
              font-size="9"
              font-family="Inter, system-ui, sans-serif">${ann.label}</text>
          ` : nothing}
        </g>
      `;

    case 'text':
      return svg`
        <text
          x="${ann.x}" y="${ann.y}"
          text-anchor="${ann.anchor ?? 'middle'}"
          fill="${ann.color ?? '#44403C'}"
          font-size="11"
          font-family="Inter, system-ui, sans-serif">${ann.text}</text>
      `;

    default:
      return svg``;
  }
}

// ========================================================================
// Pattern Collection
// ========================================================================

function collectPatternDefs(
  marks: ChartMark[],
  patternsEnabled: boolean,
): { patternId: string; color: string }[] {
  if (!patternsEnabled) return [];

  const seen = new Set<string>();
  const defs: { patternId: string; color: string }[] = [];

  for (const mark of marks) {
    if (mark.kind === 'bar' && mark.patternId) {
      const key = `${mark.patternId}-${mark.color}`;
      if (!seen.has(key)) {
        seen.add(key);
        defs.push({ patternId: mark.patternId, color: mark.color });
      }
    }
  }

  return defs;
}
