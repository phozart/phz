/**
 * Impact Chain Design Tokens (7A-C)
 *
 * Color tokens for the impact chain rendering variant of the decision tree widget.
 * These tokens integrate with the three-layer CSS custom property system:
 * public API tokens (--phz-*) -> internal computed tokens (--_*) -> component styles.
 */
export declare const IMPACT_CHAIN_TOKENS: {
    readonly 'chain.rootCause.accent': "#dc2626";
    readonly 'chain.failure.accent': "#f59e0b";
    readonly 'chain.impact.accent': "#3b82f6";
    readonly 'chain.hypothesis.validated': "#22c55e";
    readonly 'chain.hypothesis.invalidated': "#ef4444";
    readonly 'chain.hypothesis.pending': "#f59e0b";
};
export type ImpactChainTokenKey = keyof typeof IMPACT_CHAIN_TOKENS;
/**
 * Generate CSS custom property declarations for all impact chain tokens.
 *
 * @returns A string of `--phz-chain-*: value;` declarations (no selector wrapper).
 */
export declare function generateChainTokenCSS(): string;
/**
 * Resolve a single chain token key to its CSS custom property reference.
 *
 * @param key - One of the IMPACT_CHAIN_TOKENS keys.
 * @returns The CSS `var(--phz-chain-*)` reference string, or the raw value as fallback.
 */
export declare function resolveChainTokenVar(key: ImpactChainTokenKey): string;
//# sourceMappingURL=chain-tokens.d.ts.map