/**
 * Integration test config — imports from dist/ (compiled output).
 *
 * Run: npx vitest run --config vitest.integration.config.ts
 *
 * This tests what consumers actually get after `npm install`.
 * Must run `npm run build` first.
 */
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@phozart/core': path.resolve(__dirname, 'packages/core/dist/index.js'),
      '@phozart/engine': path.resolve(__dirname, 'packages/engine/dist/index.js'),
      '@phozart/criteria': path.resolve(__dirname, 'packages/criteria/dist/index.js'),
      '@phozart/grid': path.resolve(__dirname, 'packages/grid/dist/index.js'),
      '@phozart/react': path.resolve(__dirname, 'packages/react/dist/index.js'),
      '@phozart/vue': path.resolve(__dirname, 'packages/vue/dist/index.js'),
      '@phozart/angular': path.resolve(__dirname, 'packages/angular/dist/index.js'),
      '@phozart/duckdb': path.resolve(__dirname, 'packages/duckdb/dist/index.js'),
      '@phozart/ai': path.resolve(__dirname, 'packages/ai/dist/index.js'),
      '@phozart/collab': path.resolve(__dirname, 'packages/collab/dist/index.js'),
      '@phozart/widgets': path.resolve(__dirname, 'packages/widgets/dist/index.js'),
      '@phozart/shared/types': path.resolve(__dirname, 'packages/shared/dist/types/index.js'),
      '@phozart/shared/adapters': path.resolve(__dirname, 'packages/shared/dist/adapters/index.js'),
      '@phozart/shared/design-system': path.resolve(
        __dirname,
        'packages/shared/dist/design-system/index.js',
      ),
      '@phozart/shared/coordination': path.resolve(
        __dirname,
        'packages/shared/dist/coordination/index.js',
      ),
      '@phozart/shared/definitions': path.resolve(
        __dirname,
        'packages/shared/dist/definitions/index.js',
      ),
      '@phozart/shared': path.resolve(__dirname, 'packages/shared/dist/index.js'),
      '@phozart/workspace': path.resolve(__dirname, 'packages/workspace/dist/index.js'),
      '@phozart/viewer': path.resolve(__dirname, 'packages/viewer/dist/index.js'),
      '@phozart/editor': path.resolve(__dirname, 'packages/editor/dist/index.js'),
      '@phozart/local': path.resolve(__dirname, 'packages/local/dist/index.js'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
  },
});
