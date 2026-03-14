/**
 * @phozart/angular — Angular Wrapper for phz-grid
 *
 * Provides type definitions and a factory for creating an Angular standalone
 * component and RxJS-based services. Since Angular has its own build system,
 * this package provides the component factory and type exports.
 *
 * NOTE: Requires @angular/core ^19.0.0 and rxjs ^7.0.0 as peer deps.
 */
// Component factory (avoids hard dependency on Angular decorators at build time)
export { createPhzGridComponent, createGridService } from './factories.js';
// RxJS-based service factories
export { createSelectionService, createSortService, createFilterService, createEditService, createDataService, } from './factories.js';
//# sourceMappingURL=index.js.map