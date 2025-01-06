import swcPrepareOptions from '../lib/swcPrepareOptions';

import Module from 'module';
import lazy from 'lazy-cache';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const swcLazy = lazy(_require)('@swc/core');

import type { TsConfigResult } from 'get-tsconfig-compat';
export default function transformSyncWorker(contents: string, fileName: string, tsconfig: TsConfigResult) {
  const swcOptions = swcPrepareOptions(tsconfig);
  const swc = swcLazy();
  return swc.transformSync(contents, {
    ...(fileName.endsWith('.tsx') || fileName.endsWith('.jsx') ? swcOptions.tsxOptions : swcOptions.nonTsxOptions),
    filename: fileName,
  });
}
