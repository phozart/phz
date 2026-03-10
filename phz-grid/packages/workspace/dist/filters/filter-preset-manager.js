/**
 * @phozart/phz-workspace — Filter Preset Manager (O.4)
 *
 * Save/load/share named filter presets. Headless logic —
 * Lit components can be layered on top.
 */
// ========================================================================
// Factory
// ========================================================================
let counter = 0;
function generateId() {
    return `preset_${Date.now()}_${++counter}`;
}
export function createFilterPresetManager() {
    const presets = new Map();
    const listeners = new Set();
    function notify() {
        for (const listener of listeners) {
            listener();
        }
    }
    return {
        list() {
            return Array.from(presets.values());
        },
        load(id) {
            return presets.get(id);
        },
        save(name, filters) {
            const now = Date.now();
            const preset = {
                id: generateId(),
                name,
                filters: [...filters],
                createdAt: now,
                updatedAt: now,
            };
            presets.set(preset.id, preset);
            notify();
            return preset;
        },
        update(id, changes) {
            const existing = presets.get(id);
            if (!existing)
                return;
            if (changes.name !== undefined)
                existing.name = changes.name;
            if (changes.filters !== undefined)
                existing.filters = [...changes.filters];
            existing.updatedAt = Date.now();
            notify();
        },
        delete(id) {
            if (presets.delete(id)) {
                notify();
            }
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => { listeners.delete(listener); };
        },
    };
}
//# sourceMappingURL=filter-preset-manager.js.map