/**
 * Vite config for building the CDN/IIFE bundle of @phozart/grid.
 *
 * Produces a single self-contained ESM file that includes Lit, @phozart/core,
 * and all grid components. Users can load it via:
 *   <script type="module" src="phz-grid.js"></script>
 *
 * NOTE: Since session 39 added engine imports to the grid component,
 * this basic CDN build requires the engine dist to be up-to-date.
 * Use `npx vite build --config vite.cdn-all.config.ts` for the
 * unified bundle instead, which resolves via source aliases.
 */
import { defineConfig } from 'vite';
import { resolve } from 'path';
export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/cdn.ts'),
            formats: ['es'],
            fileName: () => 'phz-grid.js',
        },
        outDir: 'dist/cdn',
        emptyOutDir: true,
        minify: 'esbuild',
        target: 'es2022',
        rollupOptions: {
            // Bundle everything — no externals for CDN
            external: [],
        },
    },
    resolve: {
        alias: [
            { find: '@phozart/core', replacement: resolve(__dirname, '../core/src/index.ts') },
            { find: '@phozart/engine', replacement: resolve(__dirname, '../engine/src/index.ts') },
        ],
    },
});
//# sourceMappingURL=vite.config.js.map