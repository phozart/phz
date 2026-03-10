/**
 * @phozart/phz-workspace — Connection Editor Component (Q.5)
 *
 * Lit component for configuring URL and API data source connections.
 * Provides forms for entering connection details with validation.
 */
import { LitElement } from 'lit';
export type ConnectionEditorMode = 'url' | 'api';
export declare class PhzConnectionEditor extends LitElement {
    static readonly TAG = "phz-connection-editor";
    static styles: import("lit").CSSResult;
    mode: ConnectionEditorMode;
    private _name;
    private _url;
    private _format;
    private _endpoint;
    private _method;
    private _headers;
    private _body;
    private _setMode;
    private _handleInput;
    private _isValid;
    private _handleConnect;
    private _parseHeaders;
    protected render(): import("lit-html").TemplateResult<1>;
    private _renderURLFields;
    private _renderAPIFields;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-connection-editor': PhzConnectionEditor;
    }
}
//# sourceMappingURL=phz-connection-editor.d.ts.map