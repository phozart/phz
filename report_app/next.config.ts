import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgs = path.resolve(__dirname, '../phz-grid/packages');

const packageAliases: Record<string, string> = {
  '@phozart/phz-core':                      path.resolve(pkgs, 'core/dist/index.js'),
  '@phozart/phz-engine':                    path.resolve(pkgs, 'engine/dist/index.js'),
  '@phozart/phz-grid':                      path.resolve(pkgs, 'grid/dist/index.js'),
  '@phozart/phz-react/grid':                path.resolve(pkgs, 'react/dist/grid.js'),
  '@phozart/phz-react/criteria':            path.resolve(pkgs, 'react/dist/criteria.js'),
  '@phozart/phz-react/admin':               path.resolve(pkgs, 'react/dist/admin.js'),
  '@phozart/phz-react':                     path.resolve(pkgs, 'react/dist/index.js'),
  '@phozart/phz-widgets':                   path.resolve(pkgs, 'widgets/dist/index.js'),
  '@phozart/phz-criteria/shared-styles':     path.resolve(pkgs, 'criteria/dist/shared-styles.js'),
  '@phozart/phz-criteria':                  path.resolve(pkgs, 'criteria/dist/index.js'),
  '@phozart/phz-grid-admin':                path.resolve(pkgs, 'grid-admin/dist/index.js'),
  '@phozart/phz-engine-admin':              path.resolve(pkgs, 'engine-admin/dist/index.js'),
  '@phozart/phz-grid-creator':              path.resolve(pkgs, 'grid-creator/dist/index.js'),
  '@phozart/phz-definitions':               path.resolve(pkgs, 'definitions/dist/index.js'),
  '@phozart/phz-duckdb':                    path.resolve(pkgs, 'duckdb/dist/index.js'),
  '@phozart/phz-ai':                        path.resolve(pkgs, 'ai/dist/index.js'),
  '@phozart/phz-collab':                    path.resolve(pkgs, 'collab/dist/index.js'),
  // Shared infrastructure (adapters, types, design system, coordination)
  '@phozart/phz-shared/adapters':           path.resolve(pkgs, 'shared/dist/adapters/index.js'),
  '@phozart/phz-shared/types':              path.resolve(pkgs, 'shared/dist/types/index.js'),
  '@phozart/phz-shared/artifacts':          path.resolve(pkgs, 'shared/dist/artifacts/index.js'),
  '@phozart/phz-shared/design-system':      path.resolve(pkgs, 'shared/dist/design-system/index.js'),
  '@phozart/phz-shared/coordination':       path.resolve(pkgs, 'shared/dist/coordination/index.js'),
  '@phozart/phz-shared':                    path.resolve(pkgs, 'shared/dist/index.js'),
  // Viewer shell (read-only consumption)
  '@phozart/phz-viewer':                    path.resolve(pkgs, 'viewer/dist/index.js'),
  // Editor shell (BI authoring)
  '@phozart/phz-editor':                    path.resolve(pkgs, 'editor/dist/index.js'),
  // Workspace (admin + authoring + sub-paths)
  '@phozart/phz-workspace/all':             path.resolve(pkgs, 'workspace/dist/all.js'),
  '@phozart/phz-workspace/grid-admin':      path.resolve(pkgs, 'workspace/dist/grid-admin/index.js'),
  '@phozart/phz-workspace/engine-admin':    path.resolve(pkgs, 'workspace/dist/engine-admin/index.js'),
  '@phozart/phz-workspace/grid-creator':    path.resolve(pkgs, 'workspace/dist/grid-creator/index.js'),
  '@phozart/phz-workspace/criteria-admin':  path.resolve(pkgs, 'workspace/dist/criteria-admin/index.js'),
  '@phozart/phz-workspace/definition-ui':   path.resolve(pkgs, 'workspace/dist/definition-ui/index.js'),
  '@phozart/phz-workspace/client':          path.resolve(pkgs, 'workspace/dist/client/index.js'),
  '@phozart/phz-workspace/registry':        path.resolve(pkgs, 'workspace/dist/registry/index.js'),
  '@phozart/phz-workspace/schema':          path.resolve(pkgs, 'workspace/dist/schema/index.js'),
  '@phozart/phz-workspace/connectors':      path.resolve(pkgs, 'workspace/dist/adapters/remote-connector.js'),
  '@phozart/phz-workspace/templates':       path.resolve(pkgs, 'workspace/dist/templates/index.js'),
  '@phozart/phz-workspace/layout':          path.resolve(pkgs, 'workspace/dist/layout/index.js'),
  '@phozart/phz-workspace/alerts':          path.resolve(pkgs, 'workspace/dist/alerts/index.js'),
  '@phozart/phz-workspace/filters':         path.resolve(pkgs, 'workspace/dist/filters/index.js'),
  '@phozart/phz-workspace/explore':         path.resolve(pkgs, 'workspace/dist/explore/index.js'),
  '@phozart/phz-workspace/authoring':      path.resolve(pkgs, 'workspace/dist/authoring/index.js'),
  '@phozart/phz-workspace/catalog':        path.resolve(pkgs, 'workspace/dist/catalog/index.js'),
  '@phozart/phz-workspace/shell':           path.resolve(pkgs, 'workspace/dist/shell/index.js'),
  '@phozart/phz-workspace':                 path.resolve(pkgs, 'workspace/dist/index.js'),
};

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['lit', '@lit/reactive-element', 'lit-element', 'lit-html'],
  // Required for DuckDB WASM SharedArrayBuffer (multi-threaded mode)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
  webpack(config) {
    config.resolve.alias = { ...config.resolve.alias, ...packageAliases };
    // Ensure aliased packages (e.g. phz-duckdb) can resolve their peer deps
    // from report_app/node_modules, not from the package's own directory tree.
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      ...(config.resolve.modules ?? ['node_modules']),
    ];
    // Suppress "critical dependency" warnings from @duckdb/duckdb-wasm's Node CJS bundle
    // (uses dynamic require() which webpack can't statically analyze — irrelevant in browser)
    config.module.exprContextCritical = false;
    return config;
  },
};

export default nextConfig;
