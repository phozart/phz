# v15 Architecture Refactoring — Changelog

> Tracks all changes made during the v15 implementation.

---

## Wave 0: Baseline Verification — 2026-03-08

### Pre-existing Build Fixes
- **catalog-visual.ts**: Added missing 'filter-definition' and 'filter-rule' to `ARTIFACT_TYPE_COLORS` and `ARTIFACT_TYPE_ICONS` records
- **filters/index.ts**: Removed duplicate `ValidationResult` re-export (conflicts with registry's `ValidationResult`)
- **alerts/index.ts**: Renamed `evaluateCondition` re-export to `evaluateAlertCondition` (conflicts with filters' `evaluateCondition`)
- **local/index.ts**: Changed `export *` from phz-sheet-picker to named exports (avoids duplicate `SheetInfo`)

### Baseline Metrics
- **Tests**: 6258 passing (384 files)
- **Build**: All 19 packages clean
- **Test duration**: ~23s
