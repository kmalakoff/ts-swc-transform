/**
 * Lightweight ESM exports field resolver
 * Uses resolve.exports (952 bytes) instead of import-meta-resolve (64KB)
 *
 * Only loaded on Node >= 12.2 where module.createRequire exists.
 * On older Node, toPath.ts skips this and falls back to resolve.sync().
 */

import Module from 'module';
import * as resolve from 'resolve';

const resolveSync = (resolve.default ?? resolve).sync;

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
 * Extract the subpath from a specifier
 * "lodash/get" → "./get"
 * "react" → "."
 * "@scope/pkg/foo" → "./foo"
 */
function getSubpath(specifier: string): string {
  const parts = specifier.split('/');
  const pkgName = specifier[0] === '@' ? parts.slice(0, 2).join('/') : parts[0];
  const remainder = specifier.slice(pkgName.length);
  return remainder ? `.${remainder}` : '.';
}

/**
 * Resolve a module specifier using the exports field in package.json
 * Falls back to legacy main/module fields if exports is not present
 */
export default function resolveWithExports(specifier: string, basedir: string, conditions: string[] = ['node', 'import']): string | null {
  const resolveExportsMod = getResolveExports();
  if (!resolveExportsMod) {
    // resolve.exports not available, return null to trigger fallback
    return null;
  }

  const { exports: resolveExportsFn, legacy } = resolveExportsMod;
  const subpath = getSubpath(specifier);

  try {
    return resolveSync(specifier, {
      basedir,
      extensions: ['.js', '.json', '.node', '.mjs'],
      packageFilter: (pkg) => {
        // Try exports field first
        try {
          const resolved = resolveExportsFn(pkg, subpath, { conditions });
          if (resolved?.[0]) {
            pkg.main = resolved[0];
            return pkg;
          }
        } catch (_) {
          // exports field parsing failed, try legacy
        }

        // Try legacy main/module fields
        try {
          const legacyMain = legacy(pkg);
          if (legacyMain) {
            pkg.main = legacyMain;
          }
        } catch (_) {
          // legacy parsing failed, use original pkg
        }

        return pkg;
      },
    });
  } catch (_) {
    return null;
  }
}
