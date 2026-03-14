/**
 * @phozart/core — Data Governance Tests
 *
 * Tests for getData() masking, getRestrictedFields/getMaskedFields API,
 * exportState filter value sanitization, and userRole wiring.
 */

import { describe, it, expect } from 'vitest';
import { createGrid } from '../create-grid.js';
import { StateManager, createInitialState } from '../state.js';
import type { ColumnDefinition } from '../types/column.js';

const sampleData = [
  { id: 1, name: 'Alice', email: 'alice@example.com', ssn: '123-45-6789' },
  { id: 2, name: 'Bob', email: 'bob@example.com', ssn: '987-65-4321' },
];

const maskSSN = (value: any) => {
  const str = String(value ?? '');
  return str.length > 4 ? '***-**-' + str.slice(-4) : '****';
};

function makeColumns(): ColumnDefinition[] {
  return [
    { field: 'id', header: 'ID', type: 'number' },
    { field: 'name', header: 'Name' },
    { field: 'email', header: 'Email', access: { requiredRoles: ['admin'] } },
    { field: 'ssn', header: 'SSN', access: { requiredRoles: ['admin'], mask: maskSSN } },
  ];
}

describe('Data Governance', () => {
  describe('getData masking', () => {
    it('returns masked data for fields with mask function when user lacks role', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'viewer',
      });
      const data = grid.getData();
      expect(data[0]).toHaveProperty('ssn', '****');
      expect(data[0]).toHaveProperty('name', 'Alice');
    });

    it('returns unmasked data when user has required role', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'admin',
      });
      const data = grid.getData();
      expect(data[0]).toHaveProperty('ssn', '123-45-6789');
    });

    it('returns unmasked data when no userRole provided', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
      });
      const data = grid.getData();
      expect(data[0]).toHaveProperty('ssn', '123-45-6789');
    });
  });

  describe('getRestrictedFields / getMaskedFields', () => {
    it('getRestrictedFields returns fields without mask that user cannot access', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'viewer',
      });
      const restricted = grid.getRestrictedFields();
      expect(restricted.has('email')).toBe(true);
      expect(restricted.has('ssn')).toBe(false); // has mask
    });

    it('getMaskedFields returns fields with mask that user cannot access', () => {
      const grid = createGrid({
        data: sampleData,
        columns: makeColumns(),
        userRole: 'viewer',
      });
      const masked = grid.getMaskedFields();
      expect(masked.has('ssn')).toBe(true);
      expect(masked.has('email')).toBe(false); // no mask = restricted
    });
  });

  describe('exportState filter sanitization', () => {
    it('exportState includes filter values by default', () => {
      const columns: ColumnDefinition[] = [
        { field: 'name', header: 'Name' },
        { field: 'email', header: 'Email' },
      ];
      const sm = new StateManager(createInitialState(columns));
      sm.setState({
        filter: {
          filters: [
            { field: 'email', operator: 'contains', value: 'alice@secret.com' },
          ],
          presets: {},
        },
      });
      const exported = sm.exportState();
      expect(exported.filter.filters[0].value).toBe('alice@secret.com');
    });

    it('exportState sanitizes filter values when option is set', () => {
      const columns: ColumnDefinition[] = [
        { field: 'name', header: 'Name' },
        { field: 'email', header: 'Email' },
      ];
      const sm = new StateManager(createInitialState(columns));
      sm.setState({
        filter: {
          filters: [
            { field: 'email', operator: 'contains', value: 'alice@secret.com' },
            { field: 'name', operator: 'equals', value: 'Alice' },
          ],
          presets: {
            myPreset: {
              name: 'myPreset',
              filters: [{ field: 'email', operator: 'equals', value: 'hidden@pii.com' }],
            },
          },
        },
      });
      const exported = sm.exportState({ sanitizeFilterValues: true });
      // Filter values should be replaced
      for (const f of exported.filter.filters) {
        expect(f.value).toBe('[FILTERED]');
      }
      // Preset filter values should also be sanitized
      for (const f of exported.filter.presets['myPreset'].filters) {
        expect(f.value).toBe('[FILTERED]');
      }
    });

    it('exportState without sanitize option preserves all values', () => {
      const columns: ColumnDefinition[] = [
        { field: 'name', header: 'Name' },
      ];
      const sm = new StateManager(createInitialState(columns));
      sm.setState({
        filter: {
          filters: [{ field: 'name', operator: 'equals', value: 'Alice' }],
          presets: {},
        },
      });
      const exported = sm.exportState();
      expect(exported.filter.filters[0].value).toBe('Alice');
    });
  });
});
