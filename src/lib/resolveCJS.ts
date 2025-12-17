/**
 * CJS resolver
 *
 * Uses the `resolve` npm package for CommonJS-style module resolution.
 * Handles main field, index.js, etc.
 *
 * Note: CJS does not support subpath imports (#prefix) - those are ESM-only.
 */

import * as resolve from 'resolve';

const resolveSync = (resolve.default ?? resolve).sync;

/**
 * Resolve a CJS specifier to an absolute file path
 *
 * @param specifier - The require specifier (e.g., 'lodash', 'lodash/get')
 * @param basedir - The directory to resolve from
 * @returns The resolved absolute file path
 * @throws Error if module cannot be found
 */
export default function resolveCJS(specifier: string, basedir: string): string {
  return resolveSync(specifier, {
    basedir,
    extensions: ['.js', '.json', '.node', '.mjs'],
  });
}
