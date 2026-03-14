var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/grid — Built-in Cell Renderers
 */
import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { PhzCellRenderer } from './base-renderer.js';
import { formatDate, DEFAULT_DATE_FORMAT } from '../formatters/date-formatter.js';
let TextCellRenderer = class TextCellRenderer extends PhzCellRenderer {
    renderCell(value) {
        return html `<span class="phz-text-cell">${value ?? ''}</span>`;
    }
};
TextCellRenderer = __decorate([
    customElement('phz-text-cell')
], TextCellRenderer);
export { TextCellRenderer };
let NumberCellRenderer = class NumberCellRenderer extends PhzCellRenderer {
    static { this.styles = css `
    :host { text-align: right; display: block; }
  `; }
    renderCell(value) {
        const num = typeof value === 'number' ? value : Number(value);
        const display = Number.isNaN(num) ? '' : num.toLocaleString();
        return html `<span class="phz-number-cell">${display}</span>`;
    }
};
NumberCellRenderer = __decorate([
    customElement('phz-number-cell')
], NumberCellRenderer);
export { NumberCellRenderer };
let DateCellRenderer = class DateCellRenderer extends PhzCellRenderer {
    renderCell(value) {
        let display = '';
        if (value instanceof Date) {
            display = formatDate(value, DEFAULT_DATE_FORMAT);
        }
        else if (typeof value === 'string' || typeof value === 'number') {
            const d = new Date(value);
            display = Number.isNaN(d.getTime()) ? String(value) : formatDate(d, DEFAULT_DATE_FORMAT);
        }
        return html `<span class="phz-date-cell">${display}</span>`;
    }
};
DateCellRenderer = __decorate([
    customElement('phz-date-cell')
], DateCellRenderer);
export { DateCellRenderer };
let BooleanCellRenderer = class BooleanCellRenderer extends PhzCellRenderer {
    static { this.styles = css `
    :host { display: flex; align-items: center; justify-content: center; }
    .check { color: var(--phz-color-success, green); }
    .cross { color: var(--phz-color-neutral-400, gray); }
  `; }
    renderCell(value) {
        const checked = Boolean(value);
        return html `<span class="${checked ? 'check' : 'cross'}" aria-label="${checked ? 'Yes' : 'No'}">${checked ? '✓' : '✗'}</span>`;
    }
};
BooleanCellRenderer = __decorate([
    customElement('phz-boolean-cell')
], BooleanCellRenderer);
export { BooleanCellRenderer };
function isSafeUrl(url) {
    if (!url)
        return false;
    try {
        const parsed = new URL(url, 'https://placeholder.invalid');
        return parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'data:';
    }
    catch {
        return false;
    }
}
let LinkCellRenderer = class LinkCellRenderer extends PhzCellRenderer {
    renderCell(value, row, column) {
        const href = String(value ?? '');
        if (!isSafeUrl(href)) {
            return html `<span class="phz-link-cell">${href || 'Link'}</span>`;
        }
        const label = href || 'Link';
        return html `<a class="phz-link-cell" href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    }
};
LinkCellRenderer = __decorate([
    customElement('phz-link-cell')
], LinkCellRenderer);
export { LinkCellRenderer };
let ImageCellRenderer = class ImageCellRenderer extends PhzCellRenderer {
    static { this.styles = css `
    img { max-height: 100%; max-width: 100%; object-fit: contain; }
  `; }
    renderCell(value) {
        const src = String(value ?? '');
        if (!isSafeUrl(src)) {
            return html `<span class="phz-image-cell">[invalid image]</span>`;
        }
        return html `<img class="phz-image-cell" src="${src}" alt="" loading="lazy" />`;
    }
};
ImageCellRenderer = __decorate([
    customElement('phz-image-cell')
], ImageCellRenderer);
export { ImageCellRenderer };
let ProgressCellRenderer = class ProgressCellRenderer extends PhzCellRenderer {
    static { this.styles = css `
    :host { display: flex; align-items: center; gap: 8px; }
    .bar { flex: 1; height: 8px; background: var(--phz-color-neutral-200, #eee); border-radius: 4px; overflow: hidden; }
    .fill { height: 100%; background: var(--phz-color-primary, blue); border-radius: 4px; transition: width 0.2s; }
    .label { font-size: var(--phz-font-size-xs, 0.75rem); min-width: 3ch; text-align: right; }
  `; }
    renderCell(value) {
        const pct = Math.max(0, Math.min(100, Number(value) || 0));
        return html `
      <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <div class="fill" style="width:${pct}%"></div>
      </div>
      <span class="label">${pct}%</span>
    `;
    }
};
ProgressCellRenderer = __decorate([
    customElement('phz-progress-cell')
], ProgressCellRenderer);
export { ProgressCellRenderer };
//# sourceMappingURL=built-in.js.map