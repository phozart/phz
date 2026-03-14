import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '@phozart/core': path.resolve(__dirname, '../packages/core/dist/index.js'),
      '@phozart/grid': path.resolve(__dirname, '../packages/grid/dist/index.js'),
      '@phozart/engine': path.resolve(__dirname, '../packages/engine/dist/index.js'),
      '@phozart/shared': path.resolve(__dirname, '../packages/shared/dist/index.js'),
      '@phozart/workspace/grid-admin': path.resolve(__dirname, '../packages/workspace/dist/engine-admin/index.js'),
      '@phozart/workspace': path.resolve(__dirname, '../packages/workspace/dist/authoring/index.js'),
    },
  },
  build: {
    outDir: 'dist',
  },
});
