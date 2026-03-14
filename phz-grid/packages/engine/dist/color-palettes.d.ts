/**
 * @phozart/engine — Color Palettes
 *
 * 6 preset color palettes for chart widgets.
 * Each palette has 8 colors.
 */
export interface PalettePreset {
    id: string;
    name: string;
    colors: string[];
}
export declare const PALETTE_PRESETS: PalettePreset[];
/**
 * Get colors for a palette by ID. Falls back to default if not found.
 */
export declare function getPaletteColors(presetId: string): string[];
//# sourceMappingURL=color-palettes.d.ts.map