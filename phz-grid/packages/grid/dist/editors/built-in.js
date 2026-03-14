var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/**
 * @phozart/grid — Built-in Cell Editors
 */
import { html, css } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { PhzCellEditor } from './base-editor.js';
const editorStyles = css `
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
let TextCellEditor = class TextCellEditor extends PhzCellEditor {
    static { this.styles = editorStyles; }
    renderEditor(value) {
        return html `<input type="text" .value="${String(value ?? '')}" @keydown="${this.handleKeyDown}" />`;
    }
    getValue() {
        return this.inputEl?.value ?? '';
    }
    focusEditor() {
        this.inputEl?.focus();
        this.inputEl?.select();
    }
    handleKeyDown(e) {
        if (e.key === 'Enter') {
            this.dispatchEvent(new CustomEvent('editor-commit', { bubbles: true, composed: true }));
        }
        else if (e.key === 'Escape') {
            this.dispatchEvent(new CustomEvent('editor-cancel', { bubbles: true, composed: true }));
        }
    }
};
__decorate([
    query('input')
], TextCellEditor.prototype, "inputEl", void 0);
TextCellEditor = __decorate([
    customElement('phz-text-editor')
], TextCellEditor);
export { TextCellEditor };
let NumberCellEditor = class NumberCellEditor extends PhzCellEditor {
    static { this.styles = editorStyles; }
    renderEditor(value) {
        const num = value != null ? String(value) : '';
        return html `<input type="number" .value="${num}" @keydown="${this.handleKeyDown}" />`;
    }
    getValue() {
        const val = this.inputEl?.value;
        return val === '' ? null : Number(val);
    }
    focusEditor() {
        this.inputEl?.focus();
        this.inputEl?.select();
    }
    handleKeyDown(e) {
        if (e.key === 'Enter') {
            this.dispatchEvent(new CustomEvent('editor-commit', { bubbles: true, composed: true }));
        }
        else if (e.key === 'Escape') {
            this.dispatchEvent(new CustomEvent('editor-cancel', { bubbles: true, composed: true }));
        }
    }
};
__decorate([
    query('input')
], NumberCellEditor.prototype, "inputEl", void 0);
NumberCellEditor = __decorate([
    customElement('phz-number-editor')
], NumberCellEditor);
export { NumberCellEditor };
let SelectCellEditor = class SelectCellEditor extends PhzCellEditor {
    static { this.styles = editorStyles; }
    renderEditor(value, _row, column) {
        const options = column.editorParams?.options ?? [];
        return html `
      <select @change="${this.handleChange}" @keydown="${this.handleKeyDown}">
        ${options.map((opt) => html `<option value="${opt}" ?selected="${opt === value}">${opt}</option>`)}
      </select>
    `;
    }
    getValue() {
        return this.selectEl?.value ?? '';
    }
    focusEditor() {
        this.selectEl?.focus();
    }
    handleChange() {
        this.dispatchEvent(new CustomEvent('editor-commit', { bubbles: true, composed: true }));
    }
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.dispatchEvent(new CustomEvent('editor-cancel', { bubbles: true, composed: true }));
        }
    }
};
__decorate([
    query('select')
], SelectCellEditor.prototype, "selectEl", void 0);
SelectCellEditor = __decorate([
    customElement('phz-select-editor')
], SelectCellEditor);
export { SelectCellEditor };
let DateCellEditor = class DateCellEditor extends PhzCellEditor {
    static { this.styles = editorStyles; }
    renderEditor(value) {
        let dateStr = '';
        if (value instanceof Date) {
            dateStr = value.toISOString().split('T')[0];
        }
        else if (typeof value === 'string') {
            dateStr = value;
        }
        return html `<input type="date" .value="${dateStr}" @keydown="${this.handleKeyDown}" />`;
    }
    getValue() {
        const val = this.inputEl?.value;
        return val ? new Date(val) : null;
    }
    focusEditor() {
        this.inputEl?.focus();
    }
    handleKeyDown(e) {
        if (e.key === 'Enter') {
            this.dispatchEvent(new CustomEvent('editor-commit', { bubbles: true, composed: true }));
        }
        else if (e.key === 'Escape') {
            this.dispatchEvent(new CustomEvent('editor-cancel', { bubbles: true, composed: true }));
        }
    }
};
__decorate([
    query('input')
], DateCellEditor.prototype, "inputEl", void 0);
DateCellEditor = __decorate([
    customElement('phz-date-editor')
], DateCellEditor);
export { DateCellEditor };
let CheckboxCellEditor = class CheckboxCellEditor extends PhzCellEditor {
    static { this.styles = css `
    :host { display: flex; align-items: center; justify-content: center; }
    input[type="checkbox"] { width: 20px; height: 20px; cursor: pointer; padding: 12px; }
  `; }
    renderEditor(value) {
        return html `<input type="checkbox" .checked="${Boolean(value)}" @change="${this.handleChange}" @keydown="${this.handleKeyDown}" />`;
    }
    getValue() {
        return this.inputEl?.checked ?? false;
    }
    focusEditor() {
        this.inputEl?.focus();
    }
    handleChange() {
        this.dispatchEvent(new CustomEvent('editor-commit', { bubbles: true, composed: true }));
    }
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.dispatchEvent(new CustomEvent('editor-cancel', { bubbles: true, composed: true }));
        }
    }
};
__decorate([
    query('input')
], CheckboxCellEditor.prototype, "inputEl", void 0);
CheckboxCellEditor = __decorate([
    customElement('phz-checkbox-editor')
], CheckboxCellEditor);
export { CheckboxCellEditor };
//# sourceMappingURL=built-in.js.map