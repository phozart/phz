/**
 * @phozart/workspace — NavigationEditor headless state (V.2)
 *
 * Pure state management for authoring navigation links.
 * Supports auto-mapping source fields to target filter definitions.
 */
export function validateNavigationEditorState(state) {
    const errors = [];
    if (!state.targetArtifactId?.trim()) {
        errors.push('target artifact is required');
    }
    if (!state.label?.trim()) {
        errors.push('label is required');
    }
    return { valid: errors.length === 0, errors };
}
// ========================================================================
// Factory
// ========================================================================
export function createNavigationEditorState(sourceArtifactId, existingLink) {
    if (existingLink) {
        return {
            id: existingLink.id,
            sourceArtifactId,
            targetArtifactId: existingLink.targetArtifactId,
            targetArtifactType: existingLink.targetArtifactType,
            label: existingLink.label,
            description: existingLink.description,
            filterMappings: [...existingLink.filterMappings],
            openBehavior: existingLink.openBehavior ?? 'same-panel',
        };
    }
    return {
        sourceArtifactId,
        targetArtifactId: '',
        targetArtifactType: 'report',
        label: '',
        filterMappings: [],
        openBehavior: 'same-panel',
    };
}
// ========================================================================
// State operations (immutable)
// ========================================================================
export function setTarget(state, targetArtifactId, targetArtifactType, label) {
    return { ...state, targetArtifactId, targetArtifactType, label };
}
export function addFilterMapping(state, mapping) {
    return {
        ...state,
        filterMappings: [...state.filterMappings, mapping],
    };
}
export function removeFilterMapping(state, index) {
    if (index < 0 || index >= state.filterMappings.length)
        return state;
    return {
        ...state,
        filterMappings: state.filterMappings.filter((_, i) => i !== index),
    };
}
export function setOpenBehavior(state, behavior) {
    return { ...state, openBehavior: behavior };
}
// ========================================================================
// Extract NavigationLink from editor state
// ========================================================================
let counter = 0;
function generateId() {
    return `nl_${Date.now()}_${++counter}`;
}
export function getNavigationLink(state) {
    return {
        id: state.id ?? generateId(),
        sourceArtifactId: state.sourceArtifactId,
        targetArtifactId: state.targetArtifactId,
        targetArtifactType: state.targetArtifactType,
        label: state.label,
        description: state.description,
        filterMappings: [...state.filterMappings],
        openBehavior: state.openBehavior,
    };
}
// ========================================================================
// Auto-mapping: match source fields to target filter definitions by
// comparing source field names against filter binding targetFields.
// ========================================================================
export function autoMapFilters(sourceFields, targetFilterDefinitions) {
    const mappings = [];
    for (const field of sourceFields) {
        for (const def of targetFilterDefinitions) {
            const hasMatch = def.bindings.some(b => b.targetField === field);
            if (hasMatch) {
                mappings.push({
                    sourceField: field,
                    targetFilterDefinitionId: def.id,
                    transform: 'passthrough',
                });
                break; // first match wins
            }
        }
    }
    return mappings;
}
//# sourceMappingURL=navigation-editor.js.map