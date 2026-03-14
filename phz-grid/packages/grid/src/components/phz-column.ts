/**
 * @phozart/grid — <phz-column> Custom Element
 *
 * Declarative column definition element. Used as a child of <phz-grid>
 * to define columns via HTML attributes instead of JavaScript config.
 */
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ColumnDefinition, ColumnType } from '@phozart/core';

@customElement('phz-column')
export class PhzColumn extends LitElement {
  @property({ type: String })
  field: string = '';

  @property({ type: String })
  header: string = '';

  @property({ type: Number, attribute: 'col-width' })
  colWidth: number = 0;

  @property({ type: Number, attribute: 'min-width' })
  minWidth: number = 60;

  @property({ type: Number, attribute: 'max-width' })
  maxWidth: number = 800;

  @property({ type: Boolean })
  sortable: boolean = true;

  @property({ type: Boolean })
  filterable: boolean = true;

  @property({ type: Boolean })
  editable: boolean = false;

  @property({ type: Boolean })
  resizable: boolean = true;

  @property({ type: String })
  type: ColumnType = 'string';

  @property({ type: Number })
  priority: 1 | 2 | 3 = 2;

  @property({ type: String })
  frozen: 'left' | 'right' | null = null;

  static readonly slots = {
    header: 'Custom column header',
    cell: 'Custom cell template',
    editor: 'Custom cell editor',
    filter: 'Custom filter UI',
  } as const;

  static override styles = css`
    :host { display: none; }
  `;

  toColumnDefinition(): ColumnDefinition {
    return {
      field: this.field,
      header: this.header || this.field,
      width: this.colWidth || undefined,
      minWidth: this.minWidth,
      maxWidth: this.maxWidth,
      sortable: this.sortable,
      filterable: this.filterable,
      editable: this.editable,
      resizable: this.resizable,
      type: this.type,
      priority: this.priority,
      frozen: this.frozen ?? undefined,
    };
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-column': PhzColumn;
  }
}
