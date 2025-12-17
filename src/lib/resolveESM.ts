/**
 * Unified ESM resolver
 *
 * Handles both:
 * - Package exports: import x from 'lodash' → uses exports field
 * - Subpath imports: import x from '#internal' → uses imports field
 *
 * Uses resolve.exports.resolve() which automatically detects the specifier type.
 * Only loaded on Node >= 12.2 where module.createRequire exists.
 */

import fs from 'fs';
import Module from 'module';
import path from 'path';

// Lazy-load resolve.exports
type ResolveExportsModule = typeof import('resolve.exports');
let _resolveExports: ResolveExportsModule | null = null;

function getResolveExports(): ResolveExportsModule | null {
  if (_resolveExports === null) {
    try {
      const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
      _resolveExports = _require('resolve.exports') as ResolveExportsModule;
    } catch (_) {
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
 * Find package.json in node_modules for external packages
 */
function findPackageInNodeModules(pkgName: string, basedir: string): { dir: string; json: Record<string, unknown> } | null {
  let dir = basedir;
  const root = path.parse(dir).root;

  while (dir !== root) {
    const pkgDir = path.join(dir, 'node_modules', pkgName);
    const pkgJsonPath = path.join(pkgDir, 'package.json');
    try {
      if (fs.existsSync(pkgJsonPath)) {
        const content = fs.readFileSync(pkgJsonPath, 'utf8');
        return { dir: pkgDir, json: JSON.parse(content) };
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
 * Find the containing package.json by walking up from a file path
 * Used for # subpath imports which are scoped to the containing package
 */
function findContainingPackage(filePath: string): { dir: string; json: Record<string, unknown> } | null {
  let dir = path.dirname(filePath);
  const root = path.parse(dir).root;

  while (dir !== root) {
    const pkgJsonPath = path.join(dir, 'package.json');
    try {
      if (fs.existsSync(pkgJsonPath)) {
        const content = fs.readFileSync(pkgJsonPath, 'utf8');
        return { dir, json: JSON.parse(content) };
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
 * Resolve an ESM specifier to an absolute file path
 *
 * @param specifier - The import specifier (e.g., 'lodash', 'lodash/get', '#internal')
 * @param parentPath - The file path of the importing module
 * @param conditions - Export conditions (defaults to ['node', 'import'])
 * @returns The resolved absolute file path, or null if not resolvable
 */
export default function resolveESM(specifier: string, parentPath: string, conditions: string[] = ['node', 'import']): string | null {
  const resolveExportsMod = getResolveExports();
  if (!resolveExportsMod) {
    return null;
  }

  const { resolve: resolveFn, legacy } = resolveExportsMod;

  // Determine how to find the package.json based on specifier type
  let pkg: { dir: string; json: Record<string, unknown> } | null;
  let subpath: string;

  if (specifier.startsWith('#')) {
    // Subpath import - find containing package
    pkg = findContainingPackage(parentPath);
    subpath = specifier; // resolve.exports expects the full #specifier
  } else {
    // External package - find in node_modules
    const { pkgName, subpath: parsedSubpath } = parseSpecifier(specifier);
    pkg = findPackageInNodeModules(pkgName, parentPath);
    subpath = parsedSubpath;
  }

  if (!pkg) {
    return null;
  }

  // Use resolve.exports.resolve() which handles both exports and imports
  try {
    const resolved = resolveFn(pkg.json, subpath, { conditions });
    if (resolved?.[0]) {
      return path.join(pkg.dir, resolved[0]);
    }
  } catch (_) {
    // Resolution failed, try legacy
  }

  // Try legacy main/module fields for non-# imports
  if (!specifier.startsWith('#')) {
    try {
      const legacyMain = legacy(pkg.json);
      if (legacyMain) {
        let mainPath: string | undefined;
        if (typeof legacyMain === 'string') {
          mainPath = legacyMain;
        } else if (Array.isArray(legacyMain)) {
          mainPath = legacyMain[0];
        }
        if (mainPath) {
          return path.join(pkg.dir, mainPath);
        }
      }
    } catch (_) {
      // Legacy parsing failed
    }

    // Last resort: try index.js
    const indexPath = path.join(pkg.dir, 'index.js');
    try {
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    } catch (_) {
      // Ignore
    }
  }

  return null;
}
