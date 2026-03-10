/**
 * @phozart/phz-shared — Expression Builder State (C-2.10)
 *
 * Reusable expression builder for alert conditions, filter rules,
 * and calculated fields. Manages an expression tree with validation.
 *
 * Pure functions only — no side effects, no DOM.
 */

// ========================================================================
// ExpressionNode types
// ========================================================================

export type ExpressionNodeType = 'field' | 'operator' | 'value' | 'function' | 'group';

export interface ExpressionNode {
  id: string;
  type: ExpressionNodeType;
  value: string;
  children?: ExpressionNode[];
  parentId?: string;
}

// ========================================================================
// ExpressionBuilderState
// ========================================================================

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

// ========================================================================
// Default operators and functions
// ========================================================================

const DEFAULT_OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'AND', 'OR', 'NOT', 'IN', 'LIKE'];
const DEFAULT_FUNCTIONS = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'IF', 'COALESCE', 'ABS', 'ROUND'];

// ========================================================================
// ID generation
// ========================================================================

let nodeCounter = 0;

function generateNodeId(): string {
  nodeCounter += 1;
  return `node_${nodeCounter}_${Date.now().toString(36)}`;
}

/** Reset counter (for testing). */
export function resetNodeCounter(): void {
  nodeCounter = 0;
}

// ========================================================================
// Factory
// ========================================================================

/**
 * Create a fresh ExpressionBuilderState.
 *
 * @param fields - Optional list of available field names.
 */
export function createExpressionBuilderState(fields?: string[]): ExpressionBuilderState {
  return {
    root: null,
    selectedNodeId: null,
    availableFields: fields ?? [],
    availableOperators: [...DEFAULT_OPERATORS],
    availableFunctions: [...DEFAULT_FUNCTIONS],
    expression: '',
    valid: true,
    errors: [],
  };
}

// ========================================================================
// Tree helpers
// ========================================================================

/**
 * Find a node by ID in the tree (depth-first).
 */
