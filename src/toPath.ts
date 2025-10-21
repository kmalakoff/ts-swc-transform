import isAbsolute from 'is-absolute';
import module from 'module';
import path from 'path';
import * as resolve from 'resolve';
import url from 'url';
import { moduleRegEx } from './constants.ts';
import importMetaResolve from './lib/import-meta-resolve.ts';
import * as urlPolyfills from './lib/urlFileUrl.ts';
import type { Context } from './types.ts';
import startsWith from 'starts-with';

const resolveSync = (resolve.default ?? resolve).sync;

const useCJS = !module.createRequire;
const fileURLToPath = url.fileURLToPath || urlPolyfills.fileURLToPath;
const pathToFileURL = url.pathToFileURL || urlPolyfills.pathToFileURL;

function getParentPath(context: Context): string {
  if (context.parentPath) return path.dirname(context.parentPath);
  return context.parentURL ? path.dirname(toPath(context.parentURL)) : process.cwd();
}

export default function toPath(specifier: string, context?: Context): string {
  if (startsWith(specifier, 'file:')) return fileURLToPath(specifier);
  if (isAbsolute(specifier)) return specifier;
  if (specifier[0] === '.') {
    const parentPath = context ? getParentPath(context) : process.cwd();
    return path.join(parentPath, specifier);
  }
  if (moduleRegEx.test(specifier)) {
    const parentPath = context ? getParentPath(context) : process.cwd();
    if (!useCJS) {
      try {
        const entryURL = importMetaResolve(specifier, pathToFileURL(parentPath));
        if (entryURL) return fileURLToPath(entryURL);
      } catch (_) {
        /* it may fail due to commonjs edge cases */
      }
    }
    const entryPath = resolveSync(specifier, {
      basedir: parentPath,
      extensions: ['.js', '.json', '.node', '.mjs'],
    });
    if (entryPath) return entryPath;
  }

  return specifier;
}
