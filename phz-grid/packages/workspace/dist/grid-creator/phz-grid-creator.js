/**
 * @phozart/phz-grid-creator — <phz-grid-creator>
 *
 * Main wizard modal for creating new grids/reports.
 * 5 steps: Report Identity -> Data Source -> Column Selection -> Configuration -> Review & Create
 *
 * Slot-based rendering — only the current step's component is in the DOM.
 * Draft state lives in the wizard — not committed until "Create" click.
 * Output event: grid-definition-create with CreatePayload.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeCustomElement } from '../safe-custom-element.js';
import { createWizardState, nextStep, prevStep, canProceed, buildReviewSummary, buildCreatePayload, getStepConfig, } from './wizard-state.js';
import './phz-creator-step.js';
import './phz-creator-review.js';
let PhzGridCreator = class PhzGridCreator extends LitElement {
    constructor() {
        super(...arguments);
        this.open = false;
        this._state = createWizardState();
    }
    static { this.styles = css `
    :host { display: block; }

    .wizard-backdrop {
      position: fixed; inset: 0;
      background: rgba(28, 25, 23, 0.5); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      padding: 24px; animation: fadeIn 0.15s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .wizard {
      width: 90vw; max-width: 800px; max-height: 85vh;
      background: white; border-radius: 16px;
      display: flex; flex-direction: column;
      box-shadow: 0 24px 48px rgba(28,25,23,0.18);
      overflow: hidden;
    }

    .wizard-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 24px; border-bottom: 1px solid #E7E5E4;
    }
    .wizard-title { font-size: 18px; font-weight: 700; margin: 0; }
    .close-btn {
      background: none; border: none; font-size: 18px; cursor: pointer;
      color: #78716C; width: 44px; height: 44px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .close-btn:hover { color: #1C1917; background: #F5F5F4; }

    .wizard-body {
      flex: 1; overflow-y: auto; padding: 24px;
    }

    .wizard-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 24px; border-top: 1px solid #E7E5E4;
    }

    .btn {
      padding: 8px 20px; border-radius: 8px; font-size: 14px;
      font-weight: 600; cursor: pointer; border: none;
      min-height: 44px; min-width: 44px; transition: all 0.15s ease;
    }
    .btn-secondary {
      background: #F5F5F4; color: #1C1917;
    }
    .btn-secondary:hover { background: #E7E5E4; }
    .btn-primary {
      background: #3B82F6; color: white;
    }
    .btn-primary:hover { background: #2563EB; }
    .btn-primary:disabled {
      background: #D6D3D1; color: #A8A29E; cursor: not-allowed;
    }
    .btn-create {
      background: #22C55E; color: white;
    }
    .btn-create:hover { background: #16A34A; }

    .skip-btn { color: #78716C; background: none; border: none; cursor: pointer; font-size: 13px; }
    .skip-btn:hover { color: #1C1917; }

    .step-content { min-height: 200px; }

    @media (forced-colors: active) {
      .btn { border: 1px solid ButtonText; }
      .btn-primary { background: Highlight; color: HighlightText; }
    }

    /* ── Responsive: full-screen below 768px ── */
    @media (max-width: 768px) {
      .wizard-backdrop { padding: 0; }
      .wizard {
        width: 100%; max-width: 100%;
        height: 100%; max-height: none;
        border-radius: 0;
      }
    }

    /* ── Full-screen below 576px ── */
    @media (max-width: 576px) {
      .wizard-backdrop { padding: 0; }
      .wizard {
        width: 100%; max-width: 100%;
        height: 100%; max-height: none;
        border-radius: 0;
      }
      .wizard-header { padding: 12px 16px; }
      .wizard-body { padding: 16px; }
      .wizard-footer { padding: 12px 16px; flex-wrap: wrap; gap: 8px; }
    }
  `; }
    render() {
        if (!this.open)
            return nothing;
        const stepConfig = getStepConfig(this._state.currentStep);
        const isLastStep = this._state.currentStep === this._state.totalSteps - 1;
        const isFirstStep = this._state.currentStep === 0;
        return html `
      <div class="wizard-backdrop" @click=${this._onBackdropClick}>
        <div class="wizard" @click=${(e) => e.stopPropagation()}
             role="dialog" aria-modal="true" aria-label="Create new grid"
             @keydown=${this._onKeydown}>

          <div class="wizard-header">
            <h2 class="wizard-title">Create New Grid</h2>
            <button class="close-btn" @click=${this._cancel} aria-label="Close">&times;</button>
          </div>

          <phz-creator-step
            current-step=${this._state.currentStep}
            total-steps=${this._state.totalSteps}
            .completedSteps=${this._state.completedSteps}
          ></phz-creator-step>

          <div class="wizard-body">
            <div class="step-content">
              ${this._renderCurrentStep()}
            </div>
          </div>

          <div class="wizard-footer">
            <div>
              ${!isFirstStep ? html `
                <button class="btn btn-secondary" @click=${this._prev}>Back</button>
              ` : nothing}
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              ${!stepConfig.required && !isLastStep ? html `
                <button class="skip-btn" @click=${this._next}
                        aria-label="Skip ${stepConfig.name} step (optional)">
                  Skip
                </button>
              ` : nothing}
              ${isLastStep ? html `
                <button class="btn btn-create" @click=${this._create}>Create</button>
              ` : html `
                <button class="btn btn-primary"
                        ?disabled=${!canProceed(this._state)}
                        @click=${this._next}>
                  Next
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
    }
    _renderCurrentStep() {
        switch (this._state.currentStep) {
            case 0:
                return html `
          <div class="phz-admin-field" style="margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 600; display: block; margin-bottom: 6px;">
              Report Name <span style="color: #DC2626;">*</span>
            </label>
            <input type="text" style="width: 100%; padding: 8px 12px; border: 1px solid #D6D3D1; border-radius: 8px; font-size: 14px;"
                   .value=${this._state.draft.name}
                   @input=${(e) => { this._state.draft.name = e.target.value; this.requestUpdate(); }}
                   placeholder="Enter report name..." />
          </div>
          <div class="phz-admin-field">
            <label style="font-size: 14px; font-weight: 600; display: block; margin-bottom: 6px;">Description</label>
            <textarea style="width: 100%; padding: 8px 12px; border: 1px solid #D6D3D1; border-radius: 8px; font-size: 14px; min-height: 80px; resize: vertical;"
                      .value=${this._state.draft.description}
                      @input=${(e) => { this._state.draft.description = e.target.value; this.requestUpdate(); }}
                      placeholder="Optional description..."></textarea>
          </div>
        `;
            case 1:
                return html `<p style="color: #78716C;">Select a data source for your grid. (Data source picker loads here via slot.)</p>`;
            case 2:
                return html `<p style="color: #78716C;">Configure columns for your grid. (Column chooser loads here via slot.)</p>`;
            case 3:
                return html `<p style="color: #78716C;">Optional: Configure table settings. (Table settings component loads here via slot.)</p>`;
            case 4:
                return html `
          <phz-creator-review .summary=${buildReviewSummary(this._state)}></phz-creator-review>
        `;
            default:
                return nothing;
        }
    }
    _next() {
        if (canProceed(this._state)) {
            this._state.completedSteps.add(this._state.currentStep);
            this._state = nextStep(this._state);
        }
    }
    _prev() {
        this._state = prevStep(this._state);
    }
    _cancel() {
        this._state = createWizardState();
        this.open = false;
        this.dispatchEvent(new CustomEvent('wizard-cancel', { bubbles: true, composed: true }));
    }
    _create() {
        const payload = buildCreatePayload(this._state);
        this.dispatchEvent(new CustomEvent('grid-definition-create', {
            detail: payload,
            bubbles: true,
            composed: true,
        }));
        this._state = createWizardState();
        this.open = false;
    }
    _onBackdropClick() {
        this._cancel();
    }
    _onKeydown(e) {
        if (e.key === 'Escape') {
            this._cancel();
        }
    }
};
__decorate([
    property({ type: Boolean })
], PhzGridCreator.prototype, "open", void 0);
__decorate([
    state()
], PhzGridCreator.prototype, "_state", void 0);
PhzGridCreator = __decorate([
    safeCustomElement('phz-grid-creator')
], PhzGridCreator);
export { PhzGridCreator };
//# sourceMappingURL=phz-grid-creator.js.map