/**
 * @phozart/phz-shared — API spec types (A-1.22)
 *
 * REST API specification types for backend integration, including
 * role-based access control and complete API configuration.
 */
// ========================================================================
// Factory
// ========================================================================
export function createApiEndpoint(method, path, description, options) {
    return { method, path, description, ...options };
}
//# sourceMappingURL=api-spec.js.map