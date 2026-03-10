var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/phz-grid — <phz-column> Custom Element
 *
 * Declarative column definition element. Used as a child of <phz-grid>
 * to define columns via HTML attributes instead of JavaScript config.
 */
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
let PhzColumn = class PhzColumn extends LitElement {
    constructor() {
        super(...arguments);
        this.field = '';
        this.header = '';
        this.colWidth = 0;
        this.minWidth = 60;
        this.maxWidth = 800;
        this.sortable = true;
        this.filterable = true;
        this.editable = false;
        this.resizable = true;
        this.type = 'string';
        this.priority = 2;
        this.frozen = null;
    }
    static { this.slots = {
        header: 'Custom column header',
        cell: 'Custom cell template',
        editor: 'Custom cell editor',
        filter: 'Custom filter UI',
    }; }
    static { this.styles = css `
    :host { display: none; }
  `; }
    toColumnDefinition() {
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
    render() {
        return html `<slot></slot>`;
    }
};
__decorate([
    property({ type: String })
], PhzColumn.prototype, "field", void 0);
__decorate([
    property({ type: String })
], PhzColumn.prototype, "header", void 0);
__decorate([
    property({ type: Number, attribute: 'col-width' })
], PhzColumn.prototype, "colWidth", void 0);
__decorate([
    property({ type: Number, attribute: 'min-width' })
], PhzColumn.prototype, "minWidth", void 0);
__decorate([
    property({ type: Number, attribute: 'max-width' })
], PhzColumn.prototype, "maxWidth", void 0);
__decorate([
    property({ type: Boolean })
], PhzColumn.prototype, "sortable", void 0);
__decorate([
    property({ type: Boolean })
], PhzColumn.prototype, "filterable", void 0);
__decorate([
    property({ type: Boolean })
], PhzColumn.prototype, "editable", void 0);
__decorate([
    property({ type: Boolean })
], PhzColumn.prototype, "resizable", void 0);
__decorate([
    property({ type: String })
], PhzColumn.prototype, "type", void 0);
__decorate([
    property({ type: Number })
], PhzColumn.prototype, "priority", void 0);
__decorate([
    property({ type: String })
], PhzColumn.prototype, "frozen", void 0);
PhzColumn = __decorate([
    customElement('phz-column')
], PhzColumn);
export { PhzColumn };
//# sourceMappingURL=phz-column.js.map