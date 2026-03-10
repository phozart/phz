/**
 * @phozart/phz-widgets — Container Box Widget
 *
 * A visual container that groups child widgets with a configurable
 * appearance (background, border, shadow, padding) and optional
 * collapse/expand behavior.
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { widgetBaseStyles } from '../shared-styles.js';
import type { ContainerBoxConfig } from '@phozart/phz-shared/types';
import { createDefaultContainerBoxConfig } from '@phozart/phz-shared/types';
import {
  createContainerBoxState,
  toggleContainerCollapse,
  type ContainerBoxState,
} from '../container-box-state.js';

@customElement('phz-container-box')
export class PhzContainerBox extends LitElement {
  static styles = [
    widgetBaseStyles,
    css`
      :host {
        display: block;
        container-type: inline-size;
      }

      .container-box {
        transition: all 0.2s ease;
        overflow: hidden;
      }

      .container-box--collapsed .container-box__content {
        display: none;
      }

      .container-box__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        user-select: none;
        min-height: 36px;
      }

      .container-box__header:focus-visible {
        outline: 2px solid #3B82F6;
        outline-offset: -2px;
        border-radius: 4px;
      }

      .container-box__title {
        font-size: 14px;
        font-weight: 600;
        color: var(--phz-w-text, #1C1917);
        margin: 0;
      }

      .container-box__toggle {
        font-size: 12px;
        color: var(--phz-w-text-muted, #78716C);
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: color 0.15s ease;
      }

      .container-box__toggle:hover {
        color: var(--phz-w-text, #1C1917);
      }

      .container-box__content {
        margin-top: 8px;
      }

      @container (max-width: 300px) {
        .container-box__header {
          min-height: 32px;
        }
        .container-box__title {
          font-size: 13px;
        }
      }
    `,
  ];

  /** Container box configuration. */
  @property({ attribute: false }) config: ContainerBoxConfig = createDefaultContainerBoxConfig();

  /** Optional title displayed in the header. */
  @property({ type: String }) boxTitle?: string;

  @state() private boxState: ContainerBoxState = createContainerBoxState(createDefaultContainerBoxConfig());

  willUpdate(changedProps: Map<string, unknown>) {
    if (changedProps.has('config')) {
      this.boxState = createContainerBoxState(this.config);
    }
  }

  private handleToggle() {
    this.boxState = toggleContainerCollapse(this.boxState);
    this.requestUpdate();
    this.dispatchEvent(new CustomEvent('container-toggle', {
      bubbles: true,
      composed: true,
      detail: { collapsed: this.boxState.collapsed },
    }));
  }

  render() {
    const c = this.config;
    const containerStyle = [
      `background: ${c.background}`,
      `border-radius: ${c.borderRadius}px`,
      `padding: ${c.padding}px`,
      `box-shadow: ${c.shadow}`,
      `border: ${c.border}`,
      `min-height: ${c.minHeight}px`,
      c.clipOverflow ? 'overflow: hidden' : '',
    ].filter(Boolean).join('; ');

    return html`
      <div
        class="container-box ${this.boxState.collapsed ? 'container-box--collapsed' : ''}"
        style="${containerStyle}"
        role="group"
        aria-label="${this.boxTitle ?? 'Container'}"
      >
        ${c.showHeader
          ? html`
            <div
              class="container-box__header"
              tabindex="0"
              role="button"
              aria-expanded="${!this.boxState.collapsed}"
              @click=${this.handleToggle}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  this.handleToggle();
                }
              }}
            >
              <h4 class="container-box__title">${this.boxTitle ?? ''}</h4>
              <span class="container-box__toggle">
                ${this.boxState.collapsed ? '\u25B6' : '\u25BC'}
              </span>
            </div>
          `
          : nothing}
        <div class="container-box__content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'phz-container-box': PhzContainerBox;
  }
}
