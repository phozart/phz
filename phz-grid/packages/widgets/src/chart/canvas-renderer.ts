/**
 * @phozart/widgets — Canvas Chart Renderer (Phase 6)
 *
 * Renders chart marks to a <canvas> element using the 2D context.
 * Optimized for datasets >2000 points. Uses requestAnimationFrame for
 * batched updates.
 *
 * Implements the IChartRenderer interface.
 */

import type { ChartLayout, BarMark, PointMark } from './chart-layout.js';
import type { IChartRenderer, RenderOptions } from './chart-renderer.js';

export class CanvasChartRenderer implements IChartRenderer {
  readonly type = 'canvas' as const;

  private ctx: CanvasRenderingContext2D | null = null;
  private dpr = 1;

  /**
   * Attach to a canvas element. Must be called before render().
   */
  attach(canvas: HTMLCanvasElement): void {
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
  }

  /**
   * Render the chart layout onto the attached canvas.
   */
  render(layout: ChartLayout, options: RenderOptions): void {
    const ctx = this.ctx;
    if (!ctx) return;

    const { width, height } = layout.dimensions;
    const canvas = ctx.canvas;

    // Set canvas size accounting for device pixel ratio
    canvas.width = width * this.dpr;
    canvas.height = height * this.dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(this.dpr, this.dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Render grid lines
    this.renderGridLines(ctx, layout);

    // Render marks
    const visibleMarks = layout.marks.filter(m => !options.hiddenSeries.has(m.seriesIndex));

    for (const mark of visibleMarks) {
      switch (mark.kind) {
        case 'bar':
          this.renderBar(ctx, mark);
          break;
        case 'area':
          ctx.globalAlpha = mark.opacity;
          ctx.fillStyle = mark.color;
          this.renderPath(ctx, mark.path);
          ctx.fill();
          ctx.globalAlpha = 1;
          break;
        case 'line':
          ctx.strokeStyle = mark.color;
          ctx.lineWidth = mark.strokeWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          if (mark.strokeDash) {
            ctx.setLineDash(mark.strokeDash);
          }
          this.renderPath(ctx, mark.path);
          ctx.stroke();
          ctx.setLineDash([]);
          break;
        case 'point':
          this.renderPoint(ctx, mark);
          break;
      }
    }

    // Render axes
    this.renderAxes(ctx, layout);
  }

  private renderGridLines(ctx: CanvasRenderingContext2D, layout: ChartLayout): void {
    const { padding, plotWidth, plotHeight } = layout.dimensions;

    ctx.strokeStyle = '#E7E5E4';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;

    if (layout.yAxis.gridLines) {
      for (const tick of layout.yAxis.ticks) {
        ctx.beginPath();
        ctx.moveTo(padding.left, tick.position);
        ctx.lineTo(padding.left + plotWidth, tick.position);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
  }

  private renderBar(ctx: CanvasRenderingContext2D, mark: BarMark): void {
    ctx.fillStyle = mark.color;

    if (mark.cornerRadius > 0) {
      this.roundRect(ctx, mark.x, mark.y, mark.width, mark.height, mark.cornerRadius);
      ctx.fill();
    } else {
      ctx.fillRect(mark.x, mark.y, mark.width, mark.height);
    }
  }

  private renderPoint(ctx: CanvasRenderingContext2D, mark: PointMark): void {
    ctx.beginPath();
    ctx.arc(mark.cx, mark.cy, mark.r, 0, Math.PI * 2);

    if (mark.filled) {
      ctx.fillStyle = mark.color;
      ctx.fill();
    }

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  private renderAxes(ctx: CanvasRenderingContext2D, layout: ChartLayout): void {
    const { padding, plotWidth, plotHeight } = layout.dimensions;

    ctx.strokeStyle = '#A8A29E';
    ctx.lineWidth = 1;

    if (layout.xAxis.show) {
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top + plotHeight);
      ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
      ctx.stroke();

      ctx.fillStyle = '#78716C';
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';

      for (const tick of layout.xAxis.ticks) {
        ctx.fillText(tick.label, tick.position, padding.top + plotHeight + 16);
      }
    }

    if (layout.yAxis.show) {
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, padding.top + plotHeight);
      ctx.stroke();

      ctx.fillStyle = '#78716C';
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';

      for (const tick of layout.yAxis.ticks) {
        ctx.fillText(tick.label, padding.left - 8, tick.position + 4);
      }
    }
  }

  /** Parse SVG path string and draw on canvas context. */
  private renderPath(ctx: CanvasRenderingContext2D, pathD: string): void {
    ctx.beginPath();
    const commands = pathD.match(/[MLCHVZ][^MLCHVZ]*/gi) ?? [];

    for (const cmd of commands) {
      const type = cmd[0];
      const args = cmd.slice(1).trim().split(/[\s,]+/).map(Number);

      switch (type) {
        case 'M': ctx.moveTo(args[0], args[1]); break;
        case 'L': ctx.lineTo(args[0], args[1]); break;
        case 'H': ctx.lineTo(args[0], (ctx as any).__lastY ?? 0); break;
        case 'V': ctx.lineTo((ctx as any).__lastX ?? 0, args[0]); break;
        case 'C':
          ctx.bezierCurveTo(args[0], args[1], args[2], args[3], args[4], args[5]);
          break;
        case 'Z': ctx.closePath(); break;
      }
    }
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
  ): void {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

/**
 * Determine the optimal renderer based on data point count.
 */
export function autoSelectRenderer(totalPoints: number): 'svg' | 'hybrid' | 'canvas' {
  if (totalPoints < 2000) return 'svg';
  if (totalPoints <= 10000) return 'hybrid';
  return 'canvas';
}
