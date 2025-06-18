import * as getTS from 'get-tsconfig-compat';
import path from 'path';
import url from 'url';

const major = +process.versions.node.split('.')[0];
const version = major < 14 ? 'stable' : 'local';
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
const workerPath = path.join(__dirname, '..', 'cjs', 'workers', 'transformSync.js');

import Module from 'module';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

function dispatch(version, contents, fileName, tsconfig) {
  if (version === 'local') return _require(workerPath)(contents, fileName, tsconfig);
  return _require('node-version-call')(version, workerPath, contents, fileName, tsconfig);
}

import type { Output } from '@swc/core';
import type { TsConfigResult } from 'get-tsconfig-compat';
export default function transformSync(contents: string, fileName: string, tsconfig: TsConfigResult): Output {
  if (typeof contents !== 'string') throw new Error('transformTypes: unexpected contents');
  if (typeof fileName !== 'string') throw new Error('transformTypes: unexpected fileName');
  if (!tsconfig) tsconfig = getTS.getTsconfig(process.cwd());
  return dispatch(version, contents, fileName, tsconfig);
}
