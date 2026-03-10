/**
 * @phozart/phz-criteria — Preset Manager
 *
 * List, save, load, delete, and set default presets.
 * Supports personal + shared scopes with owner-based editing.
 */
import { LitElement } from 'lit';
import type { SelectionPreset } from '@phozart/phz-core';
export declare class PhzPresetManager extends LitElement {
    static styles: import("lit").CSSResult[];
    presets: SelectionPreset[];
    currentUserId: string;
    private _open;
    private _showSave;
    private _saveName;
    private _saveScope;
    private _toggle;
    private _canEdit;
    private _loadPreset;
    private _deletePreset;
    private _setDefault;
    private _openSave;
    private _doSave;
    render(): import("lit-html").TemplateResult<1>;
}
//# sourceMappingURL=phz-preset-manager.d.ts.map