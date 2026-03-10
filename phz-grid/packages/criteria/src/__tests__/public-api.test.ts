import { describe, it, expect } from 'vitest';
import { PhzSelectionCriteria } from '../components/phz-selection-criteria.js';

describe('PhzSelectionCriteria public API', () => {
  it('has getContext method', () => {
    expect(typeof PhzSelectionCriteria.prototype.getContext).toBe('function');
  });

  it('has setContext method', () => {
    expect(typeof PhzSelectionCriteria.prototype.setContext).toBe('function');
  });

  it('has apply method', () => {
    expect(typeof PhzSelectionCriteria.prototype.apply).toBe('function');
  });

  it('has reset method', () => {
    expect(typeof PhzSelectionCriteria.prototype.reset).toBe('function');
  });

  it('has openDrawer method', () => {
    expect(typeof PhzSelectionCriteria.prototype.openDrawer).toBe('function');
  });

  it('has closeDrawer method', () => {
    expect(typeof PhzSelectionCriteria.prototype.closeDrawer).toBe('function');
  });
});
