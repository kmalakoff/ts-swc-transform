import path from 'path';
import url from 'url';
import * as getTS from 'get-tsconfig-compat';

import wrapWorkerSync from './lib/wrapWorkerSync';
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
const workerWrapper = wrapWorkerSync(path.resolve(__dirname, '..', 'cjs', 'workers', 'transformSync.cjs'));

import type { Output } from '@swc/core';
import type { TsConfigResult } from 'get-tsconfig-compat';
/**
 * @param {string} contents The file contents.
 * @param {string} fileName The filename.
 * @param {TsConfigResult} tsconfig The configuration.
 * @returns {{ code: string, map?: string }} Returns object with the transformed code and source map if option sourceMaps was provided.
 */
export default function transformSync(contents: string, fileName: string, tsconfig: TsConfigResult): Output {
  if (typeof contents !== 'string') throw new Error('transformTypes: unexpected contents');
  if (typeof fileName !== 'string') throw new Error('transformTypes: unexpected fileName');
  if (!tsconfig) tsconfig = getTS.getTsconfig(process.cwd());
  return workerWrapper('stable', contents, fileName, tsconfig);
}
