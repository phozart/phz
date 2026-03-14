/**
 * @phozart/grid — PhzCellRenderer (Abstract Base)
 *
 * All custom cell renderers extend this class.
 */
import { LitElement, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import type { RowData, ColumnDefinition } from '@phozart/core';

export abstract class PhzCellRenderer extends LitElement {
  @property({ attribute: false })
  value: unknown = undefined;

  @property({ attribute: false })
  row: RowData | null = null;

  @property({ attribute: false })
  column: ColumnDefinition | null = null;

  abstract renderCell(
    value: unknown,
    row: RowData,
    column: ColumnDefinition,
  ): TemplateResult;

  protected override render(): TemplateResult {
    if (!this.row || !this.column) return html``;
    return this.renderCell(this.value, this.row, this.column);
  }
}
