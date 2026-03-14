import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@phozart/shared/adapters': path.resolve(__dirname, 'packages/shared/src/adapters/index.ts'),
      '@phozart/shared/types': path.resolve(__dirname, 'packages/shared/src/types/index.ts'),
      '@phozart/shared/design-system': path.resolve(
        __dirname,
        'packages/shared/src/design-system/index.ts',
      ),
      '@phozart/shared/artifacts': path.resolve(
        __dirname,
        'packages/shared/src/artifacts/index.ts',
      ),
      '@phozart/shared/coordination': path.resolve(
        __dirname,
        'packages/shared/src/coordination/index.ts',
      ),
      '@phozart/shared/definitions': path.resolve(
        __dirname,
        'packages/shared/src/definitions/index.ts',
      ),
      '@phozart/shared': path.resolve(__dirname, 'packages/shared/src/index.ts'),
      '@phozart/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
      '@phozart/engine/explorer': path.resolve(__dirname, 'packages/engine/src/explorer/index.ts'),
      '@phozart/engine': path.resolve(__dirname, 'packages/engine/src/index.ts'),
      '@phozart/criteria/shared-styles': path.resolve(
        __dirname,
        'packages/criteria/src/shared-styles.ts',
      ),
      '@phozart/criteria': path.resolve(__dirname, 'packages/criteria/src/index.ts'),
      '@phozart/grid': path.resolve(__dirname, 'packages/grid/src/index.ts'),
      '@phozart/react': path.resolve(__dirname, 'packages/react/src/index.ts'),
      '@phozart/vue': path.resolve(__dirname, 'packages/vue/src/index.ts'),
      '@phozart/angular': path.resolve(__dirname, 'packages/angular/src/index.ts'),
      '@phozart/duckdb': path.resolve(__dirname, 'packages/duckdb/src/index.ts'),
      '@phozart/ai': path.resolve(__dirname, 'packages/ai/src/index.ts'),
      '@phozart/collab': path.resolve(__dirname, 'packages/collab/src/index.ts'),
      '@phozart/widgets': path.resolve(__dirname, 'packages/widgets/src/index.ts'),
      '@phozart/definitions': path.resolve(__dirname, 'packages/shared/src/definitions/index.ts'),
      // Legacy shim names → workspace (archived packages, kept for test compatibility)
      '@phozart/grid-admin': path.resolve(__dirname, 'packages/workspace/src/grid-admin/index.ts'),
      '@phozart/engine-admin': path.resolve(
        __dirname,
        'packages/workspace/src/engine-admin/index.ts',
      ),
      '@phozart/grid-creator': path.resolve(
        __dirname,
        'packages/workspace/src/grid-creator/index.ts',
      ),
      '@phozart/workspace/grid-admin': path.resolve(
        __dirname,
        'packages/workspace/src/grid-admin/index.ts',
      ),
      '@phozart/workspace/engine-admin': path.resolve(
        __dirname,
        'packages/workspace/src/engine-admin/index.ts',
      ),
      '@phozart/workspace/grid-creator': path.resolve(
        __dirname,
        'packages/workspace/src/grid-creator/index.ts',
      ),
      '@phozart/workspace/criteria-admin': path.resolve(
        __dirname,
        'packages/workspace/src/criteria-admin/index.ts',
      ),
      '@phozart/workspace/definition-ui': path.resolve(
        __dirname,
        'packages/workspace/src/definition-ui/index.ts',
      ),
      '@phozart/workspace/client': path.resolve(
        __dirname,
        'packages/workspace/src/client/index.ts',
      ),
      '@phozart/workspace/registry': path.resolve(
        __dirname,
        'packages/workspace/src/registry/index.ts',
      ),
      '@phozart/workspace/schema': path.resolve(
        __dirname,
        'packages/workspace/src/schema/index.ts',
      ),
      '@phozart/workspace/alerts': path.resolve(
        __dirname,
        'packages/workspace/src/alerts/index.ts',
      ),
      '@phozart/workspace/filters': path.resolve(
        __dirname,
        'packages/workspace/src/filters/index.ts',
      ),
      '@phozart/workspace/explore': path.resolve(
        __dirname,
        'packages/workspace/src/explore/index.ts',
      ),
      '@phozart/workspace/templates': path.resolve(
        __dirname,
        'packages/workspace/src/templates/index.ts',
      ),
      '@phozart/workspace/layout': path.resolve(
        __dirname,
        'packages/workspace/src/layout/index.ts',
      ),
      '@phozart/workspace/connectors': path.resolve(
        __dirname,
        'packages/workspace/src/adapters/remote-connector.ts',
      ),
      '@phozart/workspace': path.resolve(__dirname, 'packages/workspace/src/index.ts'),
      '@phozart/local': path.resolve(__dirname, 'packages/local/src/index.ts'),
      '@phozart/viewer/react': path.resolve(__dirname, 'packages/viewer/src/react/index.ts'),
      '@phozart/viewer': path.resolve(__dirname, 'packages/viewer/src/index.ts'),
      '@phozart/editor/react': path.resolve(__dirname, 'packages/editor/src/react/index.ts'),
      '@phozart/editor': path.resolve(__dirname, 'packages/editor/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'istanbul',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts', '**/index.ts'],
      reporter: ['text', 'json', 'lcov'],
      thresholds: {
        statements: 55,
        branches: 70,
        functions: 50,
        lines: 55,
      },
    },
  },
});
