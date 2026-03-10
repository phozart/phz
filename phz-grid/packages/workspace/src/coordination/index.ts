export {
  createQueryCoordinator,
  // QueryCoordinatorConfig re-exported from data-adapter (single source of truth)
  type QueryCoordinatorInstance,
} from './query-coordinator.js';

export {
  createDashboardDataPipeline,
  type DashboardDataPipeline,
} from './dashboard-data-pipeline.js';

export {
  createDetailSourceLoader,
  type DetailSourceLoader,
  type DetailLoadContext,
} from './detail-source-loader.js';
