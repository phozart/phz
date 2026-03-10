const { build } = require('esbuild');
const { gzipSync } = require('zlib');
const path = require('path');
const fs = require('fs');

const packages = [
  { name: 'core', entry: 'packages/core/src/index.ts', budget: 50 },
  { name: 'grid', entry: 'packages/grid/src/index.ts', budget: 100 },
  { name: 'react', entry: 'packages/react/src/index.ts', budget: 250 },
  { name: 'vue', entry: 'packages/vue/src/index.ts', budget: 80 },
  { name: 'angular', entry: 'packages/angular/src/index.ts', budget: 80 },
  { name: 'duckdb', entry: 'packages/duckdb/src/index.ts', budget: 80 },
  { name: 'ai', entry: 'packages/ai/src/index.ts', budget: 50 },
  { name: 'collab', entry: 'packages/collab/src/index.ts', budget: 50 },
  { name: 'engine', entry: 'packages/engine/src/index.ts', budget: 100 },
  { name: 'widgets', entry: 'packages/widgets/src/index.ts', budget: 100 },
  { name: 'criteria', entry: 'packages/criteria/src/index.ts', budget: 150 },
  { name: 'grid-admin', entry: 'packages/grid-admin/src/index.ts', budget: 80 },
  { name: 'engine-admin', entry: 'packages/engine-admin/src/index.ts', budget: 100 },
];

const root = path.resolve(__dirname, '..');

const aliasPlugin = {
  name: 'phz-alias',
  setup(b) {
    b.onResolve({ filter: /^@phozart\/phz-/ }, (args) => {
      const pkgName = args.path.replace('@phozart/phz-', '');
      const resolved = path.join(root, 'packages', pkgName, 'src', 'index.ts');
      if (fs.existsSync(resolved)) {
        return { path: resolved };
      }
      return { path: args.path, external: true };
    });
  },
};

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  return (bytes / 1024).toFixed(1) + ' KB';
}

async function main() {
  console.log('');
  console.log('Package'.padEnd(18) + 'Raw'.padStart(10) + 'Gzipped'.padStart(10) + 'Budget'.padStart(10) + '  Status');
  console.log('-'.repeat(60));

  let allPass = true;

  for (const pkg of packages) {
    const entryPoint = path.join(root, pkg.entry);
    try {
      const result = await build({
        entryPoints: [entryPoint],
        bundle: true,
        write: false,
        format: 'esm',
        target: 'es2022',
        minify: true,
        treeShaking: true,
        plugins: [aliasPlugin],
        external: [
          'lit', 'lit/*', '@lit/*',
          'yjs', 'y-*',
          '@anthropic-ai/*', 'openai', '@google/*',
          '@duckdb/*',
          'vue', 'react', 'react-dom', '@angular/*',
        ],
        logLevel: 'silent',
      });

      const raw = result.outputFiles[0].contents.length;
      const gzipped = gzipSync(result.outputFiles[0].contents).length;
      const gzippedKB = gzipped / 1024;
      const pass = gzippedKB <= pkg.budget;
      if (!pass) allPass = false;

      console.log(
        pkg.name.padEnd(18) +
        formatSize(raw).padStart(10) +
        formatSize(gzipped).padStart(10) +
        (pkg.budget + ' KB').padStart(10) +
        '  ' + (pass ? 'OK' : 'OVER')
      );
    } catch (err) {
      const errMsg = err.errors ? err.errors.map(e => e.text).join('; ') : err.message.split('\n')[0];
      console.log(pkg.name.padEnd(18) + '  ERR: ' + errMsg.slice(0, 80));
    }
  }

  console.log('-'.repeat(60));
  console.log(allPass ? 'All packages within budget.' : 'Some packages exceed budget!');
  process.exit(allPass ? 0 : 1);
}

main();
