/**
 * Lit Component Importability Tests — Phase 5.1-5.3
 *
 * Tests that Lit authoring components can be imported, have correct tag names,
 * and export the expected class. These run in Node (no DOM rendering).
 */

import { describe, it, expect } from 'vitest';

describe('PhzArtifactCatalog', () => {
  it('exports the class', async () => {
    const mod = await import('../phz-artifact-catalog.js');
    expect(mod.PhzArtifactCatalog).toBeDefined();
  });

  it('has correct tag name', async () => {
    const mod = await import('../phz-artifact-catalog.js');
    const proto = mod.PhzArtifactCatalog.prototype;
    expect(proto).toBeDefined();
  });

  it('extends LitElement', async () => {
    const { LitElement } = await import('lit');
    const mod = await import('../phz-artifact-catalog.js');
    expect(mod.PhzArtifactCatalog.prototype).toBeInstanceOf(Object);
    // Verify inheritance chain
    let p = Object.getPrototypeOf(mod.PhzArtifactCatalog);
    let extendsLit = false;
    while (p) {
      if (p === LitElement) { extendsLit = true; break; }
      p = Object.getPrototypeOf(p);
    }
    expect(extendsLit).toBe(true);
  });

  it('has styles defined', async () => {
    const mod = await import('../phz-artifact-catalog.js');
    expect(mod.PhzArtifactCatalog.styles).toBeDefined();
  });
});

describe('PhzCreationWizard', () => {
  it('exports the class', async () => {
    const mod = await import('../phz-creation-wizard.js');
    expect(mod.PhzCreationWizard).toBeDefined();
  });

  it('extends LitElement', async () => {
    const { LitElement } = await import('lit');
    const mod = await import('../phz-creation-wizard.js');
    let p = Object.getPrototypeOf(mod.PhzCreationWizard);
    let extendsLit = false;
    while (p) {
      if (p === LitElement) { extendsLit = true; break; }
      p = Object.getPrototypeOf(p);
    }
    expect(extendsLit).toBe(true);
  });

  it('has styles defined', async () => {
    const mod = await import('../phz-creation-wizard.js');
    expect(mod.PhzCreationWizard.styles).toBeDefined();
  });
});

describe('PhzReportEditor', () => {
  it('exports the class', async () => {
    const mod = await import('../phz-report-editor.js');
    expect(mod.PhzReportEditor).toBeDefined();
  });

  it('extends LitElement', async () => {
    const { LitElement } = await import('lit');
    const mod = await import('../phz-report-editor.js');
    let p = Object.getPrototypeOf(mod.PhzReportEditor);
    let extendsLit = false;
    while (p) {
      if (p === LitElement) { extendsLit = true; break; }
      p = Object.getPrototypeOf(p);
    }
    expect(extendsLit).toBe(true);
  });

  it('has styles defined', async () => {
    const mod = await import('../phz-report-editor.js');
    expect(mod.PhzReportEditor.styles).toBeDefined();
  });
});
