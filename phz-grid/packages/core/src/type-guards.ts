/**
 * @phozart/phz-core — Type Guards
 */

import type {
  EditState,
  EditStateIdle,
  EditStateEditing,
  EditStateValidating,
  EditStateCommitting,
  EditStateError,
} from './types/state.js';
import type {
  DataSource,
  LocalDataSource,
  AsyncDataSource,
  DuckDBDataSourceRef,
} from './types/datasource.js';

export function isEditStateIdle(state: EditState): state is EditStateIdle {
  return state.status === 'idle';
}

export function isEditStateEditing(state: EditState): state is EditStateEditing {
  return state.status === 'editing';
}

export function isEditStateValidating(state: EditState): state is EditStateValidating {
  return state.status === 'validating';
}

export function isEditStateCommitting(state: EditState): state is EditStateCommitting {
  return state.status === 'committing';
}

export function isEditStateError(state: EditState): state is EditStateError {
  return state.status === 'error';
}

export function isLocalDataSource<T>(ds: DataSource<T>): ds is LocalDataSource<T> {
  return ds.type === 'local';
}

export function isAsyncDataSource<T>(ds: DataSource<T>): ds is AsyncDataSource<T> {
  return ds.type === 'async';
}

export function isDuckDBDataSource(ds: DataSource): ds is DuckDBDataSourceRef {
  return ds.type === 'duckdb';
}
