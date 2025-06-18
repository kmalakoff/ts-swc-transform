import Module from 'module';
import swcPrepareOptions from '../lib/swcPrepareOptions.js';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

import type { TsConfigResult } from 'get-tsconfig-compat';
export default function transformSyncWorker(contents: string, fileName: string, tsconfig: TsConfigResult) {
  const swcOptions = swcPrepareOptions(tsconfig);
  const swc = _require('@swc/core');
  return swc.transformSync(contents, {
    ...(fileName.endsWith('.tsx') || fileName.endsWith('.jsx') ? swcOptions.tsxOptions : swcOptions.nonTsxOptions),
    filename: fileName,
  });
}
