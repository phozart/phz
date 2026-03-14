/**
 * @phozart/grid — Built-in Cell Renderers
 */
import { html, css, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import type { RowData, ColumnDefinition } from '@phozart/core';
import { PhzCellRenderer } from './base-renderer.js';
import { formatDate, DEFAULT_DATE_FORMAT } from '../formatters/date-formatter.js';

@customElement('phz-text-cell')
export class TextCellRenderer extends PhzCellRenderer {
  renderCell(value: unknown): TemplateResult {
    return html`<span class="phz-text-cell">${value ?? ''}</span>`;
  }
}

@customElement('phz-number-cell')
export class NumberCellRenderer extends PhzCellRenderer {
  static override styles = css`
    :host { text-align: right; display: block; }
  `;

  renderCell(value: unknown): TemplateResult {
    const num = typeof value === 'number' ? value : Number(value);
    const display = Number.isNaN(num) ? '' : num.toLocaleString();
    return html`<span class="phz-number-cell">${display}</span>`;
  }
}

@customElement('phz-date-cell')
export class DateCellRenderer extends PhzCellRenderer {
  renderCell(value: unknown): TemplateResult {
    let display = '';
    if (value instanceof Date) {
      display = formatDate(value, DEFAULT_DATE_FORMAT);
    } else if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      display = Number.isNaN(d.getTime()) ? String(value) : formatDate(d, DEFAULT_DATE_FORMAT);
    }
    return html`<span class="phz-date-cell">${display}</span>`;
  }
}

@customElement('phz-boolean-cell')
export class BooleanCellRenderer extends PhzCellRenderer {
  static override styles = css`
    :host { display: flex; align-items: center; justify-content: center; }
    .check { color: var(--phz-color-success, green); }
    .cross { color: var(--phz-color-neutral-400, gray); }
  `;

  renderCell(value: unknown): TemplateResult {
    const checked = Boolean(value);
    return html`<span class="${checked ? 'check' : 'cross'}" aria-label="${checked ? 'Yes' : 'No'}">${checked ? '✓' : '✗'}</span>`;
  }
}

function isSafeUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url, 'https://placeholder.invalid');
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'data:';
  } catch {
    return false;
  }
}

@customElement('phz-link-cell')
export class LinkCellRenderer extends PhzCellRenderer {
  renderCell(value: unknown, row: RowData, column: ColumnDefinition): TemplateResult {
    const href = String(value ?? '');
    if (!isSafeUrl(href)) {
      return html`<span class="phz-link-cell">${href || 'Link'}</span>`;
    }
    const label = href || 'Link';
    return html`<a class="phz-link-cell" href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  }
}

@customElement('phz-image-cell')
export class ImageCellRenderer extends PhzCellRenderer {
  static override styles = css`
    img { max-height: 100%; max-width: 100%; object-fit: contain; }
  `;

  renderCell(value: unknown): TemplateResult {
    const src = String(value ?? '');
    if (!isSafeUrl(src)) {
      return html`<span class="phz-image-cell">[invalid image]</span>`;
    }
    return html`<img class="phz-image-cell" src="${src}" alt="" loading="lazy" />`;
  }
}

@customElement('phz-progress-cell')
export class ProgressCellRenderer extends PhzCellRenderer {
  static override styles = css`
    :host { display: flex; align-items: center; gap: 8px; }
    .bar { flex: 1; height: 8px; background: var(--phz-color-neutral-200, #eee); border-radius: 4px; overflow: hidden; }
    .fill { height: 100%; background: var(--phz-color-primary, blue); border-radius: 4px; transition: width 0.2s; }
    .label { font-size: var(--phz-font-size-xs, 0.75rem); min-width: 3ch; text-align: right; }
  `;

  renderCell(value: unknown): TemplateResult {
    const pct = Math.max(0, Math.min(100, Number(value) || 0));
    return html`
      <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <div class="fill" style="width:${pct}%"></div>
      </div>
      <span class="label">${pct}%</span>
    `;
  }
}
