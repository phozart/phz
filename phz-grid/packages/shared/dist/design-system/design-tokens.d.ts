/**
 * Design Tokens — Central design token definitions for the phozart Console mode.
 *
 * Extracted from @phozart/workspace styles (S.1).
 * Exports plain JS constants and pure functions only — no Lit/CSS dependencies.
 */
export declare const DESIGN_TOKENS: {
    readonly headerBg: "#1C1917";
    readonly bgBase: "#FEFDFB";
    readonly bgSubtle: "#FAF9F7";
    readonly bgMuted: "#F5F5F4";
    readonly bgEmphasis: "#292524";
    readonly textPrimary: "#1C1917";
    readonly textSecondary: "#57534E";
    readonly textMuted: "#78716C";
    readonly textFaint: "#A8A29E";
    readonly borderDefault: "#E7E5E4";
    readonly borderEmphasis: "#D6D3D1";
    readonly headerText: "#FAFAF9";
    readonly headerTextMuted: "#A8A29E";
    readonly headerBorder: "#292524";
    readonly headerAccent: "#F59E0B";
    readonly primary500: "#3B82F6";
    readonly info500: "#06B6D4";
    readonly error500: "#EF4444";
    readonly warning500: "#F59E0B";
    readonly space1: "4px";
    readonly space2: "8px";
    readonly space3: "12px";
    readonly space4: "16px";
    readonly space5: "20px";
    readonly space6: "24px";
    readonly space8: "32px";
    readonly space10: "40px";
    readonly space12: "48px";
    readonly space16: "64px";
    readonly fontSans: "'Inter', system-ui, -apple-system, sans-serif";
    readonly fontMono: "'JetBrains Mono', 'Fira Code', monospace";
    readonly textXs: "11px";
    readonly textSm: "13px";
    readonly textBase: "14px";
    readonly textLg: "16px";
    readonly textXl: "20px";
    readonly text2xl: "24px";
    readonly radiusSm: "6px";
    readonly radiusMd: "8px";
    readonly radiusLg: "12px";
    readonly radiusXl: "16px";
    readonly radiusFull: "9999px";
    readonly shadowXs: "0 1px 2px rgba(28, 25, 23, 0.04)";
    readonly shadowSm: "0 1px 3px rgba(28, 25, 23, 0.06), 0 1px 2px rgba(28, 25, 23, 0.04)";
    readonly shadowMd: "0 4px 6px rgba(28, 25, 23, 0.06), 0 2px 4px rgba(28, 25, 23, 0.04)";
    readonly shadowLg: "0 10px 15px rgba(28, 25, 23, 0.06), 0 4px 6px rgba(28, 25, 23, 0.04)";
    readonly shadowXl: "0 20px 25px rgba(28, 25, 23, 0.08), 0 8px 10px rgba(28, 25, 23, 0.04)";
    readonly shadow2xl: "0 25px 50px rgba(28, 25, 23, 0.12)";
    readonly attentionFacetPanelWidth: "200px";
    readonly attentionFacetCountColor: "#6b7280";
    readonly attentionFacetActiveBg: "rgba(59, 130, 246, 0.08)";
};
/** Type for a single token key */
export type DesignTokenKey = keyof typeof DESIGN_TOKENS;
export declare const SECTION_HEADERS: readonly ["CONTENT", "DATA", "GOVERN"];
export type SectionHeader = (typeof SECTION_HEADERS)[number];
/**
 * Generate a CSS `:root` block with all design tokens as custom properties.
 *
 * @returns A complete CSS `:root { ... }` string.
 */
export declare function generateTokenCSS(): string;
//# sourceMappingURL=design-tokens.d.ts.map