import isAbsolute from 'is-absolute';
import module from 'module';
import path from 'path';
import url from 'url';

import { stringStartsWith } from './compat.ts';
import { moduleRegEx } from './constants.ts';
import resolveCJS from './lib/resolveCJS.ts';
import resolveESM from './lib/resolveESM.ts';
import * as urlPolyfills from './lib/urlFileUrl.ts';
import type { Context } from './types.ts';

const useCJS = !module.createRequire;
const fileURLToPath = url.fileURLToPath || urlPolyfills.fileURLToPath;

function getParentPath(context: Context): string {
  if (context.parentPath) return path.dirname(context.parentPath);
  return context.parentURL ? path.dirname(toPath(context.parentURL)) : process.cwd();
}

function getParentFilePath(context?: Context): string {
  if (context?.parentPath) return context.parentPath;
  if (context?.parentURL) return fileURLToPath(context.parentURL);
  return path.join(process.cwd(), 'index.js');
}

export default function toPath(specifier: string, context?: Context): string {
  // Handle file:// URLs
  if (stringStartsWith(specifier, 'file:')) return fileURLToPath(specifier);

  // Handle absolute paths
  if (isAbsolute(specifier)) return specifier;

  // Handle relative paths
  if (specifier[0] === '.') {
    const parentPath = context ? getParentPath(context) : process.cwd();
    return path.join(parentPath, specifier);
  }

  // Handle module specifiers (bare specifiers and # imports)
  // moduleRegEx matches: bare specifiers like 'lodash', '@scope/pkg'
  // specifier[0] === '#' matches: subpath imports like '#internal'
  if (moduleRegEx.test(specifier) || specifier[0] === '#') {
    const parentFilePath = getParentFilePath(context);
    const parentDir = path.dirname(parentFilePath);

    if (useCJS) {
      // CJS: use resolve package (does not support # imports)
      if (specifier[0] === '#') {
        throw new Error(`Cannot find module '${specifier}' from '${parentDir}' (subpath imports not supported in CJS mode)`);
      }
      return resolveCJS(specifier, parentDir);
    }
    // ESM: use unified resolver that handles both exports and imports
    const entryPath = resolveESM(specifier, parentFilePath);
    if (entryPath) return entryPath;

    // If ESM resolver failed, throw meaningful error
    throw new Error(`Cannot find module '${specifier}' from '${parentDir}'`);
  }

  return specifier;
}
