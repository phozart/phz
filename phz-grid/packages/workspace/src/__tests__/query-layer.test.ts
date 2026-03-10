/**
 * T.2 — Filter queryLayer + QueryStrategy
 * Server/client/auto filter resolution and query strategy types.
 */
import { describe, it, expect } from 'vitest';
import type {
  DashboardFilterDef,
} from '../types.js';
import type { DataQuery, QueryStrategy } from '../data-adapter.js';
import {
  createFilterContext,
  type FilterContextManager,
} from '../filters/filter-context.js';
import {
  resolveQueryLayer,
  classifyFilterChange,
} from '../filters/query-layer.js';

describe('QueryStrategy types (T.2)', () => {
  it('creates a server query strategy', () => {
    const strategy: QueryStrategy = {
      execution: 'server',
      estimatedRows: 100000,
    };
    expect(strategy.execution).toBe('server');
    expect(strategy.estimatedRows).toBe(100000);
  });

  it('creates a cache strategy with TTL', () => {
    const strategy: QueryStrategy = {
      execution: 'cache',
      cacheKey: 'sales-2024-q1',
      cacheTTL: 300,
    };
    expect(strategy.cacheTTL).toBe(300);
  });

  it('creates an auto strategy', () => {
    const strategy: QueryStrategy = {
      execution: 'auto',
    };
    expect(strategy.execution).toBe('auto');
  });

  it('strategy is optional on DataQuery', () => {
    const query: DataQuery = {
      source: 'sales',
      fields: ['region', 'revenue'],
      strategy: { execution: 'server' },
    };
    expect(query.strategy?.execution).toBe('server');
  });
});

describe('DashboardFilterDef queryLayer (T.2)', () => {
  it('supports server queryLayer on DashboardFilterDef', () => {
    const def: DashboardFilterDef = {
      id: 'f1',
      field: 'region',
      dataSourceId: 'sales',
      label: 'Region',
      filterType: 'select',
      required: false,
      appliesTo: ['*'],
      queryLayer: 'server',
    };
    expect(def.queryLayer).toBe('server');
  });

  it('supports client queryLayer', () => {
    const def: DashboardFilterDef = {
      id: 'f2',
      field: 'status',
      dataSourceId: 'sales',
      label: 'Status',
      filterType: 'select',
      required: false,
      appliesTo: ['*'],
      queryLayer: 'client',
    };
    expect(def.queryLayer).toBe('client');
  });

  it('supports auto queryLayer', () => {
    const def: DashboardFilterDef = {
      id: 'f3',
      field: 'amount',
      dataSourceId: 'sales',
      label: 'Amount',
      filterType: 'numeric-range',
      required: false,
      appliesTo: ['*'],
      queryLayer: 'auto',
    };
    expect(def.queryLayer).toBe('auto');
  });

  it('queryLayer defaults to undefined when not set', () => {
    const def: DashboardFilterDef = {
      id: 'f4',
      field: 'name',
      dataSourceId: 'sales',
      label: 'Name',
      filterType: 'search',
      required: false,
      appliesTo: ['*'],
    };
    expect(def.queryLayer).toBeUndefined();
  });
});

describe('resolveQueryLayer (T.2)', () => {
  it('returns "server" when queryLayer is explicitly server', () => {
    expect(resolveQueryLayer('server')).toBe('server');
  });

  it('returns "client" when queryLayer is explicitly client', () => {
    expect(resolveQueryLayer('client')).toBe('client');
  });

  it('returns "server" when queryLayer is auto and estimatedRows is high', () => {
    expect(resolveQueryLayer('auto', { estimatedRows: 100000 })).toBe('server');
  });

  it('returns "client" when queryLayer is auto and estimatedRows is low', () => {
    expect(resolveQueryLayer('auto', { estimatedRows: 500 })).toBe('client');
  });

  it('defaults to "server" when queryLayer is undefined', () => {
    expect(resolveQueryLayer(undefined)).toBe('server');
  });
});

describe('classifyFilterChange (T.2)', () => {
  const serverFilter: DashboardFilterDef = {
    id: 'f1',
    field: 'region',
    dataSourceId: 'sales',
    label: 'Region',
    filterType: 'select',
    required: false,
    appliesTo: ['*'],
    queryLayer: 'server',
  };

  const clientFilter: DashboardFilterDef = {
    id: 'f2',
    field: 'status',
    dataSourceId: 'sales',
    label: 'Status',
    filterType: 'select',
    required: false,
    appliesTo: ['*'],
    queryLayer: 'client',
  };

  it('classifies a server filter change as "reload"', () => {
    expect(classifyFilterChange(serverFilter)).toBe('reload');
  });

  it('classifies a client filter change as "requery"', () => {
    expect(classifyFilterChange(clientFilter)).toBe('requery');
  });

  it('classifies auto filter with undefined queryLayer as "reload"', () => {
    const autoFilter: DashboardFilterDef = {
      ...serverFilter,
      queryLayer: undefined,
    };
    expect(classifyFilterChange(autoFilter)).toBe('reload');
  });
});
