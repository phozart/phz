import { createConditionalFormattingEngine, } from '../features/conditional-formatting.js';
import { detectAnomalies } from '../features/anomaly-detector.js';
export class ConditionalFormattingController {
    constructor(host) {
        this.cfEngine = createConditionalFormattingEngine();
        this.anomalies = new Map();
        this.anomalyLookup = new Map();
        this.host = host;
        host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() { }
    addFormattingRule(rule) {
        this.cfEngine.addRule(rule);
        this.host.requestUpdate();
    }
    setRules(rules) {
        this.cfEngine.clearRules();
        for (const rule of rules) {
            this.cfEngine.addRule(rule);
        }
        this.host.requestUpdate();
    }
    getCellConditionalStyle(value, field, row) {
        return this.cfEngine.evaluate(value, field, row) ?? null;
    }
    runAnomalyDetection(field) {
        const results = detectAnomalies(this.host.visibleRows, field);
        this.anomalies.set(field, results);
        this.rebuildAnomalyLookup();
        this.host.requestUpdate();
    }
    isAnomalous(rowId, field) {
        const a = this.anomalyLookup.get(`${rowId}:${field}`);
        return a?.type === 'outlier';
    }
    getAnomalyResult(rowId, field) {
        return this.anomalyLookup.get(`${rowId}:${field}`);
    }
    getAnomalies() {
        return this.anomalies;
    }
    rebuildAnomalyLookup() {
        this.anomalyLookup.clear();
        for (const [field, results] of this.anomalies) {
            for (const a of results) {
                this.anomalyLookup.set(`${a.rowId}:${field}`, a);
            }
        }
    }
}
//# sourceMappingURL=conditional-formatting.controller.js.map