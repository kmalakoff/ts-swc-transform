/**
 * Lightweight ESM exports field resolver
 * Uses resolve.exports (952 bytes) instead of import-meta-resolve (64KB)
 *
 * Only loaded on Node >= 12.2 where module.createRequire exists.
 * On older Node, toPath.ts skips this and falls back to resolve.sync().
 *
 * This implementation handles packages with ONLY an exports field (no main),
 * which the resolve package cannot handle on its own.
 */

import fs from 'fs';
import Module from 'module';
import path from 'path';

// Lazy-load resolve.exports to avoid requiring it on older Node versions
// resolve.exports requires Node >= 10, but this code only runs on Node >= 12.2
type ResolveExportsModule = typeof import('resolve.exports');
let _resolveExports: ResolveExportsModule | null = null;

function getResolveExports(): ResolveExportsModule | null {
  if (_resolveExports === null) {
    try {
      // Use dynamic require to avoid loading on older Node versions
      const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
      _resolveExports = _require('resolve.exports') as ResolveExportsModule;
    } catch (_) {
      // If resolve.exports fails to load, return null
      // This shouldn't happen on Node >= 12.2, but handle gracefully
      _resolveExports = null;
    }
  }
  return _resolveExports;
}

/**
 * Parse a specifier into package name and subpath
 * "lodash" → { pkgName: "lodash", subpath: "." }
 * "lodash/get" → { pkgName: "lodash", subpath: "./get" }
 * "@scope/pkg" → { pkgName: "@scope/pkg", subpath: "." }
 * "@scope/pkg/foo" → { pkgName: "@scope/pkg", subpath: "./foo" }
 */
function parseSpecifier(specifier: string): { pkgName: string; subpath: string } {
  const parts = specifier.split('/');
  const pkgName = specifier[0] === '@' ? parts.slice(0, 2).join('/') : parts[0];
  const remainder = specifier.slice(pkgName.length);
  const subpath = remainder ? `.${remainder}` : '.';
  return { pkgName, subpath };
}

/**
 * Find the package.json for a package by walking up node_modules
 */
function findPackageJson(pkgName: string, basedir: string): string | null {
  let dir = basedir;
  const root = path.parse(dir).root;

  while (dir !== root) {
    const candidate = path.join(dir, 'node_modules', pkgName, 'package.json');
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch (_) {
      // Ignore filesystem errors
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

/**
 * Read and parse a package.json file
 */
function readPackageJson(pkgJsonPath: string): Record<string, unknown> | null {
  try {
    const content = fs.readFileSync(pkgJsonPath, 'utf8');
    return JSON.parse(content);
  } catch (_) {
    return null;
  }
}

/**
 * Resolve a module specifier using the exports field in package.json
 * This implementation directly finds the package and reads its exports,
 * bypassing the resolve package which can't handle exports-only packages.
 */
export default function resolveWithExports(specifier: string, basedir: string, conditions: string[] = ['node', 'import']): string | null {
  const resolveExportsMod = getResolveExports();
  if (!resolveExportsMod) {
    // resolve.exports not available, return null to trigger fallback
    return null;
  }

  const { exports: resolveExportsFn, legacy } = resolveExportsMod;
  const { pkgName, subpath } = parseSpecifier(specifier);

  // Find the package.json
  const pkgJsonPath = findPackageJson(pkgName, basedir);
  if (!pkgJsonPath) {
    return null;
  }

  // Read package.json
  const pkg = readPackageJson(pkgJsonPath);
  if (!pkg) {
    return null;
  }

  const pkgDir = path.dirname(pkgJsonPath);

  // Try exports field first
  try {
    const resolved = resolveExportsFn(pkg, subpath, { conditions });
    if (resolved?.[0]) {
      return path.join(pkgDir, resolved[0]);
    }
  } catch (_) {
    // exports field parsing failed, try legacy
  }

  // Try legacy main/module fields
  try {
    const legacyMain = legacy(pkg);
    if (legacyMain) {
      // legacy() can return string, string[], or browser field object
      let mainPath: string | undefined;
      if (typeof legacyMain === 'string') {
        mainPath = legacyMain;
      } else if (Array.isArray(legacyMain)) {
        mainPath = legacyMain[0];
      }
      // Ignore browser field objects (they map file paths, not entry points)
      if (mainPath) {
        return path.join(pkgDir, mainPath);
      }
    }
  } catch (_) {
    // legacy parsing failed
  }

  // Last resort: try index.js
  const indexPath = path.join(pkgDir, 'index.js');
  try {
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  } catch (_) {
    // Ignore
  }

  return null;
}
