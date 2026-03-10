import { describe, it, expect } from 'vitest';
import { PhzGrid } from '../components/phz-grid.js';

describe('PhzGrid public API', () => {
  it('has getGridApi method', () => {
    expect(typeof PhzGrid.prototype.getGridApi).toBe('function');
  });
});
