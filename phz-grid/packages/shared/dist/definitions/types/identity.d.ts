/**
 * Definition Identity — unique identifier and metadata for a grid blueprint.
 */
export type DefinitionId = string & {
    readonly __brand: 'DefinitionId';
};
export declare function createDefinitionId(id?: string): DefinitionId;
export interface DefinitionIdentity {
    id: DefinitionId;
    name: string;
    description?: string;
    schemaVersion: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
}
//# sourceMappingURL=identity.d.ts.map