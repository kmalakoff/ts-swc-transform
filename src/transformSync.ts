import path from 'path';
import url from 'url';
import wrapWorkerSync from './lib/wrapWorkerSync.js';
const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const workerWrapper = wrapWorkerSync(path.resolve(__dirname, '..', 'cjs', 'workers', 'transformSync.js'));

import type { Output } from '@swc/core';
import type { TsConfigResult } from 'get-tsconfig-compat';
/**
 * @param {string} contents The file contents.
 * @param {string} fileName The filename.
 * @param {TsConfigResult} tsconfig The configuration.
 * @returns {{ code: string, map?: string }} Returns object with the transformed code and source map if option sourceMaps was provided.
 */
export default function transformSync(contents: string, fileName: string, tsconfig: TsConfigResult): Output {
  return workerWrapper('stable', contents, fileName, tsconfig);
}
