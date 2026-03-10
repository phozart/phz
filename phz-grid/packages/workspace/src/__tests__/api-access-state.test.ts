import { describe, it, expect, beforeEach } from 'vitest';
import {
  initialApiAccessState,
  setApiSearch,
  setStatusFilter,
  getFilteredKeys,
  createApiKey,
  revokeApiKey,
  deleteApiKey,
  updateKeyRateLimit,
  updateKeyScopes,
  selectApiKey,
  clearApiKeySelection,
  addRole,
  updateRole,
  deleteRole,
  setOpenApiSpec,
  getExpiredKeys,
  getExpiringKeys,
  markExpiredKeys,
  validateApiKey,
  API_SCOPES,
  BUILT_IN_ROLES,
  DEFAULT_RATE_LIMIT,
  _resetKeyCounter,
} from '../govern/api-access-state.js';

beforeEach(() => _resetKeyCounter());

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

describe('initialApiAccessState', () => {
  it('creates state with built-in roles', () => {
    const state = initialApiAccessState();
    expect(state.keys).toHaveLength(0);
    expect(state.roles).toHaveLength(BUILT_IN_ROLES.length);
    expect(state.search).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Search and filter
// ---------------------------------------------------------------------------

describe('search and filter', () => {
  it('filters by name', () => {
    let state = initialApiAccessState();
    ({ state } = createApiKey(state, 'Production Key', ['read:data'], 'admin'));
    ({ state } = createApiKey(state, 'Test Key', ['read:data'], 'admin'));
    state = setApiSearch(state, 'production');
    expect(getFilteredKeys(state)).toHaveLength(1);
  });

  it('filters by status', () => {
    let state = initialApiAccessState();
    ({ state } = createApiKey(state, 'Key 1', ['read:data'], 'admin'));
    const { state: s2, keyId } = createApiKey(state, 'Key 2', ['read:data'], 'admin');
    state = revokeApiKey(s2, keyId);
    state = setStatusFilter(state, 'active');
    expect(getFilteredKeys(state)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Key CRUD
// ---------------------------------------------------------------------------

describe('key CRUD', () => {
  it('creates a key', () => {
    let state = initialApiAccessState();
    const result = createApiKey(state, 'My Key', ['read:data'], 'admin');
    state = result.state;
    expect(state.keys).toHaveLength(1);
    expect(state.keys[0].name).toBe('My Key');
    expect(state.keys[0].status).toBe('active');
    expect(state.keys[0].prefix).toBeDefined();
    expect(state.selectedKeyId).toBe(result.keyId);
  });

  it('creates key with expiry', () => {
    let state = initialApiAccessState();
    const expiry = Date.now() + 86400000;
    ({ state } = createApiKey(state, 'Temp Key', ['read:data'], 'admin', expiry));
    expect(state.keys[0].expiresAt).toBe(expiry);
  });

  it('creates key with custom rate limit', () => {
    let state = initialApiAccessState();
    const rateLimit = { requestsPerMinute: 10, requestsPerHour: 100, burstLimit: 5 };
    ({ state } = createApiKey(state, 'Limited', ['read:data'], 'admin', undefined, rateLimit));
    expect(state.keys[0].rateLimit).toEqual(rateLimit);
  });

  it('revokes a key', () => {
    let state = initialApiAccessState();
    const { state: s, keyId } = createApiKey(state, 'Key', ['read:data'], 'admin');
    state = revokeApiKey(s, keyId);
    expect(state.keys[0].status).toBe('revoked');
  });

  it('deletes a key', () => {
    let state = initialApiAccessState();
    const { state: s, keyId } = createApiKey(state, 'Key', ['read:data'], 'admin');
    state = deleteApiKey(s, keyId);
    expect(state.keys).toHaveLength(0);
  });

  it('updates rate limit', () => {
    let state = initialApiAccessState();
    const { state: s, keyId } = createApiKey(state, 'Key', ['read:data'], 'admin');
    state = updateKeyRateLimit(s, keyId, { requestsPerMinute: 120, requestsPerHour: 2000, burstLimit: 20 });
    expect(state.keys[0].rateLimit.requestsPerMinute).toBe(120);
  });

  it('rejects negative rate limit', () => {
    let state = initialApiAccessState();
    const { state: s, keyId } = createApiKey(state, 'Key', ['read:data'], 'admin');
    state = updateKeyRateLimit(s, keyId, { requestsPerMinute: -1, requestsPerHour: 100, burstLimit: 5 });
    expect(state.keys[0].rateLimit.requestsPerMinute).toBe(DEFAULT_RATE_LIMIT.requestsPerMinute);
  });

  it('updates scopes', () => {
    let state = initialApiAccessState();
    const { state: s, keyId } = createApiKey(state, 'Key', ['read:data'], 'admin');
    state = updateKeyScopes(s, keyId, ['read:data', 'write:data']);
    expect(state.keys[0].scopes).toEqual(['read:data', 'write:data']);
  });
});

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

describe('selection', () => {
  it('selects and clears key', () => {
    let state = initialApiAccessState();
    const { state: s, keyId } = createApiKey(state, 'Key', ['read:data'], 'admin');
    state = clearApiKeySelection(s);
    expect(state.selectedKeyId).toBeUndefined();
    state = selectApiKey(state, keyId);
    expect(state.selectedKeyId).toBe(keyId);
  });
});

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

describe('roles', () => {
  it('adds a custom role', () => {
    let state = initialApiAccessState();
    state = addRole(state, { id: 'custom', name: 'Custom', description: 'Test', scopes: ['read:data'] });
    expect(state.roles.length).toBe(BUILT_IN_ROLES.length + 1);
  });

  it('does not add duplicate role', () => {
    let state = initialApiAccessState();
    state = addRole(state, { id: 'viewer', name: 'Viewer', description: 'Dup', scopes: [] });
    expect(state.roles.length).toBe(BUILT_IN_ROLES.length);
  });

  it('updates a custom role', () => {
    let state = initialApiAccessState();
    state = addRole(state, { id: 'custom', name: 'Custom', description: 'Test', scopes: ['read:data'] });
    state = updateRole(state, { id: 'custom', name: 'Updated Custom', description: 'Updated', scopes: ['read:data', 'write:data'], isBuiltIn: false });
    const role = state.roles.find(r => r.id === 'custom');
    expect(role?.name).toBe('Updated Custom');
  });

  it('cannot update built-in role', () => {
    let state = initialApiAccessState();
    const original = state.roles.find(r => r.id === 'viewer')!;
    state = updateRole(state, { ...original, name: 'Modified' });
    expect(state.roles.find(r => r.id === 'viewer')?.name).toBe('Viewer');
  });

  it('deletes a custom role', () => {
    let state = initialApiAccessState();
    state = addRole(state, { id: 'custom', name: 'Custom', description: 'Test', scopes: [] });
    state = deleteRole(state, 'custom');
    expect(state.roles.length).toBe(BUILT_IN_ROLES.length);
  });

  it('cannot delete built-in role', () => {
    let state = initialApiAccessState();
    state = deleteRole(state, 'viewer');
    expect(state.roles.length).toBe(BUILT_IN_ROLES.length);
  });
});

// ---------------------------------------------------------------------------
// OpenAPI spec
// ---------------------------------------------------------------------------

describe('OpenAPI spec', () => {
  it('sets spec', () => {
    let state = initialApiAccessState();
    state = setOpenApiSpec(state, '{"openapi":"3.0"}');
    expect(state.openApiSpec).toBe('{"openapi":"3.0"}');
  });
});

// ---------------------------------------------------------------------------
// Expiry
// ---------------------------------------------------------------------------

describe('expiry', () => {
  it('getExpiredKeys finds expired keys', () => {
    let state = initialApiAccessState();
    ({ state } = createApiKey(state, 'Expired', ['read:data'], 'admin', Date.now() - 1000));
    expect(getExpiredKeys(state)).toHaveLength(1);
  });

  it('getExpiringKeys finds keys expiring soon', () => {
    let state = initialApiAccessState();
    const soon = Date.now() + 60_000; // 1 minute from now
    ({ state } = createApiKey(state, 'Expiring', ['read:data'], 'admin', soon));
    expect(getExpiringKeys(state, 300_000)).toHaveLength(1);
    expect(getExpiringKeys(state, 10_000)).toHaveLength(0);
  });

  it('markExpiredKeys updates status', () => {
    let state = initialApiAccessState();
    ({ state } = createApiKey(state, 'Expired', ['read:data'], 'admin', Date.now() - 1000));
    state = markExpiredKeys(state);
    expect(state.keys[0].status).toBe('expired');
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('validation', () => {
  it('validates a valid key', () => {
    const result = validateApiKey({
      name: 'Test',
      scopes: ['read:data'],
      createdBy: 'admin',
      rateLimit: DEFAULT_RATE_LIMIT,
    });
    expect(result.valid).toBe(true);
  });

  it('fails without name', () => {
    const result = validateApiKey({ name: '', scopes: ['read:data'], createdBy: 'admin' });
    expect(result.valid).toBe(false);
  });

  it('fails without scopes', () => {
    const result = validateApiKey({ name: 'Test', scopes: [], createdBy: 'admin' });
    expect(result.valid).toBe(false);
  });

  it('fails without createdBy', () => {
    const result = validateApiKey({ name: 'Test', scopes: ['read:data'], createdBy: '' });
    expect(result.valid).toBe(false);
  });

  it('API_SCOPES are defined', () => {
    expect(API_SCOPES.length).toBeGreaterThan(0);
  });
});
