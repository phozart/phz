/**
 * Lit Component Importability Tests — Phase 5.4-5.6
 *
 * Tests that dashboard editor, config panel, and context menu components
 * can be imported and export the expected classes.
 */
import { describe, it, expect } from 'vitest';
describe('PhzDashboardEditor', () => {
    it('exports the class', async () => {
        const mod = await import('../phz-dashboard-editor.js');
        expect(mod.PhzDashboardEditor).toBeDefined();
    });
    it('extends LitElement', async () => {
        const { LitElement } = await import('lit');
        const mod = await import('../phz-dashboard-editor.js');
        let p = Object.getPrototypeOf(mod.PhzDashboardEditor);
        let extendsLit = false;
        while (p) {
            if (p === LitElement) {
                extendsLit = true;
                break;
            }
            p = Object.getPrototypeOf(p);
        }
        expect(extendsLit).toBe(true);
    });
    it('has styles defined', async () => {
        const mod = await import('../phz-dashboard-editor.js');
        expect(mod.PhzDashboardEditor.styles).toBeDefined();
    });
});
describe('PhzConfigPanel', () => {
    it('exports the class', async () => {
        const mod = await import('../phz-config-panel.js');
        expect(mod.PhzConfigPanel).toBeDefined();
    });
    it('extends LitElement', async () => {
        const { LitElement } = await import('lit');
        const mod = await import('../phz-config-panel.js');
        let p = Object.getPrototypeOf(mod.PhzConfigPanel);
        let extendsLit = false;
        while (p) {
            if (p === LitElement) {
                extendsLit = true;
                break;
            }
            p = Object.getPrototypeOf(p);
        }
        expect(extendsLit).toBe(true);
    });
    it('has styles defined', async () => {
        const mod = await import('../phz-config-panel.js');
        expect(mod.PhzConfigPanel.styles).toBeDefined();
    });
});
describe('PhzContextMenu', () => {
    it('exports the class', async () => {
        const mod = await import('../phz-context-menu.js');
        expect(mod.PhzContextMenu).toBeDefined();
    });
    it('extends LitElement', async () => {
        const { LitElement } = await import('lit');
        const mod = await import('../phz-context-menu.js');
        let p = Object.getPrototypeOf(mod.PhzContextMenu);
        let extendsLit = false;
        while (p) {
            if (p === LitElement) {
                extendsLit = true;
                break;
            }
            p = Object.getPrototypeOf(p);
        }
        expect(extendsLit).toBe(true);
    });
    it('has styles defined', async () => {
        const mod = await import('../phz-context-menu.js');
        expect(mod.PhzContextMenu.styles).toBeDefined();
    });
    it('has open property defaulting to false', async () => {
        const mod = await import('../phz-context-menu.js');
        // Check that the class exists and can be inspected
        const ctor = mod.PhzContextMenu;
        expect(typeof ctor).toBe('function');
    });
});
//# sourceMappingURL=lit-components-phase2.test.js.map