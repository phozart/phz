export class AggregationController {
    constructor(host) {
        this.host = host;
        host.addController(this);
    }
    hostConnected() { }
    hostDisconnected() { }
    computeColumnAgg(rows, col, fn) {
        const values = rows
            .map(r => col.valueGetter ? col.valueGetter(r) : r[col.field])
            .filter(v => v != null && v !== '');
        switch (fn) {
            case 'count': return String(values.length);
            case 'sum': {
                const nums = values.map(Number).filter(n => !isNaN(n));
                return nums.reduce((s, n) => s + n, 0).toLocaleString();
            }
            case 'avg': {
                const nums = values.map(Number).filter(n => !isNaN(n));
                if (nums.length === 0)
                    return '0';
                return (nums.reduce((s, n) => s + n, 0) / nums.length).toLocaleString(undefined, { maximumFractionDigits: 2 });
            }
            case 'min': {
                const nums = values.map(Number).filter(n => !isNaN(n));
                return nums.length ? nums.reduce((m, v) => v < m ? v : m, Infinity).toLocaleString() : '';
            }
            case 'max': {
                const nums = values.map(Number).filter(n => !isNaN(n));
                return nums.length ? nums.reduce((m, v) => v > m ? v : m, -Infinity).toLocaleString() : '';
            }
            default: return String(values.length);
        }
    }
}
//# sourceMappingURL=aggregation.controller.js.map