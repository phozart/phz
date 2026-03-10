/**
 * @phozart/phz-workspace — Command Palette State (B-3.11)
 *
 * Pure functions for the Ctrl+K command palette.
 * Supports quick search across artifacts, actions, and settings,
 * keyboard-driven navigation, recent items, and action categories.
 */
import type { ArtifactMeta } from '../types.js';
export type ActionCategory = 'navigate' | 'create' | 'configure' | 'export' | 'help';
export interface CommandAction {
    id: string;
    label: string;
    description?: string;
    category: ActionCategory;
    keywords: string[];
    shortcut?: string;
    icon?: string;
    handler: () => void;
}
export interface CommandResult {
    type: 'artifact' | 'action' | 'recent';
    artifact?: ArtifactMeta;
    action?: CommandAction;
    score: number;
}
export interface CommandPaletteState {
    open: boolean;
    query: string;
    results: CommandResult[];
    selectedIndex: number;
    recentItems: CommandResult[];
    maxRecentItems: number;
    registeredActions: CommandAction[];
}
export declare function initialCommandPaletteState(actions?: CommandAction[]): CommandPaletteState;
export declare function openPalette(state: CommandPaletteState): CommandPaletteState;
export declare function closePalette(state: CommandPaletteState): CommandPaletteState;
export declare function togglePalette(state: CommandPaletteState): CommandPaletteState;
export declare function registerAction(state: CommandPaletteState, action: CommandAction): CommandPaletteState;
export declare function unregisterAction(state: CommandPaletteState, actionId: string): CommandPaletteState;
export declare function setQuery(state: CommandPaletteState, query: string, artifacts?: ArtifactMeta[]): CommandPaletteState;
export declare function moveSelectionUp(state: CommandPaletteState): CommandPaletteState;
export declare function moveSelectionDown(state: CommandPaletteState): CommandPaletteState;
export declare function getSelectedResult(state: CommandPaletteState): CommandResult | undefined;
export declare function executeSelected(state: CommandPaletteState): CommandPaletteState;
export declare function getResultsByCategory(results: CommandResult[]): Map<string, CommandResult[]>;
export declare function filterResultsByCategory(state: CommandPaletteState, category: ActionCategory): CommandResult[];
//# sourceMappingURL=command-palette-state.d.ts.map