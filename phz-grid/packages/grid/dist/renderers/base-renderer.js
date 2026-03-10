var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/phz-grid — PhzCellRenderer (Abstract Base)
 *
 * All custom cell renderers extend this class.
 */
import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';
export class PhzCellRenderer extends LitElement {
    constructor() {
        super(...arguments);
        this.value = undefined;
        this.row = null;
        this.column = null;
    }
    render() {
        if (!this.row || !this.column)
            return html ``;
        return this.renderCell(this.value, this.row, this.column);
    }
}
__decorate([
    property({ attribute: false })
], PhzCellRenderer.prototype, "value", void 0);
__decorate([
    property({ attribute: false })
], PhzCellRenderer.prototype, "row", void 0);
__decorate([
    property({ attribute: false })
], PhzCellRenderer.prototype, "column", void 0);
//# sourceMappingURL=base-renderer.js.map