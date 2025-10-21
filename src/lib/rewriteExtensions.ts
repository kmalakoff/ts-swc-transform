import startsWith from 'starts-with';

export const extensions = {
  '.ts': '.js',
  '.tsx': '.js',
  '.mts': '.mjs',
  '.cts': '.cjs',
};

export function replaceExtension(ext: string): string {
  const replace = extensions[ext];
  return replace === undefined ? ext : replace;
}

// Helper to check if a path is relative (starts with ./ or ../)
function isRelativePath(path: string): boolean {
  return startsWith(path, './') || startsWith(path, '../');
}

// Multi-pattern transformer for TypeScript extension rewriting
// See: https://github.com/microsoft/TypeScript/issues/61037
// TODO: Remove when TypeScript natively supports rewriteRelativeImportExtensions in .d.ts files

export function rewriteExtensions(content: string): string {
  let result = content;

  // Pattern 1: Import/Export statements (with optional 'type' keyword)
  // Matches: import { X } from './path.ts'
  //          import type { X } from './path.ts'
  //          export * from './path.ts'
  //          export type * from './path.ts'
  result = result.replace(/\b(import|export)(\s+type)?(?:\s+[^'"]*?\s+from\s+|\s+)['"]([^'"]+)\.(tsx?|mts|cts)['"]/g, (match, _keyword, _typeKeyword, path, ext) => {
    if (!isRelativePath(path)) return match;
    const newExt = replaceExtension(`.${ext}`);
    return match.replace(`.${ext}"`, `${newExt}"`).replace(`.${ext}'`, `${newExt}'`).replace(`.${ext}\``, `${newExt}\``);
  });

  // Pattern 2: Dynamic import types
  // Matches: typeof import('./path.ts')
  result = result.replace(/\bimport\s*\(\s*['"]([^'"]+)\.(tsx?|mts|cts)['"]\s*\)/g, (match, path, ext) => {
    if (!isRelativePath(path)) return match;
    const newExt = replaceExtension(`.${ext}`);
    return match.replace(`.${ext}"`, `${newExt}"`).replace(`.${ext}'`, `${newExt}'`).replace(`.${ext}\``, `${newExt}\``);
  });

  // Pattern 3: Triple-slash path references
  // Matches: /// <reference path="./file.ts" />
  //          /// <reference path="./file.d.ts" />
  result = result.replace(/\/\/\/\s*<reference\s+path\s*=\s*['"]([^'"]+)\.(d\.ts|tsx?|mts|cts)['"]\s*\/>/g, (match, path, ext) => {
    if (!isRelativePath(path)) return match;
    // Special case: .d.ts → .d.js
    const newExt = ext === 'd.ts' ? '.d.js' : replaceExtension(`.${ext}`);
    return match.replace(`.${ext}"`, `${newExt}"`).replace(`.${ext}'`, `${newExt}'`).replace(`.${ext}\``, `${newExt}\``);
  });

  return result;
}

// CJS-specific version that also handles require() statements
export function rewriteExtensionsCJS(content: string): string {
  // Start with all ESM patterns
  let result = rewriteExtensions(content);

  // Pattern 4: CommonJS require() statements
  // Matches: require('./path.ts')
  result = result.replace(/\brequire\s*\(\s*['"]([^'"]+)\.(tsx?|mts|cts)['"]\s*\)/g, (match, path, ext) => {
    if (!isRelativePath(path)) return match;
    const newExt = replaceExtension(`.${ext}`);
    return match.replace(`.${ext}"`, `${newExt}"`).replace(`.${ext}'`, `${newExt}'`).replace(`.${ext}\``, `${newExt}\``);
  });

  return result;
}
