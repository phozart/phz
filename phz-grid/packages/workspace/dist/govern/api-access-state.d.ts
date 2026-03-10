/**
 * @phozart/phz-workspace — Govern > API Access State (B-3.15)
 *
 * Pure functions for API key management, role-based access configuration,
 * rate limit settings, and OpenAPI spec viewing.
 */
export type ApiKeyStatus = 'active' | 'revoked' | 'expired';
export interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    createdAt: number;
    expiresAt?: number;
    lastUsedAt?: number;
    status: ApiKeyStatus;
    scopes: string[];
    rateLimit: RateLimitConfig;
    createdBy: string;
}
export interface RateLimitConfig {
    requestsPerMinute: number;
    requestsPerHour: number;
    burstLimit: number;
}
export interface ApiRole {
    id: string;
    name: string;
    description: string;
    scopes: string[];
    isBuiltIn: boolean;
}
export interface ApiAccessState {
    keys: ApiKey[];
    roles: ApiRole[];
    selectedKeyId?: string;
    editingKey?: Partial<ApiKey>;
    search: string;
    statusFilter?: ApiKeyStatus;
    openApiSpec?: string;
}
export declare const API_SCOPES: readonly ["read:artifacts", "write:artifacts", "read:data", "write:data", "admin:settings", "admin:users", "export:reports", "execute:queries"];
export type ApiScope = (typeof API_SCOPES)[number];
export declare const BUILT_IN_ROLES: ApiRole[];
export declare const DEFAULT_RATE_LIMIT: RateLimitConfig;
export declare function initialApiAccessState(): ApiAccessState;
export declare function setApiSearch(state: ApiAccessState, search: string): ApiAccessState;
export declare function setStatusFilter(state: ApiAccessState, status: ApiKeyStatus | undefined): ApiAccessState;
export declare function getFilteredKeys(state: ApiAccessState): ApiKey[];
export declare function createApiKey(state: ApiAccessState, name: string, scopes: string[], createdBy: string, expiresAt?: number, rateLimit?: RateLimitConfig): {
    state: ApiAccessState;
    keyId: string;
};
export declare function revokeApiKey(state: ApiAccessState, keyId: string): ApiAccessState;
export declare function deleteApiKey(state: ApiAccessState, keyId: string): ApiAccessState;
export declare function updateKeyRateLimit(state: ApiAccessState, keyId: string, rateLimit: RateLimitConfig): ApiAccessState;
export declare function updateKeyScopes(state: ApiAccessState, keyId: string, scopes: string[]): ApiAccessState;
export declare function selectApiKey(state: ApiAccessState, keyId: string): ApiAccessState;
export declare function clearApiKeySelection(state: ApiAccessState): ApiAccessState;
export declare function addRole(state: ApiAccessState, role: Omit<ApiRole, 'isBuiltIn'>): ApiAccessState;
export declare function updateRole(state: ApiAccessState, role: ApiRole): ApiAccessState;
export declare function deleteRole(state: ApiAccessState, roleId: string): ApiAccessState;
export declare function setOpenApiSpec(state: ApiAccessState, spec: string): ApiAccessState;
export declare function getExpiredKeys(state: ApiAccessState): ApiKey[];
export declare function getExpiringKeys(state: ApiAccessState, withinMs: number): ApiKey[];
export declare function markExpiredKeys(state: ApiAccessState): ApiAccessState;
export interface ApiAccessValidation {
    valid: boolean;
    errors: string[];
}
export declare function validateApiKey(key: Partial<ApiKey>): ApiAccessValidation;
/**
 * Reset the key counter. Exposed only for testing determinism.
 * @internal
 */
export declare function _resetKeyCounter(): void;
//# sourceMappingURL=api-access-state.d.ts.map