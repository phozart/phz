/**
 * @phozart/workspace — Template Bindings
 *
 * Resolves field bindings for template widget slots and provides
 * auto-binding heuristics based on FieldProfile.
 */
export function resolveBindings(slots, bindings) {
    const result = new Map();
    for (const slot of slots) {
        // Start with defaults from slot definition
        const resolved = { ...slot.fieldBindings };
        // Override with explicit bindings
        for (const b of bindings) {
            if (b.slotId === slot.slotId) {
                resolved[b.bindingKey] = b.fieldName;
            }
        }
        result.set(slot.slotId, resolved);
    }
    return result;
}
const MEASURE_BINDING_KEYS = ['value', 'measure', 'metric'];
const DIMENSION_BINDING_KEYS = ['category', 'dimension', 'label', 'group'];
const TIME_BINDING_KEYS = ['date', 'time', 'timestamp'];
export function autoBindFields(slots, profile) {
    const bindings = [];
    let measureIdx = 0;
    let dimensionIdx = 0;
    for (const slot of slots) {
        for (const [key, _defaultVal] of Object.entries(slot.fieldBindings)) {
            const keyLower = key.toLowerCase();
            if (MEASURE_BINDING_KEYS.some(k => keyLower.includes(k))) {
                if (measureIdx < profile.suggestedMeasures.length) {
                    bindings.push({ slotId: slot.slotId, bindingKey: key, fieldName: profile.suggestedMeasures[measureIdx] });
                    measureIdx++;
                }
            }
            else if (DIMENSION_BINDING_KEYS.some(k => keyLower.includes(k))) {
                if (dimensionIdx < profile.suggestedDimensions.length) {
                    bindings.push({ slotId: slot.slotId, bindingKey: key, fieldName: profile.suggestedDimensions[dimensionIdx] });
                    // Don't increment — reuse the same dimension for multiple slots
                }
            }
            else if (TIME_BINDING_KEYS.some(k => keyLower.includes(k))) {
                if (profile.dateFields.length > 0) {
                    bindings.push({ slotId: slot.slotId, bindingKey: key, fieldName: profile.dateFields[0] });
                }
            }
        }
    }
    return bindings;
}
//# sourceMappingURL=template-bindings.js.map