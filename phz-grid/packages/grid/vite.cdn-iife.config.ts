/**
 * Vite config for building an IIFE CDN bundle (phz-all.iife.js).
 *
 * Same content as phz-all.js but in IIFE format so it can be loaded
 * via a plain <script> tag without type="module" — works with file:// protocol.
 */
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/cdn-all.ts'),
      formats: ['iife'],
      name: 'Phz',
      fileName: () => 'phz-all.iife.js',
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
      { find: /^@phozart\/phz-criteria\/(.*)/, replacement: resolve(__dirname, '../criteria/src/$1') },
      { find: /^@phozart\/phz-widgets\/(.*)/, replacement: resolve(__dirname, '../widgets/src/$1') },
      { find: /^@phozart\/phz-workspace\/(.*)/, replacement: resolve(__dirname, '../workspace/src/$1') },
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
