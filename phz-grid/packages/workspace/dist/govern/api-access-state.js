/**
 * @phozart/workspace — Govern > API Access State (B-3.15)
 *
 * Pure functions for API key management, role-based access configuration,
 * rate limit settings, and OpenAPI spec viewing.
 */
// ========================================================================
// Built-in scopes
// ========================================================================
export const API_SCOPES = [
    'read:artifacts',
    'write:artifacts',
    'read:data',
    'write:data',
    'admin:settings',
    'admin:users',
    'export:reports',
    'execute:queries',
];
// ========================================================================
// Built-in roles
// ========================================================================
export const BUILT_IN_ROLES = [
    {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to artifacts and data',
        scopes: ['read:artifacts', 'read:data'],
        isBuiltIn: true,
    },
    {
        id: 'editor',
        name: 'Editor',
        description: 'Read and write access to artifacts and data',
        scopes: ['read:artifacts', 'write:artifacts', 'read:data', 'write:data', 'export:reports'],
        isBuiltIn: true,
    },
    {
        id: 'admin',
        name: 'Administrator',
        description: 'Full access to all resources',
        scopes: [...API_SCOPES],
        isBuiltIn: true,
    },
    {
        id: 'query-runner',
        name: 'Query Runner',
        description: 'Execute queries and read data',
        scopes: ['read:data', 'execute:queries'],
        isBuiltIn: true,
    },
];
// ========================================================================
// Default rate limits
// ========================================================================
export const DEFAULT_RATE_LIMIT = {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    burstLimit: 10,
};
// ========================================================================
// Factory
// ========================================================================
let keyCounter = 0;
export function initialApiAccessState() {
    return {
        keys: [],
        roles: BUILT_IN_ROLES.map(r => ({ ...r })),
        search: '',
    };
}
// ========================================================================
// Search and filter
// ========================================================================
export function setApiSearch(state, search) {
    return { ...state, search };
}
export function setStatusFilter(state, status) {
    return { ...state, statusFilter: status };
}
export function getFilteredKeys(state) {
    let result = state.keys;
    if (state.statusFilter) {
        result = result.filter(k => k.status === state.statusFilter);
    }
    if (state.search) {
        const q = state.search.toLowerCase();
        result = result.filter(k => k.name.toLowerCase().includes(q) ||
            k.prefix.toLowerCase().includes(q) ||
            k.createdBy.toLowerCase().includes(q));
    }
    return result;
}
// ========================================================================
// Key CRUD
// ========================================================================
export function createApiKey(state, name, scopes, createdBy, expiresAt, rateLimit) {
    keyCounter++;
    const now = Date.now();
    const id = `ak_${now}_${keyCounter}`;
    const prefix = `phz_${id.slice(-8)}`;
    const key = {
        id,
        name,
        prefix,
        createdAt: now,
        expiresAt,
        status: 'active',
        scopes,
        rateLimit: rateLimit ?? { ...DEFAULT_RATE_LIMIT },
        createdBy,
    };
    return {
        state: { ...state, keys: [...state.keys, key], selectedKeyId: id },
        keyId: id,
    };
}
export function revokeApiKey(state, keyId) {
    return {
        ...state,
        keys: state.keys.map(k => k.id === keyId ? { ...k, status: 'revoked' } : k),
    };
}
export function deleteApiKey(state, keyId) {
    return {
        ...state,
        keys: state.keys.filter(k => k.id !== keyId),
        selectedKeyId: state.selectedKeyId === keyId ? undefined : state.selectedKeyId,
    };
}
export function updateKeyRateLimit(state, keyId, rateLimit) {
    if (rateLimit.requestsPerMinute < 0 || rateLimit.requestsPerHour < 0 || rateLimit.burstLimit < 0) {
        return state;
    }
    return {
        ...state,
        keys: state.keys.map(k => k.id === keyId ? { ...k, rateLimit } : k),
    };
}
export function updateKeyScopes(state, keyId, scopes) {
    return {
        ...state,
        keys: state.keys.map(k => k.id === keyId ? { ...k, scopes } : k),
    };
}
// ========================================================================
// Selection
// ========================================================================
export function selectApiKey(state, keyId) {
    return { ...state, selectedKeyId: keyId };
}
export function clearApiKeySelection(state) {
    return { ...state, selectedKeyId: undefined };
}
// ========================================================================
// Role management
// ========================================================================
export function addRole(state, role) {
    if (state.roles.some(r => r.id === role.id))
        return state;
    return {
        ...state,
        roles: [...state.roles, { ...role, isBuiltIn: false }],
    };
}
export function updateRole(state, role) {
    // Cannot update built-in roles
    const existing = state.roles.find(r => r.id === role.id);
    if (!existing || existing.isBuiltIn)
        return state;
    return {
        ...state,
        roles: state.roles.map(r => (r.id === role.id ? role : r)),
    };
}
export function deleteRole(state, roleId) {
    const role = state.roles.find(r => r.id === roleId);
    if (!role || role.isBuiltIn)
        return state;
    return {
        ...state,
        roles: state.roles.filter(r => r.id !== roleId),
    };
}
// ========================================================================
// OpenAPI spec
// ========================================================================
export function setOpenApiSpec(state, spec) {
    return { ...state, openApiSpec: spec };
}
// ========================================================================
// Expiry checks
// ========================================================================
export function getExpiredKeys(state) {
    const now = Date.now();
    return state.keys.filter(k => k.status === 'active' && k.expiresAt !== undefined && k.expiresAt <= now);
}
export function getExpiringKeys(state, withinMs) {
    const now = Date.now();
    const threshold = now + withinMs;
    return state.keys.filter(k => k.status === 'active' &&
        k.expiresAt !== undefined &&
        k.expiresAt > now &&
        k.expiresAt <= threshold);
}
export function markExpiredKeys(state) {
    const now = Date.now();
    return {
        ...state,
        keys: state.keys.map(k => k.status === 'active' && k.expiresAt !== undefined && k.expiresAt <= now
            ? { ...k, status: 'expired' }
            : k),
    };
}
export function validateApiKey(key) {
    const errors = [];
    if (!key.name?.trim()) {
        errors.push('Key name is required');
    }
    if (!key.scopes?.length) {
        errors.push('At least one scope is required');
    }
    if (!key.createdBy?.trim()) {
        errors.push('Created by is required');
    }
    if (key.rateLimit) {
        if (key.rateLimit.requestsPerMinute < 1) {
            errors.push('Requests per minute must be at least 1');
        }
        if (key.rateLimit.requestsPerHour < 1) {
            errors.push('Requests per hour must be at least 1');
        }
        if (key.rateLimit.burstLimit < 1) {
            errors.push('Burst limit must be at least 1');
        }
    }
    return { valid: errors.length === 0, errors };
}
/**
 * Reset the key counter. Exposed only for testing determinism.
 * @internal
 */
export function _resetKeyCounter() {
    keyCounter = 0;
}
//# sourceMappingURL=api-access-state.js.map