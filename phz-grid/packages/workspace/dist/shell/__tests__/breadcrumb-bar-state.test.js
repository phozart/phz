import { describe, it, expect } from 'vitest';
import { initialBreadcrumbBarState, pushBreadcrumb, popToBreadcrumb, getBreadcrumbs, getCollapsedBreadcrumbs, } from '../breadcrumb-bar-state.js';
function makeCrumb(id, label) {
    return { id, label: label ?? id, panelId: id };
}
describe('BreadcrumbBarState', () => {
    describe('initialBreadcrumbBarState', () => {
        it('starts with empty navigation stack', () => {
            const s = initialBreadcrumbBarState();
            expect(s.stack.entries).toEqual([]);
            expect(s.stack.currentIndex).toBe(-1);
        });
        it('defaults maxVisible to 5', () => {
            const s = initialBreadcrumbBarState();
            expect(s.maxVisible).toBe(5);
        });
        it('accepts custom maxVisible', () => {
            const s = initialBreadcrumbBarState(3);
            expect(s.maxVisible).toBe(3);
        });
    });
    describe('pushBreadcrumb', () => {
        it('adds a breadcrumb to the stack', () => {
            const s = pushBreadcrumb(initialBreadcrumbBarState(), makeCrumb('home', 'Home'));
            expect(s.stack.entries).toHaveLength(1);
            expect(s.stack.currentIndex).toBe(0);
        });
        it('pushes multiple breadcrumbs in sequence', () => {
            let s = pushBreadcrumb(initialBreadcrumbBarState(), makeCrumb('home'));
            s = pushBreadcrumb(s, makeCrumb('reports'));
            s = pushBreadcrumb(s, makeCrumb('sales'));
            expect(s.stack.entries).toHaveLength(3);
            expect(s.stack.currentIndex).toBe(2);
        });
        it('does not duplicate the current crumb', () => {
            let s = pushBreadcrumb(initialBreadcrumbBarState(), makeCrumb('home'));
            s = pushBreadcrumb(s, makeCrumb('home'));
            expect(s.stack.entries).toHaveLength(1);
        });
        it('does not mutate original state', () => {
            const original = initialBreadcrumbBarState();
            pushBreadcrumb(original, makeCrumb('home'));
            expect(original.stack.entries).toHaveLength(0);
        });
    });
    describe('popToBreadcrumb', () => {
        it('navigates back to a specific index', () => {
            let s = pushBreadcrumb(initialBreadcrumbBarState(), makeCrumb('home'));
            s = pushBreadcrumb(s, makeCrumb('reports'));
            s = pushBreadcrumb(s, makeCrumb('sales'));
            s = popToBreadcrumb(s, 1);
            expect(s.stack.currentIndex).toBe(1);
        });
        it('clamps to valid range', () => {
            let s = pushBreadcrumb(initialBreadcrumbBarState(), makeCrumb('home'));
            s = pushBreadcrumb(s, makeCrumb('reports'));
            s = popToBreadcrumb(s, 100);
            expect(s.stack.currentIndex).toBe(1); // clamped to max
        });
    });
    describe('getBreadcrumbs', () => {
        it('returns empty array for empty stack', () => {
            const crumbs = getBreadcrumbs(initialBreadcrumbBarState());
            expect(crumbs).toEqual([]);
        });
        it('returns breadcrumbs up to currentIndex', () => {
            let s = pushBreadcrumb(initialBreadcrumbBarState(), makeCrumb('home'));
            s = pushBreadcrumb(s, makeCrumb('reports'));
            s = pushBreadcrumb(s, makeCrumb('sales'));
            s = popToBreadcrumb(s, 1);
            const crumbs = getBreadcrumbs(s);
            expect(crumbs).toHaveLength(2);
            expect(crumbs.map(c => c.id)).toEqual(['home', 'reports']);
        });
    });
    describe('getCollapsedBreadcrumbs', () => {
        it('returns all visible when under maxVisible', () => {
            let s = pushBreadcrumb(initialBreadcrumbBarState(5), makeCrumb('home'));
            s = pushBreadcrumb(s, makeCrumb('reports'));
            s = pushBreadcrumb(s, makeCrumb('sales'));
            const result = getCollapsedBreadcrumbs(s);
            expect(result.collapsed).toEqual([]);
            expect(result.visible).toHaveLength(3);
        });
        it('collapses middle items when exceeding maxVisible', () => {
            let s = initialBreadcrumbBarState(3);
            s = pushBreadcrumb(s, makeCrumb('home'));
            s = pushBreadcrumb(s, makeCrumb('reports'));
            s = pushBreadcrumb(s, makeCrumb('sales'));
            s = pushBreadcrumb(s, makeCrumb('detail'));
            s = pushBreadcrumb(s, makeCrumb('drilldown'));
            const result = getCollapsedBreadcrumbs(s);
            // maxVisible = 3: first + 2 from end
            expect(result.visible).toHaveLength(3);
            expect(result.visible[0].id).toBe('home');
            expect(result.visible[1].id).toBe('detail');
            expect(result.visible[2].id).toBe('drilldown');
            expect(result.collapsed).toHaveLength(2);
            expect(result.collapsed.map(c => c.id)).toEqual(['reports', 'sales']);
        });
        it('handles empty stack', () => {
            const result = getCollapsedBreadcrumbs(initialBreadcrumbBarState());
            expect(result.collapsed).toEqual([]);
            expect(result.visible).toEqual([]);
        });
    });
});
//# sourceMappingURL=breadcrumb-bar-state.test.js.map