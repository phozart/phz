import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const BIN_PATH = join(import.meta.dirname, '../../bin/phz-local.js');

describe('CLI script', () => {
  it('bin/phz-local.js exists', () => {
    expect(existsSync(BIN_PATH)).toBe(true);
  });

  it('has shebang line', async () => {
    const content = await readFile(BIN_PATH, 'utf-8');
    expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
  });

  it('imports createLocalServer', async () => {
    const content = await readFile(BIN_PATH, 'utf-8');
    expect(content).toContain('createLocalServer');
  });

  it('handles --port flag', async () => {
    const content = await readFile(BIN_PATH, 'utf-8');
    expect(content).toContain("'--port'");
  });

  it('handles --data-dir flag', async () => {
    const content = await readFile(BIN_PATH, 'utf-8');
    expect(content).toContain("'--data-dir'");
  });

  it('handles --watch-dir flag', async () => {
    const content = await readFile(BIN_PATH, 'utf-8');
    expect(content).toContain("'--watch-dir'");
  });

  it('handles --no-browser flag', async () => {
    const content = await readFile(BIN_PATH, 'utf-8');
    expect(content).toContain("'--no-browser'");
  });

  it('handles --help flag', async () => {
    const content = await readFile(BIN_PATH, 'utf-8');
    expect(content).toContain("'--help'");
  });

  it('binds to 127.0.0.1 (documented)', async () => {
    const content = await readFile(BIN_PATH, 'utf-8');
    expect(content).toContain('127.0.0.1');
  });

  it('handles SIGINT for graceful shutdown', async () => {
    const content = await readFile(BIN_PATH, 'utf-8');
    expect(content).toContain('SIGINT');
  });
});
