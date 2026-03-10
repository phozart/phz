#!/usr/bin/env node

/**
 * phz-local CLI — Lightweight local server for phz-grid workspace
 *
 * Usage:
 *   phz-local [options]
 *
 * Options:
 *   --port <n>        Port number (default: 3847)
 *   --data-dir <path> Data directory (default: ~/.phz)
 *   --watch-dir <path> Directory to watch for CSV/Parquet/JSON files
 *   --no-browser      Don't open browser on start
 *   --help            Show this help
 */

import { createLocalServer } from '../dist/local-server.js';

function parseArgs(argv) {
  const args = argv.slice(2);
  const config = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
        config.port = parseInt(args[++i], 10);
        break;
      case '--data-dir':
        config.dataDir = args[++i];
        break;
      case '--watch-dir':
        config.watchDir = args[++i];
        break;
      case '--no-browser':
        config.openBrowser = false;
        break;
      case '--help':
        console.log(`
phz-local — Lightweight local server for phz-grid workspace

Usage:
  phz-local [options]

Options:
  --port <n>          Port number (default: 3847)
  --data-dir <path>   Data directory (default: ~/.phz)
  --watch-dir <path>  Directory to watch for auto-import
  --no-browser        Don't open browser on start
  --help              Show this help
`);
        process.exit(0);
      default:
        console.error(`Unknown option: ${args[i]}`);
        process.exit(1);
    }
  }

  return config;
}

async function main() {
  const config = parseArgs(process.argv);
  const server = await createLocalServer(config);

  await server.start();
  console.log(`phz-local running at http://127.0.0.1:${server.getPort()}`);
  console.log(`Data directory: ${server.getDataDir()}`);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Failed to start phz-local:', err.message);
  process.exit(1);
});
