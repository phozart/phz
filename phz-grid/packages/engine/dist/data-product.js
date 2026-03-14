/**
 * @phozart/engine — Data Product Registry
 *
 * Data products are the foundational data entities in the BI engine.
 * Each data product has a schema describing its fields.
 */
export function createDataProductRegistry() {
    const products = new Map();
    return {
        register(product) {
            products.set(product.id, product);
        },
        unregister(id) {
            products.delete(id);
        },
        get(id) {
            return products.get(id);
        },
        list() {
            return Array.from(products.values());
        },
        search(query) {
            const q = query.toLowerCase();
            return Array.from(products.values()).filter(p => p.name.toLowerCase().includes(q) ||
                (p.description && p.description.toLowerCase().includes(q)) ||
                (p.tags && p.tags.some(t => t.toLowerCase().includes(q))));
        },
        getSchema(id) {
            return products.get(id)?.schema;
        },
        validate(product) {
            const errors = [];
            if (!product.id)
                errors.push({ path: 'id', message: 'ID is required' });
            if (!product.name)
                errors.push({ path: 'name', message: 'Name is required' });
            if (!product.schema) {
                errors.push({ path: 'schema', message: 'Schema is required' });
            }
            else if (!product.schema.fields || product.schema.fields.length === 0) {
                errors.push({ path: 'schema.fields', message: 'At least one field is required' });
            }
            return { valid: errors.length === 0, errors };
        },
    };
}
//# sourceMappingURL=data-product.js.map