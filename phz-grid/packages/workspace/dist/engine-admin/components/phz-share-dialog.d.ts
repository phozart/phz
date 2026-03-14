/**
 * @phozart/engine-admin — Share Dialog
 *
 * Dialog with tabs: Embed Code, JSON Config, Link.
 * Provides copy-to-clipboard, download, and embed preview.
 */
import { LitElement } from 'lit';
export interface ShareTab {
    id: 'embed' | 'json' | 'link';
    label: string;
}
export declare const SHARE_TABS: ShareTab[];
export declare class PhzShareDialog extends LitElement {
    static styles: import("lit").CSSResult[];
    open: boolean;
    embedCode: string;
    jsonConfig: string;
    shareableUrl: string;
    private _activeTab;
    private _copyFeedback;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private _onKeyDown;
    private _close;
    private _copyText;
    private _downloadJson;
    render(): import("lit-html").TemplateResult<1>;
    private _renderTabContent;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-share-dialog': PhzShareDialog;
    }
}
//# sourceMappingURL=phz-share-dialog.d.ts.map