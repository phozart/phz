/**
 * W.5 — Demo Datasets
 *
 * Sample dataset definitions and row generators for the demo app.
 * 3 built-in datasets: sales, inventory, employees.
 */
export interface DatasetColumn {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
}
export interface SampleDataset {
    id: string;
    name: string;
    description: string;
    columns: DatasetColumn[];
}
export declare const SAMPLE_DATASETS: SampleDataset[];
export declare function generateSampleRows(dataset: SampleDataset, count: number): unknown[][];
//# sourceMappingURL=demo-datasets.d.ts.map