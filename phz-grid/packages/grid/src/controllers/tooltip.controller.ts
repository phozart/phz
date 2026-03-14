import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface TooltipHost extends ReactiveControllerHost {
  enableCellTooltips: boolean;
  tooltipDelay: number;
  renderRoot: ShadowRoot;
}

/**
 * Position info for tooltip placement.
 */
export interface TooltipPosition {
  top: number;
  left: number;
  placement: 'above' | 'below';
}

export class TooltipController implements ReactiveController {
  private host: TooltipHost;
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private tooltipEl: HTMLDivElement | null = null;
  private boundMouseOver: EventListener | null = null;
  private boundMouseOut: EventListener | null = null;
  private boundScroll: EventListener | null = null;

  constructor(host: TooltipHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {
    if (!this.host.enableCellTooltips) return;

    this.boundMouseOver = ((e: Event) => this.handleMouseOver(e as MouseEvent)) as EventListener;
    this.boundMouseOut = ((e: Event) => this.handleMouseOut(e as MouseEvent)) as EventListener;
    this.boundScroll = (() => this.hideTooltip()) as EventListener;

    const root = this.host.renderRoot;
    root.addEventListener('mouseover', this.boundMouseOver);
    root.addEventListener('mouseout', this.boundMouseOut);
    root.addEventListener('scroll', this.boundScroll, true);
  }

  hostDisconnected(): void {
    this.hideTooltip();
    this.clearTimers();

    const root = this.host.renderRoot;
    if (this.boundMouseOver) root.removeEventListener('mouseover', this.boundMouseOver);
    if (this.boundMouseOut) root.removeEventListener('mouseout', this.boundMouseOut);
    if (this.boundScroll) root.removeEventListener('scroll', this.boundScroll, true);

    this.boundMouseOver = null;
    this.boundMouseOut = null;
    this.boundScroll = null;
  }

  private handleMouseOver(e: MouseEvent): void {
    if (!this.host.enableCellTooltips) return;

    const target = e.target as HTMLElement;
    const cell = target.closest?.('.phz-data-cell') as HTMLElement | null;
    if (!cell) return;

    if (!this.isTruncated(cell)) return;

    this.clearTimers();
    this.showTimer = setTimeout(() => {
      this.showTooltip(cell);
    }, this.host.tooltipDelay);
  }

  private handleMouseOut(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const cell = target.closest?.('.phz-data-cell') as HTMLElement | null;
    if (!cell) return;

    // Don't hide if mouse is still within the same cell (prevents flicker
    // when moving between child elements like spans, icons, badges).
    const related = e.relatedTarget as HTMLElement | null;
    if (related && cell.contains(related)) return;

    this.clearTimers();
    this.hideTimer = setTimeout(() => {
      this.hideTooltip();
    }, 50);
  }

  /**
   * Check if an element's content is truncated.
   */
  isTruncated(el: HTMLElement): boolean {
    return el.scrollWidth > el.offsetWidth || el.scrollHeight > el.offsetHeight;
  }

  /**
   * Get the text content for the tooltip.
   */
  getTooltipContent(el: HTMLElement): string {
    return el.textContent?.trim() ?? '';
  }

  /**
   * Compute tooltip position relative to the target element.
   */
  computePosition(target: HTMLElement, viewportHeight = 0): TooltipPosition {
    const rect = target.getBoundingClientRect?.();
    if (!rect) return { top: 0, left: 0, placement: 'below' };

    const TOOLTIP_OFFSET = 8;
    const ESTIMATED_TOOLTIP_HEIGHT = 40;

    // Default: below the cell
    let top = rect.bottom + TOOLTIP_OFFSET;
    let placement: 'above' | 'below' = 'below';

    // Flip above if near bottom of viewport
    if (viewportHeight > 0 && top + ESTIMATED_TOOLTIP_HEIGHT > viewportHeight) {
      top = rect.top - TOOLTIP_OFFSET - ESTIMATED_TOOLTIP_HEIGHT;
      placement = 'above';
    }

    return { top, left: rect.left, placement };
  }

  private showTooltip(cell: HTMLElement): void {
    const content = this.getTooltipContent(cell);
    if (!content) return;

    this.hideTooltip();

    const el = document.createElement('div');
    el.className = 'phz-cell-tooltip';
    el.textContent = content;
    el.setAttribute('role', 'tooltip');

    // Position — use document.body so position:fixed works relative to
    // the viewport, not a shadow root with contain:style on the host.
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
    const pos = this.computePosition(cell, viewportHeight);
    el.style.position = 'fixed';
    el.style.top = `${pos.top}px`;
    el.style.left = `${pos.left}px`;
    el.style.zIndex = '100';
    el.style.background = 'var(--phz-tooltip-bg, #1f2937)';
    el.style.color = 'var(--phz-tooltip-text, #ffffff)';
    el.style.padding = '6px 10px';
    el.style.borderRadius = '4px';
    el.style.fontSize = '12px';
    el.style.maxWidth = '400px';
    el.style.wordWrap = 'break-word';
    el.style.pointerEvents = 'none';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';

    document.body.appendChild(el);
    this.tooltipEl = el;
  }

  hideTooltip(): void {
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }
  }

  private clearTimers(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}
