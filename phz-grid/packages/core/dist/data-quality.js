/**
 * @phozart/phz-core — Data Quality Metrics (DIFF-9)
 *
 * Computes aggregate data quality metrics: completeness score,
 * missing value counts, duplicate detection, and health grade.
 */
/**
 * Compute data quality metrics for a dataset.
 */
export function computeDataQualityMetrics(data, fields) {
    const totalRows = data.length;
    const totalFields = fields.length;
    if (totalRows === 0) {
        return {
            totalRows: 0,
            totalFields,
            completeness: 1,
            missingByField: Object.fromEntries(fields.map(f => [f, 0])),
            duplicateRows: 0,
            healthGrade: 'A',
        };
    }
    // Count missing values per field
    const missingByField = {};
    let totalCells = 0;
    let nonNullCells = 0;
    for (const field of fields) {
        let missing = 0;
        for (const row of data) {
            totalCells++;
            if (row[field] == null) {
                missing++;
            }
            else {
                nonNullCells++;
            }
        }
        missingByField[field] = missing;
    }
    const completeness = totalCells > 0 ? nonNullCells / totalCells : 1;
    // Detect duplicate rows
    const seen = new Set();
    let duplicateRows = 0;
    for (const row of data) {
        const key = fields.map(f => JSON.stringify(row[f])).join('|');
        if (seen.has(key)) {
            duplicateRows++;
        }
        else {
            seen.add(key);
        }
    }
    const healthGrade = computeHealthGrade(completeness, duplicateRows, totalRows);
    return {
        totalRows,
        totalFields,
        completeness,
        missingByField,
        duplicateRows,
        healthGrade,
    };
}
function computeHealthGrade(completeness, duplicateRows, totalRows) {
    const dupRatio = totalRows > 0 ? duplicateRows / totalRows : 0;
    // Completeness is the primary driver
    let score = completeness * 100;
    // Penalize duplicates
    score -= dupRatio * 20;
    if (score >= 90)
        return 'A';
    if (score >= 75)
        return 'B';
    if (score >= 60)
        return 'C';
    if (score >= 40)
        return 'D';
    return 'F';
}
//# sourceMappingURL=data-quality.js.map