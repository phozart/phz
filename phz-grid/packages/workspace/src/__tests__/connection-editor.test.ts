import { describe, it, expect } from 'vitest';
import { PhzConnectionEditor } from '../adapters/phz-connection-editor.js';

describe('PhzConnectionEditor', () => {
  it('class exists and is importable', () => {
    expect(PhzConnectionEditor).toBeDefined();
    expect(typeof PhzConnectionEditor).toBe('function');
  });

  it('has correct tag name', () => {
    expect(PhzConnectionEditor.TAG).toBe('phz-connection-editor');
  });

  it('is a LitElement subclass', () => {
    const el = new PhzConnectionEditor();
    expect(el).toBeDefined();
    expect(typeof el.requestUpdate).toBe('function');
  });

  it('has default mode property', () => {
    const el = new PhzConnectionEditor();
    expect(el.mode).toBe('url');
  });

  it('has static styles', () => {
    expect(PhzConnectionEditor.styles).toBeDefined();
  });
});
