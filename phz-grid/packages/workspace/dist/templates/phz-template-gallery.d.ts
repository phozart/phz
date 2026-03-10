/**
 * @phozart/phz-workspace — Template Gallery
 *
 * Lit component and utilities for browsing and selecting templates.
 */
import { LitElement } from 'lit';
import type { TemplateDefinition } from '../types.js';
export declare function filterTemplates(templates: TemplateDefinition[], query: string): TemplateDefinition[];
export declare function groupTemplatesByCategory(templates: TemplateDefinition[]): Map<string, TemplateDefinition[]>;
export declare class PhzTemplateGallery extends LitElement {
    static styles: import("lit").CSSResult;
    templates: TemplateDefinition[];
    private _search;
    render(): import("lit-html").TemplateResult<1>;
    private _select;
}
//# sourceMappingURL=phz-template-gallery.d.ts.map