function findNode(
  node: ExpressionNode | null,
  nodeId: string,
): ExpressionNode | null {
  if (node == null) return null;
  if (node.id === nodeId) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, nodeId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Deep clone a node tree, applying an update function to matching nodes.
 */
function mapTree(
  node: ExpressionNode,
  targetId: string,
  fn: (n: ExpressionNode) => ExpressionNode | null,
): ExpressionNode | null {
  if (node.id === targetId) {
    return fn(node);
  }
  if (node.children) {
    const mapped = node.children
      .map(c => mapTree(c, targetId, fn))
      .filter((c): c is ExpressionNode => c != null);
    return { ...node, children: mapped };
  }
  return { ...node };
}

/**
 * Add a child node to a parent in the tree.
 */
function addChildToTree(
  node: ExpressionNode,
  parentId: string,
  child: ExpressionNode,
): ExpressionNode {
  if (node.id === parentId) {
    return {
      ...node,
      children: [...(node.children ?? []), child],
    };
  }
  if (node.children) {
    return {
      ...node,
      children: node.children.map(c => addChildToTree(c, parentId, child)),
    };
  }
  return { ...node };
}

// ========================================================================
// State transitions
// ========================================================================

/**
 * Add a node to the expression tree.
 * If parentId is null, the node becomes the root (replacing any existing root).
 *
 * @param state - Current state.
 * @param parentId - Parent node ID (or null for root).
 * @param nodeInput - Node data without ID (ID is auto-generated).
 */
export function addNode(
  state: ExpressionBuilderState,
  parentId: string | null,
  nodeInput: Omit<ExpressionNode, 'id'>,
): ExpressionBuilderState {
  const id = generateNodeId();
  const newNode: ExpressionNode = {
    ...nodeInput,
    id,
    parentId: parentId ?? undefined,
  };

  let root: ExpressionNode | null;
  if (parentId == null) {
    root = newNode;
  } else if (state.root == null) {
    // No root exists — cannot add child
    return state;
  } else {
    root = addChildToTree(state.root, parentId, newNode);
  }

  const updated = { ...state, root, selectedNodeId: id };
  return rebuildExpression(updated);
}

/**
 * Remove a node from the expression tree by ID.
 * If the root is removed, the tree is cleared.
 */
export function removeNode(
  state: ExpressionBuilderState,
  nodeId: string,
): ExpressionBuilderState {
  if (state.root == null) return state;

  if (state.root.id === nodeId) {
    return rebuildExpression({
      ...state,
      root: null,
      selectedNodeId: null,
    });
  }

  const root = mapTree(state.root, nodeId, () => null);
  const selectedNodeId = state.selectedNodeId === nodeId ? null : state.selectedNodeId;

  return rebuildExpression({ ...state, root, selectedNodeId });
}

/**
 * Update properties of an existing node.
 */
export function updateNode(
  state: ExpressionBuilderState,
  nodeId: string,
  updates: Partial<ExpressionNode>,
): ExpressionBuilderState {
  if (state.root == null) return state;

  const root = mapTree(state.root, nodeId, n => ({
    ...n,
    ...updates,
    id: n.id, // ID is immutable
  }));

  return rebuildExpression({ ...state, root });
}

// ========================================================================
// Expression building
// ========================================================================

/**
 * Build a string expression from the node tree.
 */
export function buildExpression(state: ExpressionBuilderState): string {
  if (state.root == null) return '';
  return nodeToString(state.root);
}

function nodeToString(node: ExpressionNode): string {
  switch (node.type) {
    case 'field':
      return node.value;

    case 'value':
      return node.value;

    case 'operator': {
      const children = node.children ?? [];
      if (children.length === 0) return node.value;
      if (children.length === 1) {
        return `${node.value} ${nodeToString(children[0])}`;
      }
      return children.map(nodeToString).join(` ${node.value} `);
    }

    case 'function': {
      const args = (node.children ?? []).map(nodeToString).join(', ');
      return `${node.value}(${args})`;
    }

    case 'group': {
      const inner = (node.children ?? []).map(nodeToString).join(' ');
      return `(${inner})`;
    }

    default:
      return node.value;
  }
}

// ========================================================================
// Validation
// ========================================================================

/**
 * Validate the current expression tree and return the state with
 * updated valid/errors fields.
 */
export function validateExpression(state: ExpressionBuilderState): ExpressionBuilderState {
  const errors: string[] = [];

  if (state.root == null) {
    // Empty expression is valid (nothing to validate)
    return { ...state, valid: true, errors: [] };
  }

  validateNode(state.root, state, errors);

  return {
    ...state,
    valid: errors.length === 0,
    errors,
  };
}

function validateNode(
  node: ExpressionNode,
  state: ExpressionBuilderState,
  errors: string[],
): void {
  switch (node.type) {
    case 'field':
      if (state.availableFields.length > 0 && !state.availableFields.includes(node.value)) {
        errors.push(`Unknown field: "${node.value}"`);
      }
      break;

    case 'operator':
      if (!state.availableOperators.includes(node.value)) {
        errors.push(`Unknown operator: "${node.value}"`);
      }
      if (node.value === 'NOT' && (node.children ?? []).length !== 1) {
        errors.push(`NOT operator requires exactly 1 operand`);
      }
      if (['AND', 'OR'].includes(node.value) && (node.children ?? []).length < 2) {
        errors.push(`${node.value} operator requires at least 2 operands`);
      }
      break;

    case 'value':
      if (!node.value && node.value !== '0') {
        errors.push(`Empty value node`);
      }
      break;

    case 'function':
      if (state.availableFunctions.length > 0 && !state.availableFunctions.includes(node.value)) {
        errors.push(`Unknown function: "${node.value}"`);
      }
      break;

    case 'group':
      // Groups are always valid structurally
      break;
  }

  // Recurse into children
  if (node.children) {
    for (const child of node.children) {
      validateNode(child, state, errors);
    }
  }
}

// ========================================================================
// Internal helpers
// ========================================================================

function rebuildExpression(state: ExpressionBuilderState): ExpressionBuilderState {
  const expression = buildExpression(state);
  return { ...state, expression };
}
