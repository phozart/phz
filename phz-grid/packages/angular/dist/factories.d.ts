/**
 * @phozart/angular — Factory functions
 *
 * Creates Angular components and services without hard dependency on Angular decorators.
 * These factories accept the Angular runtime to create properly decorated components.
 *
 * Usage in Angular app:
 *   import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
 *   import { BehaviorSubject, Subject } from 'rxjs';
 *   import { createPhzGridComponent, createSelectionService } from '@phozart/angular';
 *
 *   const PhzGridComponent = createPhzGridComponent({ Component, Input, Output, EventEmitter });
 *   const selectionService = createSelectionService({ BehaviorSubject, Subject });
 */
import type { GridApi } from '@phozart/core';
import type { RxJSRuntime, SelectionServiceReturn, SortServiceReturn, FilterServiceReturn, EditServiceReturn, DataServiceReturn } from './types.js';
import '@phozart/grid';
/**
 * Minimal Angular runtime interface needed by the factories.
 */
export interface AngularRuntime {
    Component: any;
    Input: any;
    Output: any;
    EventEmitter: any;
    Injectable?: any;
    ElementRef?: any;
    OnInit?: any;
    OnDestroy?: any;
    OnChanges?: any;
    CUSTOM_ELEMENTS_SCHEMA?: any;
}
/**
 * Creates an Angular standalone component that wraps <phz-grid>.
 *
 * Includes full lifecycle: OnInit sets up event listeners,
 * OnChanges propagates property changes, OnDestroy cleans up.
 */
export declare function createPhzGridComponent(ng: AngularRuntime): any;
/**
 * Creates an Angular injectable GridService for managing grid state.
 *
 * Usage:
 *   const GridService = createGridService(Injectable);
 *   providers: [GridService]
 */
export declare function createGridService(ng: AngularRuntime): any;
/**
 * Creates a reactive selection service backed by BehaviorSubjects.
 */
export declare function createSelectionService(rxjs: RxJSRuntime): (gridApi: GridApi) => SelectionServiceReturn;
/**
 * Creates a reactive sort service backed by BehaviorSubject.
 */
export declare function createSortService(rxjs: RxJSRuntime): (gridApi: GridApi) => SortServiceReturn;
/**
 * Creates a reactive filter service backed by BehaviorSubject.
 */
export declare function createFilterService(rxjs: RxJSRuntime): (gridApi: GridApi) => FilterServiceReturn;
/**
 * Creates a reactive edit service backed by BehaviorSubjects.
 */
export declare function createEditService(rxjs: RxJSRuntime): (gridApi: GridApi) => EditServiceReturn;
/**
 * Creates a reactive data service backed by BehaviorSubject.
 */
export declare function createDataService(rxjs: RxJSRuntime): (gridApi: GridApi) => DataServiceReturn;
//# sourceMappingURL=factories.d.ts.map