/**
 * @phozart/core — resolveLabelTemplate Tests
 */
import { describe, it, expect } from 'vitest';
import { resolveLabelTemplate } from '../utils.js';

describe('resolveLabelTemplate', () => {
  it('replaces a single placeholder', () => {
    expect(resolveLabelTemplate('{name}', { name: 'Alice' })).toBe('Alice');
  });

  it('replaces multiple placeholders', () => {
    const result = resolveLabelTemplate('{code} - {description}', {
      code: 'US',
      description: 'United States',
    });
    expect(result).toBe('US - United States');
  });

  it('returns empty string for missing fields', () => {
    expect(resolveLabelTemplate('{missing}', { name: 'Alice' })).toBe('');
  });

  it('returns empty string for null values', () => {
    expect(resolveLabelTemplate('{val}', { val: null })).toBe('');
  });

  it('returns empty string for undefined values', () => {
    expect(resolveLabelTemplate('{val}', { val: undefined })).toBe('');
  });

  it('converts numeric values to string', () => {
    expect(resolveLabelTemplate('{id}: {name}', { id: 42, name: 'Item' })).toBe('42: Item');
  });

  it('returns template unchanged when no placeholders present', () => {
    expect(resolveLabelTemplate('No placeholders here', { a: 1 })).toBe('No placeholders here');
  });

  it('handles adjacent placeholders', () => {
    expect(resolveLabelTemplate('{a}{b}', { a: 'X', b: 'Y' })).toBe('XY');
  });

  it('handles boolean values', () => {
    expect(resolveLabelTemplate('{flag}', { flag: true })).toBe('true');
  });

  it('handles empty template string', () => {
    expect(resolveLabelTemplate('', { a: 1 })).toBe('');
  });
});
