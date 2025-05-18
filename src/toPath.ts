import module from 'module';
import path from 'path';
import url from 'url';
import isAbsolute from 'is-absolute';
import resolveCJS from 'resolve';
// @ts-ignore
import { resolve as resolveESM } from '../../assets/import-meta-resolve.cjs';
import { moduleRegEx } from './constants.js';
import * as urlPolyfills from './lib/url-file-url.js';
import type { Context } from './types.js';

const useCJS = !module.createRequire;
const fileURLToPath = url.fileURLToPath || urlPolyfills.fileURLToPath;
const pathToFileURL = url.pathToFileURL || urlPolyfills.pathToFileURL;

function getParentPath(context: Context) {
  if (context.parentPath) return path.dirname(context.parentPath);
  return context.parentURL ? path.dirname(toPath(context.parentURL)) : process.cwd();
}

export default function toPath(specifier: string, context?: Context) {
  if (specifier.startsWith('file:')) return fileURLToPath(specifier);
  if (isAbsolute(specifier)) return specifier;
  if (specifier[0] === '.') {
    const parentPath = context ? getParentPath(context) : process.cwd();
    return path.join(parentPath, specifier);
  }
  if (moduleRegEx.test(specifier)) {
    const parentPath = context ? getParentPath(context) : process.cwd();
    if (!useCJS) {
      try {
        const entryURL = resolveESM(specifier, pathToFileURL(parentPath));
        if (entryURL) return fileURLToPath(entryURL);
      } catch (_) {
        /* it may fail due to commonjs edge cases */
      }
    }
    const entryPath = resolveCJS.sync(specifier, {
      basedir: parentPath,
      extensions: ['.js', '.json', '.node', '.mjs'],
    });
    if (entryPath) return entryPath;
  }

  return specifier;
}
