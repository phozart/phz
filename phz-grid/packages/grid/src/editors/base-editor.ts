/**
 * @phozart/grid — PhzCellEditor (Abstract Base)
 *
 * All custom cell editors extend this class.
 */
import { LitElement, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import type { RowData, ColumnDefinition } from '@phozart/core';

export abstract class PhzCellEditor extends LitElement {
  @property({ attribute: false })
  value: unknown = undefined;

  @property({ attribute: false })
  row: RowData | null = null;

  @property({ attribute: false })
  column: ColumnDefinition | null = null;

  abstract renderEditor(
    value: unknown,
    row: RowData,
    column: ColumnDefinition,
  ): TemplateResult;

  abstract getValue(): unknown;

  abstract focusEditor(): void;

  protected override render(): TemplateResult {
    if (!this.row || !this.column) return html``;
    return this.renderEditor(this.value, this.row, this.column);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Auto-focus when attached
    this.updateComplete.then(() => this.focusEditor());
  }
}
