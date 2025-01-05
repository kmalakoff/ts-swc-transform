import endsWith from 'lodash.endswith';
import { sync as installBindingsSync } from '../lib/installBindings';
import swcPrepareOptions from '../lib/swcPrepareOptions';

import Module from 'module';
import lazy from 'lazy-cache';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const swcLazy = lazy(_require)('@swc/core');
const target = `${process.platform}-${process.arch}`;

import type { TsConfigResult } from 'get-tsconfig-compat';
export default function transformSyncWorker(contents: string, fileName: string, tsconfig: TsConfigResult) {
  installBindingsSync(target);

  const swcOptions = swcPrepareOptions(tsconfig);
  const swc = swcLazy();
  return swc.transformSync(contents, {
    ...(endsWith(fileName, '.tsx') || endsWith(fileName, '.jsx') ? swcOptions.tsxOptions : swcOptions.nonTsxOptions),
    filename: fileName,
  });
}
