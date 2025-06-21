import type { Output } from '@swc/core';
import type { Entry } from 'fs-iterator';
import path from 'path';
import type { CompilerOptions } from 'typescript';
import { importRegEx } from '../constants';
import type { ConfigOptions } from '../types.ts';
import { makeReplacements, replaceExtension } from './rewriteExtensions.ts';

interface InternalCompilerOptions extends CompilerOptions {
  rewriteRelativeImportExtensions?: boolean;
}

export default function patchESM(entry: Entry, output: Output, options: ConfigOptions): string {
  const rewrite = ((options.tsconfig.config.compilerOptions || {}) as unknown as InternalCompilerOptions).rewriteRelativeImportExtensions;
  if (rewrite) {
    output.code = makeReplacements(output.code, importRegEx);
  }

  return replaceExtension(path.extname(entry.basename));
}
