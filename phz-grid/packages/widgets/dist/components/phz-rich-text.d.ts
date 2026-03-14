/**
 * @phozart/widgets — Rich Text Widget
 *
 * Displays formatted text content (plain, HTML, or Markdown).
 * Supports optional max height with truncation indicator.
 */
import { LitElement } from 'lit';
import { type RichTextFormat } from '../rich-text-state.js';
export declare class PhzRichText extends LitElement {
    static styles: import("lit").CSSResult[];
    /** Text content to display. */
    content: string;
    /** Content format. */
    format: RichTextFormat;
    /** Maximum height in pixels (0 = unlimited). */
    maxHeight: number;
    private textState;
    private showFull;
    willUpdate(changedProps: Map<string, unknown>): void;
    private handleExpand;
    render(): import("lit-html").TemplateResult<1>;
    private renderContent;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-rich-text': PhzRichText;
    }
}
//# sourceMappingURL=phz-rich-text.d.ts.map