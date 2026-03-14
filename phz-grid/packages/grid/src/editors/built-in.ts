/**
 * @phozart/grid — Built-in Cell Editors
 */
import { html, css, type TemplateResult } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import type { RowData, ColumnDefinition } from '@phozart/core';
import { PhzCellEditor } from './base-editor.js';

const editorStyles = css`
  :host { display: block; width: 100%; }
  input, select {
    width: 100%;
    box-sizing: border-box;
    padding: var(--phz-spacing-xs, 4px) var(--phz-spacing-sm, 8px);
    font: inherit;
    border: 1px solid var(--phz-cell-border-editing, blue);
    border-radius: var(--phz-border-radius-sm, 2px);
    outline: none;
    background: var(--phz-cell-bg-editing, white);
  }
  input:focus, select:focus {
    box-shadow: 0 0 0 var(--phz-focus-ring-width, 2px) var(--phz-focus-ring-color, blue);
  }
`;

@customElement('phz-text-editor')
export class TextCellEditor extends PhzCellEditor {
  static override styles = editorStyles;

  @query('input') private inputEl!: HTMLInputElement;

  renderEditor(value: unknown): TemplateResult {
    return html`<input type="text" .value="${String(value ?? '')}" @keydown="${this.handleKeyDown}" />`;
  }

  getValue(): unknown {
    return this.inputEl?.value ?? '';
  }

  focusEditor(): void {
    this.inputEl?.focus();
    this.inputEl?.select();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      this.dispatchEvent(new CustomEvent('editor-commit', { bubbles: true, composed: true }));
    } else if (e.key === 'Escape') {
      this.dispatchEvent(new CustomEvent('editor-cancel', { bubbles: true, composed: true }));
    }
  }
}

@customElement('phz-number-editor')
export class NumberCellEditor extends PhzCellEditor {
  static override styles = editorStyles;

  @query('input') private inputEl!: HTMLInputElement;

  renderEditor(value: unknown): TemplateResult {
    const num = value != null ? String(value) : '';
    return html`<input type="number" .value="${num}" @keydown="${this.handleKeyDown}" />`;
  }

  getValue(): unknown {
    const val = this.inputEl?.value;
    return val === '' ? null : Number(val);
  }

  focusEditor(): void {
    this.inputEl?.focus();
    this.inputEl?.select();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      this.dispatchEvent(new CustomEvent('editor-commit', { bubbles: true, composed: true }));
    } else if (e.key === 'Escape') {
      this.dispatchEvent(new CustomEvent('editor-cancel', { bubbles: true, composed: true }));
    }
  }
}

@customElement('phz-select-editor')
export class SelectCellEditor extends PhzCellEditor {
  static override styles = editorStyles;

  @query('select') private selectEl!: HTMLSelectElement;

  renderEditor(value: unknown, _row: RowData, column: ColumnDefinition): TemplateResult {
    const options: string[] = (column as any).editorParams?.options ?? [];
    return html`
      <select @change="${this.handleChange}" @keydown="${this.handleKeyDown}">
        ${options.map(
          (opt) => html`<option value="${opt}" ?selected="${opt === value}">${opt}</option>`,
        )}
      </select>
    `;
  }

  getValue(): unknown {
    return this.selectEl?.value ?? '';
  }

  focusEditor(): void {
    this.selectEl?.focus();
  }

  private handleChange(): void {
    this.dispatchEvent(new CustomEvent('editor-commit', { bubbles: true, composed: true }));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.dispatchEvent(new CustomEvent('editor-cancel', { bubbles: true, composed: true }));
    }
  }
}

@customElement('phz-date-editor')
export class DateCellEditor extends PhzCellEditor {
  static override styles = editorStyles;

  @query('input') private inputEl!: HTMLInputElement;

  renderEditor(value: unknown): TemplateResult {
    let dateStr = '';
    if (value instanceof Date) {
      dateStr = value.toISOString().split('T')[0];
    } else if (typeof value === 'string') {
      dateStr = value;
    }
    return html`<input type="date" .value="${dateStr}" @keydown="${this.handleKeyDown}" />`;
  }

  getValue(): unknown {
    const val = this.inputEl?.value;
    return val ? new Date(val) : null;
  }

  focusEditor(): void {
    this.inputEl?.focus();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      this.dispatchEvent(new CustomEvent('editor-commit', { bubbles: true, composed: true }));
    } else if (e.key === 'Escape') {
      this.dispatchEvent(new CustomEvent('editor-cancel', { bubbles: true, composed: true }));
    }
  }
}

@customElement('phz-checkbox-editor')
export class CheckboxCellEditor extends PhzCellEditor {
  static override styles = css`
    :host { display: flex; align-items: center; justify-content: center; }
    input[type="checkbox"] { width: 20px; height: 20px; cursor: pointer; padding: 12px; }
  `;

  @query('input') private inputEl!: HTMLInputElement;

  renderEditor(value: unknown): TemplateResult {
    return html`<input type="checkbox" .checked="${Boolean(value)}" @change="${this.handleChange}" @keydown="${this.handleKeyDown}" />`;
  }

  getValue(): unknown {
    return this.inputEl?.checked ?? false;
  }

  focusEditor(): void {
    this.inputEl?.focus();
  }

  private handleChange(): void {
    this.dispatchEvent(new CustomEvent('editor-commit', { bubbles: true, composed: true }));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.dispatchEvent(new CustomEvent('editor-cancel', { bubbles: true, composed: true }));
    }
  }
}
