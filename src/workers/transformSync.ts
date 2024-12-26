import swcPrepareOptions from '../lib/swcPrepareOptions.js';

// @ts-ignore
import lazy from '../lib/lazy.cjs';
const lazySWC = lazy('@swc/core');

import type { TsConfigResult } from 'get-tsconfig-compat';
export default function transformSyncWorker(contents: string, fileName: string, tsconfig: TsConfigResult, callback) {
  swcPrepareOptions(tsconfig, (err, swcOptions) => {
    if (err) return callback(err);
    const swc = lazySWC();
    swc
      .transform(contents, {
        ...(fileName.endsWith('.tsx') || fileName.endsWith('.jsx') ? swcOptions.tsxOptions : swcOptions.nonTsxOptions),
        filename: fileName,
      })
      .then((output) => callback(null, output))
      .catch(callback);
  });
}
