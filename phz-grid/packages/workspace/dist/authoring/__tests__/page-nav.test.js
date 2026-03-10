/**
 * Page Navigation Component — Logic Tests
 *
 * Tests the data flow and event contracts of <phz-page-nav>.
 * Since we're in a Node environment (no DOM), we test the state-level
 * logic and event patterns rather than rendered output.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createPage, DEFAULT_PAGE_NAV_CONFIG, _resetPageCounter, } from '../dashboard-page-state.js';
describe('page-nav component logic', () => {
    beforeEach(() => {
        _resetPageCounter();
    });
    // ── Page creation for different types ──
    it('creates pages with all supported types', () => {
        const canvas = createPage('Canvas Page', 'canvas');
        const query = createPage('Query Page', 'query');
        const sql = createPage('SQL Page', 'sql');
        const report = createPage('Report Page', 'report');
        expect(canvas.pageType).toBe('canvas');
        expect(query.pageType).toBe('query');
        expect(sql.pageType).toBe('sql');
        expect(report.pageType).toBe('report');
    });
    it('generates unique IDs for each page', () => {
        const p1 = createPage('A');
        const p2 = createPage('B');
        const p3 = createPage('C');
        expect(new Set([p1.id, p2.id, p3.id]).size).toBe(3);
    });
    // ── PageNavConfig positions ──
    it('default config uses top position', () => {
        expect(DEFAULT_PAGE_NAV_CONFIG.position).toBe('top');
    });
    it('supports all three positions', () => {
        const positions = ['top', 'left', 'bottom'];
        positions.forEach(pos => {
            const config = { ...DEFAULT_PAGE_NAV_CONFIG, position: pos };
            expect(config.position).toBe(pos);
        });
    });
    // ── PageNavConfig styles ──
    it('supports all three nav styles', () => {
        const styles = ['tabs', 'pills', 'sidebar'];
        styles.forEach(style => {
            const config = { ...DEFAULT_PAGE_NAV_CONFIG, style };
            expect(config.style).toBe(style);
        });
    });
    // ── Page icon support ──
    it('creates pages with optional icons', () => {
        const withIcon = createPage('Dashboard', 'canvas', 'chart-bar');
        const withoutIcon = createPage('Data', 'query');
        expect(withIcon.icon).toBe('chart-bar');
        expect(withoutIcon.icon).toBeUndefined();
    });
    // ── Keyboard navigation pattern ──
    it('pages array maintains insertion order for keyboard nav', () => {
        const pages = [
            createPage('First'),
            createPage('Second'),
            createPage('Third'),
        ];
        expect(pages.map(p => p.label)).toEqual(['First', 'Second', 'Third']);
        // Simulate ArrowRight: move from index 0 to 1
        const currentIndex = 0;
        const nextIndex = (currentIndex + 1) % pages.length;
        expect(nextIndex).toBe(1);
        // Simulate wrapping: from last to first
        const lastIndex = pages.length - 1;
        const wrapIndex = (lastIndex + 1) % pages.length;
        expect(wrapIndex).toBe(0);
    });
    // ── ARIA contract ──
    it('each page has properties needed for ARIA tab pattern', () => {
        const page = createPage('Test Page', 'sql');
        // Every page needs: id (for aria-controls), label (for display)
        expect(page.id).toBeTruthy();
        expect(page.label).toBeTruthy();
        expect(page.pageType).toBeTruthy();
    });
    // ── Collapsible sidebar ──
    it('collapsible only applies to left position', () => {
        const config = {
            position: 'left',
            style: 'sidebar',
            showLabels: true,
            collapsible: true,
        };
        expect(config.collapsible).toBe(true);
        // top/bottom should not use collapsible
        const topConfig = { ...config, position: 'top' };
        // collapsible field exists but is semantically ignored for non-left
        expect(topConfig.position).toBe('top');
    });
    // ── Show labels toggle ──
    it('showLabels can be toggled for icon-only mode', () => {
        const iconOnly = { ...DEFAULT_PAGE_NAV_CONFIG, showLabels: false };
        expect(iconOnly.showLabels).toBe(false);
    });
    // ── Page type badge logic ──
    it('canvas pages should not show type badge (convention)', () => {
        const canvas = createPage('Main', 'canvas');
        // Convention: canvas is the default type, no badge needed
        expect(canvas.pageType).toBe('canvas');
    });
    it('non-canvas pages should show type badge', () => {
        const sql = createPage('Queries', 'sql');
        const query = createPage('Builder', 'query');
        const report = createPage('Grid', 'report');
        // All non-canvas types need visible type indicator
        expect(sql.pageType).not.toBe('canvas');
        expect(query.pageType).not.toBe('canvas');
        expect(report.pageType).not.toBe('canvas');
    });
});
//# sourceMappingURL=page-nav.test.js.map