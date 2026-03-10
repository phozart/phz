var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/phz-grid — PhzCellEditor (Abstract Base)
 *
 * All custom cell editors extend this class.
 */
import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';
export class PhzCellEditor extends LitElement {
    constructor() {
        super(...arguments);
        this.value = undefined;
        this.row = null;
        this.column = null;
    }
    render() {
        if (!this.row || !this.column)
            return html ``;
        return this.renderEditor(this.value, this.row, this.column);
    }
    connectedCallback() {
        super.connectedCallback();
        // Auto-focus when attached
        this.updateComplete.then(() => this.focusEditor());
    }
}
__decorate([
    property({ attribute: false })
], PhzCellEditor.prototype, "value", void 0);
__decorate([
    property({ attribute: false })
], PhzCellEditor.prototype, "row", void 0);
__decorate([
    property({ attribute: false })
], PhzCellEditor.prototype, "column", void 0);
//# sourceMappingURL=base-editor.js.map