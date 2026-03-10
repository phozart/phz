/**
 * Definition Identity — unique identifier and metadata for a grid blueprint.
 */
export function createDefinitionId(id) {
    return (id ?? crypto.randomUUID());
}
//# sourceMappingURL=identity.js.map