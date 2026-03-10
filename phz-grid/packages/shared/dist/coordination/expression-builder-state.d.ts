/**
 * @phozart/phz-shared — Expression Builder State (C-2.10)
 *
 * Reusable expression builder for alert conditions, filter rules,
 * and calculated fields. Manages an expression tree with validation.
 *
 * Pure functions only — no side effects, no DOM.
 */
export type ExpressionNodeType = 'field' | 'operator' | 'value' | 'function' | 'group';
export interface ExpressionNode {
    id: string;
    type: ExpressionNodeType;
    value: string;
    children?: ExpressionNode[];
    parentId?: string;
}
export interface ExpressionBuilderState {
    root: ExpressionNode | null;
    selectedNodeId: string | null;
    availableFields: string[];
    availableOperators: string[];
    availableFunctions: string[];
    expression: string;
    valid: boolean;
    errors: string[];
}
/** Reset counter (for testing). */
export declare function resetNodeCounter(): void;
/**
 * Create a fresh ExpressionBuilderState.
 *
 * @param fields - Optional list of available field names.
 */
export declare function createExpressionBuilderState(fields?: string[]): ExpressionBuilderState;
/**
 * Add a node to the expression tree.
 * If parentId is null, the node becomes the root (replacing any existing root).
 *
 * @param state - Current state.
 * @param parentId - Parent node ID (or null for root).
 * @param nodeInput - Node data without ID (ID is auto-generated).
 */
export declare function addNode(state: ExpressionBuilderState, parentId: string | null, nodeInput: Omit<ExpressionNode, 'id'>): ExpressionBuilderState;
/**
 * Remove a node from the expression tree by ID.
 * If the root is removed, the tree is cleared.
 */
export declare function removeNode(state: ExpressionBuilderState, nodeId: string): ExpressionBuilderState;
/**
 * Update properties of an existing node.
 */
export declare function updateNode(state: ExpressionBuilderState, nodeId: string, updates: Partial<ExpressionNode>): ExpressionBuilderState;
/**
 * Build a string expression from the node tree.
 */
export declare function buildExpression(state: ExpressionBuilderState): string;
/**
 * Validate the current expression tree and return the state with
 * updated valid/errors fields.
 */
export declare function validateExpression(state: ExpressionBuilderState): ExpressionBuilderState;
//# sourceMappingURL=expression-builder-state.d.ts.map