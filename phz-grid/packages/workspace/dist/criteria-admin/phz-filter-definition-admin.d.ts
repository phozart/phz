/**
 * @phozart/phz-criteria — Filter Definition Admin
 *
 * Two-view admin component for managing artefact-independent filter definitions
 * and their bindings to artefacts. CSS prefix: phz-fda-
 *
 * @deprecated Use `<phz-filter-designer>` for definition management and
 * `<phz-filter-configurator>` for artefact binding. This component remains
 * functional for backward compatibility.
 *
 * Events:
 * - definition-create: { definition }
 * - definition-update: { id, patch }
 * - definition-deprecate: { id }
 * - binding-add: { filterDefinitionId, artefactId, order }
 * - binding-remove: { filterDefinitionId, artefactId }
 * - binding-update: { filterDefinitionId, artefactId, patch }
 */
import { LitElement } from 'lit';
import type { FilterDefinition, FilterBinding } from '@phozart/phz-core';
export declare class PhzFilterDefinitionAdmin extends LitElement {
    static styles: import("lit").CSSResult[];
    definitions: FilterDefinition[];
    bindings: FilterBinding[];
    artefactId: string;
    private _view;
    private _editingId;
    private _editingLabel;
    private _showNewForm;
    private _deprecationWarned;
    connectedCallback(): void;
    private _newLabel;
    private _newType;
    private _newSession;
    render(): import("lit-html").TemplateResult<1>;
    private _renderDefinitions;
    private _renderNewForm;
    private _renderBindings;
    private _commitLabelEdit;
    private _createDefinition;
    private _dispatchEvent;
}
//# sourceMappingURL=phz-filter-definition-admin.d.ts.map