import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const PACKAGES_DIR = path.join(REPO_ROOT, 'packages');

function getPackageDirs(): string[] {
  return fs
    .readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(PACKAGES_DIR, d.name));
}

function hasLitDependency(pkgJson: Record<string, unknown>): boolean {
  const deps = (pkgJson.dependencies ?? {}) as Record<string, string>;
  const peerDeps = (pkgJson.peerDependencies ?? {}) as Record<string, string>;
  return 'lit' in deps || 'lit' in peerDeps;
}

function hasCustomElementDecorator(pkgDir: string): boolean {
  const srcDir = path.join(pkgDir, 'src');
  if (!fs.existsSync(srcDir)) return false;

  function scanDir(dir: string): boolean {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== '__tests__' && entry.name !== 'node_modules') {
        if (scanDir(path.join(dir, entry.name))) return true;
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        const content = fs.readFileSync(path.join(dir, entry.name), 'utf-8');
        if (content.includes('@customElement')) return true;
      }
    }
    return false;
  }

  return scanDir(srcDir);
}

describe('sideEffects audit', () => {
  it('packages with @customElement must not declare sideEffects: false', () => {
    const violations: string[] = [];

    for (const pkgDir of getPackageDirs()) {
      const pkgJsonPath = path.join(pkgDir, 'package.json');
      if (!fs.existsSync(pkgJsonPath)) continue;

      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      if (!hasLitDependency(pkgJson)) continue;
      if (!hasCustomElementDecorator(pkgDir)) continue;

      if (pkgJson.sideEffects === false) {
        violations.push(`${pkgJson.name} (${path.basename(pkgDir)}/package.json) has sideEffects: false but uses @customElement`);
      }
    }

    expect(violations).toEqual([]);
  });

  it('packages with @customElement should declare dist sideEffects patterns', () => {
    const missingPatterns: string[] = [];

    for (const pkgDir of getPackageDirs()) {
      const pkgJsonPath = path.join(pkgDir, 'package.json');
      if (!fs.existsSync(pkgJsonPath)) continue;

      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      if (!hasLitDependency(pkgJson)) continue;
      if (!hasCustomElementDecorator(pkgDir)) continue;

      const se = pkgJson.sideEffects;
      if (se === false) {
        missingPatterns.push(pkgJson.name);
      } else if (!Array.isArray(se)) {
        missingPatterns.push(`${pkgJson.name}: sideEffects should be an array, got ${typeof se}`);
      } else if (!se.some((p: string) => p.includes('dist/'))) {
        missingPatterns.push(`${pkgJson.name}: sideEffects array has no dist/ patterns`);
      }
    }

    expect(missingPatterns).toEqual([]);
  });
});
