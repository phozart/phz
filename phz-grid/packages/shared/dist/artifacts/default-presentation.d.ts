/**
 * @phozart/phz-shared — DefaultPresentation (A-1.04)
 *
 * Admin-defined presentation defaults for artifacts (density, theme,
 * column order, frozen columns, etc.). Users can create personal views
 * that override specific presentation settings.
 *
 * Extracted from workspace/navigation/default-presentation.ts.
 */
export interface DefaultPresentation {
    density: 'compact' | 'dense' | 'comfortable';
    theme: string;
    columnOrder: string[];
    columnWidths: Record<string, number>;
    hiddenColumns: string[];
    frozenColumns?: number;
    sortState?: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>;
}
export declare function createDefaultPresentation(overrides: Partial<DefaultPresentation>): DefaultPresentation;
export declare function mergePresentation(admin: DefaultPresentation, user: Partial<DefaultPresentation>): DefaultPresentation;
//# sourceMappingURL=default-presentation.d.ts.map