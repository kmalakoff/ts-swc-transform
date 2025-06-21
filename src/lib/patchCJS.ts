import { extensions, requireRegEx } from '../constants';
import makeReplacements from './makeReplacements';

// https://github.com/vercel/next.js/blob/20b63e13ab2631d6043277895d373aa31a1b327c/packages/next/taskfile-swc.js#L118-L125
export const interop = "/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }";
const DEFAULT_EXTENSION = '.cjs';

import type { Output } from '@swc/core';
import type { Entry } from 'fs-iterator';
import type { CompilerOptions } from 'typescript';
import type { ConfigOptionsInternal } from '../types.js';

interface InternalCompilerOptions extends CompilerOptions {
  rewriteRelativeImportExtensions?: boolean;
}

export default function patchCJS(entry: Entry, output: Output, options: ConfigOptionsInternal): string {
  const cjsExtension = (options.extensions ? options.extensions.cjs : DEFAULT_EXTENSION) || DEFAULT_EXTENSION;
  const rewrite = ((options.tsconfig.config.compilerOptions || {}) as unknown as InternalCompilerOptions).rewriteRelativeImportExtensions;
  if (rewrite) {
    output.code = makeReplacements(entry, output.code, requireRegEx, extensions, cjsExtension, options);
  }
  output.code += interop;

  return cjsExtension;
}
