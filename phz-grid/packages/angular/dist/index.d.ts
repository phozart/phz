/**
 * @phozart/phz-angular — Angular Wrapper for phz-grid
 *
 * Provides type definitions and a factory for creating an Angular standalone
 * component and RxJS-based services. Since Angular has its own build system,
 * this package provides the component factory and type exports.
 *
 * NOTE: Requires @angular/core ^19.0.0 and rxjs ^7.0.0 as peer deps.
 */
export type { PhzGridInputs, PhzGridOutputs, GridServiceConfig, RxJSRuntime, BehaviorSubjectLike, SubjectLike, ObservableLike, SelectionServiceReturn, SortServiceReturn, FilterServiceReturn, EditServiceReturn, DataServiceReturn, } from './types.js';
export { createPhzGridComponent, createGridService } from './factories.js';
export { createSelectionService, createSortService, createFilterService, createEditService, createDataService, } from './factories.js';
//# sourceMappingURL=index.d.ts.map