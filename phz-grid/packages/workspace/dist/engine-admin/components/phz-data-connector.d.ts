/**
 * @phozart/phz-engine-admin — Data Connector
 *
 * "Get Data" wizard for connecting to data sources.
 * Supports JSON, CSV, REST API, and DuckDB table/file sources.
 *
 * Events:
 * - data-connected: { sourceType, config, schema, previewData }
 */
import { LitElement } from 'lit';
export declare class PhzDataConnector extends LitElement {
    static styles: import("lit").CSSResult[];
    private step;
    private sourceType;
    private jsonData;
    private jsonUrl;
    private csvData;
    private csvDelimiter;
    private csvHasHeader;
    private restUrl;
    private restMethod;
    private restHeaders;
    private restAuthType;
    private restAuthValue;
    private duckdbTableName;
    private duckdbFilePath;
    private previewData;
    private schema;
    private error;
    private selectSourceType;
    private goBack;
    private handleConnect;
    private buildConfig;
    private parseData;
    private handleFinish;
    private renderProgress;
    private renderStep1;
    private renderStep2;
    private renderJsonForm;
    private renderCsvForm;
    private renderRestForm;
    private renderDuckdbForm;
    private renderStep3;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'phz-data-connector': PhzDataConnector;
    }
}
//# sourceMappingURL=phz-data-connector.d.ts.map