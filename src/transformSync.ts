import Module from 'module';
import { bind } from 'node-version-call';
import path from 'path';
import loadConfigSync from 'read-tsconfig-sync';
import url from 'url';

import type { TSConfig } from './types.ts';

const major = +process.versions.node.split('.')[0];
const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;
const __dirname = path.dirname(typeof __filename === 'undefined' ? url.fileURLToPath(import.meta.url) : __filename);
const workerPath = path.join(__dirname, '..', 'cjs', 'workers', 'transformSync.js');

function run(contents: string, fileName: string, tsconfig: TSConfig) {
  return _require(workerPath)(contents, fileName, tsconfig);
}

// spawnOptions: false - no node/npm spawn (library call only)
const worker = major >= 20 ? run : bind('>=20', workerPath, { spawnOptions: false });

import type { Output } from '@swc/core';
export default function transformSync(contents: string, fileName: string, tsconfig?: TSConfig): Output {
  if (typeof contents !== 'string') throw new Error('transformSync: unexpected contents');
  if (typeof fileName !== 'string') throw new Error('transformSync: unexpected fileName');
  if (!tsconfig) tsconfig = loadConfigSync(process.cwd());
  return worker(contents, fileName, tsconfig) as Output;
}
