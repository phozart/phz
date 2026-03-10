/**
 * @phozart/phz-engine — Dependency Graph
 *
 * Tracks dependencies between entities in the 5-layer computation DAG.
 * Provides cycle detection, topological sort, and deletion safety checks.
 */
// --- Extract Dependencies from AST ---
export function extractDependencies(expr) {
    const refs = [];
    function walk(node) {
        switch (node.kind) {
            case 'field_ref':
                refs.push({ id: node.fieldName, type: 'field' });
                break;
            case 'param_ref':
                refs.push({ id: node.parameterId, type: 'parameter' });
                break;
            case 'metric_ref':
                refs.push({ id: node.metricId, type: 'metric' });
                break;
            case 'calc_ref':
                refs.push({ id: node.calculatedFieldId, type: 'calculated_field' });
                break;
            case 'literal':
                break;
            case 'unary_op':
                walk(node.operand);
                break;
            case 'binary_op':
                walk(node.left);
                walk(node.right);
                break;
            case 'conditional':
                walk(node.condition);
                walk(node.thenBranch);
                walk(node.elseBranch);
                break;
            case 'function_call':
                for (const arg of node.args)
                    walk(arg);
                break;
            case 'null_check':
                walk(node.operand);
                break;
        }
    }
    walk(expr);
    return refs;
}
// --- Composite key helper ---
function nodeKey(id, type) {
    return `${type}::${id}`;
}
// --- Factory ---
export function createDependencyGraph() {
    const nodes = new Map();
    function addNode(node) {
        nodes.set(nodeKey(node.id, node.type), node);
    }
    function removeNode(id, type) {
        nodes.delete(nodeKey(id, type));
    }
    function getNode(id, type) {
        return nodes.get(nodeKey(id, type));
    }
    function getDependencies(id, type) {
        const node = nodes.get(nodeKey(id, type));
        return node?.dependsOn ?? [];
    }
    function getDependents(id, type) {
        const key = nodeKey(id, type);
        const dependents = [];
        for (const node of nodes.values()) {
            if (node.dependsOn.some(d => nodeKey(d.id, d.type) === key)) {
                dependents.push({ id: node.id, type: node.type });
            }
        }
        return dependents;
    }
    function canDelete(id, type) {
        const dependents = getDependents(id, type);
        return {
            canDelete: dependents.length === 0,
            dependents,
        };
    }
    function detectCycles() {
        const cycles = [];
        const visited = new Set();
        const inStack = new Set();
        const stack = [];
        function dfs(ref) {
            const key = nodeKey(ref.id, ref.type);
            if (inStack.has(key)) {
                const cycleStart = stack.findIndex(s => nodeKey(s.id, s.type) === key);
                cycles.push(stack.slice(cycleStart));
                return;
            }
            if (visited.has(key))
                return;
            visited.add(key);
            inStack.add(key);
            stack.push(ref);
            const node = nodes.get(key);
            if (node) {
                for (const dep of node.dependsOn) {
                    dfs(dep);
                }
            }
            stack.pop();
            inStack.delete(key);
        }
        for (const node of nodes.values()) {
            dfs({ id: node.id, type: node.type });
        }
        return cycles;
    }
    function topologicalSort() {
        const inDegree = new Map();
        const adjList = new Map();
        for (const node of nodes.values()) {
            const key = nodeKey(node.id, node.type);
            if (!inDegree.has(key))
                inDegree.set(key, 0);
            if (!adjList.has(key))
                adjList.set(key, []);
        }
        for (const node of nodes.values()) {
            const key = nodeKey(node.id, node.type);
            for (const dep of node.dependsOn) {
                const depKey = nodeKey(dep.id, dep.type);
                if (nodes.has(depKey)) {
                    if (!adjList.has(depKey))
                        adjList.set(depKey, []);
                    adjList.get(depKey).push(key);
                    inDegree.set(key, (inDegree.get(key) ?? 0) + 1);
                }
            }
        }
        const queue = [];
        for (const [key, deg] of inDegree) {
            if (deg === 0)
                queue.push(key);
        }
        const sorted = [];
        while (queue.length > 0) {
            const current = queue.shift();
            const node = nodes.get(current);
            if (node)
                sorted.push(node);
            for (const neighbor of adjList.get(current) ?? []) {
                const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
                inDegree.set(neighbor, newDeg);
                if (newDeg === 0)
                    queue.push(neighbor);
            }
        }
        return sorted;
    }
    function buildFromDataModel(model, metrics, kpis) {
        nodes.clear();
        // Layer 1: Fields (no dependencies)
        for (const field of model.fields) {
            addNode({ id: field.name, type: 'field', dependsOn: [] });
        }
        // Layer 2: Parameters (no dependencies)
        for (const param of model.parameters) {
            addNode({ id: param.id, type: 'parameter', dependsOn: [] });
        }
        // Layer 3: Calculated Fields (depend on fields, params, other calc fields)
        for (const calc of model.calculatedFields) {
            const deps = extractDependencies(calc.expression);
            addNode({ id: calc.id, type: 'calculated_field', dependsOn: deps });
        }
        // Layer 4: Metrics (depend on fields, params, other metrics via expression formulas)
        if (metrics) {
            for (const metric of metrics) {
                const deps = [];
                if (metric.formula.type === 'simple' || metric.formula.type === 'conditional') {
                    deps.push({ id: metric.formula.field, type: 'field' });
                }
                else if (metric.formula.type === 'expression') {
                    const exprFormula = metric.formula;
                    deps.push(...extractDependencies(exprFormula.expression));
                }
                addNode({ id: metric.id, type: 'metric', dependsOn: deps });
            }
        }
        // Layer 5: KPIs (depend on metrics, params via threshold bands)
        if (kpis) {
            for (const kpi of kpis) {
                const deps = [];
                if (kpi.metricId) {
                    deps.push({ id: kpi.metricId, type: 'metric' });
                }
                if (kpi.bands) {
                    for (const band of kpi.bands) {
                        if (band.upTo.type === 'parameter' && band.upTo.parameterId) {
                            deps.push({ id: band.upTo.parameterId, type: 'parameter' });
                        }
                        if (band.upTo.type === 'metric' && band.upTo.metricId) {
                            deps.push({ id: band.upTo.metricId, type: 'metric' });
                        }
                    }
                }
                addNode({ id: kpi.id, type: 'kpi', dependsOn: deps });
            }
        }
    }
    return {
        addNode,
        removeNode,
        getNode,
        getDependencies,
        getDependents,
        canDelete,
        detectCycles,
        topologicalSort,
        buildFromDataModel,
        clear() { nodes.clear(); },
    };
}
//# sourceMappingURL=dependency-graph.js.map