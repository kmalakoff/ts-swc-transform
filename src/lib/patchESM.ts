import path from 'path';
import { importRegEx } from '../constants';
import makeReplacements from './makeReplacements';

const EXTENSIONS = {
  cjs: ['.cjs', '.cts'],
  esm: ['.js', '.ts', '.tsx', '.mts', '.mjs'],
};
const DEFAULT_EXTENSION_CJS = '.cjs';
const DEFAULT_EXTENSION_EMS = '.js';

import type { Output } from '@swc/core';
import type { Entry } from 'fs-iterator';
import type { CompilerOptions } from 'typescript';
import type { ConfigOptionsInternal } from '../types.js';

interface InternalCompilerOptions extends CompilerOptions {
  rewriteRelativeImportExtensions?: boolean;
}

export default function patchESM(entry: Entry, output: Output, options: ConfigOptionsInternal): string {
  const cjsExtension = (options.extensions ? options.extensions.cjs : DEFAULT_EXTENSION_CJS) || DEFAULT_EXTENSION_CJS;
  const esmExtension = (options.extensions ? options.extensions.esm : DEFAULT_EXTENSION_EMS) || DEFAULT_EXTENSION_EMS;

  const rewrite = ((options.tsconfig.config.compilerOptions || {}) as unknown as InternalCompilerOptions).rewriteRelativeImportExtensions;
  if (rewrite) {
    output.code = makeReplacements(entry, output.code, importRegEx, EXTENSIONS.esm, esmExtension, options);
    output.code = makeReplacements(entry, output.code, importRegEx, EXTENSIONS.cjs, cjsExtension, options);
  }

  let ext = path.extname(entry.basename);
  if (EXTENSIONS.esm.indexOf(ext) >= 0) ext = esmExtension;
  else if (EXTENSIONS.cjs.indexOf(ext) >= 0) ext = cjsExtension;
  return ext;
}
