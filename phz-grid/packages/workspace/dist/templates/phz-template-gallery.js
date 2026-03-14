/**
 * @phozart/workspace — Template Gallery
 *
 * Lit component and utilities for browsing and selecting templates.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
// --- Pure utilities ---
export function filterTemplates(templates, query) {
    if (!query.trim())
        return templates;
    const q = query.toLowerCase();
    return templates.filter(t => t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q)));
}
export function groupTemplatesByCategory(templates) {
    const groups = new Map();
    for (const t of templates) {
        let group = groups.get(t.category);
        if (!group) {
            group = [];
            groups.set(t.category, group);
        }
        group.push(t);
    }
    return groups;
}
// --- Lit Component ---
let PhzTemplateGallery = class PhzTemplateGallery extends LitElement {
    constructor() {
        super(...arguments);
        this.templates = [];
        this._search = '';
    }
    static { this.styles = css `
    :host { display: block; }
    .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .card {
      border: 1px solid var(--phz-border-color, #e0e0e0);
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
    }
    .card:hover { border-color: var(--phz-accent-color, #1976d2); }
    .card-name { font-weight: 600; margin-bottom: 4px; }
    .card-desc { font-size: 0.85em; color: var(--phz-text-secondary, #666); }
    .card-tags { margin-top: 8px; display: flex; gap: 4px; flex-wrap: wrap; }
    .tag { font-size: 0.75em; background: var(--phz-tag-bg, #f0f0f0); padding: 2px 6px; border-radius: 4px; }
  `; }
    render() {
        const filtered = filterTemplates(this.templates, this._search);
        return html `
      <div class="gallery" role="list" aria-label="Template gallery">
        ${filtered.map(t => html `
          <div class="card" role="listitem" tabindex="0"
            @click="${() => this._select(t)}"
            @keydown="${(e) => { if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._select(t);
        } }}">
            <div class="card-name">${t.name}</div>
            <div class="card-desc">${t.description}</div>
            <div class="card-tags">${t.tags.map(tag => html `<span class="tag">${tag}</span>`)}</div>
          </div>
        `)}
      </div>
    `;
    }
    _select(template) {
        this.dispatchEvent(new CustomEvent('template-select', {
            detail: { template },
            bubbles: true,
            composed: true,
        }));
    }
};
__decorate([
    property({ type: Array })
], PhzTemplateGallery.prototype, "templates", void 0);
__decorate([
    state()
], PhzTemplateGallery.prototype, "_search", void 0);
PhzTemplateGallery = __decorate([
    safeCustomElement('phz-template-gallery')
], PhzTemplateGallery);
export { PhzTemplateGallery };
//# sourceMappingURL=phz-template-gallery.js.map