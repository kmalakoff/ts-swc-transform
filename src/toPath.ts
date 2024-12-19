import fs from 'fs';
import path from 'path';
import url from 'url';
import isAbsolute from 'is-absolute';
import resolve from 'resolve';
// @ts-ignore
import process from './lib/process.cjs';
import type { Context } from './types.js';

const moduleRegEx = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/;

function getParentPath(context: Context) {
  if (context.parentPath) return path.dirname(context.parentPath);
  return context.parentURL ? path.dirname(toPath(context.parentURL)) : process.cwd();
}

export default function toPath(specifier: string, context?: Context) {
  if (specifier.startsWith('file://')) return url.parse(specifier).pathname;
  if (isAbsolute(specifier)) return specifier;
  if (specifier[0] === '.') {
    const parentPath = context ? getParentPath(context) : process.cwd();
    return path.resolve(parentPath, specifier);
  }
  if (moduleRegEx.test(specifier)) {
    const parentPath = context ? getParentPath(context) : process.cwd();

    let pkg = null;
    const main = resolve.sync(specifier, {
      basedir: parentPath,
      extensions: ['.js', '.json', '.node', '.mjs'],
      packageFilter(json, dir) {
        pkg = { json, dir };
        return json;
      },
    });
    if (!pkg || !pkg.json.module) return main; // no modules, use main
    if (pkg.json.name === specifier) return path.resolve(pkg.dir, pkg.json.module); // the module

    // a relative path. Only accept if it doesn't break the relative naming and it exists
    const modulePath = path.resolve(pkg.dir, pkg.json.module);
    const mainPath = path.resolve(pkg.dir, pkg.json.main);
    const moduleResolved = path.resolve(modulePath, path.relative(mainPath, main));
    return moduleResolved.indexOf(specifier.replace(pkg.json.name, '')) < 0 || !fs.existsSync(moduleResolved) ? main : moduleResolved;
  }

  return specifier;
}
