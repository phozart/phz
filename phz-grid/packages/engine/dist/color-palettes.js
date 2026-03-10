/**
 * @phozart/phz-engine — Color Palettes
 *
 * 6 preset color palettes for chart widgets.
 * Each palette has 8 colors.
 */
export const PALETTE_PRESETS = [
    {
        id: 'phz-default',
        name: 'Phz Default',
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
    },
    {
        id: 'warm',
        name: 'Warm',
        colors: ['#DC2626', '#EA580C', '#D97706', '#CA8A04', '#F59E0B', '#FB923C', '#F87171', '#FCA5A5'],
    },
    {
        id: 'cool',
        name: 'Cool',
        colors: ['#2563EB', '#0891B2', '#0D9488', '#059669', '#3B82F6', '#06B6D4', '#14B8A6', '#10B981'],
    },
    {
        id: 'earth',
        name: 'Earth',
        colors: ['#92400E', '#78350F', '#854D0E', '#166534', '#A16207', '#65A30D', '#B45309', '#047857'],
    },
    {
        id: 'ocean',
        name: 'Ocean',
        colors: ['#1E40AF', '#1E3A8A', '#0369A1', '#0284C7', '#0EA5E9', '#38BDF8', '#7DD3FC', '#BAE6FD'],
    },
    {
        id: 'monochrome',
        name: 'Monochrome',
        colors: ['#1C1917', '#44403C', '#78716C', '#A8A29E', '#D6D3D1', '#57534E', '#292524', '#E7E5E4'],
    },
];
/**
 * Get colors for a palette by ID. Falls back to default if not found.
 */
export function getPaletteColors(presetId) {
    const preset = PALETTE_PRESETS.find(p => p.id === presetId);
    return preset ? preset.colors : PALETTE_PRESETS[0].colors;
}
//# sourceMappingURL=color-palettes.js.map