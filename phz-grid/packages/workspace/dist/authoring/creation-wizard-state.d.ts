/**
 * @phozart/phz-workspace — Creation Wizard Simplification State (B-3.02)
 *
 * Simplified 3-step wizard: Choose Type -> Configure -> Review.
 * Supports template selection from the templates subsystem and quick-create
 * shortcuts for common artifact types.
 */
import type { ArtifactType } from '../types.js';
export type WizardStep = 'choose-type' | 'configure' | 'review';
export interface TemplateOption {
    id: string;
    name: string;
    description: string;
    category: string;
    thumbnail?: string;
}
export interface CreationWizardState {
    step: WizardStep;
    artifactType?: ArtifactType;
    templateId?: string;
    name: string;
    description: string;
    dataSourceId?: string;
    config: Record<string, unknown>;
    quickCreate: boolean;
}
export interface CreationWizardResult {
    artifactType: ArtifactType;
    templateId: string;
    name: string;
    description: string;
    dataSourceId: string;
    config: Record<string, unknown>;
}
export interface QuickCreatePreset {
    id: string;
    label: string;
    artifactType: ArtifactType;
    templateId: string;
    defaultConfig: Record<string, unknown>;
}
export declare const QUICK_CREATE_PRESETS: QuickCreatePreset[];
export declare function initialCreationWizardState(): CreationWizardState;
export declare function canProceedWizard(state: CreationWizardState): boolean;
export declare function nextWizardStep(state: CreationWizardState): CreationWizardState;
export declare function prevWizardStep(state: CreationWizardState): CreationWizardState;
export declare function selectWizardType(state: CreationWizardState, artifactType: ArtifactType): CreationWizardState;
export declare function selectWizardTemplate(state: CreationWizardState, templateId: string): CreationWizardState;
export declare function setWizardName(state: CreationWizardState, name: string): CreationWizardState;
export declare function setWizardDescription(state: CreationWizardState, description: string): CreationWizardState;
export declare function setWizardDataSource(state: CreationWizardState, dataSourceId: string): CreationWizardState;
export declare function setWizardConfig(state: CreationWizardState, config: Record<string, unknown>): CreationWizardState;
export declare function applyQuickCreate(state: CreationWizardState, preset: QuickCreatePreset, dataSourceId: string, name: string): CreationWizardState;
export declare function filterTemplatesForType(templates: TemplateOption[], artifactType: ArtifactType): TemplateOption[];
export declare function finalizeWizard(state: CreationWizardState): CreationWizardResult | null;
//# sourceMappingURL=creation-wizard-state.d.ts.map