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
      '@phozart/phz-core': path.resolve(__dirname, 'packages/core/dist/index.js'),
      '@phozart/phz-engine': path.resolve(__dirname, 'packages/engine/dist/index.js'),
      '@phozart/phz-criteria': path.resolve(__dirname, 'packages/criteria/dist/index.js'),
      '@phozart/phz-grid': path.resolve(__dirname, 'packages/grid/dist/index.js'),
      '@phozart/phz-react': path.resolve(__dirname, 'packages/react/dist/index.js'),
      '@phozart/phz-vue': path.resolve(__dirname, 'packages/vue/dist/index.js'),
      '@phozart/phz-angular': path.resolve(__dirname, 'packages/angular/dist/index.js'),
      '@phozart/phz-duckdb': path.resolve(__dirname, 'packages/duckdb/dist/index.js'),
      '@phozart/phz-ai': path.resolve(__dirname, 'packages/ai/dist/index.js'),
      '@phozart/phz-collab': path.resolve(__dirname, 'packages/collab/dist/index.js'),
      '@phozart/phz-widgets': path.resolve(__dirname, 'packages/widgets/dist/index.js'),
      // Legacy shim names → workspace (archived packages)
      '@phozart/phz-grid-admin': path.resolve(__dirname, 'packages/workspace/src/grid-admin/index.ts'),
      '@phozart/phz-engine-admin': path.resolve(__dirname, 'packages/workspace/src/engine-admin/index.ts'),
      '@phozart/phz-definitions': path.resolve(__dirname, 'packages/definitions/dist/index.js'),
      '@phozart/phz-grid-creator': path.resolve(__dirname, 'packages/workspace/src/grid-creator/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
  },
});
