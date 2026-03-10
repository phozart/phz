/**
 * @phozart/phz-core — Type Guards
 */
import type { EditState, EditStateIdle, EditStateEditing, EditStateValidating, EditStateCommitting, EditStateError } from './types/state.js';
import type { DataSource, LocalDataSource, AsyncDataSource, DuckDBDataSourceRef } from './types/datasource.js';
export declare function isEditStateIdle(state: EditState): state is EditStateIdle;
export declare function isEditStateEditing(state: EditState): state is EditStateEditing;
export declare function isEditStateValidating(state: EditState): state is EditStateValidating;
export declare function isEditStateCommitting(state: EditState): state is EditStateCommitting;
export declare function isEditStateError(state: EditState): state is EditStateError;
export declare function isLocalDataSource<T>(ds: DataSource<T>): ds is LocalDataSource<T>;
export declare function isAsyncDataSource<T>(ds: DataSource<T>): ds is AsyncDataSource<T>;
export declare function isDuckDBDataSource(ds: DataSource): ds is DuckDBDataSourceRef;
//# sourceMappingURL=type-guards.d.ts.map