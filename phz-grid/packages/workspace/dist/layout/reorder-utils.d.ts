/**
 * @phozart/phz-workspace — Dashboard DnD Reorder Utils (L.13)
 *
 * Immutable array reorder operations for dashboard widget lists.
 */
interface Identifiable {
    id: string;
    weight?: number;
}
export declare function moveWidget<T extends Identifiable>(widgets: T[], fromIndex: number, toIndex: number): T[];
export declare function insertBefore<T extends Identifiable>(widgets: T[], widgetId: string, beforeId: string): T[];
export declare function updateWeight<T extends Identifiable>(widgets: T[], widgetId: string, newWeight: number): T[];
export {};
//# sourceMappingURL=reorder-utils.d.ts.map