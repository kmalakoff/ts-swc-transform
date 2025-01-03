import path from 'path';
import url from 'url';
import * as getTS from 'get-tsconfig-compat';

const major = +process.versions.node.split('.')[0];
const version = major < 14 ? 'stable' : 'local';
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
const workerPath = path.join(__dirname, '..', 'cjs', 'workers', 'transformSync.cjs');

import Module from 'module';
import lazy from 'lazy-cache';
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const callLazy = lazy(_require)('node-version-call');
const workerLazy = lazy(_require)(workerPath);

function dispatch(version, src, dest, options) {
  if (version === 'local') return workerLazy()(src, dest, options);
  return callLazy()(version, workerPath, src, dest, options);
}

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
  return dispatch(version, contents, fileName, tsconfig);
}
