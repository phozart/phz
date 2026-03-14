/**
 * @phozart/grid — AriaManager
 *
 * Manages ARIA attributes on the grid's DOM elements to maintain
 * screen reader accessibility, including the semantic shadow layer
 * for virtualized content.
 *
 * Uses separate host element (for setAttribute) and shadowRoot
 * (for querySelector/appendChild) to avoid the crash when the grid
 * passes its renderRoot instead of the host.
 */
import type { GridApi, AriaLabels } from '@phozart/core';

export class AriaManager {
  private hostElement: HTMLElement | null = null;
  private shadowRoot: DocumentFragment | null = null;
  private liveRegion: HTMLElement | null = null;
  private grid: GridApi;
  private labels: AriaLabels = {};

  constructor(grid: GridApi) {
    this.grid = grid;
  }

  setAriaLabels(labels: AriaLabels): void {
    this.labels = labels;
  }

  getLabel(key: keyof AriaLabels, fallback: string): string {
    return this.labels[key] ?? fallback;
  }

  attach(host: HTMLElement, shadowRoot?: DocumentFragment | HTMLElement): void {
    this.hostElement = host;
    this.shadowRoot = (shadowRoot as DocumentFragment) ?? host;
    this.ensureLiveRegion();
  }

  updateGridRole(rowCount: number, columnCount: number): void {
    if (!this.hostElement) return;
    this.hostElement.setAttribute('role', 'grid');
    this.hostElement.setAttribute('aria-rowcount', String(rowCount + 1));
    this.hostElement.setAttribute('aria-colcount', String(columnCount));
    const gridLabel = this.labels.grid;
    if (gridLabel) {
      this.hostElement.setAttribute('aria-label', gridLabel);
    }
  }

  updateCellRole(rowAttr: string, colAttr: string, role: string): void {
    const root = this.shadowRoot ?? this.hostElement;
    if (!root) return;
    const cell = root.querySelector(
      `[data-row="${rowAttr}"][data-col="${colAttr}"]`
    );
    if (cell) {
      cell.setAttribute('role', role);
    }
  }

  announceChange(message: string): void {
    if (!this.liveRegion) return;
    this.liveRegion.textContent = '';
    requestAnimationFrame(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    });
  }

  destroy(): void {
    if (this.liveRegion && this.liveRegion.parentElement) {
      this.liveRegion.parentElement.removeChild(this.liveRegion);
    }
    this.liveRegion = null;
    this.hostElement = null;
    this.shadowRoot = null;
  }

  private ensureLiveRegion(): void {
    if (this.liveRegion) return;
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'phz-sr-only';
    Object.assign(this.liveRegion.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      borderWidth: '0',
    });
    const root = this.shadowRoot ?? this.hostElement;
    if (root) {
      root.appendChild(this.liveRegion);
    }
  }
}
