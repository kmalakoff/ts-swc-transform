import { stringStartsWith } from '../compat.ts';

export const extensions: Record<string, string> = {
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
  return stringStartsWith(path, './') || stringStartsWith(path, '../');
}

// TypeScript's isDeclarationFileName: .d.ts, .d.mts, .d.cts and arbitrary-extension .d.<ext>.ts
const DECLARATION_FILE = /\.d\.([cm]?ts|[^./]+\.ts)$/;

function rewriteSpecifier(match: string, path: string, ext: string): string {
  if (!isRelativePath(path) || DECLARATION_FILE.test(`${path}.${ext}`)) return match;
  const newExt = replaceExtension(`.${ext}`);
  return match.replace(`.${ext}"`, `${newExt}"`).replace(`.${ext}'`, `${newExt}'`);
}

// Rewrites relative TypeScript-extension specifiers in emitted declaration files; swc rewrites JS emit natively.
// tsc leaves .d.ts specifiers as written: https://github.com/microsoft/TypeScript/issues/61037
// TODO: Remove when TypeScript natively supports rewriteRelativeImportExtensions in .d.ts files
export function rewriteExtensions(content: string): string {
  let result = content;

  // Import/export statements, with an optional 'type' keyword
  // Matches: import { X } from './path.ts'
  //          import type { X } from './path.ts'
  //          export * from './path.ts'
  //          export type * from './path.ts'
  result = result.replace(/\b(import|export)(\s+type)?(?:\s+[^'"]*?\s+from\s+|\s+)['"]([^'"]+)\.(tsx?|mts|cts)['"]/g, (match, _keyword, _typeKeyword, path, ext) => rewriteSpecifier(match, path, ext));

  // Import types
  // Matches: typeof import('./path.ts')
  result = result.replace(/\bimport\s*\(\s*['"]([^'"]+)\.(tsx?|mts|cts)['"]\s*\)/g, (match, path, ext) => rewriteSpecifier(match, path, ext));

  return result;
}
