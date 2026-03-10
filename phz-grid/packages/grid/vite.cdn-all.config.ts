/**
 * Vite config for building the unified CDN bundle (phz-all.js).
 *
 * Includes: grid + engine + widgets + grid-admin + engine-admin.
 * All Lit components share a single Lit instance (no duplication).
 */
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/cdn-all.ts'),
      formats: ['es'],
      fileName: () => 'phz-all.js',
    },
    outDir: 'dist/cdn',
    emptyOutDir: false,
    minify: 'esbuild',
    target: 'es2022',
    rollupOptions: {
      external: [],
    },
  },
  resolve: {
    alias: [
      // Deep-path aliases must come before package-root aliases
      { find: /^@phozart\/phz-criteria\/(.*)/, replacement: resolve(__dirname, '../criteria/src/$1') },
      { find: /^@phozart\/phz-widgets\/(.*)/, replacement: resolve(__dirname, '../widgets/src/$1') },
      { find: /^@phozart\/phz-workspace\/(.*)/, replacement: resolve(__dirname, '../workspace/src/$1') },
      // Package root aliases
      { find: '@phozart/phz-core', replacement: resolve(__dirname, '../core/src/index.ts') },
      { find: '@phozart/phz-engine', replacement: resolve(__dirname, '../engine/src/index.ts') },
      { find: '@phozart/phz-criteria', replacement: resolve(__dirname, '../criteria/src/index.ts') },
      { find: '@phozart/phz-widgets', replacement: resolve(__dirname, '../widgets/src/index.ts') },
      // Legacy shim names → workspace (archived packages)
      { find: '@phozart/phz-grid-admin', replacement: resolve(__dirname, '../workspace/src/grid-admin/index.ts') },
      { find: '@phozart/phz-engine-admin', replacement: resolve(__dirname, '../workspace/src/engine-admin/index.ts') },
    ],
  },
});
