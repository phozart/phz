/**
 * @phozart/phz-core — Type Guards
 */
export function isEditStateIdle(state) {
    return state.status === 'idle';
}
export function isEditStateEditing(state) {
    return state.status === 'editing';
}
export function isEditStateValidating(state) {
    return state.status === 'validating';
}
export function isEditStateCommitting(state) {
    return state.status === 'committing';
}
export function isEditStateError(state) {
    return state.status === 'error';
}
export function isLocalDataSource(ds) {
    return ds.type === 'local';
}
export function isAsyncDataSource(ds) {
    return ds.type === 'async';
}
export function isDuckDBDataSource(ds) {
    return ds.type === 'duckdb';
}
//# sourceMappingURL=type-guards.js.map