/**
 * W.5 — Demo Datasets
 *
 * Sample dataset definitions and row generators for the demo app.
 * 3 built-in datasets: sales, inventory, employees.
 */
// ========================================================================
// Built-in Datasets
// ========================================================================
export const SAMPLE_DATASETS = [
    {
        id: 'sales',
        name: 'Sales Transactions',
        description: 'Retail sales data with regions, products, and revenue',
        columns: [
            { name: 'order_id', type: 'string' },
            { name: 'date', type: 'date' },
            { name: 'region', type: 'string' },
            { name: 'product', type: 'string' },
            { name: 'quantity', type: 'number' },
            { name: 'revenue', type: 'number' },
            { name: 'discount', type: 'number' },
        ],
    },
    {
        id: 'inventory',
        name: 'Product Inventory',
        description: 'Warehouse inventory levels with reorder points',
        columns: [
            { name: 'sku', type: 'string' },
            { name: 'product_name', type: 'string' },
            { name: 'category', type: 'string' },
            { name: 'quantity_on_hand', type: 'number' },
            { name: 'reorder_point', type: 'number' },
            { name: 'unit_cost', type: 'number' },
            { name: 'in_stock', type: 'boolean' },
        ],
    },
    {
        id: 'employees',
        name: 'Employee Directory',
        description: 'HR dataset with departments, roles, and salaries',
        columns: [
            { name: 'employee_id', type: 'string' },
            { name: 'name', type: 'string' },
            { name: 'department', type: 'string' },
            { name: 'title', type: 'string' },
            { name: 'hire_date', type: 'date' },
            { name: 'salary', type: 'number' },
            { name: 'active', type: 'boolean' },
        ],
    },
];
// ========================================================================
// Sample Row Generation
// ========================================================================
const REGIONS = ['North', 'South', 'East', 'West', 'Central'];
const PRODUCTS = ['Widget A', 'Widget B', 'Gadget X', 'Gadget Y', 'Gizmo Z'];
const CATEGORIES = ['Electronics', 'Home', 'Office', 'Sports', 'Tools'];
const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Finance', 'HR'];
const TITLES = ['Manager', 'Senior Engineer', 'Analyst', 'Director', 'Coordinator'];
const NAMES = ['Alice Chen', 'Bob Smith', 'Carol Davis', 'Dan Wilson', 'Eve Johnson'];
function seededValue(arr, idx) {
    return arr[idx % arr.length];
}
function generateSalesRow(idx) {
    const day = (idx % 28) + 1;
    const month = (idx % 12) + 1;
    return [
        `ORD-${String(idx + 1).padStart(5, '0')}`,
        `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        seededValue(REGIONS, idx),
        seededValue(PRODUCTS, idx + 2),
        (idx % 50) + 1,
        ((idx % 500) + 10) * 1.5,
        (idx % 20) * 0.01,
    ];
}
function generateInventoryRow(idx) {
    return [
        `SKU-${String(idx + 1).padStart(4, '0')}`,
        seededValue(PRODUCTS, idx),
        seededValue(CATEGORIES, idx + 1),
        (idx % 200) + 5,
        (idx % 50) + 10,
        ((idx % 100) + 5) * 0.99,
        (idx % 3) !== 0,
    ];
}
function generateEmployeeRow(idx) {
    const month = (idx % 12) + 1;
    return [
        `EMP-${String(idx + 1).padStart(4, '0')}`,
        seededValue(NAMES, idx),
        seededValue(DEPARTMENTS, idx + 1),
        seededValue(TITLES, idx + 2),
        `2020-${String(month).padStart(2, '0')}-15`,
        50000 + (idx % 80) * 1000,
        (idx % 5) !== 0,
    ];
}
export function generateSampleRows(dataset, count) {
    const rows = [];
    for (let i = 0; i < count; i++) {
        switch (dataset.id) {
            case 'sales':
                rows.push(generateSalesRow(i));
                break;
            case 'inventory':
                rows.push(generateInventoryRow(i));
                break;
            case 'employees':
                rows.push(generateEmployeeRow(i));
                break;
            default:
                rows.push(dataset.columns.map(() => null));
        }
    }
    return rows;
}
//# sourceMappingURL=demo-datasets.js.map