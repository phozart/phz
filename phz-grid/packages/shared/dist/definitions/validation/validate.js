/**
 * Validate a GridDefinition using Zod schemas.
 */
import { GridDefinitionSchema } from './schemas.js';
export function validateDefinition(def) {
    const result = GridDefinitionSchema.safeParse(def);
    if (result.success) {
        return { valid: true, errors: [] };
    }
    return {
        valid: false,
        errors: result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
        })),
    };
}
//# sourceMappingURL=validate.js.map