export class AriaManager {
    constructor(grid) {
        this.hostElement = null;
        this.shadowRoot = null;
        this.liveRegion = null;
        this.labels = {};
        this.grid = grid;
    }
    setAriaLabels(labels) {
        this.labels = labels;
    }
    getLabel(key, fallback) {
        return this.labels[key] ?? fallback;
    }
    attach(host, shadowRoot) {
        this.hostElement = host;
        this.shadowRoot = shadowRoot ?? host;
        this.ensureLiveRegion();
    }
    updateGridRole(rowCount, columnCount) {
        if (!this.hostElement)
            return;
        this.hostElement.setAttribute('role', 'grid');
        this.hostElement.setAttribute('aria-rowcount', String(rowCount + 1));
        this.hostElement.setAttribute('aria-colcount', String(columnCount));
        const gridLabel = this.labels.grid;
        if (gridLabel) {
            this.hostElement.setAttribute('aria-label', gridLabel);
        }
    }
    updateCellRole(rowAttr, colAttr, role) {
        const root = this.shadowRoot ?? this.hostElement;
        if (!root)
            return;
        const cell = root.querySelector(`[data-row="${rowAttr}"][data-col="${colAttr}"]`);
        if (cell) {
            cell.setAttribute('role', role);
        }
    }
    announceChange(message) {
        if (!this.liveRegion)
            return;
        this.liveRegion.textContent = '';
        requestAnimationFrame(() => {
            if (this.liveRegion) {
                this.liveRegion.textContent = message;
            }
        });
    }
    destroy() {
        if (this.liveRegion && this.liveRegion.parentElement) {
            this.liveRegion.parentElement.removeChild(this.liveRegion);
        }
        this.liveRegion = null;
        this.hostElement = null;
        this.shadowRoot = null;
    }
    ensureLiveRegion() {
        if (this.liveRegion)
            return;
        this.liveRegion = document.createElement('div');
        this.liveRegion.setAttribute('role', 'status');
        this.liveRegion.setAttribute('aria-live', 'polite');
        this.liveRegion.setAttribute('aria-atomic', 'true');
        this.liveRegion.className = 'phz-sr-only';
        Object.assign(this.liveRegion.style, {
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            borderWidth: '0',
        });
        const root = this.shadowRoot ?? this.hostElement;
        if (root) {
            root.appendChild(this.liveRegion);
        }
    }
}
//# sourceMappingURL=aria-manager.js.map