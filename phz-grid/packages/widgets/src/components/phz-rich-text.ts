/**
 * @phozart/widgets — Rich Text Widget
 *
 * Displays formatted text content (plain, HTML, or Markdown).
 * Supports optional max height with truncation indicator.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import {
  createRichTextState,
  setMaxHeight,
  type RichTextState,
  type RichTextFormat,
} from '../rich-text-state.js';

@customElement('phz-rich-text')
export class PhzRichText extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host {
        display: block;
        container-type: inline-size;
      }

      .rich-text {
        font-size: 14px;
        line-height: 1.6;
        color: var(--phz-w-text, #1C1917);
        word-break: break-word;
        overflow-wrap: break-word;
      }

      .rich-text--truncated {
        position: relative;
        overflow: hidden;
      }

      .rich-text--truncated::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 40px;
        background: linear-gradient(transparent, var(--phz-w-bg, #FFFFFF));
        pointer-events: none;
      }

      .rich-text__expand {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        font-weight: 500;
        color: #3B82F6;
        cursor: pointer;
        background: none;
        border: none;
        padding: 2px 0;
      }

      .rich-text__expand:hover {
        text-decoration: underline;
      }

      .rich-text__expand:focus-visible {
        outline: 2px solid #3B82F6;
        outline-offset: 2px;
      }

      /* Pre-formatted for plain text */
      .rich-text--plain {
        white-space: pre-wrap;
        font-family: inherit;
      }

      @container (max-width: 300px) {
        .rich-text {
          font-size: 13px;
          line-height: 1.5;
        }
      }
    `,
  ];

  /** Text content to display. */
  @property({ type: String }) content: string = '';

  /** Content format. */
  @property({ type: String }) format: RichTextFormat = 'plain';

  /** Maximum height in pixels (0 = unlimited). */
  @property({ type: Number }) maxHeight: number = 0;

  @state() private textState: RichTextState = createRichTextState('');
  @state() private showFull: boolean = false;

  willUpdate(changedProps: Map<string, unknown>) {
    if (changedProps.has('content') || changedProps.has('format') || changedProps.has('maxHeight')) {
      this.textState = createRichTextState(this.content, this.format);
      if (this.maxHeight > 0) {
        this.textState = setMaxHeight(this.textState, this.maxHeight);
      }
    }
  }

  private handleExpand() {
    this.showFull = !this.showFull;
    this.dispatchEvent(new CustomEvent('rich-text-expand', {
      bubbles: true,
      composed: true,
      detail: { expanded: this.showFull },
    }));
  }

  render() {
    if (!this.content) {
      return html`<div class="phz-w-card phz-w-state"><p class="phz-w-state__message">No content</p></div>`;
    }

    const isTruncated = this.textState.truncated && !this.showFull;
    const style = isTruncated && this.maxHeight > 0
      ? `max-height: ${this.maxHeight}px`
      : '';

    return html`
      <div class="phz-w-card" role="article">
        <div
          class="rich-text rich-text--${this.format} ${isTruncated ? 'rich-text--truncated' : ''}"
          style="${style}"
        >
          ${this.renderContent()}
        </div>
        ${this.textState.truncated
          ? html`
            <button
              class="rich-text__expand"
              @click=${this.handleExpand}
              aria-expanded="${this.showFull}"
            >
              ${this.showFull ? 'Show less' : 'Show more'}
            </button>
          `
          : nothing}
      </div>
    `;
  }

  private renderContent() {
    // For plain text, render as-is (CSS handles whitespace)
    // For HTML, use unsafeHTML in real component; here we render safely
    // For markdown, a real implementation would parse markdown
    return this.content;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-rich-text': PhzRichText;
  }
}
