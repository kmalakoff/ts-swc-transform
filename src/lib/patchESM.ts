import type { Output } from '@swc/core';
import type { Entry } from 'fs-iterator';
import path from 'path';
import type { InternalConfigOptions } from '../types.ts';
import { replaceExtension, rewriteExtensions } from './rewriteExtensions.ts';

// Read straight off the parsed tsconfig JSON, which is arbitrary data rather
// than typescript's own CompilerOptions.
interface InternalCompilerOptions {
  rewriteRelativeImportExtensions?: boolean;
}

export default function patchESM(entry: Entry, output: Output, options: InternalConfigOptions): string {
  const rewrite = ((options.tsconfig.config.compilerOptions || {}) as unknown as InternalCompilerOptions).rewriteRelativeImportExtensions;
  if (rewrite) output.code = rewriteExtensions(output.code);

  return replaceExtension(path.extname(entry.basename));
}
