import path from 'path';
import url from 'url';
import wrapWorker from './lib/wrapWorker.js';
import worker from './workers/transformSync.js';
const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const workerPath = path.resolve(__dirname, '..', 'cjs', 'transformSync.js');
const workerWrapper = wrapWorker(worker, workerPath, 'lts', true);

import type { TsConfigResult } from 'get-tsconfig-compat';
/**
 * @param {string} contents The file contents.
 * @param {string} fileName The filename.
 * @param {TsConfigResult} tsconfig The configuration.
 * @returns {{ code: string, map?: string }} Returns object with the transformed code and source map if option sourceMaps was provided.
 */
export default function transformSync(contents: string, fileName: string, tsconfig: TsConfigResult) {
  // biome-ignore lint/style/noArguments: <explanation>
  if (arguments.length === 4) return worker(contents, fileName, tsconfig, arguments[3]);
  return workerWrapper(contents, fileName, tsconfig);
}
